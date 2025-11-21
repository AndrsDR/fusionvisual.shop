// src/components/productDetails/ProductOptions.jsx
export function ProductOptions({ size, fabric, onSize, onFabric }) {
    return (
        <div className="details-options">

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

            <label className="option-label">
                Tela:
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

        </div>
    );
}
