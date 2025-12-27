import { useState, useEffect } from "react";
import "./CartSidebar.css";
import { useCart } from "../../context/CartContext.jsx";
import { useCartUI } from "../../context/CartUIContext.jsx";
import { computePriceBreakdown, computeUnitPrice } from "../../pricing/pricing.js";

const SHEETS_WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycby0Xaf6r--8orb0ql_lXhsgTHD9A6xhGzqKYvAq9-a4VkHFPBwpqwKloXTZAFvKkMylhg/exec";

// ✅ Backend (local o prod). En prod puedes dejar VITE_API_BASE_URL vacío y usar rutas relativas.
const API_BASE_URL = "http://localhost:4242";

// ✅ key para persistir pedido pendiente durante el redirect de PayPal
const PENDING_ORDER_KEY = "fv_pending_order";

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

function buildItemsForSheet(cart) {
    return cart.map((item) => {
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

/* =========================
   Subcomponentes UI
========================= */
function CartHeader({ onClose }) {
    return (
        <header className="cart-header">
            <h2>Tu carrito</h2>
            <button
                className="cart-close-btn"
                onClick={onClose}
                aria-label="Cerrar carrito"
            >
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
            <img
                src={getShirtImagePath(item)}
                alt="Camisa"
                className="cart-thumb-shirt"
            />
            {item.frontDesign && (
                <img
                    src={item.frontDesign.png}
                    alt="Diseño"
                    className="cart-thumb-design"
                />
            )}
        </div>
    );
}

function CartItemInfo({ item }) {
    const breakdown = item.priceBreakdown || computePriceBreakdown(item);

    return (
        <div className="cart-item-info">
            <h3 className="cart-item-title">
                {item.type === "custom"
                    ? "Camiseta personalizada"
                    : item.name || item.designId || "Diseño"}
            </h3>

            {/* Talla (sin precio) */}
            <p className="cart-item-meta cart-meta-row">
                <span>Talla {item.size}</span>
            </p>

            {/* Tela + precio */}
            <p className="cart-item-meta cart-meta-row">
                <span>Tela: {item.fabric || "Algodón"} - {money(breakdown.fabricDelta)}</span>
            </p>

            {/* Tipo camisa + precio */}
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

            {/* Frente/Espalda + precio */}
            {item.sidesMode && (
                <p className="cart-item-meta cart-meta-row">
                    <span><SidesLabel mode={item.sidesMode} /> - {money(breakdown.sidesDelta)}</span>
                </p>
            )}

            {/* Diseño + precio fijo */}
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
                <span className="cart-item-price">
                    {money(lineTotal)}
                </span>
            </div>

            <button className="cart-remove-btn" onClick={onRemoveOrDecrement}>
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
                <CartItemActions
                    item={item}
                    onRemoveOrDecrement={onRemoveOrDecrement}
                />
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
                        <CartItemRow
                            key={item.id}
                            item={item}
                            onRemoveOrDecrement={() => onRemoveOrDecrement(item)}
                        />
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
                <button
                    className="cart-clear-btn"
                    onClick={onClear}
                    disabled={cartIsEmpty}
                >
                    Vaciar carrito
                </button>

                <div className="cart-total">
                    <span>Total:</span>
                    <strong>${total.toFixed(2)}</strong>
                </div>
            </div>

            <button
                className="cart-checkout-btn"
                onClick={onCheckoutOpen}
                disabled={cartIsEmpty}
            >
                Finalizar pedido
            </button>
        </footer>
    );
}

/* =========================
   Modal Checkout
========================= */
function CheckoutModal({
    contact,
    setContact,
    address,
    setAddress,
    submitted,
    isSubmitting,
    orderId,
    total,
    paymentStatus,
    onClose,
    onSubmit,
    onStartPaypal
}) {
    return (
        <div className="cart-checkout-modal">
            <div className="cart-checkout-card">
                <div className="checkout-header">
                    <h3>Checkout</h3>
                    <button
                        className="checkout-close-icon"
                        type="button"
                        aria-label="Cerrar"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        ×
                    </button>
                </div>

                {!submitted ? (
                    <>
                        <p className="checkout-text">
                            Completa tus datos para preparar tu pedido.
                            <br />
                            Después podrás pagar con PayPal.
                        </p>

                        <form onSubmit={onSubmit} className="checkout-form">
                            <label className="checkout-label">
                                Celular o correo electrónico:
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Ej. +52 998... o usuario@gmail.com"
                                    className="checkout-input"
                                    disabled={isSubmitting}
                                />
                            </label>

                            <label className="checkout-label">
                                Dirección de entrega:
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Calle, número, colonia, C.P., referencias..."
                                    className="checkout-input checkout-textarea"
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                            </label>

                            <button
                                type="submit"
                                className="checkout-submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Procesando..." : "Continuar"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="checkout-thanks">
                        <p><strong>Pedido listo ✅</strong></p>

                        <p style={{ marginTop: "0.5rem" }}>
                            Total: <strong>${Number(total || 0).toFixed(2)}</strong>
                        </p>

                        {orderId ? (
                            <p style={{ marginTop: "0.5rem" }}>
                                Folio interno: <strong>{orderId}</strong>
                            </p>
                        ) : null}

                        {paymentStatus === "PAID" ? (
                            <p style={{ marginTop: "0.75rem" }}>
                                Pago confirmado ✅ ¡Gracias por tu compra!
                            </p>
                        ) : (
                            <>
                                <p style={{ marginTop: "0.75rem" }}>
                                    Presiona para abrir PayPal y aprobar el pago.
                                    <br />
                                    Al regresar, el pago se confirmará automáticamente y se registrará el pedido.
                                </p>

                                <button
                                    type="button"
                                    className="checkout-submit-btn"
                                    onClick={onStartPaypal}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Abriendo PayPal..." : "Pagar con PayPal"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================
   Componente principal
========================= */
export function CartSidebar() {
    const { isCartOpen, closeCart } = useCartUI();
    const { cart, removeFromCart, clearCart, decrementFromCart } = useCart();

    const [showCheckout, setShowCheckout] = useState(false);
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [orderId, setOrderId] = useState("");
    const [paypalOrderId, setPaypalOrderId] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("PENDING"); // PENDING | PAID

    const [pendingPayload, setPendingPayload] = useState(null);

    const total = calcTotal(cart);
    const cartIsEmpty = cart.length === 0;

    const resetCheckoutState = () => {
        setShowCheckout(false);
        setSubmitted(false);
        setContact("");
        setAddress("");
        setIsSubmitting(false);
        setOrderId("");
        setPaypalOrderId("");
        setPaymentStatus("PENDING");
        setPendingPayload(null);
        sessionStorage.removeItem(PENDING_ORDER_KEY);
    };

    const handleOverlayClick = () => {
        if (isSubmitting) return;
        if (showCheckout) resetCheckoutState();
        else closeCart();
    };

    const handleRemoveOrDecrement = (item) => {
        const qty = item.quantity || 1;
        if (qty > 1 && typeof decrementFromCart === "function") {
            decrementFromCart(item);
        } else {
            removeFromCart(item);
        }
    };

    const handleCheckoutSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!contact.trim()) {
            alert("Por favor escribe tu número de contacto o correo.");
            return;
        }
        if (!address.trim()) {
            alert("Por favor escribe tu dirección de entrega.");
            return;
        }
        if (!cart || cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        // ✅ Pedido pendiente (NO se manda a Sheets todavía)
        const payload = {
            contact,
            address,
            items: buildItemsForSheet(cart)
        };

        setPendingPayload(payload);
        sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(payload));

        setSubmitted(true);
    };

    const handleStartPaypal = async () => {
        if (isSubmitting) return;

        if (!submitted) {
            alert("Primero completa tus datos y presiona Continuar.");
            return;
        }

        const stored = sessionStorage.getItem(PENDING_ORDER_KEY);
        const pending = pendingPayload || (stored ? JSON.parse(stored) : null);

        if (!pending) {
            alert("No hay datos pendientes. Cierra y vuelve a abrir el checkout.");
            return;
        }

        if (!total || Number(total) <= 0) {
            alert("El total está en $0. Revisa precios antes de pagar.");
            return;
        }

        try {
            setIsSubmitting(true);

            const res = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderId || "FV-TMP",
                    total: Number(total),
                    currency: "MXN"
                })
            });

            const raw = await res.text();

            let data;
            try {
                data = JSON.parse(raw);
            } catch {
                data = { ok: false, error: raw };
            }

            if (!res.ok) {
                console.error("❌ PayPal create-order HTTP error:", res.status, data);
                throw new Error(data?.error || `HTTP ${res.status}`);
            }

            if (!data?.ok || !data?.approveUrl || !data?.paypalOrderId) {
                console.error("❌ PayPal create-order bad payload:", data);
                throw new Error(data?.error || "No se pudo generar el link de pago.");
            }

            setPaypalOrderId(data.paypalOrderId);

            // ✅ IMPORTANTE: el payload ya está en sessionStorage para sobrevivir el redirect
            window.location.href = data.approveUrl;

        } catch (err) {
            console.error("❌ handleStartPaypal error:", err);
            alert(err?.message || "Error al iniciar el pago con PayPal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ Auto-capture al regresar de PayPal
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const token = params.get("token");
        const canceled = params.get("canceled") || params.get("cancel");

        if (canceled) {
            window.history.replaceState({}, "", window.location.pathname);
            alert("Pago cancelado.");
            return;
        }

        if (!token) return;

        (async () => {
            try {
                setIsSubmitting(true);

                // Recupera payload sobreviviente al redirect
                const stored = sessionStorage.getItem(PENDING_ORDER_KEY);
                const pending = stored ? JSON.parse(stored) : null;

                setPaypalOrderId(token);

                // Abre modal por si el usuario aterriza fuera del carrito
                setShowCheckout(true);
                setSubmitted(true);

                if (!pending) {
                    throw new Error("No hay pedido pendiente para registrar en Sheets.");
                }

                // 1) Captura en backend
                const res = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paypalOrderId: token })
                });

                const data = await res.json();

                if (!data?.ok) {
                    throw new Error(data?.error || "No se pudo capturar el pago.");
                }

                // 2) Registrar en Sheets SOLO si ya se capturó
                const sheetRes = await fetch(SHEETS_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(pending)
                });

                const sheetData = await sheetRes.json();

                if (!sheetData?.ok) {
                    throw new Error(sheetData?.error || "No se pudo registrar el pedido en Sheets.");
                }

                // 3) Finalizar
                setPendingPayload(null);
                sessionStorage.removeItem(PENDING_ORDER_KEY);

                setPaymentStatus("PAID");
                clearCart();

                window.history.replaceState({}, "", window.location.pathname);

            } catch (err) {
                console.error("❌ Auto-capture error:", err);
                alert(err?.message || "Error confirmando el pago.");
                window.history.replaceState({}, "", window.location.pathname);
            } finally {
                setIsSubmitting(false);
            }
        })();
    }, [clearCart]);

    if (!isCartOpen) return null;

    return (
        <div className="cart-sidebar-overlay" onClick={handleOverlayClick}>
            <aside className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
                <CartHeader onClose={closeCart} />

                <CartBody cart={cart} onRemoveOrDecrement={handleRemoveOrDecrement} />

                <CartFooter
                    cartIsEmpty={cartIsEmpty}
                    total={total}
                    onClear={clearCart}
                    onCheckoutOpen={() => {
                        if (cartIsEmpty) return;
                        setShowCheckout(true);
                    }}
                />

                {showCheckout && (
                    <CheckoutModal
                        contact={contact}
                        setContact={setContact}
                        address={address}
                        setAddress={setAddress}
                        submitted={submitted}
                        isSubmitting={isSubmitting}
                        orderId={orderId}
                        total={total}
                        paymentStatus={paymentStatus}
                        onClose={() => {
                            if (isSubmitting) return;
                            resetCheckoutState();
                        }}
                        onSubmit={handleCheckoutSubmit}
                        onStartPaypal={handleStartPaypal}
                    />
                )}
            </aside>
        </div>
    );
}
