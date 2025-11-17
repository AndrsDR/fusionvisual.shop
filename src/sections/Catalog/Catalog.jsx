// src/sections/Catalog/Catalog.jsx
import "./Catalog.css";
import designsData from "../../mocks/designs.json";
import { useEffect, useState } from "react";

export function Catalog() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!designsData || !Array.isArray(designsData)) return;

        // Shuffle categories
        const shuffled = [...designsData].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 5);

        // Pick one mockup per category
        const randomPicks = selected.map((cat) => {
            const randomDesign =
                cat.designs[Math.floor(Math.random() * cat.designs.length)];

            return {
                id: randomDesign.id,
                category: cat.category,
                mockup: randomDesign.mockup,
            };
        });

        setItems(randomPicks);
    }, []);

    const handleBuy = (item) => {
        console.log({
            id: item.id,
            mockup: item.mockup,
        });
    };

    return (
        <section id="catalog-section" className="catalog-section">
            <h2 className="catalog-title">Catálogo de Diseños</h2>

            <div className="catalog-grid">
                {items.map((item) => (
                    <article key={item.id} className="catalog-card">
                        <div className="catalog-img-box">
                            <img src={item.mockup} alt={item.category} loading="lazy" />
                        </div>

                        <h3 className="catalog-cat">{item.category}</h3>

                        <button
                            className="catalog-buy"
                            onClick={() => handleBuy(item)}
                        >
                            Comprar
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
}
