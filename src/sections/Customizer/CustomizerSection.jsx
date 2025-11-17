import { useState } from "react";
import "./CustomizerSection.css";

import designsData from "../../mocks/designs.json";
import shirtData from "../../mocks/shirts.json";
import { CategoryBar } from "../../components/customizer/CategoryBar.jsx";
import { CustomizerControls } from "../../components/customizer/CustomizerControls";
import { DesignGrid } from "../../components/customizer/DesignGrid";
import { ShirtPreview } from "../../components/customizer/ShirtPreview.jsx";

export function CustomizerSection() {
    const [selectedCategory, setSelectedCategory] = useState(designsData[0]?.category || "");
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [selectedColor, setSelectedColor] = useState("black");
    const [selectedSize, setSelectedSize] = useState("M");
    const [selectedFabric, setSelectedFabric] = useState("cotton");

    const currentShirt = shirtData.images.find(img => img.colorId === selectedColor);

    const handleBuy = () => {
        if (!selectedDesign) {
            alert("Por favor selecciona un diseño antes de continuar.");
            return;
        }

        console.log({
            designId: selectedDesign.id,
            color: selectedColor,
            fabric: selectedFabric,
            size: selectedSize,
        });
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
                    />

                    <DesignGrid
                        categoryData={designsData.find((c) => c.category === selectedCategory)}
                        onSelectDesign={setSelectedDesign}
                    />
                </div>

                <div className="customizer-right">
                    <div>
                        <ShirtPreview
                            shirtImg={currentShirt?.image}
                            designImg={selectedDesign?.png}
                        />

                        {/* 🔥 Botón Comprar */}
                        <button className="buy-button" onClick={handleBuy}>
                            Comprar
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
