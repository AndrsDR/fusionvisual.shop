import { useEffect, useRef, useState } from "react";
import { usePayPalCheckout } from "../../hooks/usePayPalCheckout.js";
import "./CartSidebar.css";
import { useCart } from "../../context/CartContext.jsx";
import { useCartUI } from "../../context/CartUIContext.jsx";
import { computePriceBreakdown, computeUnitPrice } from "../../pricing/pricing.js";

const SHEETS_WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycby0Xaf6r--8orb0ql_lXhsgTHD9A6xhGzqKYvAq9-a4VkHFPBwpqwKloXTZAFvKkMylhg/exec";

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
                <span className="cart-item-price">
                    {money(lineTotal)}
                </span>
            </div>

            <button
                className="cart-remove-btn"
                onClick={() => onRemoveOrDecrement(item)}
            >
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
                            onRemoveOrDecrement={onRemoveOrDecrement}
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
    onClose,
    onSubmit,
    paymentStatus,
    paypalContainerRef,
    isPayPalReady,
    isPayPalProcessing
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
                            Completa tus datos y confirma tu pedido.
                            <br />
                            (El pago se activará más adelante.)
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
                                {isSubmitting ? "Procesando..." : "Comprar"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="checkout-thanks">
                        <p><strong>Pedido registrado ✅</strong></p>

                        <p style={{ marginTop: "0.5rem" }}>
                            Total: <strong>${Number(total || 0).toFixed(2)}</strong>
                        </p>

                        {orderId ? (
                            <p style={{ marginTop: "0.5rem" }}>
                                Folio: <strong>{orderId}</strong>
                            </p>
                        ) : null}

                        <p style={{ marginTop: "0.75rem" }}>
                            Te contactaremos para coordinar el pago y la entrega.
                        </p>

                        <p style={{ marginTop: "0.75rem" }}>
                            (PayPal se activará cuando esté listo el sistema de pagos.)
                        </p>

                        {paymentStatus === "PAID" ? (
                            <>
                                <p style={{ marginTop: "0.75rem" }}>
                                    Pago confirmado ✅ ¡Gracias por tu compra!
                                </p>
                                <p style={{ marginTop: "0.75rem" }}>
                                    Te contactaremos para coordinar la entrega.
                                </p>
                            </>
                        ) : (
                            <>
                                <p style={{ marginTop: "0.75rem" }}>
                                    Paga con PayPal para confirmar tu pedido.
                                </p>

                                {!isPayPalReady ? (
                                    <p style={{ marginTop: "0.5rem" }}>
                                        Cargando PayPal...
                                    </p>
                                ) : null}

                                {isPayPalProcessing || isSubmitting ? (
                                    <p style={{ marginTop: "0.5rem" }}>
                                        Procesando...
                                    </p>
                                ) : null}

                                <div
                                    ref={paypalContainerRef}
                                    style={{ marginTop: "0.75rem" }}
                                />
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
    const [paymentStatus, setPaymentStatus] = useState("PENDING"); // PENDING | PAID
    const [pendingPayload, setPendingPayload] = useState(null);

    const [paypalOrderId, setPaypalOrderId] = useState("");

    const [isPayPalReady, setIsPayPalReady] = useState(false);
    const [isPayPalProcessing, setIsPayPalProcessing] = useState(false);

    const [submittedTotal, setSubmittedTotal] = useState(0);

    const total = calcTotal(cart);
    const cartIsEmpty = cart.length === 0;

    useEffect(() => {
        if (isCartOpen || showCheckout) {
            document.body.classList.add("modal-open");
        } else {
            document.body.classList.remove("modal-open");
        }
    
        // limpieza por seguridad
        return () => {
            document.body.classList.remove("modal-open");
        };
    }, [isCartOpen, showCheckout]);
    

    const resetCheckoutState = () => {
        setShowCheckout(false);
        setSubmitted(false);
        setContact("");
        setAddress("");
        setIsSubmitting(false);
        setOrderId("");
        setPaypalOrderId("");
        setSubmittedTotal(0);
        setPaymentStatus("PENDING");
        setPendingPayload(null);
        setIsPayPalProcessing(false);
    };

    const handleOverlayClick = () => {
        if (isSubmitting || isPayPalProcessing) return;

        if (showCheckout && submitted && paymentStatus === "PENDING") return;

        if (showCheckout) resetCheckoutState();
        else closeCart();
    };

    const handleRemoveOrDecrement = (item) => {
        const qty = item.quantity || 1;
        if (qty > 1 && typeof decrementFromCart === "function") {
            decrementFromCart(item);
            console.log("se quito" + item)
        } else {
            removeFromCart(item);
            console.log("se quito" + item)
        }
    };

    const paypalAmount = submitted ? submittedTotal : total;

    const paypalEnabled =
        showCheckout &&
        submitted &&
        paymentStatus === "PENDING" &&
        !!pendingPayload;


    // ✅ CLIENT ID: usa env de Vite (recomendado)
    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

    useEffect(() => {
        if (!paypalEnabled) {
            setIsPayPalReady(false);
            return;
        }
        setIsPayPalReady(!!window.paypal?.Buttons);
    }, [paypalEnabled]);

    const { containerRef: paypalContainerRef, isReady, isProcessing } = usePayPalCheckout({
        enabled: paypalEnabled,
        clientId: paypalClientId,
        currency: "MXN",

        createOrder: (data, actions) => {
            const value = String(Number(paypalAmount || 0).toFixed(2));

            return actions.order.create({
                purchase_units: [
                    {
                        amount: {
                            currency_code: "MXN",
                            value
                        }
                    }
                ]
            });
        },

        onApprove: async (data, actions) => {
            try {
                setIsPayPalProcessing(true);

                const details = await actions.order.capture();


                setPaypalOrderId(details?.id || data?.orderID || "");

                if (!pendingPayload) {
                    throw new Error("No hay pedido pendiente para registrar.");
                }

                const paidPayload = {
                    ...pendingPayload,
                    status: "PAID",
                    paypal: {
                        id: details?.id || data?.orderID || "",
                        payerEmail: details?.payer?.email_address || ""
                    }
                };

                const res = await fetch(SHEETS_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(paidPayload)
                });

                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.ok) {
                    throw new Error(json?.error || "No se pudo registrar el pedido en Sheets.");
                }

                setPaymentStatus("PAID");
                clearCart();
            } catch (err) {
                console.error("❌ PayPal approve -> Sheets error:", err);
                alert(err?.message || "Error registrando el pedido pagado.");
            } finally {
                setIsSubmitting(false);
                setIsPayPalProcessing(false);
            }
        },

        onCancel: () => {
            alert("Pago cancelado. No se registró ningún pedido.");
            setIsPayPalProcessing(false);
        },

        onError: (err) => {
            console.error("❌ PayPal error:", err);
            alert("Hubo un error con PayPal. Intenta de nuevo.");
            setIsPayPalProcessing(false);
        }
    });

    // ✅ si quieres que tu UI use el estado REAL del hook, sincronízalo aquí
    useEffect(() => {
        setIsPayPalReady(isReady);
    }, [isReady]);

    useEffect(() => {
        setIsPayPalProcessing(isProcessing);
    }, [isProcessing]);

    const handleCheckoutSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting || isPayPalProcessing) return;

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

        const folio = `FV-${Date.now()}`;
        const totalSnapshot = Number(total || 0);

        setSubmittedTotal(totalSnapshot);
        setOrderId(folio);

        const payload = {
            orderId: folio,
            contact,
            address,
            total: totalSnapshot,
            status: "PENDING_PAYMENT",
            items: buildItemsForSheet(cart)
        };

        setPendingPayload(payload);
        setPaymentStatus("PENDING");
        setSubmitted(true);
    };

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
                        total={submitted ? submittedTotal : total}
                        paymentStatus={paymentStatus}
                        paypalContainerRef={paypalContainerRef}
                        isPayPalReady={isPayPalReady}
                        isPayPalProcessing={isPayPalProcessing}
                        onClose={() => {
                            if (isSubmitting || isPayPalProcessing) return;
                            resetCheckoutState();
                        }}
                        onSubmit={handleCheckoutSubmit}
                    />
                )}
            </aside>
        </div>
    );
}
