// src/sections/Catalog/Catalog.jsx
import "./Catalog.css";
import designsData from "../../mocks/designs.json";
import { useEffect, useState } from "react";
import { CatalogCard } from "../../components/catalog/CatalogCard";
import { useNavigate } from "react-router-dom";

export function Catalog() {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!designsData || !Array.isArray(designsData)) return;

        // Selecciona aleatoriamente 5 categorías
        const randomCategories = [...designsData]
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

        // Selecciona 1 mockup real por categoría
        const picks = randomCategories.map((cat) => {
            const d = cat.designs[Math.floor(Math.random() * cat.designs.length)];

            return {
                id: d.id,
                mockup: d.mockup,
                category: cat.category,
                designData: d
            };
        });

        setItems(picks);
    }, []);

    // Navega al detalle con los datos del item
    const handleView = (item) => {
        navigate(`/product/${item.id}`, {
            state: item
        });
    };

    return (
        <section className="catalog-section">
            <h2 className="catalog-title">Catálogo de Diseños</h2>

            <div className="catalog-grid">
                {items.map((item) => (
                    <CatalogCard
                        key={item.id}
                        item={item}
                        onView={handleView}
                    />
                ))}
            </div>
        </section>
    );
}
