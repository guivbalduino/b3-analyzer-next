"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, TrendingUp, ArrowLeft, Brain, Sparkles } from "lucide-react";
import CDIComparisonCard from "@/components/CDIComparisonCard";

function ComparisonContent() {
    const searchParams = useSearchParams();
    const [symbol, setSymbol] = useState(searchParams.get("symbol")?.toUpperCase() || "");
    const [data, setData] = useState<any>(null);
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e?: React.FormEvent, tickerOverride?: string) => {
        if (e) e.preventDefault();
        const ticker = tickerOverride || symbol;
        if (!ticker) return;

        setLoading(true);
        setError("");
        setData(null);

        try {
            const [res, histRes] = await Promise.all([
                fetch(`/api/stock/${ticker}`),
                fetch(`/api/stock/${ticker}/historical?period=1Y`)
            ]);

            if (!res.ok) throw new Error("Ativo não encontrado");

            const [stockData, hData] = await Promise.all([res.json(), histRes.json()]);
            setData(stockData);
            setHistoricalData(hData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchParams.get("symbol")) {
            handleSearch(undefined, searchParams.get("symbol") || "");
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-4 md:p-10">
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <Link href="/" className="p-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 hover:scale-105 transition-all shadow-sm">
                        <ArrowLeft size={24} className="text-zinc-500" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            Análise <span className="text-indigo-500">Comparativa CDI</span>
                            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase rounded-full border border-indigo-500/20 flex items-center gap-1">
                                <Sparkles size={10} /> ML Powered
                            </div>
                        </h1>
                        <p className="text-zinc-500 font-bold">Compare rendimento histórico e projetado com benchmarks de taxa fixa</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Buscar ticker (ex: ITUB4)"
                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none transition-all font-bold text-lg shadow-sm"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={24} />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                    >
                        {loading ? "..." : "Simular"}
                    </button>
                </form>
            </header>

            <main className="max-w-7xl mx-auto">
                {error && (
                    <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-[2.5rem] text-red-600 dark:text-red-400 font-black text-center mb-8">
                        {error}. Tente outro ticker (ex: PETR4, VALE3, BTC-USD).
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-black text-zinc-400 uppercase tracking-widest animate-pulse">Processando Modelos de Machine Learning...</p>
                    </div>
                ) : data && historicalData.length > 0 ? (
                    <CDIComparisonCard
                        symbol={data.symbol}
                        historicalStockData={historicalData}
                        currentPrice={data.price}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12">
                        <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-6 items-center text-center">
                            <div className="p-6 bg-emerald-500/10 rounded-3xl">
                                <TrendingUp className="text-emerald-500" size={48} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black mb-2">Por que comparar com CDI?</h3>
                                <p className="text-zinc-500 font-medium leading-relaxed">O CDI é o benchmark principal da renda fixa brasileira. Descubra se seus ativos de risco estão realmente entregando o prêmio necessário.</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-6 items-center text-center">
                            <div className="p-6 bg-indigo-500/10 rounded-3xl">
                                <Brain className="text-indigo-500" size={48} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black mb-2">Previsão com IA</h3>
                                <p className="text-zinc-500 font-medium leading-relaxed">Utilizamos 4 modelos estatísticos de alta precisão para traçar tendências de 1 ano e comparar com a taxa Selic esperada.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function CDIComparisonPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ComparisonContent />
        </Suspense>
    );
}
