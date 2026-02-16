"use client";

import { useState, useMemo, useEffect } from "react";
import { useUserActions } from "@/hooks/useUserActions";
import { useStockHistory } from "@/hooks/useStockData";
import { calculateBacktestLogic, calculateCAGR, calculateProjectionValue, calculateProjectionTime, calculateProjectionIncome, calculateProjectionTimeForIncome } from "@/lib/simulation";
import BatchAnalysis from "@/components/BatchAnalysis";
import { ArrowLeft, Calculator, TrendingUp, Trophy, AlertCircle, Clock, Target, ArrowUpRight, Info, Star, ChevronUp, X, Sparkles, Download, Upload } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function InfoTooltip({ title, content }: { title: string, content: string }) {
    return (
        <div className="relative group">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-help hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-800">
                <Info size={12} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{title}</span>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-4 bg-zinc-900 text-white text-[11px] font-medium rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl pointer-events-none leading-relaxed border border-zinc-800">
                <p className="font-black text-emerald-400 mb-1 uppercase tracking-widest border-b border-zinc-800 pb-1">{title}</p>
                {content}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
            </div>
        </div>
    );
}

export default function FavoritesPage() {
    const { favorites } = useUserActions();

    // Global Simulation State
    const [simType, setSimType] = useState<"backtest" | "projection">("backtest");

    // Backtest Params
    const [amount, setAmount] = useState(1000);
    const [period, setPeriod] = useState("1Y");

    // Projection Params
    const [projMode, setProjMode] = useState<"value" | "goal" | "income_value" | "income_goal">("value");
    const [monthlyContribution, setMonthlyContribution] = useState(500);
    const [months, setMonths] = useState(12); // For "value" modes
    const [targetAmount, setTargetAmount] = useState(100000); // For "goal" modes

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32">
            {/* Header / Global Controls */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2 leading-none">
                                <Trophy className="text-yellow-500" size={24} />
                                Minha Carteira & Simulador
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <Link
                                href="/favoritos/import"
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors border border-zinc-200 dark:border-zinc-700"
                            >
                                <Upload size={14} />
                                <span className="hidden sm:inline">Importar TXT</span>
                            </Link>
                            <button
                                onClick={() => {
                                    const content = favorites?.map(f => f.symbol).join("\n");
                                    const blob = new Blob([content || ""], { type: "text/plain" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "favoritos_b3.txt";
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                disabled={!favorites || favorites.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                <Download size={14} />
                                <span className="hidden sm:inline">Exportar TXT</span>
                            </button>
                        </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-1">
                        {/* Type Switcher */}
                        <div className="flex p-1 bg-zinc-200 dark:bg-zinc-900 rounded-xl md:w-80">
                            <button
                                onClick={() => setSimType("backtest")}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${simType === "backtest" ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                            >
                                Passado
                            </button>
                            <button
                                onClick={() => setSimType("projection")}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${simType === "projection" ? "bg-white dark:bg-zinc-800 shadow-sm text-emerald-500" : "text-zinc-500"}`}
                            >
                                Futuro
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                <InfoTooltip
                                    title="CAGR"
                                    content="Compound Annual Growth Rate ou Taxa de Crescimento Anual Composta. Representa a rentabilidade média anual do ativo no período selecionado."
                                />
                                <InfoTooltip
                                    title="ROI"
                                    content="Return on Investment ou Retorno sobre Investimento. Mostra a valorização total do capital investido, incluindo a valorização das cotas e todos os dividendos recebidos e reinvestidos."
                                />
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 p-2">
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Inicial (R$)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="w-full bg-transparent border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 px-2 py-1 font-bold outline-none transition-colors"
                                />
                            </div>

                            {simType === "backtest" ? (
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Período</label>
                                    <div className="flex gap-2 mt-1">
                                        {["1M", "6M", "1Y", "5Y"].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPeriod(p)}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${period === p ? "bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Aporte Mensal</label>
                                        <input
                                            type="number"
                                            value={monthlyContribution}
                                            onChange={e => setMonthlyContribution(Number(e.target.value))}
                                            className="w-full bg-transparent border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 px-2 py-1 font-bold outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-end gap-2">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <div className="flex bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg mb-1">
                                                <button
                                                    onClick={() => setProjMode(prev => prev.includes('income') ? 'income_value' : 'value')}
                                                    className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${!projMode.includes('goal') ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                                                >
                                                    Valor Final
                                                </button>
                                                <button
                                                    onClick={() => setProjMode(prev => prev.includes('income') ? 'income_goal' : 'goal')}
                                                    className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${projMode.includes('goal') ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                                                >
                                                    Quanto Tempo
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setProjMode(prev => {
                                                        if (prev === "value") return "income_value";
                                                        if (prev === "income_value") return "value";
                                                        if (prev === "goal") return "income_goal";
                                                        if (prev === "income_goal") return "goal";
                                                        return "value";
                                                    });
                                                }}
                                                className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                {projMode.includes("income") ? "Foco: Renda Mensal" : "Foco: Patrimônio"}
                                            </button>
                                        </div>

                                        {projMode.includes("value") ? (
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Meses</label>
                                                <input
                                                    type="number"
                                                    value={months}
                                                    onChange={e => setMonths(Number(e.target.value))}
                                                    className="w-full bg-transparent border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 px-2 py-1 font-bold outline-none transition-colors"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                                    {projMode === "income_goal" ? "Renda Alvo (R$/mês)" : "Meta (R$)"}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={targetAmount}
                                                    onChange={e => setTargetAmount(Number(e.target.value))}
                                                    className="w-full bg-transparent border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 px-2 py-1 font-bold outline-none transition-colors"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout - Two Columns */}
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Column: Individual Asset Simulations */}
                    <div className="flex-1 w-full order-2 lg:order-1">
                        {!favorites || favorites.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                                    <AlertCircle />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Nenhum favorito ainda</h3>
                                <p className="text-zinc-500 text-sm mt-2">Adicione ações aos favoritos na tela inicial para comparar aqui.</p>
                                <Link href="/" className="inline-block mt-6 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors">
                                    Explorar Ações
                                </Link>
                            </div>
                        ) : (
                            <FavoritesGrid
                                favorites={favorites}
                                simType={simType}
                                amount={amount}
                                period={period}
                                projMode={projMode}
                                monthlyContribution={monthlyContribution}
                                months={months}
                                targetAmount={targetAmount}
                            />
                        )}
                    </div>

                    {/* Right Column: AI Batch Analysis Sidebar */}
                    {favorites && favorites.length > 0 && (
                        <div className="w-full lg:w-[480px] shrink-0 order-1 lg:order-2 sticky top-[120px]">
                            <BatchAnalysis favorites={favorites} />

                            <div className="mt-6 p-6 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1 flex items-center gap-2">
                                    <Info size={12} />
                                    Dica do Especialista
                                </h4>
                                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium">
                                    O Estrategista IA analisa os fundamentos e sentimentos de cada ativo sequencialmente.
                                    Aguarde o processamento completo para gerar o <strong>Ranking Tático</strong> da carteira.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FavoritesGrid({ favorites, simType, amount, period, projMode, monthlyContribution, months, targetAmount }: any) {
    // We need to fetch data for all favorites to sort them. 
    // This component will manage the list and sorting.

    // For simplicity and performance, we'll let each card fetch its own data, 
    // BUT to find the "winner", we actually need the data up here.
    // A better approach for "bulk" is difficult without passing data up.
    // Let's create a wrapper that fetches data for a single item and passes result up? 
    // Or just render them and let users visually scan. 
    // The user explicitly asked for "coloca um emoji de trofeu ou uma borda no melhor".
    // This implies we need to know all results.

    // Limitation: We can't easily wait for X separate useQuery hooks to resolve and then sort.
    // Solution: We will render the list. We will use a context or callback to collect results?
    // Complex.
    // Simpler Alternative: Render the cards. Each card determines its own result.
    // The "Winner" logic is hard to do perfectly client-side with separate hooks without a parent orchestrator.
    // However, given the scope, maybe we can just highlight valid good results?
    // OR: We fetch ALL data in this component? That might be heavy if many favorites.
    // Let's try rendering cards and maybe skipping the "global winner" for a second, 
    // OR implementing a "Client Side Sort" where cards report their value to parent.

    // Let's try the "Report Back" pattern.

    const [results, setResults] = useState<Record<string, number>>({});
    const [multiPeriodPerformances, setMultiPeriodPerformances] = useState<Record<string, any>>({});
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleResult = (symbol: string, value: number, multi: any) => {
        // Only update if changed to avoid infinite loops
        setResults(prev => {
            if (prev[symbol] === value) return prev;
            return { ...prev, [symbol]: value };
        });

        if (multi) {
            setMultiPeriodPerformances(prev => {
                const current = prev[symbol];
                if (current && current.m1 === multi.m1 && current.m6 === multi.m6 && current.y1 === multi.y1) return prev;
                return { ...prev, [symbol]: multi };
            });
        }
    };

    // Determine winner
    const winnerSymbol = useMemo(() => {
        let maxVal = -Infinity;
        let winner: string | null = null;
        Object.entries(results).forEach(([sym, val]) => {
            const isTimeMode = simType === "projection" && (projMode === "goal" || projMode === "income_goal");
            if (isTimeMode) {
                if (val > 0 && (winner === null || val < maxVal)) {
                    maxVal = val;
                    winner = sym;
                }
            } else {
                if (val > maxVal) {
                    maxVal = val;
                    winner = sym;
                }
            }
        });
        return winner;
    }, [results, simType, projMode]);

    const sortedFavorites = useMemo(() => {
        return [...favorites].sort((a, b) => {
            const valA = results[a.symbol] || 0;
            const valB = results[b.symbol] || 0;

            const isTimeMode = simType === "projection" && (projMode === "goal" || projMode === "income_goal");
            if (isTimeMode) {
                if (valA === 0) return 1;
                if (valB === 0) return -1;
                return valA - valB;
            } else {
                return valB - valA;
            }
        });
    }, [favorites, results, simType, projMode]);

    // Consolidated Ranking Logic
    const consolidatedRanking = useMemo(() => {
        const symbols = Object.keys(multiPeriodPerformances);
        if (symbols.length === 0) return [];

        const pointsTable = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        const scores: Record<string, number> = {};
        symbols.forEach(s => scores[s] = 0);

        // Calculate for each period
        ["m1", "m6", "y1"].forEach(periodKey => {
            const periodSorted = [...symbols].sort((a, b) =>
                (multiPeriodPerformances[b][periodKey] || 0) - (multiPeriodPerformances[a][periodKey] || 0)
            );

            periodSorted.slice(0, 12).forEach((sym, idx) => {
                scores[sym] += pointsTable[idx] || 0;
            });
        });

        return Object.entries(scores)
            .map(([symbol, score]) => ({
                symbol,
                score,
                name: favorites.find((f: any) => f.symbol === symbol)?.name || "",
                m1: multiPeriodPerformances[symbol].m1,
                m6: multiPeriodPerformances[symbol].m6,
                y1: multiPeriodPerformances[symbol].y1
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);
    }, [multiPeriodPerformances, favorites]);

    return (
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedFavorites.map((fav: any, index: number) => (
                    <FavoriteCard
                        key={fav.symbol}
                        symbol={fav.symbol}
                        name={fav.name}
                        simType={simType}
                        amount={amount}
                        period={period}
                        projMode={projMode}
                        monthlyContribution={monthlyContribution}
                        months={months}
                        targetAmount={targetAmount}
                        onResult={handleResult}
                        isWinner={winnerSymbol === fav.symbol}
                        rank={index + 1}
                    />
                ))}
            </div>

            {/* Floating button for consolidated ranking */}
            <button
                onClick={() => setIsDrawerOpen(true)}
                className="fixed bottom-8 right-8 z-50 p-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-3 font-black group"
            >
                <div className="bg-emerald-500 p-1.5 rounded-full text-white group-hover:rotate-12 transition-transform">
                    <Star size={18} fill="currentColor" />
                </div>
                <span className="pr-2 uppercase text-[10px] tracking-[0.2em]">Ranking Consolidado</span>
            </button>

            {/* Consolidated Ranking Drawer (Gaveta) */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-t-[2.5rem] p-8 shadow-2xl border-t border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto translate-y-0 transition-transform duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight dark:text-white leading-none">Hall da Fama Consolidado</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Pontuação baseada em 1M, 6M e 1Y</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
                            >
                                <X size={24} />
                                <span className="sr-only">Fechar</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {consolidatedRanking.map((item, idx) => (
                                <div
                                    key={item.symbol}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${idx === 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? "bg-yellow-400 text-yellow-900" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm dark:text-white leading-none">{item.symbol}</p>
                                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5 truncate max-w-[150px]">{item.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Média ROI</p>
                                            <p className="text-[10px] font-black text-emerald-500">
                                                {((item.m1 + item.m6 + item.y1) / 3).toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-center min-w-[70px]">
                                            <p className="text-[9px] font-bold opacity-60 uppercase leading-none mb-0.5">Pontos</p>
                                            <p className="text-lg font-black leading-none">{item.score}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {consolidatedRanking.length === 0 && (
                                <div className="text-center py-10 text-zinc-500 text-sm italic">
                                    Aguardando carregamento dos dados...
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase text-center tracking-widest">
                                Critério: 1º: 15pts | 2º: 12pts | 3º: 10pts | 4º+: 9, 8, 7...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FavoriteCard({ symbol, name, simType, amount, period, projMode, monthlyContribution, months, targetAmount, onResult, isWinner, rank }: any) {
    const { history, isLoading } = useStockHistory(symbol);
    // Calculate current price immediately when history loads
    const currentPrice = useMemo(() => {
        if (!history || history.length === 0) return 0;
        const sorted = [...history].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return sorted[sorted.length - 1].close;
    }, [history]);

    // Re-calculate results for display and sub-metrics
    const simResult = useMemo(() => {
        if (!history || history.length === 0 || currentPrice === 0) return null;
        if (simType === "backtest") {
            return calculateBacktestLogic(history, currentPrice, amount, period);
        }
        return null;
    }, [history, currentPrice, amount, period, simType]);

    // Report result to parent
    useEffect(() => {
        if (!history || history.length === 0) return;

        let resValue = 0;
        const multiResults = {
            m1: 0,
            m6: 0,
            y1: 0
        };

        // ROI calculation for ranking
        const r1 = calculateBacktestLogic(history, currentPrice, amount, "1M");
        const r6 = calculateBacktestLogic(history, currentPrice, amount, "6M");
        const r1y = calculateBacktestLogic(history, currentPrice, amount, "1Y");

        if (r1) multiResults.m1 = (r1.finalValueCompound - amount) / amount * 100;
        if (r6) multiResults.m6 = (r6.finalValueCompound - amount) / amount * 100;
        if (r1y) multiResults.y1 = (r1y.finalValueCompound - amount) / amount * 100;

        if (simType === "backtest") {
            if (simResult) {
                resValue = simResult.finalValueCompound;
            }
        } else {
            const cagr = calculateCAGR(history);
            if (cagr !== null) {
                if (projMode === "value") {
                    resValue = calculateProjectionValue(cagr, amount, monthlyContribution, months);
                } else if (projMode === "income_value") {
                    resValue = calculateProjectionIncome(cagr, amount, monthlyContribution, months);
                } else if (projMode === "income_goal") {
                    resValue = calculateProjectionTimeForIncome(cagr, amount, monthlyContribution, targetAmount);
                } else {
                    resValue = calculateProjectionTime(cagr, amount, monthlyContribution, targetAmount);
                }
            }
        }

        onResult(symbol, resValue, multiResults);
    }, [history, simResult, simType, amount, projMode, monthlyContribution, months, targetAmount, symbol, onResult, currentPrice]);

    if (isLoading) return <div className="h-48 rounded-[2rem] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />;


    let displayContent = null;
    let cagr = 0;

    if (history && history.length > 0) {
        cagr = calculateCAGR(history) || 0;

        if (simType === "backtest" && simResult) {
            displayContent = (
                <div className="space-y-1">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Valor Final (Composto)</div>
                    <div className="text-2xl font-black text-indigo-500 tracking-tighter">
                        R$ {simResult.finalValueCompound.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="flex gap-2 text-[10px] font-medium text-zinc-400">
                        <span className="text-emerald-500">ROI: +{((simResult.finalValueCompound - amount) / amount * 100).toFixed(0)}%</span>
                        <span>Div: R$ {simResult.dividendsValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            );
        } else if (simType === "projection") {
            // Projection
            if (projMode === "value") {
                const val = calculateProjectionValue(cagr, amount, monthlyContribution, months);
                displayContent = (
                    <div className="space-y-1">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Patrimônio Projetado</div>
                        <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                            R$ {val.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                            Investido: R$ {(amount + (monthlyContribution * months)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                );
            } else if (projMode === "income_value") {
                const val = calculateProjectionIncome(cagr, amount, monthlyContribution, months);
                displayContent = (
                    <div className="space-y-1">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Renda Mensal (Reinvestida)</div>
                        <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                            R$ {val.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}/mês
                        </div>
                        <div className="text-[10px] text-zinc-400">
                            Ao final de {months} meses
                        </div>
                    </div>
                );
            } else if (projMode === "income_goal") {
                const valMonths = calculateProjectionTimeForIncome(cagr, amount, monthlyContribution, targetAmount);
                const years = valMonths / 12;
                displayContent = (
                    <div className="space-y-1">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Tempo para Renda Alvo</div>
                        {valMonths === Infinity ? (
                            <div className="text-xl font-black text-red-500 tracking-tighter italic">Inalcançável</div>
                        ) : (
                            <>
                                <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                                    {years.toFixed(1)} <span className="text-lg text-zinc-400">anos</span>
                                </div>
                                <div className="text-[10px] text-zinc-400">~ {Math.ceil(valMonths)} meses</div>
                            </>
                        )}
                    </div>
                );
            } else {
                const valMonths = calculateProjectionTime(cagr, amount, monthlyContribution, targetAmount);
                const years = valMonths / 12;
                displayContent = (
                    <div className="space-y-1">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Tempo para Meta</div>
                        <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                            {years.toFixed(1)} <span className="text-lg text-zinc-400">anos</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                            ~ {Math.ceil(valMonths)} meses
                        </div>
                    </div>
                );
            }
        }
    }

    return (
        <div className={`bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border relative transition-all group hover:scale-[1.02] hover:shadow-xl ${isWinner ? "border-yellow-400 ring-4 ring-yellow-400/20 shadow-yellow-500/20" : "border-zinc-100 dark:border-zinc-800"}`}>
            {/* Rank Badge */}
            <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 z-20 ${rank === 1 ? "bg-yellow-400 border-yellow-500 text-yellow-900" :
                rank === 2 ? "bg-zinc-300 border-zinc-400 text-zinc-700" :
                    rank === 3 ? "bg-amber-600 border-amber-700 text-amber-50" :
                        "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                }`}>
                #{rank}
            </div>

            {isWinner && (
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg animate-bounce z-20">
                    <Trophy size={20} fill="currentColor" />
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-black text-lg text-zinc-900 dark:text-white leading-none">{symbol}</h3>
                    <p className="text-xs text-zinc-400 font-bold mt-1 truncate max-w-[120px]">{name}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-black text-zinc-900 dark:text-zinc-300">R$ {currentPrice.toFixed(2)}</div>
                    <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mt-1">
                        CAGR {(cagr * 100).toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {displayContent ? (
                    <div className="space-y-4">
                        {displayContent}

                        {simType === "backtest" && simResult && (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">YOC (Dividendo)</p>
                                    <p className="text-xs font-black text-indigo-500">
                                        {((simResult.dividendsValue / amount) * 100 / (period === "1M" ? 1 / 12 : period === "6M" ? 0.5 : period === "1Y" ? 1 : 5)).toFixed(1)}% a.a
                                    </p>
                                </div>
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-right">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Preço Inicial</p>
                                    <p className="text-xs font-black text-zinc-600 dark:text-zinc-400">R$ {simResult.initialPrice.toFixed(2)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium py-4">
                        <AlertCircle size={14} />
                        Dados insuficientes
                    </div>
                )}
            </div>

            <Link href={`/?symbol=${symbol}`} className="absolute inset-0 z-10" />
        </div>
    );
}
