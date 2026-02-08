// api/paypal/create-order.js

import { computeUnitPrice } from "../../src/pricing/pricing.js";

function getPayPalBase() {
    const env = String(process.env.PAYPAL_ENV || "sandbox").toLowerCase();
    return env === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
}

function enforceOrigin(req, res) {
    const allowed = process.env.ALLOWED_ORIGIN;
    if (!allowed) return true; // si no configuras ALLOWED_ORIGIN, no bloqueamos

    const origin = req.headers.origin || "";
    if (origin !== allowed) {
        res.status(403).json({ error: "Forbidden origin" });
        return false;
    }
    return true;
}

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

async function getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
        throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const PAYPAL_BASE = getPayPalBase();

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

        if (!enforceOrigin(req, res)) return;

        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        const cartSnapshot = body?.cartSnapshot;
        const orderId = String(body?.orderId || "").trim();

        if (!orderId) {
            return res.status(400).json({ error: "Missing orderId" });
        }

        if (!Array.isArray(cartSnapshot) || cartSnapshot.length === 0) {
            return res.status(400).json({ error: "Invalid cartSnapshot" });
        }

        const total = calcTotalFromCartSnapshot(cartSnapshot);
        if (!(total > 0)) {
            return res.status(400).json({ error: "Total must be > 0" });
        }

        const accessToken = await getPayPalAccessToken();
        const PAYPAL_BASE = getPayPalBase();
        const value = total.toFixed(2);

        const payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "MXN",
                        value
                    },
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
