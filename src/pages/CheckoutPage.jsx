// src/pages/CheckoutPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useCheckoutDraft } from "../hooks/useCheckoutDraft.js";
import { usePayPalCheckout } from "../hooks/usePayPalCheckout.js";
import { buildItemsForSheet, createEmptyAddress } from "../checkout/checkoutDraft.js";
import { publishCheckoutEvent } from "../checkout/checkoutChannel.js";

import "./CheckoutPage.css";

const SHEETS_WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL || "";
const COPOMEX_TOKEN = import.meta.env.VITE_COPOMEX_TOKEN || "";

function money(n) {
    const x = Number(n);
    return `$${(Number.isFinite(x) ? x : 0).toFixed(2)}`;
}

function onlyDigits(s) {
    return String(s || "").replace(/\D/g, "");
}

function buildFormattedAddress(a) {
    const streetLine = [
        a.street?.trim(),
        a.noNumber ? "S/N" : a.streetNumber?.trim(),
        a.noInterior ? "" : a.interiorNumber?.trim() ? `Int ${a.interiorNumber.trim()}` : ""
    ]
        .filter(Boolean)
        .join(" ");

    const placeLine = [
        a.neighborhood?.trim() ? `Col. ${a.neighborhood.trim()}` : "",
        a.municipality?.trim(),
        a.state?.trim(),
        a.postalCode?.trim() ? `CP ${a.postalCode.trim()}` : "",
        "México"
    ]
        .filter(Boolean)
        .join(", ");

    const refs = a.references?.trim() ? `Referencias: ${a.references.trim()}` : "";

    return [streetLine, placeLine, refs].filter(Boolean).join(" — ");
}

function buildAddressForSheets(a) {
    const country = "México";
    const state = a.state?.trim() || "";
    const municipality = a.municipality?.trim() || "";
    const postalCode = a.postalCode?.trim() || "";
    const neighborhood = a.neighborhood?.trim() || "";
    const street = a.street?.trim() || "";

    const ext = a.noNumber ? "S/N" : (a.streetNumber?.trim() || "S/N");
    const interior = a.noInterior ? "S/N" : (a.interiorNumber?.trim() || "S/N");
    const refs = a.references?.trim() || "Sin Referencias";

    return [
        `País: ${country}`,
        state ? `Estado: ${state}` : null,
        postalCode ? `CP: ${postalCode}` : null,
        `Colonia: ${municipality || "—"}${neighborhood ? `, ${neighborhood}` : ""}`,
        street ? `Calle: ${street}` : null,
        `Número exterior: ${ext}`,
        `Número interior: ${interior}`,
        `Referencias: ${refs}`
    ]
        .filter(Boolean)
        .join(" — ");
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000";

async function postJson(path, body) {
    const url = API_BASE ? new URL(path, API_BASE).toString() : path;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(`HTTP_${res.status}`);
    }
    return json;
}


export function CheckoutPage() {
    const { sessionId, draft, total, error, updateDraft, hasValidDraft } = useCheckoutDraft();

    const [contact, setContact] = useState("");
    const [address, setAddress] = useState(createEmptyAddress());

    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [orderId, setOrderId] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("PENDING"); // PENDING | PAID
    const [pendingPayload, setPendingPayload] = useState(null);

    const [isPayPalReady, setIsPayPalReady] = useState(false);
    const [isPayPalProcessing, setIsPayPalProcessing] = useState(false);

    // --- COPOMEX state ---
    const [postalCode, setPostalCode] = useState("");
    const [colonias, setColonias] = useState([]);
    const [cpLoading, setCpLoading] = useState(false);
    const [cpError, setCpError] = useState("");

    const apiEnabled = Boolean(COPOMEX_TOKEN);
    const cpReqIdRef = useRef(0);
    const hydratedRef = useRef(false);

    useEffect(() => {
        if (!draft || hydratedRef.current) return;

        setContact(draft.contact || "");

        if (typeof draft.address === "string") {
            const base = {
                ...createEmptyAddress(),
                formattedAddress: draft.address,
                validation: { method: "manual", confirmed: false }
            };
            setAddress(base);
            setPostalCode(base.postalCode || "");
        } else {
            const nextAddr = draft.address || createEmptyAddress();
            setAddress(nextAddr);
            setPostalCode(nextAddr.postalCode || "");
        }

        setSubmitted(draft.status === "SUBMITTED" || draft.status === "PAID" || draft.status === "COMPLETED");
        setOrderId(draft.orderId || "");
        setPaymentStatus(draft.paymentStatus || "PENDING");
        setPendingPayload(draft.pendingPayload || null);

        hydratedRef.current = true;
    }, [draft]);

    const cp5 = useMemo(() => onlyDigits(postalCode).slice(0, 5), [postalCode]);
    const cpValid = useMemo(() => cp5.length === 5 && colonias.length > 0 && !cpError, [cp5, colonias.length, cpError]);
    const coloniaSelected = useMemo(() => cpValid && Boolean(address?.neighborhood), [cpValid, address?.neighborhood]);

    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
    const paypalEnabled = hasValidDraft && submitted && paymentStatus === "PENDING" && !!pendingPayload;

    const { containerRef: paypalContainerRef, isReady, isProcessing } = usePayPalCheckout({
        enabled: paypalEnabled,
        clientId: paypalClientId,
        currency: "MXN",

        // ✅ Server-side create (secure)
        createOrder: async () => {
            if (!draft?.cartSnapshot || !Array.isArray(draft.cartSnapshot) || draft.cartSnapshot.length === 0) {
                throw new Error("Carrito vacío.");
            }
            if (!pendingPayload?.orderId) {
                throw new Error("No hay folio de pedido.");
            }

            const out = await postJson("/api/paypal/create-order", {
                orderId: pendingPayload.orderId,
                cartSnapshot: draft.cartSnapshot
            });

            if (!out?.paypalOrderId) {
                throw new Error("No se recibió paypalOrderId del servidor.");
            }

            return out.paypalOrderId;
        },

        // ✅ Server-side capture (secure)
        onApprove: async (data) => {
            try {
                setIsPayPalProcessing(true);

                const paypalOrderId = data?.orderID || "";
                if (!paypalOrderId) throw new Error("No se recibió orderID de PayPal.");

                if (!pendingPayload) throw new Error("No hay pedido pendiente para registrar.");
                if (!SHEETS_WEBHOOK_URL) throw new Error("Falta configurar VITE_SHEETS_WEBHOOK_URL.");

                const cap = await postJson("/api/paypal/capture-order", { paypalOrderId });

                const payerEmail =
                    cap?.capture?.payer?.email_address ||
                    cap?.capture?.payer?.email ||
                    "";

                const paidPayload = {
                    ...pendingPayload,
                    status: "PAID",
                    paypal: { id: paypalOrderId, payerEmail }
                };

                const res = await fetch(SHEETS_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(paidPayload)
                });

                const json = await res.json().catch(() => null);
                if (!res.ok || !json?.ok) {
                    throw new Error(json?.error || "No se pudo registrar el pedido en Sheets.");
                }

                setPaymentStatus("PAID");
                updateDraft({
                    paymentStatus: "PAID",
                    status: "COMPLETED",
                    paypal: { orderId: paypalOrderId, payerEmail }
                });

                publishCheckoutEvent({
                    type: "CHECKOUT_COMPLETED",
                    sessionId,
                    payload: { orderId: pendingPayload.orderId }
                });
            } catch (err) {
                console.error("❌ PayPal approve/capture -> Sheets error:", err);
                alert(err?.message || "Error registrando el pedido pagado.");
                updateDraft({ status: "ERROR" });
            } finally {
                setIsSubmitting(false);
                setIsPayPalProcessing(false);
            }
        },

        onCancel: () => {
            alert("Pago cancelado. No se registró ningún pedido.");
            setIsPayPalProcessing(false);
        },

        onError: (err) => {
            console.error("❌ PayPal error:", err);
            alert("Hubo un error con PayPal. Intenta de nuevo.");
            setIsPayPalProcessing(false);
        }
    });

    useEffect(() => setIsPayPalReady(isReady), [isReady]);
    useEffect(() => setIsPayPalProcessing(isProcessing), [isProcessing]);

    async function fetchAddressByCP(cp5Local) {
        if (!apiEnabled) {
            setCpError("Falta configurar VITE_COPOMEX_TOKEN.");
            return;
        }

        const myReqId = ++cpReqIdRef.current;

        setCpLoading(true);
        setCpError("");

        try {
            const res = await fetch(
                `https://api.copomex.com/query/info_cp/${cp5Local}?type=simplified&token=${encodeURIComponent(COPOMEX_TOKEN)}`
            );

            const data = await res.json().catch(() => null);

            if (myReqId !== cpReqIdRef.current) return;

            const r = data?.response;
            const estado = r?.estado || "";
            const municipio = r?.municipio || "";
            const ciudad = r?.ciudad || "";
            const asent = Array.isArray(r?.asentamiento) ? r.asentamiento : [];

            if (!estado || !municipio || asent.length === 0) {
                throw new Error("Código postal no válido.");
            }

            setColonias(asent);

            setAddress((prev) => {
                const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                const keepNeighborhood = asent.includes(base.neighborhood) ? base.neighborhood : "";

                const next = {
                    ...base,
                    country: "MX",
                    postalCode: cp5Local,
                    state: estado,
                    municipality: municipio,
                    city: ciudad || base.city || "",
                    neighborhood: keepNeighborhood,
                    validation: { method: "cp", confirmed: Boolean(keepNeighborhood) }
                };

                next.formattedAddress = buildFormattedAddress(next);
                return next;
            });

            updateDraft({
                address: {
                    country: "MX",
                    postalCode: cp5Local,
                    state: estado,
                    municipality: municipio,
                    city: ciudad || ""
                }
            });
        } catch (e) {
            if (myReqId !== cpReqIdRef.current) return;

            setColonias([]);
            setCpError(e?.message || "No se pudo validar el CP.");

            setAddress((prev) => {
                const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                const next = {
                    ...base,
                    country: "MX",
                    postalCode: cp5Local,
                    state: "",
                    municipality: "",
                    city: "",
                    neighborhood: "",
                    validation: { method: "cp", confirmed: false }
                };
                next.formattedAddress = buildFormattedAddress(next);
                return next;
            });

            updateDraft({
                address: {
                    country: "MX",
                    postalCode: cp5Local,
                    state: "",
                    municipality: "",
                    city: "",
                    neighborhood: ""
                }
            });
        } finally {
            if (myReqId === cpReqIdRef.current) setCpLoading(false);
        }
    }

    useEffect(() => {
        if (cp5.length !== 5) {
            cpReqIdRef.current++;

            setColonias([]);
            setCpError("");
            setCpLoading(false);

            setAddress((prev) => {
                const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                const next = {
                    ...base,
                    country: "MX",
                    postalCode: cp5,
                    state: "",
                    municipality: "",
                    city: "",
                    neighborhood: "",
                    validation: { method: "cp", confirmed: false }
                };
                next.formattedAddress = buildFormattedAddress(next);
                return next;
            });

            updateDraft({ address: { postalCode: cp5 } });
            return;
        }

        const t = setTimeout(() => fetchAddressByCP(cp5), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cp5]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!hasValidDraft) return;
        if (isSubmitting || isPayPalProcessing) return;

        if (!contact.trim()) {
            alert("Por favor escribe tu número de contacto o correo.");
            return;
        }

        const a = address || {};
        const formatted = buildFormattedAddress(a);

        if (!a.postalCode || String(a.postalCode).length !== 5) {
            alert("Ingresa un código postal válido (5 dígitos).");
            return;
        }
        if (!cpValid || !a.state || !a.municipality) {
            alert("No se pudo validar Estado/Municipio. Revisa el código postal.");
            return;
        }
        if (!a.neighborhood) {
            alert("Selecciona una colonia.");
            return;
        }
        if (!a.street || a.street.trim().length < 3) {
            alert("Escribe la calle.");
            return;
        }
        if (!a.noNumber && !String(a.streetNumber || "").trim()) {
            alert("Indica el número exterior o marca “Sin número”.");
            return;
        }
        if (!String(formatted || "").trim()) {
            alert("Por favor completa tu dirección de entrega.");
            return;
        }

        const folio = `FV-${Date.now()}`;
        const addressForSheets = buildAddressForSheets(a);

        const addressObjForPayload = {
            ...a,
            formattedAddress: formatted,
            addressForSheets
        };

        const payload = {
            orderId: folio,
            contact: contact.trim(),
            address: addressForSheets,
            addressObj: addressObjForPayload,
            total: Number(total || 0),
            status: "PENDING_PAYMENT",
            items: buildItemsForSheet(draft.cartSnapshot)
        };

        setIsSubmitting(true);
        setOrderId(folio);
        setPendingPayload(payload);
        setPaymentStatus("PENDING");
        setSubmitted(true);

        updateDraft({
            contact: contact.trim(),
            address: addressObjForPayload,
            orderId: folio,
            pendingPayload: payload,
            paymentStatus: "PENDING",
            status: "SUBMITTED"
        });

        setIsSubmitting(false);
    };

    if (!hasValidDraft) {
        return (
            <div className="checkout-page">
                <div className="checkout-card">
                    <div className="checkout-header">
                        <h2 className="checkout-title">Checkout</h2>
                    </div>

                    <p className="checkout-meta">
                        {error || "No hay checkout activo."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-card">
                <div className="checkout-header">
                    <h2 className="checkout-title">Checkout</h2>
                </div>

                <p className="checkout-meta">
                    Total: <strong>{money(total)}</strong>
                </p>

                {!submitted ? (
                    <>
                        <p className="checkout-lead">
                            Completa tus datos y confirma tu pedido.
                        </p>

                        <form className="checkout-form" onSubmit={handleSubmit}>
                            <div className="checkout-field">
                                <label className="checkout-label" htmlFor="checkout-contact">
                                    Celular o correo electrónico:
                                </label>
                                <input
                                    id="checkout-contact"
                                    className="checkout-input"
                                    type="text"
                                    value={contact}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setContact(v);
                                        updateDraft({ contact: v });
                                    }}
                                    placeholder="Ej. +52 998... o usuario@gmail.com"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="checkout-field">
                                <label className="checkout-label" htmlFor="checkout-cp">
                                    Código Postal (México):
                                </label>
                                <input
                                    id="checkout-cp"
                                    className="checkout-input"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={5}
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(onlyDigits(e.target.value).slice(0, 5))}
                                    placeholder="Ej. 77500"
                                    disabled={isSubmitting}
                                />

                                {!apiEnabled ? (
                                    <p className="checkout-muted">Falta configurar VITE_COPOMEX_TOKEN.</p>
                                ) : null}

                                {cpLoading ? <p className="checkout-muted">Buscando colonias…</p> : null}
                                {cpError ? <p className="checkout-error">{cpError}</p> : null}

                                {!cpError && !cpLoading && cp5.length < 5 ? (
                                    <p className="checkout-muted">Ingresa 5 dígitos para cargar colonias.</p>
                                ) : null}
                            </div>

                            <div className="checkout-row">
                                <div className="checkout-field">
                                    <label className="checkout-label">Estado</label>
                                    <input className="checkout-input" value={address?.state || ""} disabled />
                                </div>

                                <div className="checkout-field">
                                    <label className="checkout-label">Municipio</label>
                                    <input className="checkout-input" value={address?.municipality || ""} disabled />
                                </div>
                            </div>

                            <div className="checkout-field">
                                <label className="checkout-label">Colonia</label>
                                <select
                                    className="checkout-input"
                                    value={address?.neighborhood || ""}
                                    onChange={(e) => {
                                        const v = e.target.value;

                                        setAddress((prev) => {
                                            const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                                            const next = {
                                                ...base,
                                                neighborhood: v,
                                                validation: { method: "cp", confirmed: Boolean(v) }
                                            };
                                            next.formattedAddress = buildFormattedAddress(next);
                                            return next;
                                        });

                                        updateDraft({
                                            address: {
                                                neighborhood: v,
                                                validation: { method: "cp", confirmed: Boolean(v) }
                                            }
                                        });
                                    }}
                                    disabled={isSubmitting || !cpValid}
                                >
                                    <option value="">
                                        {!cpValid ? "Primero valida tu CP" : "Selecciona colonia"}
                                    </option>
                                    {colonias.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>

                                {!coloniaSelected && cpValid ? (
                                    <p className="checkout-muted">Selecciona una colonia para continuar.</p>
                                ) : null}
                            </div>

                            <div className="checkout-row">
                                <div className="checkout-field">
                                    <label className="checkout-label">Calle</label>
                                    <input
                                        className="checkout-input"
                                        value={address?.street || ""}
                                        onChange={(e) => {
                                            const v = e.target.value;

                                            setAddress((prev) => {
                                                const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                                                const next = { ...base, street: v };
                                                next.formattedAddress = buildFormattedAddress(next);
                                                return next;
                                            });

                                            updateDraft({ address: { street: v } });
                                        }}
                                        placeholder="Ej. Av. Tulum"
                                        disabled={isSubmitting || !coloniaSelected}
                                    />
                                </div>

                                <div className="checkout-field">
                                    <label className="checkout-label">Número exterior</label>
                                    <input
                                        className="checkout-input"
                                        value={address?.streetNumber || ""}
                                        onChange={(e) => {
                                            const v = e.target.value;

                                            setAddress((prev) => {
                                                const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                                                const next = { ...base, streetNumber: v };
                                                next.formattedAddress = buildFormattedAddress(next);
                                                return next;
                                            });

                                            updateDraft({ address: { streetNumber: v } });
                                        }}
                                        placeholder={address?.noNumber ? "S/N" : "Ej. 123"}
                                        disabled={isSubmitting || !coloniaSelected || Boolean(address?.noNumber)}
                                    />

                                    <label className="checkout-inline-check">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(address?.noNumber)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;

                                                setAddress((prev) => {
                                                    const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                                                    const next = {
                                                        ...base,
                                                        noNumber: checked,
                                                        streetNumber: checked ? "" : (base.streetNumber || "")
                                                    };
                                                    next.formattedAddress = buildFormattedAddress(next);
                                                    return next;
                                                });

                                                updateDraft({
                                                    address: {
                                                        noNumber: checked,
                                                        streetNumber: checked ? "" : (address?.streetNumber || "")
                                                    }
                                                });
                                            }}
                                            disabled={isSubmitting || !coloniaSelected}
                                        />
                                        Sin número
                                    </label>
                                </div>
                            </div>

                            <div className="checkout-row">
                                <div className="checkout-field">
                                    <label className="checkout-label">Interior</label>
                                    <input
                                        className="checkout-input"
                                        value={address?.interiorNumber || ""}
                                        onChange={(e) => {
                                            const v = e.target.value;

                                            setAddress((prev) => {
                                                const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                                                const next = { ...base, interiorNumber: v };
                                                next.formattedAddress = buildFormattedAddress(next);
                                                return next;
                                            });

                                            updateDraft({ address: { interiorNumber: v } });
                                        }}
                                        placeholder={address?.noInterior ? "S/N" : "Ej. 2B"}
                                        disabled={isSubmitting || !coloniaSelected || Boolean(address?.noInterior)}
                                    />

                                    <label className="checkout-inline-check">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(address?.noInterior)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;

                                                setAddress((prev) => {
                                                    const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                                                    const next = {
                                                        ...base,
                                                        noInterior: checked,
                                                        interiorNumber: checked ? "" : (base.interiorNumber || "")
                                                    };
                                                    next.formattedAddress = buildFormattedAddress(next);
                                                    return next;
                                                });

                                                updateDraft({
                                                    address: {
                                                        noInterior: checked,
                                                        interiorNumber: checked ? "" : (address?.interiorNumber || "")
                                                    }
                                                });
                                            }}
                                            disabled={isSubmitting || !coloniaSelected}
                                        />
                                        Sin interior
                                    </label>
                                </div>

                                <div className="checkout-field">
                                    <label className="checkout-label">Referencias (opcional)</label>
                                    <input
                                        className="checkout-input"
                                        value={address?.references || ""}
                                        onChange={(e) => {
                                            const v = e.target.value;

                                            setAddress((prev) => {
                                                const base = prev && typeof prev === "object" ? prev : createEmptyAddress();
                                                const next = { ...base, references: v };
                                                next.formattedAddress = buildFormattedAddress(next);
                                                return next;
                                            });

                                            updateDraft({ address: { references: v } });
                                        }}
                                        placeholder="Ej. Casa blanca, portón negro…"
                                        disabled={isSubmitting || !coloniaSelected}
                                    />
                                </div>
                            </div>

                            <div className="checkout-field">
                                <p className="checkout-muted">
                                    <strong>Dirección:</strong>{" "}
                                    {address?.formattedAddress ? address.formattedAddress : "—"}
                                </p>
                            </div>

                            <div className="checkout-actions">
                                <button className="checkout-primary-btn" type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Procesando..." : "Comprar"}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="checkout-status">
                        <p><strong>Pedido registrado ✅</strong></p>

                        {orderId ? (
                            <p className="checkout-muted">
                                Folio: <strong>{orderId}</strong>
                            </p>
                        ) : null}

                        {paymentStatus === "PAID" ? (
                            <>
                                <p className="checkout-muted">
                                    Pago confirmado ✅ ¡Gracias por tu compra!
                                </p>
                                <p className="checkout-muted">
                                    Ya puedes cerrar esta pestaña.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="checkout-muted">
                                    Paga con PayPal para confirmar tu pedido.
                                </p>

                                {!isPayPalReady ? (
                                    <p className="checkout-muted">
                                        Cargando PayPal...
                                    </p>
                                ) : null}

                                {isPayPalProcessing ? (
                                    <p className="checkout-muted">
                                        Procesando...
                                    </p>
                                ) : null}

                                <div className="checkout-paypal">
                                    <div ref={paypalContainerRef} />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
