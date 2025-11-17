// hooks/useAppActions.js
import { useNavigate } from "react-router-dom";

export function useAppActions() {
    const navigate = useNavigate();

    /**
     * Scroll progresivo — espera a que la sección aparezca en DOM.
     */
    const smoothScrollTo = (id) => {
        if (!id) return;
        let tries = 0;
        const maxTries = 60; // ~1s aprox

        const attempt = () => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            if (tries++ < maxTries) requestAnimationFrame(attempt);
        };

        requestAnimationFrame(attempt);
    };

    /** Ir al Home y subir hasta arriba */
    const goHome = () => {
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /** Ir al Home y scrollear a una sección */
    const goToSection = (id) => {
        if (!id) return;
        navigate("/");
        smoothScrollTo(id);
    };

    /**
     * Controlador global de acciones para botones
     * action: string o array tipo ["section", "catalog-section"]
     */
    const handleAction = (action) => {
        if (!action) return console.warn("Action vacía en handleAction");

        // Actions simples directas
        if (typeof action === "string") {
            switch (action) {
                case "home": return goHome();
                case "catalog": return goToSection("catalog-section");
                case "about": return goToSection("about-section");
                default:
                    return console.warn(`No action registrada: ${action}`);
            }
        }

        // Actions con parámetro: ["section", "catalog-section"]
        if (Array.isArray(action)) {
            const [type, value] = action;
            if (type === "section") return goToSection(value);
            return console.warn(`No action con parámetros registrada: ${action}`);
        }
    };

    return {
        goHome,
        goToSection,
        smoothScrollTo,
        handleAction,
    };
}
