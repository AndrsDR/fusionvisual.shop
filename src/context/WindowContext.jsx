import { createContext, useContext, useState } from "react";

const WindowContext = createContext();

export function WindowProvider({ children }) {
    const [currentWindow, setCurrentWindow] = useState("home"); 
    // valores posibles: "home", "customizer"

    return (
        <WindowContext.Provider value={{ currentWindow, setCurrentWindow }}>
            {children}
        </WindowContext.Provider>
    );
}

export function useWindow() {
    return useContext(WindowContext);
}
