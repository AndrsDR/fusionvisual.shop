// src/hooks/useCheckoutDraft.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getActiveCheckoutSessionId,
    loadDraft,
    patchDraft,
    validateDraft,
    calcTotalFromCartSnapshot,
} from "../checkout/checkoutDraft.js";

export function useCheckoutDraft() {
    const [sessionId, setSessionId] = useState(null);
    const [draft, setDraft] = useState(null);
    const [error, setError] = useState("");

    // carga inicial
    useEffect(() => {
        const sid = getActiveCheckoutSessionId();
        setSessionId(sid);

        if (!sid) {
            setDraft(null);
            setError("No hay checkout activo.");
            return;
        }

        const d = loadDraft(sid);
        const v = validateDraft(d);
        if (!v.ok) {
            setDraft(null);
            setError(v.reason || "Draft inválido.");
            return;
        }

        setDraft(d);
        setError("");
    }, []);

    // total derivado (no confiamos en draft.total)
    const total = useMemo(() => {
        return calcTotalFromCartSnapshot(draft?.cartSnapshot || []);
    }, [draft]);

    const updateDraft = useCallback((partial) => {
        if (!sessionId) return null;
        const next = patchDraft(sessionId, partial);
        if (next) setDraft(next);
        return next;
    }, [sessionId]);

    return {
        sessionId,
        draft,
        total,
        error,
        updateDraft,
        hasValidDraft: !!draft && !error,
    };
}
