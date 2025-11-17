import { Header } from "../components/layout/Header.jsx";
import { Catalog } from "../sections/Catalog/Catalog.jsx";
import { Hero } from "../sections/Hero/Hero.jsx";

export function HomePage() {
    return (
        <>
        <Header />
        <Hero />
        <Catalog />
        </>
    );
}
