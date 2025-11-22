import React from "react";
import "./Footer.css";
import { useAppActions } from "../../hooks/useAppActions";
import { useNavigate } from "react-router-dom";

export function Footer() {


    const { handleAction } = useAppActions();
    const navigate = useNavigate();

    return (
        <footer className="footer-wrapper">
            <div className="footer-content">

                {/* Branding */}
                <div className="footer-brand">
                    <h2>Fusion Visual</h2>
                    <p>
                        Diseños personalizados, impresión de calidad y prendas hechas especialmente para ti.
                    </p>
                </div>

                {/* Columns */}
                <div className="footer-columns">

                    <div className="footer-col">
                        <h3>Navegación</h3>
                        <ul>
                            <li><a onClick={() => handleAction('home')}>Inicio</a></li>
                            <li><a onClick={() => handleAction('catalog')} >Catálogo</a></li>
                            <li><a onClick={() => navigate("/customizer")} >Personalizar</a></li>
                            <li><a onClick={() => handleAction('how')} >¿Cómo funciona?</a></li>
                            <li><a onClick={() => handleAction('about')}>Sobre nosotros</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>Contacto</h3>
                        <ul>
                            <li>📞 998 108 4785</li>
                            <li>💬 +52 1 998 108 4785</li>
                            <li>✉️ ventas@fusionvisual.shop</li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>Redes sociales</h3>
                        <ul>
                            <li>
                                <a href="https://www.facebook.com/61575458654547" target="_blank">
                                    Facebook
                                </a>
                            </li>
                            <li>
                                <a href="https://www.instagram.com/fusion.visual_/" target="_blank">
                                    Instagram
                                </a>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom credits */}
            <div className="footer-bottom">
                <p>
                    © 2024 Fusion Visual. Todos los derechos reservados.
                </p>
                <p className="designer-credit">
                    Frontend creado por <strong>Rogelio Andrés Díaz Rosales</strong>.
                </p>
            </div>
        </footer>
    );
}
