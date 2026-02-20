"use client";

import { useState, useMemo, useEffect } from "react";
import { useUserActions } from "@/hooks/useUserActions";
import { ArrowLeft, TrendingUp, Info, AlertCircle, Calendar, DollarSign, ArrowUpRight, SortAsc, SortDesc } from "lucide-react";
import Link from "next/link";

interface DividendResult {
    symbol: string;
    name: string;
    currentPrice: number;
    totalDividends: number;
    avgAnnualDividend: number;
    avgMonthlyDividend: number;
    annualYield: number;
    monthlyYield: number;
    yearsAnalyzed: number;
    isLoading: boolean;
    error: string | null;
}

export default function DividendMapPage() {
    const { favorites } = useUserActions();
    const [yieldType, setYieldType] = useState<"annual" | "monthly">("annual");
    const [results, setResults] = useState<Record<string, DividendResult>>({});
    const [sortBy, setSortBy] = useState<keyof DividendResult>("annualYield");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        if (!favorites || favorites.length === 0) return;

        favorites.forEach(async (fav) => {
            if (results[fav.symbol]) return;

            setResults(prev => ({
                ...prev,
                [fav.symbol]: {
                    symbol: fav.symbol,
                    name: fav.name,
                    currentPrice: 0,
                    totalDividends: 0,
                    avgAnnualDividend: 0,
                    avgMonthlyDividend: 0,
                    annualYield: 0,
                    monthlyYield: 0,
                    yearsAnalyzed: 0,
                    isLoading: true,
                    error: null
                }
            }));

            try {
                const [priceRes, historyRes] = await Promise.all([
                    fetch(`/api/stock/${fav.symbol}`),
                    fetch(`/api/stock/${fav.symbol}/historical?period=max`)
                ]);

                if (!priceRes.ok || !historyRes.ok) throw new Error("Erro ao buscar dados");

                const priceData = await priceRes.json();
                const historyData = await historyRes.json();

                const currentPrice = priceData.price;
                const now = new Date();
                const twoYearsAgo = new Date();
                twoYearsAgo.setFullYear(now.getFullYear() - 2);

                const recentHistory = historyData.filter((h: any) => new Date(h.date) >= twoYearsAgo);

                // Calculate time span in years
                const firstDate = new Date(recentHistory[0].date);
                const lastDate = new Date(recentHistory[recentHistory.length - 1].date);
                const yearsDiff = Math.max(0.1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

                const totalDividends = recentHistory.reduce((acc: number, h: any) => acc + (h.dividend || 0), 0);
                const avgAnnualDividend = totalDividends / yearsDiff;
                const avgMonthlyDividend = avgAnnualDividend / 12;

                const annualYield = (avgAnnualDividend / currentPrice) * 100;
                const monthlyYield = (avgMonthlyDividend / currentPrice) * 100;

                setResults(prev => ({
                    ...prev,
                    [fav.symbol]: {
                        ...prev[fav.symbol],
                        currentPrice,
                        totalDividends,
                        avgAnnualDividend,
                        avgMonthlyDividend,
                        annualYield,
                        monthlyYield,
                        yearsAnalyzed: yearsDiff,
                        isLoading: false
                    }
                }));
            } catch (err: any) {
                setResults(prev => ({
                    ...prev,
                    [fav.symbol]: {
                        ...prev[fav.symbol],
                        isLoading: false,
                        error: err.message
                    }
                }));
            }
        });
    }, [favorites]);

    const sortedResults = useMemo(() => {
        const list = Object.values(results);
        return list.sort((a, b) => {
            const valA = a[sortBy] as number;
            const valB = b[sortBy] as number;
            return sortOrder === "desc" ? valB - valA : valA - valB;
        });
    }, [results, sortBy, sortOrder]);

    const toggleSort = (key: keyof DividendResult) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        } else {
            setSortBy(key);
            setSortOrder("desc");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/favoritos" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2 leading-none">
                                <TrendingUp className="text-emerald-500" size={24} />
                                Mapa de Yield (Médio 2 Anos)
                            </h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                Análise baseada no histórico de proventos pagos
                            </p>
                        </div>

                        <div className="ml-auto flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                            <button
                                onClick={() => setYieldType("annual")}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${yieldType === "annual" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                            >
                                Anual
                            </button>
                            <button
                                onClick={() => setYieldType("monthly")}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${yieldType === "monthly" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                            >
                                Mensal
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {!favorites || favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                            <AlertCircle />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Nenhum favorito ainda</h3>
                        <p className="text-zinc-500 text-sm mt-2">Adicione ações aos favoritos para compará-las aqui.</p>
                        <Link href="/" className="inline-block mt-6 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors">
                            Explorar Ações
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                        <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ativo</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Preço</th>
                                        <th
                                            className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors"
                                            onClick={() => toggleSort(yieldType === "annual" ? "annualYield" : "monthlyYield")}
                                        >
                                            <div className="flex items-center gap-1">
                                                Yield Médio (%)
                                                {sortBy.includes("Yield") && (sortOrder === "desc" ? <SortDesc size={12} /> : <SortAsc size={12} />)}
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Div. Médio (R$)</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {sortedResults.map((res) => (
                                        <tr key={res.symbol} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center font-black text-zinc-900 dark:text-white text-xs">
                                                        {res.symbol.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm dark:text-white leading-none">{res.symbol}</p>
                                                        <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-tight truncate max-w-[120px]">{res.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {res.isLoading ? (
                                                    <div className="w-16 h-4 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                                                ) : (
                                                    <p className="font-bold text-sm text-zinc-600 dark:text-zinc-300">R$ {res.currentPrice.toFixed(2)}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                {res.isLoading ? (
                                                    <div className="w-20 h-6 bg-emerald-100 dark:bg-emerald-900/30 animate-pulse rounded-lg" />
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-black ${yieldType === 'annual' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                                                            {(yieldType === "annual" ? res.annualYield : res.monthlyYield).toFixed(2)}% {yieldType === 'annual' ? 'a.a' : 'a.m'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                {res.isLoading ? (
                                                    <div className="w-24 h-4 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                                                ) : (
                                                    <div>
                                                        <p className="font-black text-sm text-zinc-900 dark:text-white leading-none">
                                                            R$ {(yieldType === "annual" ? res.avgAnnualDividend : res.avgMonthlyDividend).toFixed(2)}
                                                        </p>
                                                        <p className="text-[9px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">
                                                            Total: R$ {res.totalDividends.toFixed(2)} ({res.yearsAnalyzed.toFixed(1)} anos)
                                                        </p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link
                                                    href={`/?symbol=${res.symbol}`}
                                                    className="p-2 hover:bg-emerald-500 hover:text-white rounded-lg transition-all inline-block text-zinc-400"
                                                >
                                                    <ArrowUpRight size={18} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-8 p-6 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 flex gap-4">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl text-emerald-500 shrink-0 shadow-sm border border-zinc-100 dark:border-zinc-700">
                        <Info size={20} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Como o Yield é calculado?</h4>
                        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl">
                            O Yield Médio de 2 Anos é calculado somando todos os dividendos e JCP pagos nos últimos 24 meses, dividindo pelo tempo de vida do ticker (caso tenha menos que 2 anos) para obter uma média anual. Este valor é então dividido pelo preço atual do ativo. Isto oferece uma visão mais realista que o Yield atual, pois suaviza picos atípicos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
