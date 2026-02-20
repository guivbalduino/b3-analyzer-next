"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import PortfolioSummary from "@/components/PortfolioSummary";
import PortfolioTable from "@/components/PortfolioTable";
import PortfolioNews from "@/components/PortfolioNews";
import PortfolioAIAdvisor from "@/components/PortfolioAIAdvisor";

export default function PortfolioPage() {
    const { portfolio, addToPortfolio, updateQuantity, removeFromPortfolio } = usePortfolio();
    const [searchSymbol, setSearchSymbol] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // State to store current prices fetched from API
    const [enrichedPortfolio, setEnrichedPortfolio] = useState<any[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchPrices = useCallback(async () => {
        if (portfolio.length === 0) {
            setEnrichedPortfolio([]);
            setInitialLoading(false);
            return;
        }

        try {
            const results = await Promise.all(
                portfolio.map(async (item) => {
                    const res = await fetch(`/api/stock/${item.symbol}`);
                    if (res.ok) {
                        const data = await res.json();
                        return {
                            ...item,
                            price: data.price,
                            change: data.change,
                            changePercent: data.changePercent,
                            sector: data.sector || item.sector,
                            name: data.name || item.name,
                            type: data.type || item.type
                        };
                    }
                    return { ...item, price: 0, change: 0, changePercent: 0 };
                })
            );
            setEnrichedPortfolio(results);
        } catch (err) {
            console.error("Error enrichment:", err);
        } finally {
            setInitialLoading(false);
        }
    }, [portfolio]);

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchSymbol) return;

        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/stock/${searchSymbol}`);
            if (!res.ok) throw new Error("Ativo não encontrado");

            const data = await res.json();
            await addToPortfolio({
                symbol: data.symbol,
                name: data.name,
                quantity: quantity,
                sector: data.sector,
                industry: data.industry,
                type: data.type
            });

            setSearchSymbol("");
            setQuantity(1);
        } catch (err: any) {
            setError(err.message || "Erro ao adicionar ativo");
        } finally {
            setLoading(false);
        }
    };

    const symbols = useMemo(() => portfolio.map(p => p.symbol), [portfolio]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black flex items-center gap-2">
                                <Wallet className="text-emerald-500" size={24} />
                                Minha Carteira
                            </h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Controle seus ativos reais</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/carteira/import"
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Importar TXT</span>
                        </Link>
                        <button
                            onClick={() => {
                                const content = portfolio?.map(p => `${p.symbol};${p.quantity}`).join("\n");
                                const blob = new Blob([content || ""], { type: "text/plain" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "minha_carteira.txt";
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            disabled={!portfolio || portfolio.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            <ArrowLeft size={14} className="rotate-[270deg]" />
                            <span className="hidden sm:inline">Exportar TXT</span>
                        </button>
                    </div>

                    <form onSubmit={handleAdd} className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ticker (Ex: PETR4)"
                                className="w-40 h-10 pl-10 pr-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 focus:outline-none transition-all font-bold text-xs uppercase"
                                value={searchSymbol}
                                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        </div>
                        <input
                            type="number"
                            placeholder="Qtd"
                            className="w-20 h-10 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 focus:outline-none transition-all font-bold text-xs"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                        <button
                            type="submit"
                            disabled={loading || !searchSymbol}
                            className="h-10 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                            Adicionar
                        </button>
                    </form>
                </div>
            </header>

            <main className="max-w-full mx-auto px-6 py-10">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3 text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {initialLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                        <Loader2 className="animate-spin" size={40} />
                        <p className="font-bold animate-pulse">Consultando cotações em tempo real...</p>
                    </div>
                ) : portfolio.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                            <Wallet size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Sua carteira está vazia</h2>
                        <p className="text-zinc-500 font-medium mt-2 max-w-sm mx-auto">
                            Comece adicionando os tickers e quantidades dos ativos que você possui na barra superior.
                        </p>
                    </div>
                ) : (
                    <>
                        <PortfolioSummary data={enrichedPortfolio} />

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2">
                                <PortfolioTable
                                    data={enrichedPortfolio}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeFromPortfolio}
                                />

                                <PortfolioAIAdvisor portfolio={enrichedPortfolio} />
                            </div>

                            <div className="xl:col-span-1">
                                <PortfolioNews symbols={symbols} />
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
