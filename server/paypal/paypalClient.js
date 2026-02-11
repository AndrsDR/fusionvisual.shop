// server/paypal/paypalClient.js
function mustEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

export function getPayPalBaseUrl() {
    return process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken() {
    const clientId = mustEnv("PAYPAL_CLIENT_ID");
    const secret = mustEnv("PAYPAL_SECRET");
    const baseUrl = getPayPalBaseUrl();

    const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const resp = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    const json = await resp.json().catch(() => null);

    if (!resp.ok) {
        throw new Error(`PayPal token failed: ${JSON.stringify(json)}`);
    }

    if (!json?.access_token) {
        throw new Error("PayPal token missing access_token");
    }

    return json.access_token;
}
