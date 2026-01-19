import "./Header.css";
import logoBlanco from "../../assets/LOGO BLANCO (2).png";
import { useAppActions } from "../../hooks/useAppActions";
import { useCart } from "../../context/CartContext.jsx";

function HeaderSection({ icon, text, action }) {
    return (
        <li className="nav-item">
            <button onClick={action} className="nav-button" aria-label={text}>
                <span className="nav-icon material-symbols-outlined" aria-hidden="true">
                    {icon}
                </span>
                <span className="nav-text">{text}</span>
            </button>
        </li>
    );
}

export function Header() {
    const { handleAction } = useAppActions();
    const { cart } = useCart();

    return (
        <header className="site-header">
            <h1 className="site-logo">
                <img src={logoBlanco} alt="Fusion Visual" />
                <span className="visually-hidden">Fusion Visual</span>
            </h1>

            <hr className="header-divider" />

            <nav className="site-nav" aria-label="Navegación principal">
                <ul className="nav-list">
                    <HeaderSection icon="home" text="Inicio" action={() => handleAction("home")} />
                    <HeaderSection icon="bookmark_stacks" text="Catalogo" action={() => handleAction("catalog")} />
                    <HeaderSection icon="search" text="Buscador" action={() => handleAction("search")} />

                    <hr className="header-divider" />

                    <HeaderSection icon="sell" text="Quienes somos" action={() => handleAction("about")} />
                    <HeaderSection icon="help" text="Como funciona" action={() => handleAction("how")} />

                    <hr className="header-divider" />
                </ul>

                {/* Carrito SIEMPRE igual */}
                <button
                    onClick={() => handleAction("cart")}
                    className="icon-button cart-button"
                    aria-label="Abrir carrito"
                >
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {
                        cart.length > 0 &&
                        <span className="cart-count">{cart.length}</span>
                    }
                </button>
            </nav>
        </header>
    );
}
