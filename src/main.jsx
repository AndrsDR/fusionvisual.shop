import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { WindowProvider } from "./context/WindowContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CartUIProvider } from "./context/CartUIContext.jsx";

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <WindowProvider>
            <SearchProvider>
                <CartProvider>
                    <CartUIProvider>
                        <App />
                    </CartUIProvider>
                </CartProvider>
            </SearchProvider>
        </WindowProvider>
    </BrowserRouter>
);
