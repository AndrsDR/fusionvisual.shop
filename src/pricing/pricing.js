// src/pricing/pricing.js

export const SHIRT_BASE_PRICE = {
    basic: 179,
    polo: 249,
    vneck: 199,
};

export const FABRIC_DELTA = {
    cotton: 20,
    premium: 40,
    dryfit: 60,
};

export const SIDES_DELTA = {
    front: 0,
    back: 0,
    both: 60,
};

// ✅ Un solo precio para cualquier diseño
export const DESIGN_FLAT_PRICE = .1;

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
    if (item.type === "default") {
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

    breakdown.unitPrice =
        (item.type === "default")
            ? breakdown.designFlat
            : breakdown.base + breakdown.fabricDelta + breakdown.sidesDelta + breakdown.designFlat;

    return breakdown;
}
