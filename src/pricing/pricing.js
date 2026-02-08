// src/pricing/pricing.js

export const SHIRT_BASE_PRICE = {
    basic: .179,
    polo: .249,
    vneck: .199,
};

export const FABRIC_DELTA = {
    cotton: .19,
    premium: .39,
    dryfit: .59,
};

export const SIDES_DELTA = {
    front: 0,
    back: 0,
    both: .59,
};

// costo del diseño/impresión
export const DESIGN_FLAT_PRICE = .49;

function safeNumber(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
}

function pickKey(map, key, fallbackKey) {
    return Object.prototype.hasOwnProperty.call(map, key) ? key : fallbackKey;
}

// Unit price por 1 unidad (sin quantity)
export function computeUnitPrice(item) {
    const rawShirtType = item?.shirtType || "basic";
    const rawFabric = item?.fabric || "cotton";
    const rawSidesMode = item?.sidesMode || "front";

    // IMPORTANT: si el cliente manda valores inválidos, NO debe bajar el precio a 0.
    // Forzamos fallback a llaves válidas.
    const shirtType = pickKey(SHIRT_BASE_PRICE, rawShirtType, "basic");
    const fabric = pickKey(FABRIC_DELTA, rawFabric, "cotton");
    const sidesMode = pickKey(SIDES_DELTA, rawSidesMode, "front");

    const base = safeNumber(SHIRT_BASE_PRICE[shirtType], 0);
    const fabricDelta = safeNumber(FABRIC_DELTA[fabric], 0);
    const sidesDelta = safeNumber(SIDES_DELTA[sidesMode], 0);

    // Si "default" es solo diseño (sin playera), cobra solo el diseño
    const isDesignOnly = item?.type === "default" && !item?.shirtType;
    if (isDesignOnly) {
        return DESIGN_FLAT_PRICE;
    }

    // Para custom / prendas: base + tela + lados + diseño fijo
    return base + fabricDelta + sidesDelta + DESIGN_FLAT_PRICE;
}

export function computePriceBreakdown(item) {
    const rawShirtType = item?.shirtType || "basic";
    const rawFabric = item?.fabric || "cotton";
    const rawSidesMode = item?.sidesMode || "front";

    const shirtType = pickKey(SHIRT_BASE_PRICE, rawShirtType, "basic");
    const fabric = pickKey(FABRIC_DELTA, rawFabric, "cotton");
    const sidesMode = pickKey(SIDES_DELTA, rawSidesMode, "front");

    const breakdown = {
        base: safeNumber(SHIRT_BASE_PRICE[shirtType], 0),
        fabricDelta: safeNumber(FABRIC_DELTA[fabric], 0),
        sidesDelta: safeNumber(SIDES_DELTA[sidesMode], 0),
        designFlat: DESIGN_FLAT_PRICE,
    };

    const isDesignOnly = item?.type === "default" && !item?.shirtType;

    breakdown.unitPrice = isDesignOnly
        ? breakdown.designFlat
        : breakdown.base + breakdown.fabricDelta + breakdown.sidesDelta + breakdown.designFlat;

    return breakdown;
}
