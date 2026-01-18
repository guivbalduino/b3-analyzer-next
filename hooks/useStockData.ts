"use client";

import { useState, useEffect } from "react";

export function useStockHistory(symbol: string) {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol) return;

        async function fetchHistory() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/stock/${symbol}/historical?period=max`);
                if (!res.ok) throw new Error("Falha ao carregar histórico");
                const data = await res.json();
                setHistory(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchHistory();
    }, [symbol]);

    return { history, isLoading, error };
}
