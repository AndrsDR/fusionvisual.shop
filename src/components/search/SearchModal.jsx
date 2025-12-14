import React, { useEffect, useMemo, useState } from "react";
import "./SearchModal.css";
import designsData from "../../mocks/designs.json";
import { useSearch } from "../../context/SearchContext";
import { useViewDesign } from "../../hooks/useViewDesign";

/* ============================
   Helpers
============================ */
function getCategories(data) {
    return (data || []).map((item) => item.category).filter(Boolean);
}

function getDesignsByCategory(data, category) {
    if (!category) return [];
    const match = data.find((item) => item.category === category);
    return match?.designs || [];
}

/* ============================
   Subcomponentes
============================ */
function CategorySearchView({ query, setQuery, categories, onCategoryClick }) {
    return (
        <div className="search-view">
            <input
                className="search-input"
                type="text"
                placeholder="Buscar categoría..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />

            <div className="category-list">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className="category-item"
                        onClick={() => onCategoryClick(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}

function CategoryDesignsView({ category, designs, onBack, onDesignClick }) {
    return (
        <div className="search-view">
            <div className="category-header">
                <button className="back-button" onClick={onBack}>
                    <span className="material-symbols-outlined">
                        chevron_left
                    </span>
                </button>
                <h3 className="category-title">{category}</h3>
            </div>

            
            <div className="design-panel">
                <div className={`design-grid ${designs.length <= 12 ? "design-grid--short" : ""}`}>
                    {designs.map((design) => (
                        <button
                            key={design.id}
                            type="button"
                            className="design-card"
                            onClick={() => onDesignClick(design)}
                        >
                            <div className="design-thumb">
                                <img src={design.mockup} alt={design.id} loading="lazy" />
                            </div>
                            <div className="design-meta">Diseño {design.designId}</div>
                        </button>
                    ))}
                </div>
                
                {designs.length <= 12 && <div className="design-spacer" />}
            </div>
                
        </div>
    );
}

/* ============================
   Componente principal
============================ */
export function SearchModal() {
    const { isSearchOpen, closeSearch } = useSearch();
    const { viewDesign } = useViewDesign();

    const [query, setQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState(null);

    const categories = useMemo(() => getCategories(designsData), []);
    const filteredCategories = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return categories;
        return categories.filter((c) =>
            c.toLowerCase().includes(q)
        );
    }, [query, categories]);

    const activeDesigns = useMemo(
        () => getDesignsByCategory(designsData, activeCategory),
        [activeCategory]
    );

    /* Bloquear scroll del body */
    useEffect(() => {
        if (!isSearchOpen) return;

        const body = document.body;
        const prevOverflow = body.style.overflow;
        body.style.overflow = "hidden";

        return () => {
            body.style.overflow = prevOverflow;
        };
    }, [isSearchOpen]);

    /* Reset */
    useEffect(() => {
        if (!isSearchOpen) {
            setQuery("");
            setActiveCategory(null);
        }
    }, [isSearchOpen]);

    function handleDesignClick(design) {
        closeSearch();
        viewDesign({
            id: design.id,
            mockup: design.mockup,
            category: activeCategory,
            designData: design
        });
    }

    if (!isSearchOpen) return null;

    return (
        <div className="search-overlay" onClick={closeSearch}>
            <div
                className="search-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {!activeCategory ? (
                    <CategorySearchView
                        query={query}
                        setQuery={setQuery}
                        categories={filteredCategories}
                        onCategoryClick={setActiveCategory}
                    />
                ) : (
                    <CategoryDesignsView
                        category={activeCategory}
                        designs={activeDesigns}
                        onBack={() => setActiveCategory(null)}
                        onDesignClick={handleDesignClick}
                    />
                )}
            </div>
        </div>
    );
}
