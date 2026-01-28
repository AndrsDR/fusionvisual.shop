// src/checkout/checkoutChannel.js

const CHANNEL_NAME = "fv_checkout_channel";
const FALLBACK_KEY = "fv_checkout_event";

export function publishCheckoutEvent(event) {
    // event: { type, sessionId, payload? }
    const msg = {
        ...event,
        ts: Date.now(),
    };

    // 1) BroadcastChannel
    if ("BroadcastChannel" in window) {
        const ch = new BroadcastChannel(CHANNEL_NAME);
        ch.postMessage(msg);
        ch.close();
        return;
    }

    // 2) Fallback: storage event
    try {
        localStorage.setItem(FALLBACK_KEY, JSON.stringify(msg));
        // remover ayuda a no dejar basura
        localStorage.removeItem(FALLBACK_KEY);
    } catch {
        // no-op
    }
}

export function subscribeCheckoutEvents(onEvent) {
    const unsubs = [];

    // 1) BroadcastChannel
    if ("BroadcastChannel" in window) {
        const ch = new BroadcastChannel(CHANNEL_NAME);
        const handler = (e) => onEvent?.(e.data);
        ch.addEventListener("message", handler);

        unsubs.push(() => {
            ch.removeEventListener("message", handler);
            ch.close();
        });
    }

    // 2) Fallback: storage event
    const storageHandler = (e) => {
        if (e.key !== FALLBACK_KEY || !e.newValue) return;
        try {
            const data = JSON.parse(e.newValue);
            onEvent?.(data);
        } catch {
            // ignore
        }
    };
    window.addEventListener("storage", storageHandler);
    unsubs.push(() => window.removeEventListener("storage", storageHandler));

    return () => unsubs.forEach((fn) => fn());
}
