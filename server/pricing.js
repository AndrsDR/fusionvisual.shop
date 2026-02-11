// server/pricing.js
const SHIRT_BASE_PRICE = {
    basic: 179,
    polo: 249,
    vneck: 199
};

const FABRIC_DELTA = {
    cotton: 19,
    premium: 39,
    dryfit: 59
};

const SIDES_DELTA = {
    front: 0,
    back: 0,
    both: 59
};

const DESIGN_FLAT_PRICE = 49;

function safeNumber(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
}

function pickKey(map, key, fallbackKey) {
    return Object.prototype.hasOwnProperty.call(map, key) ? key : fallbackKey;
}

// Retorna en pesos (entero)
export function computeUnitPriceMXN(item) {
    const rawShirtType = item?.shirtType || "basic";
    const rawFabric = item?.fabric || "cotton";
    const rawSidesMode = item?.sidesMode || "front";

    const shirtType = pickKey(SHIRT_BASE_PRICE, rawShirtType, "basic");
    const fabric = pickKey(FABRIC_DELTA, rawFabric, "cotton");
    const sidesMode = pickKey(SIDES_DELTA, rawSidesMode, "front");

    const base = safeNumber(SHIRT_BASE_PRICE[shirtType], 0);
    const fabricDelta = safeNumber(FABRIC_DELTA[fabric], 0);
    const sidesDelta = safeNumber(SIDES_DELTA[sidesMode], 0);

    const isDesignOnly = item?.type === "default" && !item?.shirtType;
    if (isDesignOnly) return DESIGN_FLAT_PRICE;

    return base + fabricDelta + sidesDelta + DESIGN_FLAT_PRICE;
}

export function calcCartTotalMXN(cartSnapshot) {
    if (!Array.isArray(cartSnapshot)) return 0;

    return cartSnapshot.reduce((acc, item) => {
        const qty = Math.max(1, Math.floor(Number(item?.quantity || 1)));
        const unit = computeUnitPriceMXN(item);
        return acc + unit * qty;
    }, 0);
}
