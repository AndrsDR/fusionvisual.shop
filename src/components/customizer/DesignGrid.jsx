
export function DesignGrid({ categoryData, onSelectDesign }) {
    if (!categoryData) return <p style={{ padding: 20 }}>No hay diseños.</p>;

    return (
        <div className="design-grid">
            {categoryData.designs.map((design) => (
                <img
                    key={design.id}
                    src={design.png}
                    alt=""
                    className="design-item"
                    onClick={() => onSelectDesign(design)}
                />
            ))}
        </div>
    );
}
