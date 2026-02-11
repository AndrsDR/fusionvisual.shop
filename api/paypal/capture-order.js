import { capturePayPalOrder } from "../../server/paypal/captureOrder.js";

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
        }

        const out = await capturePayPalOrder(req.body);
        const status = out?.ok ? 200 : 400;

        return res.status(status).json(out);
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: "CAPTURE_ORDER_FAILED",
            message: err?.message || String(err)
        });
    }
}
