// src/context/CartContext.jsx
import { useReducer, createContext, useContext } from "react";
import { cartReducer, cartInitialState } from "../reducers/cart";
import { computePriceBreakdown } from "../pricing/pricing";


export const CartContext = createContext();

function useCartReducer() {
    const [state, dispatch] = useReducer(cartReducer, cartInitialState);

    const addToCart = (product, quantity = 1) => {
        const breakdown = computePriceBreakdown(product);
        
        dispatch({
            type: "ADD_TO_CART",
            payload: {
                ...product,
                quantity,
                unitPrice: breakdown.unitPrice,
                priceBreakdown: breakdown, // opcional
            }
        });
    };

    const decrementFromCart = (product) =>
        dispatch({
            type: "DECREMENT_FROM_CART",
            payload: product,
        });

    const removeFromCart = (product) =>
        dispatch({
            type: "REMOVE_FROM_CART",
            payload: product,
        });

    const clearCart = () =>
        dispatch({ type: "CLEAR_CART" });

    return { state, addToCart, decrementFromCart, removeFromCart, clearCart };
}

export function CartProvider({ children }) {
    const {
        state,
        addToCart,
        removeFromCart,
        decrementFromCart,
        clearCart
    } = useCartReducer();

    return (
        <CartContext.Provider
            value={{
                cart: state,
                addToCart,
                removeFromCart,
                decrementFromCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
