import React from "react";
import "./AboutSection.css";

export default function AboutSection() {
    return (
        <section id="about" className="about-wrapper">
            <div className="about-container">

                <span className="about-tag">SOBRE FUSION VISUAL</span>

                <h2 className="about-title">Quiénes somos</h2>

                <p className="about-intro">
                    Fusion Visual es un estudio de diseño textil especializado en crear prendas únicas,
                    elaboradas con creatividad, estilo y atención al detalle. Cada pieza de nuestro catálogo
                    ha sido seleccionada y trabajada cuidadosamente para ofrecer una experiencia visual distinta.
                </p>

                <p className="about-body">
                    No somos una fábrica: trabajamos de forma personalizada para que recibas exactamente
                    el diseño que imaginaste, con la mejor calidad posible. Nuestro objetivo es que cada prenda
                    represente tu identidad y cuente una historia.
                </p>

                <p className="about-body">
                    Desde la selección de diseños hasta la personalización, impresión y entrega, Fusion Visual
                    te acompaña en cada paso para que obtengas algo hecho especialmente para ti.
                </p>

                <div className="about-features">
                    <div className="feature-card">
                        <h3>Diseño a medida</h3>
                        <p>Convertimos tu idea en un diseño profesional adaptado a tu estilo.</p>
                    </div>

                    <div className="feature-card">
                        <h3>Selección creativa</h3>
                        <p>Cada diseño del catálogo es elegido cuidadosamente por estética y calidad.</p>
                    </div>

                    <div className="feature-card">
                        <h3>Impresión y acabado</h3>
                        <p>Priorizamos materiales y procesos que garantizan excelente durabilidad.</p>
                    </div>
                </div>

            </div>
        </section>
    );
}
