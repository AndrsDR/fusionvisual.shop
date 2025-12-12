// src/components/customizer/ShirtPreview.jsx

export function ShirtPreview({ shirtImg, designImg, shirtType = "basic" }) {
    const designClass = `shirt-design shirt-design-${shirtType}`;

    return (
        <div className="shirt-preview">
            <div className="shirt-base">
                {shirtImg && (
                    <img
                        src={shirtImg}
                        alt="Camiseta"
                        className="shirt-base-img"
                    />
                )}

                {designImg && (
                    <img
                        src={designImg}
                        alt="Diseño"
                        className={designClass}
                    />
                )}
            </div>
        </div>
    );
}

