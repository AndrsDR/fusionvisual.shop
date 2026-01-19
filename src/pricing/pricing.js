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

// Unit price por 1 unidad (sin quantity)
export function computeUnitPrice(item) {
    const shirtType = item.shirtType || "basic";
    const fabric = item.fabric || "cotton";
    const sidesMode = item.sidesMode || "front";

    const base = safeNumber(SHIRT_BASE_PRICE[shirtType], 0);
    const fabricDelta = safeNumber(FABRIC_DELTA[fabric], 0);
    const sidesDelta = safeNumber(SIDES_DELTA[sidesMode], 0);

    // Si "default" es solo diseño (sin playera), cobra solo el diseño
    // Tu buildItemsForSheet mapea type "default" distinto. :contentReference[oaicite:1]{index=1}
    const isDesignOnly = item.type === "default" && !item.shirtType;
    if (isDesignOnly) {
        return DESIGN_FLAT_PRICE;
    }

    // Para custom / prendas: base + tela + lados + diseño fijo
    return base + fabricDelta + sidesDelta + DESIGN_FLAT_PRICE;
}

export function computePriceBreakdown(item) {
    const shirtType = item.shirtType || "basic";
    const fabric = item.fabric || "cotton";
    const sidesMode = item.sidesMode || "front";

    const breakdown = {
        base: safeNumber(SHIRT_BASE_PRICE[shirtType], 0),
        fabricDelta: safeNumber(FABRIC_DELTA[fabric], 0),
        sidesDelta: safeNumber(SIDES_DELTA[sidesMode], 0),
        designFlat: DESIGN_FLAT_PRICE,
    };

    const isDesignOnly = item.type === "default" && !item.shirtType;

    breakdown.unitPrice = isDesignOnly
        ? breakdown.designFlat
        : breakdown.base + breakdown.fabricDelta + breakdown.sidesDelta + breakdown.designFlat;

    return breakdown;
}
