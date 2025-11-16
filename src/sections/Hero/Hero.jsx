import "./Hero.css";
import { useNavigate } from "react-router-dom";

export function Hero() {
    const navigate = useNavigate();
    return (
        <section className="hero-section">
            <div className="hero-bg"></div>

            <div className="hero-overlay"></div>

            <div className="hero-content">
                <h2 className="hero-title">Yo quiero crear mi propia camisa</h2>

                <button className="hero-button" onClick={() => navigate("/customizer")}>
                    Crear
                </button>
            </div>
        </section>
    );
}
