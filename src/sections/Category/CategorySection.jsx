import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import designsData from "../../mocks/designs.json";
import "./CategorySection.css";

export function CategorySection() {
    const { categoryName } = useParams();
    const navigate = useNavigate();

    const category = designsData.find(
        c => c.category === decodeURIComponent(categoryName)
    );

    if (!category) {
        return (
            <section className="category-wrapper">
                <h2 className="category-title">Categoría no encontrada</h2>
            </section>
        );
    }

    return (
        <section className="category-wrapper">
            <h1 className="category-title">{category.category}</h1>

            <div className="category-grid">
                {category.designs.map((des) => (
                    <div
                        key={des.id}
                        className="category-card"
                        onClick={() => navigate(`/details/${des.id}`)}
                    >
                        <img src={des.mockup} alt={des.id} />
                    </div>
                ))}
            </div>
        </section>
    );
}
