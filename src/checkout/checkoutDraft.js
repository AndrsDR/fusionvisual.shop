// src/checkout/checkoutDraft.js
import { computeUnitPrice } from "../pricing/pricing.js";

const KEY_PREFIX = "fv_checkout_draft:";
const ACTIVE_KEY = "fv_checkout_active_session";
const VERSION = 1;

// TTL del draft (ajústalo si quieres)
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function now() {
    return Date.now();
}

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function createCheckoutSessionId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `chk_${crypto.randomUUID()}`;
    }
    const rand = Math.random().toString(16).slice(2);
    return `chk_${now()}_${rand}`;
}

export function getDraftStorageKey(sessionId) {
    return `${KEY_PREFIX}${sessionId}`;
}

export function setActiveCheckoutSessionId(sessionId) {
    localStorage.setItem(ACTIVE_KEY, String(sessionId || ""));
}

export function getActiveCheckoutSessionId() {
    const v = localStorage.getItem(ACTIVE_KEY);
    return v || null;
}

export function clearActiveCheckoutSessionId() {
    localStorage.removeItem(ACTIVE_KEY);
}

export function isDraftExpired(draft) {
    const createdAt = Number(draft?.createdAt || 0);
    if (!createdAt) return true;
    return now() - createdAt > DRAFT_TTL_MS;
}

/**
 * Address object (MX) inicial vacío
 */
export function createEmptyAddress() {
    return {
        country: "MX",
        state: "",
        municipality: "",
        neighborhood: "",
        postalCode: "",
        street: "",
        streetNumber: "",
        interiorNumber: "",
        noNumber: false,
        references: "",
        formattedAddress: "",
        lat: null,
        lng: null,
        placeId: null,
        validation: {
            method: "cp",        // cp | places | manual
            confirmed: false
        }
    };
}

/**
 * Validación mínima del draft (no valida address completa; eso lo haces en CheckoutPage)
 */
export function validateDraft(draft) {
    if (!draft || typeof draft !== "object") return { ok: false, reason: "Draft vacío" };
    if (draft.version !== VERSION) return { ok: false, reason: "Versión inválida" };
    if (!draft.sessionId) return { ok: false, reason: "Sin sessionId" };
    if (!Array.isArray(draft.cartSnapshot) || draft.cartSnapshot.length === 0) {
        return { ok: false, reason: "Carrito vacío" };
    }
    if (draft.origin && draft.origin !== window.location.origin) {
        return { ok: false, reason: "Origen inválido" };
    }
    if (isDraftExpired(draft)) return { ok: false, reason: "Draft expirado" };

    // address puede venir de versiones viejas (string). No invalidamos por eso:
    // CheckoutPage debe migrarlo o manejarlo.
    return { ok: true };
}

export function calcTotalFromCartSnapshot(cartSnapshot) {
    return (cartSnapshot || []).reduce((acc, item) => {
        const unit = Number(item?.unitPrice || 0);
        const qty = Number(item?.quantity || 1);
        return acc + unit * qty;
    }, 0);
}

// Items para Google Sheets
export function buildItemsForSheet(cartSnapshot) {
    return (cartSnapshot || []).map((item) => {
        const quantity = item.quantity || 1;
        const unitPrice = computeUnitPrice(item) || 0;

        const type = item.type || "default";
        const isDefault = type === "default";

        const designLabel = isDefault
            ? (item.designId || item.name || "")
            : (item.designLabel || item.name || "");

        const pngFront = isDefault
            ? (item.designImageUrl || "")
            : (item.pngFront || item.frontDesign?.png || "");

        const pngBack = isDefault
            ? ""
            : (item.pngBack || item.backDesign?.png || "");

        return {
            type,
            designLabel,
            sidesMode: item.sidesMode || "front",
            size: item.size || "",
            fabric: item.fabric || "",
            shirtType: item.shirtType || "",
            color: item.color || item.colorHex || "",
            quantity,
            unitPrice,
            pngFront,
            pngBack
        };
    });
}

export function createDraftFromCart(cart) {
    const sessionId = createCheckoutSessionId();
    const cartSnapshot = typeof structuredClone === "function"
        ? structuredClone(cart)
        : JSON.parse(JSON.stringify(cart));

    return {
        version: VERSION,
        sessionId,
        createdAt: now(),
        origin: window.location.origin,
        status: "DRAFT", // DRAFT | SUBMITTED | PAID | COMPLETED | ERROR

        cartSnapshot,

        // Contacto
        contact: "",

        // ✅ Dirección estructurada (MX)
        address: createEmptyAddress(),

        // Checkout/pago
        orderId: "",
        paymentStatus: "PENDING", // PENDING | PAID
        pendingPayload: null,

        paypal: {
            orderId: "",
            payerEmail: ""
        }
    };
}

export function saveDraft(draft) {
    const key = getDraftStorageKey(draft.sessionId);
    localStorage.setItem(key, JSON.stringify(draft));
}

export function loadDraft(sessionId) {
    if (!sessionId) return null;
    const key = getDraftStorageKey(sessionId);
    const raw = localStorage.getItem(key);
    return safeParse(raw);
}

export function deleteDraft(sessionId) {
    if (!sessionId) return;
    localStorage.removeItem(getDraftStorageKey(sessionId));
}

export function patchDraft(sessionId, partial) {
    const current = loadDraft(sessionId);
    if (!current) return null;

    // Merge superficial
    const next = { ...current, ...partial };

    // Si quieres merge profundo SOLO para address:
    // (así updateDraft({ address: { street: "X" } }) no borra lo demás)
    if (partial && typeof partial === "object" && partial.address && typeof partial.address === "object") {
        const base = current.address && typeof current.address === "object"
            ? current.address
            : createEmptyAddress();

        next.address = { ...base, ...partial.address };
    }

    saveDraft(next);
    return next;
}
