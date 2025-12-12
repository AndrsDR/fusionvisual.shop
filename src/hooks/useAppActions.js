// hooks/useAppActions.js
import { useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import { useCartUI } from "../context/CartUIContext.jsx";

export function useAppActions() {
    const navigate = useNavigate();
    const { toggleSearch } = useSearch();
    const { toggleCart } = useCartUI();

    const smoothScrollTo = (id) => {
        if (!id) return;
        let tries = 0;
        const maxTries = 60;

        const attempt = () => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            tries += 1;
            if (tries < maxTries) {
                setTimeout(attempt, 50);
            }
        };

        attempt();
    };

    const goHome = () => {
        navigate("/");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goToSection = (id) => {
        if (!id) return;

        if (window.location.pathname !== "/") {
            navigate("/");
            setTimeout(() => smoothScrollTo(id), 120);
        } else {
            smoothScrollTo(id);
        }
    };

    const handleAction = (action) => {
        if (!action) return;

        if (typeof action === "string") {
            switch (action) {
                case "home":
                    return goHome();
                case "catalog":
                    return goToSection("catalog");
                case "about":
                    return goToSection("about");
                case "how":
                    return goToSection("how");
                case "search":
                    return toggleSearch();
                case "cart":
                    return toggleCart();
                default:
                    console.warn("No action registrada:", action);
                    return;
            }
        }

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
