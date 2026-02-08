// api/paypal/capture-order.js

import { buildItemsForSheet } from "../../src/checkout/checkoutDraft.js";
import { computeUnitPrice } from "../../src/pricing/pricing.js";

const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";
const EXPECTED_CURRENCY = "MXN";

function safeQty(q) {
    const n = Number(q);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(99, Math.floor(n)));
}

function calcTotalFromCartSnapshot(cartSnapshot) {
    const items = Array.isArray(cartSnapshot) ? cartSnapshot : [];
    let total = 0;

    for (const item of items) {
        const qty = safeQty(item?.quantity);
        const unit = Number(computeUnitPrice(item) || 0);
        total += unit * qty;
    }

    return Math.round(total * 100) / 100;
}

function isValidOrderId(orderId) {
    if (typeof orderId !== "string") return false;
    if (orderId.length < 6 || orderId.length > 80) return false;
    return /^[A-Za-z0-9_-]+$/.test(orderId);
}

async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
        throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const r = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    const json = await r.json().catch(() => null);
    if (!r.ok || !json?.access_token) {
        throw new Error(json?.error_description || "Failed to get PayPal access token");
    }

    return json.access_token;
}

function extractCapturedAmount(captureJson) {
    const pu = captureJson?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    const value = cap?.amount?.value;
    return value ? Number(value) : null;
}

function extractCustomId(captureJson) {
    const pu = captureJson?.purchase_units?.[0];
    return pu?.custom_id || null;
}

function extractCaptureStatus(captureJson) {
    const pu = captureJson?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    return cap?.status || "";
}

function extractCaptureCurrency(captureJson) {
    const pu = captureJson?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    return cap?.amount?.currency_code || "";
}

function sanitizeString(s, max = 200) {
    return String(s || "").slice(0, max);
}

function pickPendingPayload(p) {
    return {
        orderId: sanitizeString(p?.orderId, 80),
        contact: sanitizeString(p?.contact, 120),
        address: sanitizeString(p?.address, 500),
        addressObj: p?.addressObj && typeof p.addressObj === "object"
            ? {
                country: sanitizeString(p.addressObj.country, 10),
                state: sanitizeString(p.addressObj.state, 60),
                municipality: sanitizeString(p.addressObj.municipality, 80),
                neighborhood: sanitizeString(p.addressObj.neighborhood, 120),
                postalCode: sanitizeString(p.addressObj.postalCode, 10),
                street: sanitizeString(p.addressObj.street, 120),
                streetNumber: sanitizeString(p.addressObj.streetNumber, 20),
                interiorNumber: sanitizeString(p.addressObj.interiorNumber, 20),
                noNumber: !!p.addressObj.noNumber,
                references: sanitizeString(p.addressObj.references, 200),
                formattedAddress: sanitizeString(p.addressObj.formattedAddress, 600)
            }
            : null
    };
}

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        const orderID = String(body?.orderID || "").trim();
        const pendingPayload = body?.pendingPayload || null;
        const cartSnapshot = body?.cartSnapshot;

        if (!orderID) return res.status(400).json({ error: "Missing orderID" });

        if (!Array.isArray(cartSnapshot) || cartSnapshot.length === 0) {
            return res.status(400).json({ error: "Invalid cartSnapshot" });
        }

        // Whitelist del payload (evita inyección de campos a Sheets)
        const base = pickPendingPayload(pendingPayload);

        if (!isValidOrderId(base.orderId)) {
            return res.status(400).json({ error: "Invalid pendingPayload.orderId" });
        }

        // Total “oficial” server-side (NO confiar en unitPrice del cliente)
        const expectedTotal = calcTotalFromCartSnapshot(cartSnapshot);

        if (!(expectedTotal > 0)) {
            return res.status(400).json({ error: "Expected total must be > 0" });
        }

        const accessToken = await getPayPalAccessToken();

        // Captura
        const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        const captureJson = await r.json().catch(() => null);

        if (!r.ok) {
            return res.status(r.status).json({
                error: captureJson?.message || "Failed to capture PayPal order",
                details: captureJson
            });
        }

        // Amarre fuerte: PayPal custom_id DEBE existir y debe coincidir con tu orderId interno
        const paypalCustomId = extractCustomId(captureJson);

        if (!paypalCustomId) {
            return res.status(400).json({ error: "Missing PayPal custom_id (order binding failed)" });
        }

        if (paypalCustomId !== base.orderId) {
            return res.status(400).json({
                error: "PayPal order does not match pendingPayload.orderId",
                expectedOrderId: base.orderId,
                paypalCustomId
            });
        }

        // Validar estado y moneda del capture (hardening)
        const capStatus = extractCaptureStatus(captureJson);
        if (capStatus && capStatus !== "COMPLETED") {
            return res.status(400).json({ error: "Capture not completed", status: capStatus });
        }

        const capCurrency = extractCaptureCurrency(captureJson);
        if (capCurrency && capCurrency !== EXPECTED_CURRENCY) {
            return res.status(400).json({ error: "Currency mismatch", currency: capCurrency });
        }

        const captured = extractCapturedAmount(captureJson);

        // Verificación del monto (tolerancia mínima por flotantes)
        if (captured == null || Math.abs(captured - expectedTotal) > 0.009) {
            return res.status(400).json({
                error: "Captured amount mismatch",
                expected: expectedTotal.toFixed(2),
                captured: captured == null ? null : captured.toFixed(2)
            });
        }

        const payerEmail = captureJson?.payer?.email_address || "";

        // Re-armar items desde server (no confiar en los items del cliente)
        const serverItems = buildItemsForSheet(cartSnapshot);

        const paidPayload = {
            ...base,
            status: "PAID",
            total: Number(expectedTotal.toFixed(2)),
            items: serverItems,
            paypal: {
                id: orderID,
                payerEmail
            }
        };

        const sheetsUrl = process.env.SHEETS_WEBHOOK_URL;
        if (!sheetsUrl) {
            return res.status(500).json({ error: "Missing SHEETS_WEBHOOK_URL on server" });
        }

        const headers = { "Content-Type": "text/plain;charset=utf-8" };

        // Hardening opcional: protege el webhook con un secret header (si configuras la env var).
        const sheetsSecret = process.env.SHEETS_WEBHOOK_SECRET;
        if (sheetsSecret) {
            headers["X-FV-Secret"] = sheetsSecret;
        }

        // Registrar en Sheets desde backend
        const s = await fetch(sheetsUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(paidPayload)
        });

        const sj = await s.json().catch(() => null);
        if (!s.ok || !sj?.ok) {
            return res.status(500).json({ error: sj?.error || "Failed to write to Sheets" });
        }

        return res.status(200).json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: e?.message || "Server error" });
    }
}
