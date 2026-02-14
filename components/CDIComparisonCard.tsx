"use client";

import { useState, useEffect, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart
} from "recharts";
import { format, addDays, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Settings2,
    Brain,
    Info,
    Activity,
    ChevronRight,
    ArrowRightLeft
} from "lucide-react";
import { predictLinear, predictPolynomial, predictHolt, predictWMA } from "@/lib/ml-utils";

interface CDIComparisonCardProps {
    symbol: string;
    historicalStockData: any[];
    currentPrice: number;
}

export default function CDIComparisonCard({ symbol, historicalStockData, currentPrice }: CDIComparisonCardProps) {
    const [mode, setMode] = useState<"past" | "future">("past");
    const [cdiData, setCdiData] = useState<any[]>([]);
    const [loadingCdi, setLoadingCdi] = useState(false);

    // Future Mode State
    const [cdiPercentage, setCdiPercentage] = useState(100);
    const [selectedModels, setSelectedModels] = useState<string[]>(["linear"]);
    const [unifiedAverage, setUnifiedAverage] = useState(true);
    const [expectedSelic, setExpectedSelic] = useState(11.75); // Taxa Selic atual aprox.

    // Load CDI data
    useEffect(() => {
        async function fetchCdi() {
            setLoadingCdi(true);
            try {
                const res = await fetch("/api/cdi?period=1Y");
                if (res.ok) {
                    const data = await res.json();
                    setCdiData(data);
                }
            } catch (err) {
                console.error("Erro ao buscar CDI");
            } finally {
                setLoadingCdi(false);
            }
        }
        fetchCdi();
    }, []);

    // Past Comparison Logic
    const pastChartData = useMemo(() => {
        if (!cdiData.length || !historicalStockData.length) return [];

        // Align data by date
        const stockMap = new Map();
        historicalStockData.forEach(d => {
            const dateStr = format(new Date(d.date), "dd/MM/yyyy");
            stockMap.set(dateStr, d.close);
        });

        const initialStockPrice = historicalStockData[0].close;
        let cumulativeCdi = 1;

        return cdiData.map(c => {
            const stockPrice = stockMap.get(c.date);
            cumulativeCdi *= (1 + c.rate);

            return {
                date: c.date,
                displayDate: c.date.split('/')[1] + '/' + c.date.split('/')[2].slice(2),
                stockYield: stockPrice ? ((stockPrice / initialStockPrice) - 1) * 100 : null,
                cdiYield: (cumulativeCdi - 1) * 100
            };
        }).filter(d => d.stockYield !== null);
    }, [cdiData, historicalStockData]);

    // Future Comparison Logic (ML)
    const futureChartData = useMemo(() => {
        if (!historicalStockData.length) return [];

        const prices = historicalStockData.map(d => d.close);
        const nextDays = 252; // 1 year

        const predictions: { [key: string]: number[] } = {
            linear: predictLinear(prices, nextDays),
            polynomial: predictPolynomial(prices, nextDays),
            holt: predictHolt(prices, nextDays),
            wma: predictWMA(prices, nextDays)
        };

        // Calculate Unified Average of selected models
        const activeModels = unifiedAverage ? ["linear", "polynomial", "holt", "wma"] : selectedModels;
        const avgPrediction: number[] = [];

        for (let i = 0; i < nextDays; i++) {
            let sum = 0;
            activeModels.forEach(m => { sum += predictions[m][i]; });
            avgPrediction.push(sum / activeModels.length);
        }

        // Future CDI Calculation
        const dailyCdiRate = (Math.pow(1 + (expectedSelic / 100), 1 / 252) - 1) * (cdiPercentage / 100);
        let cumulativeCdi = 1;

        const results = [];
        const lastDate = new Date(historicalStockData[historicalStockData.length - 1].date);
        const lastPrice = prices[prices.length - 1];

        for (let i = 0; i < nextDays; i++) {
            cumulativeCdi *= (1 + dailyCdiRate);
            results.push({
                date: format(addDays(lastDate, i + 1), "dd/MM/yy"),
                stockYield: ((avgPrediction[i] / lastPrice) - 1) * 100,
                cdiYield: (cumulativeCdi - 1) * 100
            });
        }

        return results.filter((_, i) => i % 5 === 0); // Decimate for performance
    }, [historicalStockData, expectedSelic, cdiPercentage, selectedModels, unifiedAverage]);

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
            {/* Header / Mode Selector */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <ArrowRightLeft className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">Comparativo CDI</h2>
                        <p className="text-zinc-500 text-sm font-medium">Análise de Rendimento vs Benchmark</p>
                    </div>
                </div>

                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                    <button
                        onClick={() => setMode("past")}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${mode === "past" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                        Histórico (1 Ano)
                    </button>
                    <button
                        onClick={() => setMode("future")}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${mode === "future" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                        Projeção ML (1 Ano)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Card */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <Activity size={18} />
                                {mode === "past" ? "Performance Acumulada (%)" : "Projeção de Rendimento (%)"}
                            </h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-bold text-zinc-500 uppercase">{symbol}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                <span className="text-xs font-bold text-zinc-500 uppercase">CDI</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mode === "past" ? pastChartData : futureChartData}>
                                <defs>
                                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCDI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                                <XAxis
                                    dataKey={mode === "past" ? "displayDate" : "date"}
                                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                                    stroke="#a1a1aa"
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                                    stroke="#a1a1aa"
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `${val.toFixed(0)}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(24, 24, 27, 0.95)',
                                        border: 'none',
                                        borderRadius: '1.5rem',
                                        color: '#fff',
                                        padding: '1.5rem',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    formatter={(value: number | undefined) => [`${(value || 0).toFixed(2)}%`, ""]}

                                />
                                <Area
                                    type="monotone"
                                    dataKey="stockYield"
                                    name={symbol}
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorStock)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cdiYield"
                                    name="CDI"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCDI)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-start gap-4">
                            <Info className="text-zinc-400 mt-1" size={20} />
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                {mode === "past"
                                    ? "Este gráfico compara o rendimento percentual acumulado do ativo (preço de fechamento) contra o CDI acumulado no mesmo período de 1 ano. Dividendos não estão incluídos nesta versão simplificada."
                                    : "A projeção utiliza algoritmos de Machine Learning para prever o preço futuro com base na tendência histórica e compara com a rentabilidade esperada do CDI baseada na Selic e porcentagem informada."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="flex flex-col gap-8">
                    {/* Stats Card */}
                    <div className="bg-zinc-900 dark:bg-zinc-100 p-8 rounded-[2.5rem] text-white dark:text-zinc-900 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 opacity-60">
                            <Settings2 size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest">Painel de Controle</h4>
                        </div>

                        {mode === "future" ? (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-4">Rentabilidade CDI (%)</label>
                                    <div className="flex items-center justify-between gap-4">
                                        <input
                                            type="range"
                                            min="80"
                                            max="200"
                                            step="5"
                                            value={cdiPercentage}
                                            onChange={(e) => setCdiPercentage(parseInt(e.target.value))}
                                            className="flex-1 accent-indigo-500 h-1.5 bg-zinc-800 dark:bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-2xl font-black w-20 text-right">{cdiPercentage}%</span>
                                    </div>
                                    <p className="text-[10px] mt-2 opacity-50 font-bold uppercase">Ex: Inter (80%), Mercado Pago (105%)</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-4">Taxa Selic Esperada (%)</label>
                                    <input
                                        type="number"
                                        value={expectedSelic}
                                        onChange={(e) => setExpectedSelic(parseFloat(e.target.value))}
                                        className="w-full bg-zinc-800 dark:bg-zinc-200 p-4 rounded-2xl font-black text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-none"
                                        step="0.25"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest opacity-60 mb-4">Modelos de ML</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setUnifiedAverage(!unifiedAverage)}
                                            className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${unifiedAverage ? "bg-indigo-500 border-indigo-500 text-white" : "bg-transparent border-zinc-700 dark:border-zinc-300 opacity-60"}`}
                                        >
                                            Média Unificada
                                        </button>
                                        {!unifiedAverage && (
                                            <>
                                                {["linear", "polynomial", "holt", "wma"].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => {
                                                            if (selectedModels.includes(m)) {
                                                                setSelectedModels(selectedModels.filter(sm => sm !== m));
                                                            } else {
                                                                setSelectedModels([...selectedModels, m]);
                                                            }
                                                        }}
                                                        className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedModels.includes(m) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-transparent border-zinc-700 dark:border-zinc-300 opacity-60"}`}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-6 bg-zinc-800 dark:bg-white/10 rounded-3xl">
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Resumo Anual</p>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-bold opacity-80">{symbol}</span>
                                        <span className={`font-black ${(pastChartData[pastChartData.length - 1]?.stockYield || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {(pastChartData[pastChartData.length - 1]?.stockYield || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold opacity-80">CDI (12m)</span>
                                        <span className="font-black text-indigo-400">
                                            {(pastChartData[pastChartData.length - 1]?.cdiYield || 0).toFixed(2)}%
                                        </span>
                                    </div>

                                </div>
                                <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                    <Brain size={20} className="text-indigo-400" />
                                    <p className="text-[10px] font-bold uppercase leading-tight">Mude para projeção para ver o futuro com IA</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Comparison Tooltip */}
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Veredito</h4>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                                <TrendingUp size={16} className="text-emerald-600" />
                            </div>
                        </div>

                        {pastChartData.length > 0 && (
                            <div>
                                {mode === "past" ? (
                                    <div className="space-y-4">
                                        {(pastChartData[pastChartData.length - 1]?.stockYield || 0) > (pastChartData[pastChartData.length - 1]?.cdiYield || 0) ? (
                                            <>
                                                <div className="text-2xl font-black text-emerald-500 leading-tight">O ativo venceu o CDI ✅</div>
                                                <p className="text-sm text-zinc-500 font-medium">No último ano, o {symbol} entregou {((pastChartData[pastChartData.length - 1]?.stockYield || 0) - (pastChartData[pastChartData.length - 1]?.cdiYield || 0)).toFixed(2)}% a mais que o benchmark.</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-2xl font-black text-red-500 leading-tight">O CDI venceu o ativo ❌</div>
                                                <p className="text-sm text-zinc-500 font-medium">O CDI rendeu {((pastChartData[pastChartData.length - 1]?.cdiYield || 0) - (pastChartData[pastChartData.length - 1]?.stockYield || 0)).toFixed(2)}% a mais que o {symbol}.</p>
                                            </>
                                        )}

                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {futureChartData[futureChartData.length - 1].stockYield > futureChartData[futureChartData.length - 1].cdiYield ? (
                                            <>
                                                <div className="text-2xl font-black text-emerald-500 leading-tight">IA prevê vitória ✅</div>
                                                <p className="text-sm text-zinc-500 font-medium">O modelo projeta que {symbol} pode superar o CDI de {cdiPercentage}% em aproximadamente {(futureChartData[futureChartData.length - 1].stockYield - futureChartData[futureChartData.length - 1].cdiYield).toFixed(2)}% nos próximos 12 meses.</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-2xl font-black text-amber-500 leading-tight">IA sugere cautela ⚠️</div>
                                                <p className="text-sm text-zinc-500 font-medium">Nesta configuração de ML, o CDI parece ser uma opção mais conservadora e rentável ({(futureChartData[futureChartData.length - 1].cdiYield - futureChartData[futureChartData.length - 1].stockYield).toFixed(2)}% acima).</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
