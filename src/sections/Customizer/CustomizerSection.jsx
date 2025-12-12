import { useState, useEffect } from "react";
import "./CustomizerSection.css";

import designsData from "../../mocks/designs.json";
import shirtData from "../../mocks/shirts.json";

import { CategoryBar } from "../../components/customizer/CategoryBar.jsx";
import { CustomizerControls } from "../../components/customizer/CustomizerControls";
import { DesignGrid } from "../../components/customizer/DesignGrid";
import { ShirtPreview } from "../../components/customizer/ShirtPreview.jsx";
import { useCart } from "../../context/CartContext.jsx";

export function CustomizerSection({ designFromDetail }) {

    const [selectedCategory, setSelectedCategory] = useState(
        designsData[0]?.category || ""
    );

    const [selectedSide, setSelectedSide] = useState("front");
    const [frontDesign, setFrontDesign] = useState(null);
    const [backDesign, setBackDesign] = useState(null);

    const [enableBack, setEnableBack] = useState(false);

    const [selectedColor, setSelectedColor] = useState("negro");
    const [selectedSize, setSelectedSize] = useState("M");
    const [selectedFabric, setSelectedFabric] = useState("cotton");

    // tipo de camisa: basic | polo | v-neck
    const [selectedShirtType, setSelectedShirtType] = useState("basic");

    const colors = shirtData.images;
    const defaultColorId = "negro";

    const getEffectiveColor = () => {
        const exists = colors.some((c) => c.colorId === selectedColor);
        return exists ? selectedColor : (colors[0]?.colorId || defaultColorId);
    };

    // 👇 ahora resolvemos según TIPO + LADO + COLOR
    const resolveShirtImage = (side) => {
        const colorId = getEffectiveColor();
        return `/shirts/${selectedShirtType}/${side}/${colorId}.png`;
    };

    const currentFrontImg = resolveShirtImage("front");
    const currentBackImg = resolveShirtImage("back");

    const { addToCart, cart } = useCart();

    useEffect(() => {
        console.log("🛒 Carrito actualizado (customizer):", cart);
    }, [cart]);

    // Si venimos desde detalle, preseleccionar diseño en el frente
    useEffect(() => {
        if (!designFromDetail) return;

        const categoryObj = designsData.find(
            (c) => c.category === designFromDetail.category
        );
        if (!categoryObj) return;

        const realDesign = categoryObj.designs.find(
            (d) => d.id === designFromDetail.id
        );
        if (!realDesign) return;

        setSelectedCategory(categoryObj.category);
        setFrontDesign(realDesign);
        setSelectedSide("front");
    }, [designFromDetail]);

    const handleSelectDesign = (design) => {
        if (selectedSide === "front") {
            setFrontDesign(design);
        } else if (enableBack) {
            setBackDesign(design);
        }
    };

    const handleBuy = () => {
        if (!frontDesign && !backDesign) {
            alert("Debes elegir al menos un diseño.");
            return;
        }

        const effectiveColor = getEffectiveColor();

        const cartItemId = `custom-${frontDesign?.id || "none"}-${backDesign?.id || "none"}-${selectedShirtType}-${effectiveColor}-${selectedSize}-${selectedFabric}`;

        const productForCart = {
            id: cartItemId,
            type: "custom",
            name: "Camiseta personalizada",
            baseProductId: "tshirt",
            size: selectedSize,
            fabric: selectedFabric,
            colorHex: effectiveColor,
            shirtType: selectedShirtType,

            sidesMode:
                frontDesign && backDesign
                    ? "both"
                    : frontDesign
                    ? "front"
                    : "back",

            frontDesign: frontDesign
                ? {
                      id: frontDesign.id,
                      category: frontDesign.category,
                      png: frontDesign.png,
                      mockup: frontDesign.mockup
                  }
                : null,

            backDesign: backDesign
                ? {
                      id: backDesign.id,
                      category: backDesign.category,
                      png: backDesign.png,
                      mockup: backDesign.mockup
                  }
                : null,

            unitPrice: 0
        };

        addToCart(productForCart, 1);
    };

    return (
        <section className="customizer-section">
            <CategoryBar
                categories={designsData.map((c) => c.category)}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
            />

            <div className="customizer-layout">
                <div className="customizer-left">
                    <CustomizerControls
                        selectedColor={selectedColor}
                        onSelectColor={setSelectedColor}
                        selectedSize={selectedSize}
                        onSelectSize={setSelectedSize}
                        selectedFabric={selectedFabric}
                        onSelectFabric={setSelectedFabric}
                        selectedShirtType={selectedShirtType}
                        onSelectShirtType={setSelectedShirtType}
                    />

                    <div style={{ margin: "10px 0" }}>
                        <label style={{ cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={enableBack}
                                onChange={() => {
                                    const newValue = !enableBack;
                                    setEnableBack(newValue);
                                    setSelectedSide(newValue ? "back" : "front");
                                }}
                                style={{ marginRight: "6px" }}
                            />
                            Modificar espalda
                        </label>
                    </div>

                    <DesignGrid
                        categoryData={designsData.find(
                            (c) => c.category === selectedCategory
                        )}
                        onSelectDesign={handleSelectDesign}
                    />
                </div>

                <div className="customizer-right">
                    <div className="preview-dual">
                        <div
                            className={`preview-box ${
                                selectedSide === "front" ? "active-preview" : ""
                            }`}
                            onClick={() => setSelectedSide("front")}
                        >
                            <ShirtPreview
                                shirtImg={currentFrontImg}
                                designImg={frontDesign?.png}
                                shirtType={selectedShirtType}
                            />
                            <p>Frente</p>
                        </div>

                        {enableBack && (
                            <div
                                className={`preview-box ${
                                    selectedSide === "back" ? "active-preview" : ""
                                }`}
                                onClick={() => setSelectedSide("back")}
                            >
                                <ShirtPreview
                                    shirtImg={currentBackImg}
                                    designImg={backDesign?.png}
                                    shirtType={selectedShirtType}
                                />
                                <p>Espalda</p>
                            </div>
                        )}
                    </div>

                    <button className="buy-button" onClick={handleBuy}>
                        Comprar
                    </button>
                </div>
            </div>
        </section>
    );
}
