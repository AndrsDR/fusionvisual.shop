import { useEffect, useRef, useState } from "react";

export function CategoryBar({ categories, selectedCategory, onSelect }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // Cerrar al click afuera
    useEffect(() => {
        function onDocMouseDown(e) {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    // Cerrar con ESC
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    const handlePick = (cat) => {
        onSelect(cat);
        setOpen(false);
    };

    return (
        <div className="category-dropdown" ref={wrapRef}>
            <button
                type="button"
                className="category-trigger"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="grid"
                aria-expanded={open}
            >
                <span className="category-trigger-label">
                    {selectedCategory || "Categorías"}
                </span>

                <span
                    className={`category-trigger-icon material-symbols-outlined ${
                        open ? "is-open" : ""
                    }`}
                    aria-hidden="true"
                >
                    expand_more
                </span>
            </button>

            <div className={`category-panel ${open ? "open" : ""}`}>
                <div className="category-grid" role="grid">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            role="gridcell"
                            className={`category-cell ${
                                cat === selectedCategory ? "active" : ""
                            }`}
                            onClick={() => handlePick(cat)}
                            title={cat}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
