// server/paypal/createOrder.js
import { getPayPalAccessToken, getPayPalBaseUrl } from "./paypalClient.js";
import { calcCartTotalMXN } from "../pricing.js";

function toPayPalAmountString(mxnNumber) {
    const value = Number(mxnNumber);
    const safe = Number.isFinite(value) ? value : 0;
    return safe.toFixed(2);
}

function pickApproveUrl(links) {
    if (!Array.isArray(links)) return "";
    const approve = links.find((l) => l?.rel === "approve") || links.find((l) => l?.rel === "payer-action");
    return approve?.href || "";
}

export async function createPayPalOrder(body) {
    const orderId = body?.orderId;
    const cartSnapshot = body?.cartSnapshot;

    if (!orderId || typeof orderId !== "string") {
        return { ok: false, error: "MISSING_ORDER_ID" };
    }
    if (!Array.isArray(cartSnapshot) || cartSnapshot.length === 0) {
        return { ok: false, error: "EMPTY_CART" };
    }
    function isValidCartItem(item) {
        const qty = Number(item?.quantity);
        if (!Number.isFinite(qty) || qty <= 0) return false;

        const hasShirt = typeof item?.shirtType === "string" && item.shirtType.length > 0;
        const hasFabric = typeof item?.fabric === "string" && item.fabric.length > 0;
        const hasSides = typeof item?.sidesMode === "string" && item.sidesMode.length > 0;

        // Si tu negocio NO vende “solo diseño” en checkout, exige camisa
        if (!hasShirt) return false;

        // Si quieres ser estricto:
        if (!hasFabric) return false;
        if (!hasSides) return false;

        return true;
    }

    for (const item of cartSnapshot) {
        if (!isValidCartItem(item)) {
            return { ok: false, error: "INVALID_CART_ITEM" };
        }
    }
    


    const totalMXN = calcCartTotalMXN(cartSnapshot);
    if (!(totalMXN > 0)) {
        return { ok: false, error: "INVALID_TOTAL" };
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const resp = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "MXN",
                        value: toPayPalAmountString(totalMXN)
                    },
                    custom_id: orderId
                }
            ]
        })
    });

    const json = await resp.json().catch(() => null);

    if (!resp.ok) {
        return { ok: false, error: "PAYPAL_CREATE_FAILED", details: json };
    }

    return {
        ok: true,
        paypalOrderId: json?.id || "",
        approveUrl: pickApproveUrl(json?.links),
        debug: {
            orderId,
            totalMXN
        }
    };
}
