// src/pages/ProductDetailPage.jsx
import { useLocation } from "react-router-dom";
import { ProductDetailsSection } from "../sections/ProductDetails/ProductDetailsSection";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export function ProductDetailPage() {
    const { state: item } = useLocation();

    return (
        <>
        <Header />
        <ProductDetailsSection item={item} />
        <Footer />
        </>
    )
}
