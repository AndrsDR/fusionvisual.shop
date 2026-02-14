import { useState, useEffect, useMemo } from "react";
import "./CustomizerSection.css";

import designsData from "../../mocks/designs.json";
import shirtData from "../../mocks/shirts.json";

import { CategoryBar } from "../../components/customizer/CategoryBar.jsx";
import { CustomizerControls } from "../../components/customizer/CustomizerControls";
import { DesignGrid } from "../../components/customizer/DesignGrid";
import { ShirtPreview } from "../../components/customizer/ShirtPreview.jsx";
import { useCart } from "../../context/CartContext.jsx";

function normalizeUrl(raw) {
    return (raw || "").trim();
}

// Hash simple y estable para generar IDs sin colisiones obvias
function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    // unsigned + base36
    return (hash >>> 0).toString(36);
}

function isProbablyImageUrl(url) {
    // No lo uso como validación final (la validación real es cargar la imagen),
    // pero sirve para dar feedback temprano.
    return /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(url);
}

function CustomUrlInput({
    selectedSide,
    enableBack,
    urlFront,
    urlBack,
    onChangeFront,
    onChangeBack,
    onApply,
    statusFront,
    statusBack
}) {
    const isBack = selectedSide === "back";
    const value = isBack ? urlBack : urlFront;
    const setValue = isBack ? onChangeBack : onChangeFront;
    const status = isBack ? statusBack : statusFront;

    const sideLabel = isBack ? "Espalda" : "Frente";

    return (
        <div style={{ padding: "10px 10px 0 10px" }}>
            <div style={{ marginBottom: 8, opacity: 0.85 }}>
                <b>Custom</b> — Pega un link directo de imagen para <b>{sideLabel}</b>
            </div>

            {isBack && !enableBack && (
                <div style={{ marginBottom: 10, opacity: 0.8 }}>
                    Activa “Modificar espalda” para usar URL en espalda.
                </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
                <input
                    type="url"
                    placeholder="https://.../mi-diseno.png"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.05)",
                        color: "white",
                        outline: "none"
                    }}
                />
                <button
                    type="button"
                    onClick={() => onApply(selectedSide)}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                    }}
                >
                    Aplicar
                </button>
            </div>

            <div style={{ marginTop: 8, minHeight: 20, opacity: 0.9 }}>
                {status?.state === "idle" && (
                    <span style={{ opacity: 0.75 }}>
                        Tip: usa URLs directas (terminan en .png/.jpg/.webp). Drive/Dropbox suelen fallar.
                    </span>
                )}

                {status?.state === "loading" && <span>Cargando imagen…</span>}

                {status?.state === "error" && (
                    <span style={{ color: "#ff8a8a" }}>
                        {status.message || "No se pudo cargar la imagen. Revisa el link."}
                    </span>
                )}

                {status?.state === "ok" && (
                    <span style={{ color: "#8affb1" }}>
                        Imagen válida ✅
                    </span>
                )}

                {value && !isProbablyImageUrl(value) && status?.state !== "ok" && (
                    <span style={{ display: "block", opacity: 0.75, marginTop: 4 }}>
                        Ojo: el link no parece terminar en .png/.jpg/.webp (igual puede funcionar si es URL directa).
                    </span>
                )}
            </div>
        </div>
    );
}

export function CustomizerSection({ designFromDetail }) {
    const CUSTOM_CATEGORY = "Custom";

    const categories = useMemo(() => {
        const raw = designsData.map((c) => c.category);
        // Custom al inicio, sin duplicar
        return raw.includes(CUSTOM_CATEGORY)
            ? raw
            : [CUSTOM_CATEGORY, ...raw];
    }, []);

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

    // basic | polo | v-neck
    const [selectedShirtType, setSelectedShirtType] = useState("basic");

    // URLs custom por lado
    const [customUrlFront, setCustomUrlFront] = useState("");
    const [customUrlBack, setCustomUrlBack] = useState("");

    // Estado de validación por lado
    const [customStatusFront, setCustomStatusFront] = useState({ state: "idle" });
    const [customStatusBack, setCustomStatusBack] = useState({ state: "idle" });

    const colors = shirtData.images;
    const defaultColorId = "negro";

    const getEffectiveColor = () => {
        const exists = colors.some((c) => c.colorId === selectedColor);
        return exists ? selectedColor : colors[0]?.colorId || defaultColorId;
    };

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

    // Preselección desde detalle
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

    const handleToggleBack = () => {
        const newValue = !enableBack;
        setEnableBack(newValue);
        setSelectedSide(newValue ? "back" : "front");

        if (!newValue) {
            setBackDesign(null);
            setCustomUrlBack("");
            setCustomStatusBack({ state: "idle" });
        }
    };

    const validateAndApplyCustomUrl = (side) => {
        const url =
            side === "front"
                ? normalizeUrl(customUrlFront)
                : normalizeUrl(customUrlBack);

        if (!url) {
            const msg = "Pega un link antes de aplicar.";
            if (side === "front") setCustomStatusFront({ state: "error", message: msg });
            else setCustomStatusBack({ state: "error", message: msg });
            return;
        }

        if (side === "back" && !enableBack) {
            setCustomStatusBack({ state: "error", message: "Activa “Modificar espalda” primero." });
            return;
        }

        const setStatus = side === "front" ? setCustomStatusFront : setCustomStatusBack;

        setStatus({ state: "loading" });

        const img = new Image();
        img.onload = () => {
            setStatus({ state: "ok" });

            const id = `custom-${hashString(url)}`;
            const customDesignObj = {
                id,
                category: CUSTOM_CATEGORY,
                png: url,
                mockup: url
            };

            if (side === "front") {
                setFrontDesign(customDesignObj);
            } else {
                setBackDesign(customDesignObj);
            }
        };
        img.onerror = () => {
            setStatus({
                state: "error",
                message: "No se pudo cargar la imagen (URL rota, no es directa o bloqueada)."
            });
        };
        img.src = url;
    };

    const isCustomSelected = selectedCategory === CUSTOM_CATEGORY;

    const customIsReadyForCart = () => {
        // Si no estás en Custom, no aplica
        if (!isCustomSelected) return true;

        // Reglas:
        // - Frente: si hay design en frente, ok; si no hay, error
        // - Espalda: solo si enableBack está activo -> debe estar ok si quieres usarlo,
        //   pero permitimos que sea opcional si el usuario no aplica espalda.
        const frontOk = !!frontDesign && customStatusFront.state === "ok";

        if (!enableBack) return frontOk;

        // Con espalda habilitada, permitimos:
        // - front ok y back opcional (pero si back existe debe ser ok)
        const backOk = !backDesign || customStatusBack.state === "ok";
        return frontOk && backOk;
    };

    const handleBuy = () => {
        if (!frontDesign && !backDesign) {
            alert("Debes elegir al menos un diseño.");
            return;
        }

        if (isCustomSelected && !customIsReadyForCart()) {
            alert("Tu imagen Custom no es válida. Revisa el link y vuelve a aplicar.");
            return;
        }

        const effectiveColor = getEffectiveColor();

        const cartItemId = `custom-${frontDesign?.id || "none"}-${
            backDesign?.id || "none"
        }-${selectedShirtType}-${effectiveColor}-${selectedSize}-${selectedFabric}`;

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
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={(cat) => {
                    setSelectedCategory(cat);

                    // Si entra a custom, dejamos el lado donde esté,
                    // pero damos un estado "idle" si aún no tiene nada.
                    if (cat === CUSTOM_CATEGORY) {
                        if (!customUrlFront) setCustomStatusFront({ state: "idle" });
                        if (enableBack && !customUrlBack) setCustomStatusBack({ state: "idle" });
                    }
                }}
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
                        enableBack={enableBack}
                        onToggleBack={handleToggleBack}
                    />

                    {isCustomSelected ? (
                        <CustomUrlInput
                            selectedSide={selectedSide}
                            enableBack={enableBack}
                            urlFront={customUrlFront}
                            urlBack={customUrlBack}
                            onChangeFront={(v) => {
                                setCustomUrlFront(v);
                                setCustomStatusFront({ state: "idle" });
                            }}
                            onChangeBack={(v) => {
                                setCustomUrlBack(v);
                                setCustomStatusBack({ state: "idle" });
                            }}
                            onApply={validateAndApplyCustomUrl}
                            statusFront={customStatusFront}
                            statusBack={customStatusBack}
                        />
                    ) : (
                        <DesignGrid
                            categoryData={designsData.find(
                                (c) => c.category === selectedCategory
                            )}
                            onSelectDesign={handleSelectDesign}
                        />
                    )}
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
                        Agregar al carrito
                    </button>
                </div>
            </div>
        </section>
    );
}
