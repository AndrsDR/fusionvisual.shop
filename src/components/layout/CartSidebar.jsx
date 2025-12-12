import { useState } from "react";
import "./CartSidebar.css";
import { useCart } from "../../context/CartContext.jsx";
import { useCartUI } from "../../context/CartUIContext.jsx";

const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby0Xaf6r--8orb0ql_lXhsgTHD9A6xhGzqKYvAq9-a4VkHFPBwpqwKloXTZAFvKkMylhg/exec";


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

export function CartSidebar() {
    const { isCartOpen, closeCart } = useCartUI();
    const {
        cart,
        removeFromCart,
        clearCart,
        decrementFromCart
    } = useCart();

    const [showCheckout, setShowCheckout] = useState(false);
    const [contact, setContact] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleOverlayClick = () => {
        if (showCheckout) {
            setShowCheckout(false);
            setSubmitted(false);
            setContact("");
        } else {
            closeCart();
        }
    };

    const handleCheckoutSubmit = async (e) => {
        setShowCheckout(false);
        setSubmitted(false);
        setContact("");
        e.preventDefault();
        
        if (!contact.trim()) {
            alert("Por favor escribe tu número de contacto.");
            return;
        }
    
        if (!cart || cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }
    
        const itemsForSheet = cart.map((item) => {
            const quantity = item.quantity || 1;
            const unitPrice = item.unitPrice || 0;
        
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
    
        const payload = {
            contact,
            items: itemsForSheet
        };
    
        try {
            await fetch(SHEETS_WEBHOOK_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(payload)
            });
        
            console.log("📦 Pedido enviado a Sheets (no-cors, respuesta opaca)");
        
            // closeCart();  // opcional si quieres cerrar también el sidebar
        
            alert("¡Pedido enviado correctamente! 🙌");
        
            // clearCart(); // si en algún momento quieres vaciar el carrito
        
        } catch (err) {
            console.error("❌ Error enviando pedido a Sheets:", err);
            alert("Ocurrió un error al enviar el pedido. Intenta de nuevo.");
        }
    };
    



    const total = cart.reduce((acc, item) => {
        const price = item.unitPrice || 0;
        const qty = item.quantity || 1;
        return acc + price * qty;
    }, 0);

    if (!isCartOpen) return null;

    return (
        <div className="cart-sidebar-overlay" onClick={handleOverlayClick}>
            <aside
                className="cart-sidebar"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="cart-header">
                    <h2>Tu carrito</h2>
                    <button
                        className="cart-close-btn"
                        onClick={closeCart}
                        aria-label="Cerrar carrito"
                    >
                        ×
                    </button>
                </header>

                <div className="cart-body">
                    {cart.length === 0 ? (
                        <p className="cart-empty">
                            Aún no has agregado nada.
                        </p>
                    ) : (
                        <ul className="cart-items">
                            {cart.map((item) => (
                                <li key={item.id} className="cart-item">
                                    <div className="cart-item-thumb">
                                        {item.type === "default" ? (
                                            <img
                                                src={item.designImageUrl}
                                                alt={item.name || item.designId}
                                                className="cart-thumb-img"
                                            />
                                        ) : (
                                            <div className="cart-thumb-shirt-wrap">
                                                <img
                                                    src={getShirtImagePath(item)}
                                                    alt="Camisa"
                                                    className="cart-thumb-shirt"
                                                />
                                                {item.frontDesign && (
                                                    <img
                                                        src={
                                                            item.frontDesign.png
                                                        }
                                                        alt="Diseño"
                                                        className="cart-thumb-design"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="cart-item-info">
                                        <h3 className="cart-item-title">
                                            {item.type === "custom"
                                                ? "Camiseta personalizada"
                                                : item.name ||
                                                  item.designId ||
                                                  "Diseño"}
                                        </h3>

                                        <p className="cart-item-meta">
                                            Talla {item.size} ·{" "}
                                            {item.fabric || "Algodón"}
                                        </p>

                                        {item.shirtType && (
                                            <p className="cart-item-meta">
                                                Tipo:{" "}
                                                {item.shirtType === "basic"
                                                    ? "Básica"
                                                    : item.shirtType ===
                                                      "polo"
                                                    ? "Polo"
                                                    : "Cuello V"}
                                            </p>
                                        )}

                                        {item.sidesMode && (
                                            <p className="cart-item-meta">
                                                <SidesLabel
                                                    mode={item.sidesMode}
                                                />
                                            </p>
                                        )}

                                        <p className="cart-item-meta">
                                            Cantidad: {item.quantity || 1}
                                        </p>

                                        <div className="cart-item-actions">
                                            <span className="cart-item-price">
                                                ${" "}
                                                {(item.unitPrice || 0).toFixed(
                                                    2
                                                )}
                                            </span>
                                            <button
                                                className="cart-remove-btn"
                                                onClick={() => {
                                                    const qty =
                                                        item.quantity || 1;
                                                    if (
                                                        qty > 1 &&
                                                        typeof decrementFromCart ===
                                                            "function"
                                                    ) {
                                                        decrementFromCart(item);
                                                    } else {
                                                        removeFromCart(item);
                                                    }
                                                }}
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <footer className="cart-footer">
                    <div className="cart-footer-top">
                        <button
                            className="cart-clear-btn"
                            onClick={clearCart}
                            disabled={cart.length === 0}
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
                        onClick={() => {
                            if (cart.length === 0) return;
                            setShowCheckout(true);
                        }}
                        disabled={cart.length === 0}
                    >
                        Finalizar pedido
                    </button>
                </footer>

                {showCheckout && (
                    <div className="cart-checkout-modal">
                        <div className="cart-checkout-card">
                            <div className="checkout-header">
                                <h3>Datos de contacto</h3>
                                <button
                                    className="checkout-close-icon"
                                    type="button"
                                    aria-label="Cerrar datos de contacto"
                                    onClick={() => {
                                        setShowCheckout(false);
                                        setSubmitted(false);
                                        setContact("");
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <p className="checkout-text">
                                Esta página solo registra tu pedido.
                                <br />
                                El pago y la fecha de entrega se acuerdan por el
                                medio de contacto que nos dejes aquí.
                            </p>

                            {submitted ? (
                                <div className="checkout-thanks">
                                    <p>
                                        ¡Gracias por confiar en nosotros con tus
                                        camisetas! 🖤
                                    </p>
                                    <p>
                                        En cuanto revisemos tu pedido te
                                        mandaremos mensaje para confirmar pago y
                                        entrega.
                                    </p>
                                    <button
                                        className="checkout-close-btn"
                                        onClick={() => {
                                            setShowCheckout(false);
                                            setSubmitted(false);
                                            setContact("");
                                            closeCart();
                                        }}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleCheckoutSubmit}
                                    className="checkout-form"
                                >
                                    <label className="checkout-label">
                                        Celular o correo electrónico:
                                        <input
                                            type="text"
                                            value={contact}
                                            onChange={(e) =>
                                                setContact(e.target.value)
                                            }
                                            placeholder="Ej. +52 998... o usuario@gmail.com"
                                            className="checkout-input"
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        className="checkout-submit-btn"
                                    >
                                        Enviar pedido
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
