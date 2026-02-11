// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";

import { createPayPalOrder } from "./paypal/createOrder.js";
import { capturePayPalOrder } from "./paypal/captureOrder.js";

const app = express();

const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]);

app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.has(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));

// JSON parse errors -> JSON response (no HTML)
app.use((err, req, res, next) => {
    if (err && err.type === "entity.parse.failed") {
        return res.status(400).json({
            ok: false,
            error: "INVALID_JSON_BODY"
        });
    }
    return next(err);
});

app.get("/api/health", (req, res) => {
    res.status(200).json({ ok: true });
});

app.get("/api/ping", (req, res) => {
    res.status(200).json({ ok: true, pong: true });
});

app.post("/api/paypal/create-order", async (req, res) => {
    try {
        const out = await createPayPalOrder(req.body);

        if (!out.ok) {
            const status = out.error === "MISSING_ORDER_ID" || out.error === "EMPTY_CART" || out.error === "INVALID_TOTAL"
                ? 400
                : 502;

            return res.status(status).json(out);
        }

        return res.status(200).json(out);
    } catch (err) {
        console.error("create-order error:", err);
        return res.status(500).json({
            ok: false,
            error: "SERVER_ERROR",
            message: String(err?.message || err)
        });
    }
});

app.post("/api/paypal/capture-order", async (req, res) => {
    try {
        const out = await capturePayPalOrder(req.body);

        if (!out.ok) {
            // ORDER_NOT_APPROVED -> 409 (conflict), other paypal failures -> 502
            const status = out.error === "MISSING_PAYPAL_ORDER_ID"
                ? 400
                : out.error === "ORDER_NOT_APPROVED"
                    ? 409
                    : 502;

            return res.status(status).json(out);
        }

        return res.status(200).json(out);
    } catch (err) {
        console.error("capture-order error:", err);
        return res.status(500).json({
            ok: false,
            error: "SERVER_ERROR",
            message: String(err?.message || err)
        });
    }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "127.0.0.1", () => {
    console.log(`[server] listening on http://127.0.0.1:${port}`);
});
