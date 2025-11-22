import "./HowItWorksSection.css";

export function HowItWorksSection() {
    return (
        <section id="how" className="how-section">
            <h2 className="how-title">¿Cómo funciona?</h2>

            <div className="how-steps">
                <div className="how-step">
                    <span className="how-number">1</span>
                    <h3>Elige tu diseño</h3>
                    <div className="p-container">
                        <p>Explora nuestro catálogo y selecciona tu diseño favorito.</p>
                    </div>
                </div>

                <div className="how-step">
                    <span className="how-number">2</span>
                    <h3>Personaliza tu prenda</h3>
                    <div className="p-container">
                        <p>Selecciona talla, tela y ajustes desde nuestra herramienta de personalización.</p>
                    </div>
                </div>

                <div className="how-step">
                    <span className="how-number">3</span>
                    <h3>Confirma tu pedido</h3>
                    <div className="p-container">
                        <p>Envianos tu diseño y completa tu orden.</p>
                    </div>
                </div>

                <div className="how-step">
                    <span className="how-number">4</span>
                    <h3>Impresión y envío</h3>
                    <div className="p-container">
                        <p>Nos encargamos del resto. Tu prenda llegará lista para usar.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
