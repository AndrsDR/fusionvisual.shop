import { createPayPalOrder } from "../../server/paypal/createOrder.js";

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
        }

        const out = await createPayPalOrder(req.body);
        const status = out?.ok ? 200 : 400;

        return res.status(status).json(out);
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: "CREATE_ORDER_FAILED",
            message: err?.message || String(err)
        });
    }
}
