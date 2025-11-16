import "./Header.css";
import logoNegro from "../../assets/LOGO negro (2).png";
import logoBlanco from "../../assets/LOGO BLANCO (2).png";



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

    return (
        <header className="site-header">
            <h1 className="site-logo">
                <img src={logoBlanco} alt="img" />
                <span className="visually-hidden">Fusion Visual</span>
            </h1>

            <hr className="header-divider"/>

            <nav className="site-nav" aria-label="Navegación principal">
                <ul className="nav-list">
                    <HeaderSection icon="home" action={() => alert('home')} />
                    <HeaderSection icon="grade" action={() => alert('feature')} />
                    <HeaderSection icon="search" action={() => alert('search')}/>

                    <hr className="header-divider"/>

                    <HeaderSection icon="groups" action={() => alert('about')} />
                    
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