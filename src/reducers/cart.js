// src/reducers/cart.js

export const cartInitialState =
    JSON.parse(window.localStorage.getItem('cart')) || [];

export const CART_ACTION_TYPES = {
    ADD_TO_CART: 'ADD_TO_CART',
    REMOVE_FROM_CART: 'REMOVE_FROM_CART',
    DECREMENT_FROM_CART: 'DECREMENT_FROM_CART',
    SET_QUANTITY: 'SET_QUANTITY',
    CLEAR_CART: 'CLEAR_CART'
};

export const updateLocalStorage = state => {
    // window.localStorage.setItem('cart', JSON.stringify(state));
};

const UPDATE_STATE_BY_ACTION = {
    [CART_ACTION_TYPES.ADD_TO_CART]: (state, action) => {
        const { id, quantity = 1 } = action.payload;
        const productInCartIndex = state.findIndex(item => item.id === id);

        if (productInCartIndex >= 0) {
            const newState = [
                ...state.slice(0, productInCartIndex),
                {
                    ...state[productInCartIndex],
                    quantity: state[productInCartIndex].quantity + quantity
                },
                ...state.slice(productInCartIndex + 1)
            ];

            updateLocalStorage(newState);
            return newState;
        }

        const newState = [
            ...state,
            {
                ...action.payload,
                quantity
            }
        ];

        updateLocalStorage(newState);
        return newState;
    },

    [CART_ACTION_TYPES.DECREMENT_FROM_CART]: (state, action) => {
        const { id } = action.payload;
        const productInCartIndex = state.findIndex(item => item.id === id);

        if (productInCartIndex < 0) return state;

        const currentProduct = state[productInCartIndex];
        const newQuantity = currentProduct.quantity - 1;

        if (newQuantity <= 0) {
            const newState = [
                ...state.slice(0, productInCartIndex),
                ...state.slice(productInCartIndex + 1)
            ];
            updateLocalStorage(newState);
            return newState;
        }

        const newState = [
            ...state.slice(0, productInCartIndex),
            {
                ...currentProduct,
                quantity: newQuantity
            },
            ...state.slice(productInCartIndex + 1)
        ];

        updateLocalStorage(newState);
        return newState;
    },

    [CART_ACTION_TYPES.REMOVE_FROM_CART]: (state, action) => {
        const { id } = action.payload;
        const newState = state.filter(item => item.id !== id);
        updateLocalStorage(newState);
        return newState;
    },

    [CART_ACTION_TYPES.CLEAR_CART]: () => {
        updateLocalStorage([]);
        return [];
    }
};

export const cartReducer = (state, action) => {
    const { type: actionType } = action;
    const updateState = UPDATE_STATE_BY_ACTION[actionType];
    return updateState ? updateState(state, action) : state;
};
