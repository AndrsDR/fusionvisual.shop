import { createContext, useContext, useState } from "react";

const CartUIContext = createContext();

export function CartUIProvider({ children }) {
    const [isCartOpen, setIsCartOpen] = useState(false);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);
    const toggleCart = () => setIsCartOpen(prev => !prev);

    return (
        <CartUIContext.Provider
            value={{ isCartOpen, openCart, closeCart, toggleCart }}
        >
            {children}
        </CartUIContext.Provider>
    );
}

export function useCartUI() {
    return useContext(CartUIContext);
}
