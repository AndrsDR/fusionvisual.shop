import { Footer } from "../components/layout/Footer.jsx";
import { Header } from "../components/layout/Header.jsx";
import AboutSection from "../sections/About/AboutSection.jsx";
import { Catalog } from "../sections/Catalog/Catalog.jsx";
import { Hero } from "../sections/Hero/Hero.jsx";
import { HowItWorksSection } from "../sections/HowItWorks/HowItWorksSection.jsx";
import { SearchModal } from "../components/search/SearchModal.jsx";

export function HomePage() {
    return (
        <>
        <Header />
        <SearchModal />
        <Hero />
        <Catalog />
        <HowItWorksSection />
        <AboutSection />
        <Footer />
        </>
    );
}
