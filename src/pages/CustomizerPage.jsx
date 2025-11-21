import { useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { CustomizerSection } from "../sections/Customizer/CustomizerSection.jsx";

export function CustomizerPage() {
    const location = useLocation();              
    const designFromDetail = location.state?.design || null;

    return (
        <>
            <Header />
            <CustomizerSection designFromDetail={designFromDetail} />
        </>
    );
}
