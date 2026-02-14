// src/components/customizer/ShirtPreview.jsx

function getFlexAlignmentX(x) {
    if (x === "left") return "flex-start";
    if (x === "right") return "flex-end";
    return "center";
}

function getFlexAlignmentY(y) {
    if (y === "top") return "flex-start";
    if (y === "bottom") return "flex-end";
    return "center";
}

function getTransformOrigin(x, y) {
    const ox = x === "left" ? "0%" : x === "right" ? "100%" : "50%";
    const oy = y === "top" ? "0%" : y === "bottom" ? "100%" : "50%";
    return `${ox} ${oy}`;
}

export function ShirtPreview({
    shirtImg,
    designImg,
    shirtType = "basic",
    placement = { x: "center", y: "center", scale: 100 }
}) {
    const designClass = `shirt-design-img`;

    const x = placement?.x || "center";
    const y = placement?.y || "center";

    // clamp scale 0..100 (si quieres mínimo 10, lo haces en el control)
    const scale = Math.max(0, Math.min(100, Number(placement?.scale ?? 100)));

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

                {!!designImg && (
                    <div
                        className={`print-area print-area-${shirtType}`}
                        style={{
                            justifyContent: getFlexAlignmentX(x),
                            alignItems: getFlexAlignmentY(y)
                        }}
                    >
                        <img
                            src={designImg}
                            alt="Diseño"
                            className={designClass}
                            style={{
                                transform: `scale(${scale / 100})`,
                                transformOrigin: getTransformOrigin(x, y)
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
