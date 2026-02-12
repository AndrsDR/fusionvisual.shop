export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
        }

        const url = process.env.SHEETS_WEBHOOK_URL;
        if (!url) {
            return res.status(500).json({ ok: false, error: "MISSING_SHEETS_WEBHOOK_URL" });
        }

        const payload = req.body;

        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        const text = await resp.text();
        let json = null;
        try {
            json = JSON.parse(text);
        } catch {
            json = null;
        }

        if (!resp.ok) {
            return res.status(502).json({
                ok: false,
                error: "SHEETS_WEBHOOK_FAILED",
                status: resp.status,
                body: text
            });
        }

        if (json && json.ok === false) {
            return res.status(502).json({
                ok: false,
                error: json.error || "SHEETS_REJECTED",
                body: json
            });
        }

        return res.status(200).json({ ok: true, sheets: json || text });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: "SHEETS_PROXY_FAILED",
            message: err?.message || String(err)
        });
    }
}
