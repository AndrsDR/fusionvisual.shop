import "./Header.css";

function HeaderSection({ icon = "html", action = () => {} }) {
    

    return (
        <>
        <span onClick={action} className="material-symbols-outlined">{icon}</span>
        </>
    )
}

export function Header() {

    return (
        <header className="site-header">
            <h1 className="site-logo">
                <img src="#" alt="img" />
                <span className="visually-hidden">Titulo</span>
            </h1>

            <hr className="header-divider"/>

            <nav className="site-nav" aria-label="Navegación principal">
                <ul className="nav-list">
                    <HeaderSection icon="home" action={() => alert('home')} />
                    <HeaderSection icon="grade" action={() => alert('feature')} />
                    <HeaderSection icon="search" action={() => alert('search')}/>

                    <hr className="header-divider"/>

                    <HeaderSection icon="groups" action={() => alertk('about')} />
                    
                    
                </ul>

                <button onClick={() => alert('cart')} className="icon-button cart-button" aria-label="Abrir carrito">
                    <span className="material-symbols-outlined">shopping_cart</span>
                    #
                </button>
            </nav>
        </header>
    );
}