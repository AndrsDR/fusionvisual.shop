import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { CustomizerPage } from "./pages/CustomizerPage";
import { ProductDetailPage } from "./pages/ProductDetail";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CartSidebar } from "./components/layout/CartSidebar.jsx";

function App() {
    return (
        <>
            <CartSidebar />

            <Routes>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/customizer" element={<CustomizerPage />} />
            </Routes>
        </>
    );
}

export default App;
