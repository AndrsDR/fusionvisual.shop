// src/components/productDetails/ProductOptions.jsx

export function ProductOptions({
    size,
    fabric,
    shirtType,
    printBack,
    onSize,
    onFabric,
    onShirtType,
    onTogglePrintBack
}) {
    return (
        <div className="details-options">

            {/* TIPO DE PRENDA */}
            <label className="option-label">
                Tipo de prenda:
                <select
                    className="option-select"
                    value={shirtType}
                    onChange={(e) => onShirtType(e.target.value)}
                >
                    <option value="basic">Básica</option>
                    <option value="polo">Polo</option>
                    <option value="v-neck">Cuello V</option>
                </select>
            </label>

            {/* TALLA */}
            <label className="option-label">
                Talla:
                <select
                    className="option-select"
                    value={size}
                    onChange={(e) => onSize(e.target.value)}
                >
                    <option>S</option>
                    <option>M</option>
                    <option>L</option>
                    <option>XL</option>
                    <option>XXL</option>
                </select>
            </label>

            {/* TELA */}
            <label className="option-label">
                Tipo de tela:
                <select
                    className="option-select"
                    value={fabric}
                    onChange={(e) => onFabric(e.target.value)}
                >
                    <option value="cotton">Algodón Premium</option>
                    <option value="dryfit">DryFit</option>
                    <option value="oversize">Oversize Heavy</option>
                </select>
            </label>

            {/* IMPRIMIR TAMBIÉN EN ESPALDA */}
            <label className="option-label option-toggle">
                <input
                    type="checkbox"
                    checked={printBack}
                    onChange={onTogglePrintBack}
                    style={{ marginRight: "8px" }}
                />
                Imprimir también en la espalda (mismo diseño)
            </label>

        </div>
    );
}
