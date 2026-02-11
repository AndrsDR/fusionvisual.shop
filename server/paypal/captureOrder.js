// server/paypal/captureOrder.js
import { getPayPalAccessToken, getPayPalBaseUrl } from "./paypalClient.js";

function extractIssue(detailsJson) {
    const details = detailsJson?.details;
    if (!Array.isArray(details) || details.length === 0) return "";
    return details[0]?.issue || "";
}

export async function capturePayPalOrder(body) {
    const paypalOrderId = body?.paypalOrderId;

    if (!paypalOrderId || typeof paypalOrderId !== "string") {
        return { ok: false, error: "MISSING_PAYPAL_ORDER_ID" };
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const resp = await fetch(
        `${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        }
    );

    const json = await resp.json().catch(() => null);

    if (!resp.ok) {
        const issue = extractIssue(json);

        if (issue === "ORDER_NOT_APPROVED") {
            return {
                ok: false,
                error: "ORDER_NOT_APPROVED",
                details: json
            };
        }

        return { ok: false, error: "PAYPAL_CAPTURE_FAILED", details: json };
    }

    return { ok: true, capture: json };
}
