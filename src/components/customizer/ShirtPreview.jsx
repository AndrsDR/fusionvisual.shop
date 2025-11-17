export function ShirtPreview({ shirtImg, designImg }) {
    return (
        <div className="shirt-preview">
            <div className="shirt-base">
                {shirtImg && (
                    <img src={shirtImg} alt="shirt" className="shirt-base-img" />
                )}

                {designImg && (
                    <img src={designImg} alt="design" className="shirt-design" />
                )}
            </div>
        </div>
    );
}
