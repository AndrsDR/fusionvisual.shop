import React, { useState, useEffect } from "react";
import "./SearchModal.css";
import designsData from "../../mocks/designs.json";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";

export function SearchModal() {
    const { isSearchOpen, closeSearch } = useSearch();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const cats = designsData.map(item => item.category);
        setCategories(cats);
    }, []);

    const filtered = categories.filter(cat =>
        cat.toLowerCase().includes(query.toLowerCase())
    );

    function handleCategoryClick(category) {
        onClose();
        navigate(`/category/${encodeURIComponent(category)}`);
    }

    if (!isSearchOpen) return null;


    return (
        <div className="search-overlay" onClick={closeSearch}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>

                <input
                    className="search-input"
                    type="text"
                    placeholder="Buscar categoría..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <div className="category-list">
                    {filtered.map(cat => (
                        <button
                            key={cat}
                            className="category-item"
                            onClick={() => handleCategoryClick(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}
