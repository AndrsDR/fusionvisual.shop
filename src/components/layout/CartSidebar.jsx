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

    return (
        <div className="cart-thumb-shirt-wrap">
            <img src={getShirtImagePath(item)} alt="Camisa" className="cart-thumb-shirt" />
            {item.frontDesign && (
                <img src={item.frontDesign.png} alt="Diseño" className="cart-thumb-design" />
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
