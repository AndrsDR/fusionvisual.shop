// src/sections/ProductDetails/ProductDetailsSection.jsx
import { useState, useEffect } from "react";
import "./ProductDetailsSection.css";

import { ProductImage } from "../../components/productDetails/ProductImage";
import { ProductOptions } from "../../components/productDetails/ProductOptions";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";

export function ProductDetailsSection({ item }) {
    const [size, setSize] = useState("M");
    const [fabric, setFabric] = useState("cotton");
    const [shirtType, setShirtType] = useState("basic");
    const [printBack, setPrintBack] = useState(false);

    const navigate = useNavigate();
    const { addToCart, cart } = useCart();

    useEffect(() => {
        console.log("🛒 Carrito actualizado (detalle producto):", cart);
    }, [cart]);

    const handleAdd = () => {
        if (!item) return;

        const design = item.designData ?? item;

        const sidesMode = printBack ? "both" : "front";

        const cartItemId = `default-${design.id}-${shirtType}-${sidesMode}-${size}-${fabric}`;

        const productForCart = {
            id: cartItemId,
            type: "default",
            name: design.category ?? item.category,
            baseProductId: "tshirt",
            size,
            fabric,
            shirtType,
            sidesMode,
            designId: design.id,
            designImageUrl: design.mockup ?? item.mockup,
            unitPrice: 0
        };

        addToCart(productForCart, 1);
    };

    return (
        <section className="product-details-section">
            <div className="details-container">

                <ProductImage src={item.mockup} />

                <div className="details-info">
                    <h2 className="details-title">{item.category}</h2>

                    <p
                        className="details-subtitle"
                        onClick={() =>
                            navigate("/customizer", { state: { design: item } })
                        }
                    >
                        Personaliza tu camiseta
                    </p>

                    <hr />

                    <ProductOptions
                        size={size}
                        fabric={fabric}
                        shirtType={shirtType}
                        printBack={printBack}
                        onSize={setSize}
                        onFabric={setFabric}
                        onShirtType={setShirtType}
                        onTogglePrintBack={() => setPrintBack(prev => !prev)}
                    />

                    <button className="add-cart-btn" onClick={handleAdd}>
                        Añadir al carrito
                    </button>
                </div>
            </div>
        </section>
    );
}
