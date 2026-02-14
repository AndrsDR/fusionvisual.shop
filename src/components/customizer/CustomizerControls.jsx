import shirtData from "../../mocks/shirts.json";

export function CustomizerControls({
    selectedColor,
    onSelectColor,
    selectedSize,
    onSelectSize,
    selectedFabric,
    onSelectFabric,
    selectedShirtType,
    onSelectShirtType,

    /* === NUEVO === */
    enableBack,
    onToggleBack,
    selectedSide,
    frontPlacement,
    backPlacement,
    onChangeFrontPlacement,
    onChangeBackPlacement
}) {
    const colors = shirtData.images;
    const shirtTypes = shirtData.types;
    const currentPlacement = selectedSide === "back" ? backPlacement : frontPlacement;
    const setCurrentPlacement = (next) => {
        if (selectedSide === "back") onChangeBackPlacement(next);
        else onChangeFrontPlacement(next);
    };
    const safeScale = Math.max(0, Math.min(100, Number(currentPlacement?.scale ?? 100)));

    return (
        <div className="customizer-controls">
            <h3 className="controls-title">Opciones</h3>

            {/* === COLOR === */}
            <label className="control-group">
                Color de camiseta:
                <div className="color-options">
                    {colors.map((c) => (
                        <span
                            key={c.colorId}
                            className="color-box"
                            style={{
                                background: c.previewColor,
                                border:
                                    selectedColor === c.colorId
                                        ? "2px solid var(--text-primary)"
                                        : "1px solid var(--border-default)"
                            }}
                            onClick={() => onSelectColor(c.colorId)}
                        />
                    ))}
                </div>
            </label>

            {/* === TIPO DE PRENDA === */}
            <label className="control-group">
                Tipo de prenda:
                <select
                    className="control-select"
                    value={selectedShirtType}
                    onChange={(e) => onSelectShirtType(e.target.value)}
                >
                    {shirtTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </label>

            {/* === TELA === */}
            <label className="control-group">
                Tipo de tela:
                <select
                    className="control-select"
                    value={selectedFabric}
                    onChange={(e) => onSelectFabric(e.target.value)}
                >
                    <option value="cotton">Algodón Premium</option>
                    <option value="dryfit">DryFit</option>
                    <option value="oversize">Oversize Heavy</option>
                </select>
            </label>

            {/* === TALLA === */}
            <label className="control-group">
                Talla:
                <select
                    className="control-select"
                    value={selectedSize}
                    onChange={(e) => onSelectSize(e.target.value)}
                >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                </select>
            </label>

            {/* === MODIFICAR ESPALDA (solo checkbox) === */}
            <div className="control-group">
                <div className="side-toggle">
                    <input
                        id="enableBack"
                        type="checkbox"
                        className="toggle-input"
                        checked={enableBack}
                        onChange={onToggleBack}
                    />
                    <label htmlFor="enableBack" className="toggle-label">
                        Modificar espalda
                    </label>
                </div>
            </div>

            <details className="control-group" style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", opacity: 0.9 }}>
                    Posición y escala del diseño ({selectedSide === "back" ? "Espalda" : "Frente"})
                </summary>

                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    <label className="control-group">
                        Posición horizontal:
                        <select
                            className="control-select"
                            value={currentPlacement?.x || "center"}
                            onChange={(e) => setCurrentPlacement({ ...currentPlacement, x: e.target.value })}
                        >
                            <option value="left">Izquierda</option>
                            <option value="center">Centro</option>
                            <option value="right">Derecha</option>
                        </select>
                    </label>

                    <label className="control-group">
                        Posición vertical:
                        <select
                            className="control-select"
                            value={currentPlacement?.y || "center"}
                            onChange={(e) => setCurrentPlacement({ ...currentPlacement, y: e.target.value })}
                        >
                            <option value="top">Arriba</option>
                            <option value="center">Centro</option>
                            <option value="bottom">Abajo</option>
                        </select>
                    </label>

                    <label className="control-group">
                        Escala: {safeScale}%
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={safeScale}
                            onChange={(e) =>
                                setCurrentPlacement({ ...currentPlacement, scale: Number(e.target.value) })
                            }
                            style={{ width: "100%" }}
                        />
                    </label>

                    {selectedSide === "back" && !enableBack && (
                        <div style={{ opacity: 0.75 }}>
                            Activa "Modificar espalda" para controlar posicion/escala en espalda.
                        </div>
                    )}
                </div>
            </details>
        </div>
    );
}

