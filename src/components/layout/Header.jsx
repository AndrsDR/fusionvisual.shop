import "./Header.css";
import logoNegro from "../../assets/LOGO negro (2).png";
import logoBlanco from "../../assets/LOGO BLANCO (2).png";
import { useAppActions } from "../../hooks/useAppActions";



function HeaderSection({ icon = "html", action = () => {} }) {

    return (
        <>
        <button onClick={action} className="icon-button">
            <span className="material-symbols-outlined">{icon}</span>
        </button>
        </>
    )
}

export function Header() {

    const { handleAction } = useAppActions();

    return (
        <header className="site-header">
            <h1 className="site-logo">
                <img src={logoBlanco} alt="img" />
                <span className="visually-hidden">Fusion Visual</span>
            </h1>

            <hr className="header-divider"/>

            <nav className="site-nav" aria-label="Navegación principal">
                <ul className="nav-list">
                    <HeaderSection icon="home" action={() => handleAction('home')} />
                    <HeaderSection icon="bookmark_stacks" action={() => handleAction('catalog')} />
                    <HeaderSection icon="search" action={() => handleAction('search')}/>

                    <hr className="header-divider"/>

                    <HeaderSection icon="groups" action={() => handleAction('about')} />
                    <HeaderSection icon="help" action={() => handleAction('how')} />
                    
                    <hr className="header-divider"/>
                </ul>

                

                <button onClick={() => alert('cart')} className="icon-button cart-button" aria-label="Abrir carrito">
                    <span className="material-symbols-outlined">shopping_cart</span>
                    <span className="cart-count">#</span>
                </button>
            </nav>
        </header>
    );
}