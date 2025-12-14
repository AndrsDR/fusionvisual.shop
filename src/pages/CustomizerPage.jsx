import { useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { CustomizerSection } from "../sections/Customizer/CustomizerSection.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { SearchModal } from "../components/search/SearchModal.jsx";

export function CustomizerPage() {
    const location = useLocation();              
    const designFromDetail = location.state?.design || null;

    return (
        <>
            <Header />
            <SearchModal />
            <CustomizerSection designFromDetail={designFromDetail} />
            <Footer />
        </>
    );
}
