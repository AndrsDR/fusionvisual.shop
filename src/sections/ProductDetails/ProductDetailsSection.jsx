// src/sections/ProductDetails/ProductDetailsSection.jsx
import { useState } from "react";
import "./ProductDetailsSection.css";

import { ProductImage } from "../../components/productDetails/ProductImage";
import { ProductOptions } from "../../components/productDetails/ProductOptions";
import { useNavigate } from "react-router-dom";

export function ProductDetailsSection({ item }) {
    const [size, setSize] = useState("M");
    const [fabric, setFabric] = useState("cotton");
    const navigate = useNavigate();

    const handleAdd = () => {
        const product = {
            id: item.id,
            mockup: item.mockup,
            category: item.category,
            size,
            fabric
        };

        console.log("Producto listo para carrito:", product);
    };

    return (
        <section className="product-details-section">
            <div className="details-container">

                <ProductImage src={item.mockup} />

                <div className="details-info">
                    <h2 className="details-title">{item.category}</h2>
                    <p className="details-subtitle" onClick={() => navigate("/customizer", { state: { design: item } })}>Personaliza tu camiseta</p>
                    <hr />

                    <ProductOptions
                        size={size}
                        fabric={fabric}
                        onSize={setSize}
                        onFabric={setFabric}
                    />

                    <button className="add-cart-btn" onClick={handleAdd}>
                        Añadir al carrito
                    </button>
                </div>
            </div>
        </section>
    );
}
