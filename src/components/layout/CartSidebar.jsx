import { useEffect } from "react";
import "./CartSidebar.css";

import { useCart } from "../../context/CartContext.jsx";
import { useCartUI } from "../../context/CartUIContext.jsx";
import { computePriceBreakdown } from "../../pricing/pricing.js";

import {
    createDraftFromCart,
    saveDraft,
    setActiveCheckoutSessionId,
    getActiveCheckoutSessionId,
    clearActiveCheckoutSessionId
} from "../../checkout/checkoutDraft.js";

import { subscribeCheckoutEvents } from "../../checkout/checkoutChannel.js";

/* =========================
   Helpers (puros)
========================= */
function getShirtImagePath(item) {
    const type = item.shirtType || "basic";
    const colorId = item.colorHex || "negro";
    return `/shirts/${type}/front/${colorId}.png`;
}

function getFlexAlignmentX(x) {
    if (x === "left") return "flex-start";
    if (x === "right") return "flex-end";
    return "center";
}

function getFlexAlignmentY(y) {
    if (y === "top") return "flex-start";
    if (y === "bottom") return "flex-end";
    return "center";
}

function getTransformOrigin(x, y) {
    const ox = x === "left" ? "0%" : x === "right" ? "100%" : "50%";
    const oy = y === "top" ? "0%" : y === "bottom" ? "100%" : "50%";
    return `${ox} ${oy}`;
}

function getThumbPrintAreaStyle(shirtType) {
    if (shirtType === "polo" || shirtType === "v-neck") {
        return {
            width: "42%",
            height: "52%",
            transform: "translate(-50%, -40%)"
        };
    }

    return {
        width: "45%",
        height: "55%",
        transform: "translate(-50%, -45%)"
    };
}

function SidesLabel({ mode }) {
    if (mode === "both") return <span>Frente y espalda</span>;
    if (mode === "back") return <span>Solo espalda</span>;
    return <span>Solo frente</span>;
}

function calcTotal(cart) {
    return cart.reduce((acc, item) => {
        const price = item.unitPrice || 0;
        const qty = item.quantity || 1;
        return acc + price * qty;
    }, 0);
}

function money(n) {
    const x = Number(n);
    return `$${(Number.isFinite(x) ? x : 0).toFixed(2)}`;
}

/* =========================
   Subcomponentes UI
========================= */
function CartHeader({ onClose }) {
    return (
        <header className="cart-header">
            <h2>Tu carrito</h2>
            <button className="cart-close-btn" onClick={onClose} aria-label="Cerrar carrito">
                ×
            </button>
        </header>
    );
}

function CartItemThumb({ item }) {
    if (item.type === "default") {
        return (
            <img
                src={item.designImageUrl}
                alt={item.name || item.designId}
                className="cart-thumb-img"
            />
        );
    }

    const placement = item.frontPlacement || item.frontDesign?.placement || {};
    const x = placement?.x || "center";
    const y = placement?.y || "center";
    const scale = Math.max(0, Math.min(100, Number(placement?.scale ?? 100)));
    const printAreaStyle = getThumbPrintAreaStyle(item.shirtType || "basic");
    const designSrc = item.frontDesign?.png || "";

    return (
        <div className="cart-thumb-shirt-wrap">
            <img src={getShirtImagePath(item)} alt="Camisa" className="cart-thumb-shirt" />
            {!!designSrc && (
                <div
                    className="cart-thumb-print-area"
                    style={{
                        ...printAreaStyle,
                        justifyContent: getFlexAlignmentX(x),
                        alignItems: getFlexAlignmentY(y)
                    }}
                >
                    <img
                        src={designSrc}
                        alt="Dise�o"
                        className="cart-thumb-design-img"
                        style={{
                            transform: `scale(${scale / 100})`,
                            transformOrigin: getTransformOrigin(x, y)
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function CartItemInfo({ item }) {
    const breakdown = item.priceBreakdown || computePriceBreakdown(item);

    return (
        <div className="cart-item-info">
            <h3 className="cart-item-title">
                {item.type === "custom" ? "Camiseta personalizada" : item.name || item.designId || "Diseño"}
            </h3>

            <p className="cart-item-meta cart-meta-row">
                <span>Talla {item.size}</span>
            </p>

            <p className="cart-item-meta cart-meta-row">
                <span>
                    Tela: {item.fabric || "Algodón"} - {money(breakdown.fabricDelta)}
                </span>
            </p>

            {item.shirtType && (
                <p className="cart-item-meta cart-meta-row">
                    <span>
                        Tipo:{" "}
                        {item.shirtType === "basic"
                            ? "Básica"
                            : item.shirtType === "polo"
                            ? "Polo"
                            : "Cuello V"}{" "}
                        - {money(breakdown.base)}
                    </span>
                </p>
            )}

            {item.sidesMode && (
                <p className="cart-item-meta cart-meta-row">
                    <span>
                        <SidesLabel mode={item.sidesMode} /> - {money(breakdown.sidesDelta)}
                    </span>
                </p>
            )}

            <p className="cart-item-meta cart-meta-row">
                <span>Diseño - {money(breakdown.designFlat)}</span>
            </p>

            <p className="cart-item-meta">Cantidad: {item.quantity || 1}</p>
        </div>
    );
}

function CartItemActions({ item, onRemoveOrDecrement }) {
    const unit = item.unitPrice || 0;
    const qty = item.quantity || 1;
    const lineTotal = unit * qty;

    return (
        <div className="cart-item-actions">
            <div className="cart-item-pricewrap">
                <span className="cart-item-price">{money(lineTotal)}</span>
            </div>

            <button className="cart-remove-btn" onClick={() => onRemoveOrDecrement(item)}>
                Quitar
            </button>
        </div>
    );
}

function CartItemRow({ item, onRemoveOrDecrement }) {
    return (
        <li className="cart-item">
            <div className="cart-item-thumb">
                <CartItemThumb item={item} />
            </div>

            <div className="cart-item-info">
                <CartItemInfo item={item} />
                <CartItemActions item={item} onRemoveOrDecrement={onRemoveOrDecrement} />
            </div>
        </li>
    );
}

function CartBody({ cart, onRemoveOrDecrement }) {
    return (
        <div className="cart-body">
            {cart.length === 0 ? (
                <p className="cart-empty">Aún no has agregado nada.</p>
            ) : (
                <ul className="cart-items">
                    {cart.map((item) => (
                        <CartItemRow key={item.id} item={item} onRemoveOrDecrement={onRemoveOrDecrement} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function CartFooter({ cartIsEmpty, total, onClear, onCheckoutOpen }) {
    return (
        <footer className="cart-footer">
            <div className="cart-footer-top">
                <button className="cart-clear-btn" onClick={onClear} disabled={cartIsEmpty}>
                    Vaciar carrito
                </button>

                <div className="cart-total">
                    <span>Total:</span>
                    <strong>${total.toFixed(2)}</strong>
                </div>
            </div>

            <button className="cart-checkout-btn" onClick={onCheckoutOpen} disabled={cartIsEmpty}>
                Finalizar pedido
            </button>
        </footer>
    );
}

/* =========================
   Componente principal
========================= */
export function CartSidebar() {
    const { isCartOpen, closeCart } = useCartUI();
    const { cart, removeFromCart, clearCart, decrementFromCart } = useCart();

    const total = calcTotal(cart);
    const cartIsEmpty = cart.length === 0;

    // Listener: SOLO limpia cuando checkout completó en la otra pestaña
    useEffect(() => {
        const unsub = subscribeCheckoutEvents((evt) => {
            if (!evt || evt.type !== "CHECKOUT_COMPLETED") return;

            const active = getActiveCheckoutSessionId();
            if (!active || evt.sessionId !== active) return;

            clearCart();
            closeCart();
            clearActiveCheckoutSessionId();
        });

        return unsub;
    }, [clearCart, closeCart]);

    const handleRemoveOrDecrement = (item) => {
        const qty = item.quantity || 1;
        if (qty > 1 && typeof decrementFromCart === "function") decrementFromCart(item);
        else removeFromCart(item);
    };

    if (!isCartOpen) return null;

    return (
        <div className="cart-sidebar-overlay" onClick={closeCart}>
            <aside className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
                <CartHeader onClose={closeCart} />

                <CartBody cart={cart} onRemoveOrDecrement={handleRemoveOrDecrement} />

                <CartFooter
                    cartIsEmpty={cartIsEmpty}
                    total={total}
                    onClear={clearCart}
                    onCheckoutOpen={(e) => {
                        e?.preventDefault?.();
                        if (cartIsEmpty) return;

                        const draft = createDraftFromCart(cart);
                        saveDraft(draft);
                        setActiveCheckoutSessionId(draft.sessionId);

                        // Intentar abrir en otra pestaña (sin alert/confirm)
                        window.open("/checkout", "_blank", "noopener,noreferrer");
                    }}
                />
            </aside>
        </div>
    );
}

