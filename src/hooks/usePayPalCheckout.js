// src/hooks/usePayPalCheckout.js
import { useEffect, useRef, useState } from "react";

function loadPayPalSdk({ clientId, currency = "MXN" }) {
    return new Promise((resolve, reject) => {
        if (!clientId) {
            reject(new Error("Falta clientId para cargar PayPal SDK."));
            return;
        }

        if (window.paypal?.Buttons) return resolve(true);

        const existing = document.querySelector('script[data-paypal-sdk="true"]');
        if (existing) {
            existing.addEventListener("load", () => resolve(true));
            existing.addEventListener("error", () => reject(new Error("No se pudo cargar el PayPal SDK.")));
            return;
        }

        const s = document.createElement("script");
        s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&components=buttons`;
        s.async = true;
        s.defer = true;
        s.dataset.paypalSdk = "true";

        s.onload = () => resolve(true);
        s.onerror = () => reject(new Error("No se pudo cargar el PayPal SDK."));

        document.body.appendChild(s);
    });
}

export function usePayPalCheckout({
    enabled,
    clientId,
    currency = "MXN",
    createOrder,
    onApprove,
    onError,
    onCancel
}) {
    const containerRef = useRef(null);
    const buttonsRef = useRef(null);

    // ✅ Mantén SIEMPRE los handlers más recientes SIN re-renderizar botones
    const handlersRef = useRef({
        createOrder: null,
        onApprove: null,
        onError: null,
        onCancel: null
    });

    const [isReady, setIsReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        handlersRef.current.createOrder = createOrder;
        handlersRef.current.onApprove = onApprove;
        handlersRef.current.onError = onError;
        handlersRef.current.onCancel = onCancel;
    }, [createOrder, onApprove, onError, onCancel]);

    useEffect(() => {
        if (!enabled) {
            setIsReady(false);

            try { buttonsRef.current?.close(); } catch {}
            buttonsRef.current = null;

            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }

            setIsProcessing(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setIsReady(false);

                await loadPayPalSdk({ clientId, currency });
                if (cancelled) return;

                if (!window.paypal?.Buttons) {
                    throw new Error("PayPal SDK no está listo (window.paypal.Buttons undefined)");
                }

                const container = containerRef.current;
                if (!container) return;

                // ✅ Limpia antes de render
                container.innerHTML = "";

                // ✅ Cierra instancia previa
                try { buttonsRef.current?.close(); } catch {}
                buttonsRef.current = null;

                const buttons = window.paypal.Buttons({
                    createOrder: (...args) => {
                        return handlersRef.current.createOrder?.(...args);
                    },
                    onApprove: async (...args) => {
                        try {
                            setIsProcessing(true);
                            return await handlersRef.current.onApprove?.(...args);
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    onCancel: (...args) => {
                        setIsProcessing(false);
                        return handlersRef.current.onCancel?.(...args);
                    },
                    onError: (err) => {
                        setIsProcessing(false);
                        handlersRef.current.onError?.(err);
                    }
                });

                buttonsRef.current = buttons;

                await buttons.render(container);
                if (cancelled) return;

                setIsReady(true);
            } catch (err) {
                if (cancelled) return;
                setIsReady(false);
                setIsProcessing(false);
                handlersRef.current.onError?.(err);
            }
        })();

        return () => {
            cancelled = true;

            try { buttonsRef.current?.close(); } catch {}
            buttonsRef.current = null;

            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }

            setIsProcessing(false);
            setIsReady(false);
        };
    }, [enabled, clientId, currency]);

    return { containerRef, isReady, isProcessing };
}
