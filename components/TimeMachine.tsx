"use client";

import { useState, useEffect, useMemo } from "react";
import { Calculator, ArrowRight, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { calculateBacktestLogic, calculateCAGR, calculateProjectionValue, calculateProjectionTime } from "@/lib/simulation";

interface TimeMachineProps {
    data: any[]; // Historical data
    currentPrice: number;
    symbol: string;
}

export default function TimeMachine({ data, currentPrice, symbol }: TimeMachineProps) {
    const [activeTab, setActiveTab] = useState<"backtest" | "projection">("backtest");
    const [cagr, setCagr] = useState<number | null>(null);

    // Calculate CAGR on mount (using available history)
    useEffect(() => {
        const calculatedCagr = calculateCAGR(data);
        setCagr(calculatedCagr);
    }, [data]);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Header Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={() => setActiveTab("backtest")}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "backtest" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                >
                    Explorar Passado
                </button>
                <div className="w-px bg-zinc-100 dark:bg-zinc-800" />
                <button
                    onClick={() => setActiveTab("projection")}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "projection" ? "bg-white dark:bg-zinc-900 text-emerald-500" : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                >
                    Simular Futuro
                </button>
            </div>

            <div className="p-8">
                {activeTab === "backtest" ? (
                    <BacktestView data={data} currentPrice={currentPrice} symbol={symbol} />
                ) : (
                    <ProjectionView cagr={cagr} symbol={symbol} />
                )}
            </div>
        </div>
    );
}

// --- Backtest View (Original Logic) ---
function BacktestView({ data, currentPrice, symbol }: any) {
    const [amount, setAmount] = useState(1000);
    const [period, setPeriod] = useState("1Y");
    const [result, setResult] = useState<any>(null);

    const periods = [
        { label: "1 Mês", value: "1M", days: 30 },
        { label: "6 Meses", value: "6M", days: 180 },
        { label: "1 Ano", value: "1Y", days: 365 },
        { label: "5 Anos", value: "5Y", days: 1825 },
    ];

    useEffect(() => {
        const res = calculateBacktestLogic(data, currentPrice, amount, period);
        setResult(res);
    }, [amount, period, data, currentPrice]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Clock size={20} />
                </div>
                <div>
                    <h3 className="font-black text-lg tracking-tight">De Volta para o Passado</h3>
                    <p className="text-xs text-zinc-400 font-medium">Veja quanto renderia seu dinheiro.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Investimento</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl font-black text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-zinc-700 dark:text-zinc-200" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Há quanto tempo</label>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer text-zinc-700 dark:text-zinc-200">
                        {periods.map(p => <option key={p.value} value={p.value}>{p.label} atrás</option>)}
                    </select>
                </div>
            </div>

            {result && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm text-zinc-500 font-medium mb-4">Hoje você teria (sem reinvestir):</p>
                        <div className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white mb-6">
                            R$ {result.finalValueSimple.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                                <span className="font-bold text-zinc-400 uppercase">Valorização</span>
                                <div className="font-bold text-emerald-500">R$ {result.appreciationValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="space-y-1 border-l pl-4 border-zinc-200 dark:border-zinc-700">
                                <span className="font-bold text-zinc-400 uppercase">Proventos</span>
                                <div className="font-bold text-indigo-500">R$ {result.dividendsValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-500 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-24 bg-white/10 blur-[60px] rounded-full pointer-events-none" />
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Reinvestindo tudo</p>
                        <div className="text-2xl font-black tracking-tighter relative z-10">
                            R$ {result.finalValueCompound.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-indigo-100 text-[10px] font-medium mt-1 relative z-10">
                            +{((result.extraReturn / result.finalValueSimple) * 100).toFixed(1)}% turbinado pelos juros compostos
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Projection View (New Logic) ---
function ProjectionView({ cagr, symbol }: any) {
    const [mode, setMode] = useState<"value" | "goal">("value");
    const [startAmount, setStartAmount] = useState(1000);
    const [monthlyContribution, setMonthlyContribution] = useState(500);
    const [months, setMonths] = useState(12);
    const [targetAmount, setTargetAmount] = useState(100000);

    // Result Calculations
    const projectedValue = useMemo(() => {
        if (cagr === null) return 0;
        return calculateProjectionValue(cagr, startAmount, monthlyContribution, months);
    }, [cagr, startAmount, monthlyContribution, months]);

    const projectedMonthsToGoal = useMemo(() => {
        if (cagr === null) return 0;
        return calculateProjectionTime(cagr, startAmount, monthlyContribution, targetAmount);
    }, [cagr, startAmount, monthlyContribution, targetAmount]);

    const projectedYears = projectedMonthsToGoal / 12;

    if (cagr === null) return <div className="text-center text-zinc-400 py-10">Histórico insuficiente para projeção.</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Target size={20} />
                </div>
                <div>
                    <h3 className="font-black text-lg tracking-tight">Simulador de Futuro</h3>
                    <p className="text-xs text-zinc-400 font-medium">Baseado na média histórica ({((cagr || 0) * 100).toFixed(1)}% a.a.)</p>
                </div>
            </div>

            {/* Toggle Mode */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button onClick={() => setMode("value")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === "value" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                    Quanto vou ter?
                </button>
                <button onClick={() => setMode("goal")} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === "goal" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                    Quanto tempo leva?
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Inicial (R$)</label>
                    <input type="number" value={startAmount} onChange={(e) => setStartAmount(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-700 dark:text-zinc-200" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Aporte Mensal (R$)</label>
                    <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-700 dark:text-zinc-200" />
                </div>

                {mode === "value" ? (
                    <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Esperar por (Meses)</label>
                        <input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-700 dark:text-zinc-200" />
                    </div>
                ) : (
                    <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Meta (R$)</label>
                        <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-700 dark:text-zinc-200" />
                    </div>
                )}
            </div>

            {/* Projection Result */}
            <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group mt-2">
                <div className="absolute top-0 right-0 p-24 bg-white/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-white/20 transition-all duration-700" />

                {mode === "value" ? (
                    <>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Projeção de Patrimônio</p>
                        <div className="text-3xl font-black tracking-tighter relative z-10">
                            R$ {projectedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-emerald-100 text-[10px] font-medium mt-2 relative z-10 opacity-80">
                            *Inv. total: R$ {(startAmount + (monthlyContribution * months)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2 relative z-10">Tempo estimado</p>
                        <div className="text-3xl font-black tracking-tighter relative z-10 flex items-baseline gap-2">
                            {projectedYears.toFixed(1)} <span className="text-lg">anos</span>
                        </div>
                        <div className="text-emerald-100 text-sm font-medium relative z-10">
                            ({Math.ceil(projectedMonthsToGoal)} meses)
                        </div>
                        <div className="text-emerald-100 text-[10px] font-medium mt-2 relative z-10 opacity-80">
                            *Considerando rentabilidade constante.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
