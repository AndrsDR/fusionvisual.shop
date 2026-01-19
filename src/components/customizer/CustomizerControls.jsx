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
    onToggleBack
}) {
    const colors = shirtData.images;
    const shirtTypes = shirtData.types;

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
        </div>
    );
}
