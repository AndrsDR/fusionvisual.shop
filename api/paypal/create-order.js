// api/paypal/create-order.js

import { computeUnitPrice } from "../../src/pricing/pricing.js";

const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";

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

    // redondeo a 2 decimales
    return Math.round(total * 100) / 100;
}

function isValidOrderId(orderId) {
    // Permite UUID, folios, etc. (alfa-num + guion + underscore)
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

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const cartSnapshot = body?.cartSnapshot;
        const orderId = String(body?.orderId || "").trim();

        if (!Array.isArray(cartSnapshot) || cartSnapshot.length === 0) {
            return res.status(400).json({ error: "Invalid cartSnapshot" });
        }

        // Arquitectura esperada: el cliente manda un folio interno y el backend lo amarra con custom_id.
        if (!isValidOrderId(orderId)) {
            return res.status(400).json({ error: "Invalid or missing orderId" });
        }

        const total = calcTotalFromCartSnapshot(cartSnapshot);
        if (!(total > 0)) {
            return res.status(400).json({ error: "Total must be > 0" });
        }

        const accessToken = await getPayPalAccessToken();

        const value = total.toFixed(2);

        const payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "MXN",
                        value
                    },
                    // Amarre fuerte: SIEMPRE presente
                    custom_id: orderId
                }
            ]
        };

        const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const json = await r.json().catch(() => null);

        if (!r.ok || !json?.id) {
            return res.status(r.status).json({
                error: json?.message || "Failed to create PayPal order",
                details: json
            });
        }

        return res.status(200).json({
            orderID: json.id,
            total: value
        });
    } catch (e) {
        return res.status(500).json({ error: e?.message || "Server error" });
    }
}
