export function CategoryBar({ categories, selectedCategory, onSelect }) {
    return (
        <div className="category-bar">
            {categories.map((cat) => (
                <button
                    key={cat}
                    className={`category-pill ${cat === selectedCategory ? "active" : ""}`}
                    onClick={() => onSelect(cat)}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
