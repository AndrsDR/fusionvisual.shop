export function CatalogCard({ item, onView }) {
    return (
        <article className="catalog-card">
            <div className="catalog-img-box">
                <img src={item.mockup} alt={item.category} loading="lazy" />
            </div>

            <h3 className="catalog-cat">{item.category}</h3>

            <button className="catalog-view-btn" onClick={() => onView(item)}>
                Ver diseño
            </button>
        </article>
    );
}