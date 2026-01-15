"use client";

import { Info, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

interface StockData {
    price: number;
    eps: number;
    bvps: number;
    dividendRate: number;
    targetMeanPrice: number;
}

interface HistoricalData {
    close: number;
}

interface AnalysisSectionProps {
    data: StockData;
    historicalData: HistoricalData[];
    loading: boolean;
}

export default function AnalysisSection({ data, historicalData, loading }: AnalysisSectionProps) {
    if (loading) {
        return (
            <div className="w-full h-full bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] animate-pulse flex flex-col gap-4 p-8">
                <div className="h-6 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
                <div className="h-24 w-full bg-zinc-200 dark:bg-zinc-700 rounded-2xl"></div>
                <div className="h-24 w-full bg-zinc-200 dark:bg-zinc-700 rounded-2xl"></div>
            </div>
        );
    }

    // --- CÁLCULOS ---

    // 1. Graham (Preço Justo)
    const grahamFairPrice = data.eps > 0 && data.bvps > 0
        ? Math.sqrt(22.5 * data.eps * data.bvps)
        : null;
    const grahamUpside = grahamFairPrice ? ((grahamFairPrice / data.price) - 1) * 100 : null;

    // 2. Décio Bazin (Preço Teto)
    const bazinPriceCeiling = data.dividendRate > 0 ? data.dividendRate / 0.06 : null;
    const bazinUpside = bazinPriceCeiling ? ((bazinPriceCeiling / data.price) - 1) * 100 : null;

    // 3. RSI (IFR 14 dias)
    const calculateRSI = (prices: number[]) => {
        if (prices.length < 15) return null;
        let gains = 0;
        let losses = 0;

        for (let i = prices.length - 14; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }

        if (losses === 0) return 100;
        const rs = (gains / 14) / (losses / 14);
        return 100 - (100 / (1 + rs));
    };

    const rsi = calculateRSI(historicalData.map(d => d.close));

    const getRSISignal = (val: number) => {
        if (val >= 70) return { label: "Sobrecompra", color: "text-red-600 dark:text-red-400", icon: <TrendingUp size={16} /> };
        if (val <= 30) return { label: "Sobrevenda", color: "text-emerald-600 dark:text-emerald-400", icon: <TrendingDown size={16} /> };
        return { label: "Neutro", color: "text-zinc-600 dark:text-zinc-400", icon: <Info size={16} /> };
    };

    const rsiSignal = rsi ? getRSISignal(rsi) : null;

    // --- UI HELPER ---
    const SignalBadge = ({ label, colorClass }: { label: string, colorClass: string }) => (
        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-tighter ${colorClass} bg-white dark:bg-zinc-800 border-2 border-current shadow-sm`}>
            {label}
        </span>
    );

    const getSignalFromUpside = (upside: number | null) => {
        if (upside === null) return null;
        if (upside > 15) return { label: "Compra", color: "text-emerald-600 dark:text-emerald-400" };
        if (upside < -10) return { label: "Venda", color: "text-red-600 dark:text-red-400" };
        return { label: "Manter", color: "text-amber-600 dark:text-amber-400" };
    };

    const AnalysisCard = ({ title, value, upside, description }: any) => {
        const signal = getSignalFromUpside(upside);
        return (
            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-3 relative group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{title}</span>
                        <div className="relative">
                            <Info size={14} className="text-zinc-300 hover:text-emerald-500 transition-colors cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-xl border border-white/10 dark:border-zinc-700">
                                {description}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900 dark:border-t-zinc-800"></div>
                            </div>
                        </div>
                    </div>
                    {signal && <SignalBadge label={signal.label} colorClass={signal.color} />}
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">
                        {value ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "N/A"}
                    </span>
                    {upside !== null && (
                        <span className={`text-sm font-black ${upside >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {upside >= 0 ? "+" : ""}{upside.toFixed(1)}%
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="text-emerald-500" size={24} />
                    <h3 className="font-black text-lg text-emerald-900 dark:text-emerald-400">Resumo da Análise</h3>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-bold leading-snug">
                    Estimativas baseadas em fundamentos e indicadores profissionais.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnalysisCard
                    title="Preço Graham"
                    value={grahamFairPrice}
                    upside={grahamUpside}
                    description="O Valor Justo de Graham estima o preço intrínseco baseado em Lucro e Valor Patrimonial (máx Multiplicador 22.5)."
                />

                <AnalysisCard
                    title="Preço Teto Bazin"
                    value={bazinPriceCeiling}
                    upside={bazinUpside}
                    description="O valor para garantir um Dividend Yield mínimo de 6%, baseado nos últimos pagamentos de dividendos."
                />

                <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4 relative group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Indicador RSI (14)</span>
                            <div className="relative">
                                <Info size={14} className="text-zinc-300 hover:text-emerald-500 transition-colors cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-xl border border-white/10 dark:border-zinc-700">
                                    O RSI (IFR) mede a força e velocidade dos movimentos de preço. Acima de 70 indica sobrecompra, abaixo de 30 indica sobrevenda.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900 dark:border-t-zinc-800"></div>
                                </div>
                            </div>
                        </div>
                        {rsiSignal && (
                            <SignalBadge
                                label={rsiSignal.label === "Sobrecompra" ? "Venda" : rsiSignal.label === "Sobrevenda" ? "Compra" : "Manter"}
                                colorClass={rsiSignal.color}
                            />
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-black text-zinc-900 dark:text-white">{rsi?.toFixed(1) || "N/A"}</span>
                        {rsiSignal && (
                            <div className={`flex items-center gap-1.5 text-sm font-black ${rsiSignal.color}`}>
                                {rsiSignal.icon}
                                {rsiSignal.label}
                            </div>
                        )}
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${rsi && rsi > 70 ? 'bg-red-500' : rsi && rsi < 30 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${rsi || 0}%` }}
                        ></div>
                    </div>
                </div>

                {data.targetMeanPrice > 0 && (
                    <div className="p-6 bg-zinc-900 dark:bg-zinc-100 rounded-[2rem] shadow-xl relative group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Média Alvo Analistas</span>
                                <div className="relative">
                                    <Info size={12} className="text-zinc-500 hover:text-white dark:hover:text-zinc-900 transition-colors cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-[10px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-xl border border-black/10 dark:border-white/10">
                                        Média dos preços-alvo estabelecidos por analistas de mercado para os próximos 12 meses.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-zinc-900"></div>
                                    </div>
                                </div>
                            </div>
                            {(() => {
                                const upside = ((data.targetMeanPrice / data.price) - 1) * 100;
                                const signal = getSignalFromUpside(upside);
                                return signal && <SignalBadge label={signal.label} colorClass={signal.color} />;
                            })()}
                        </div>
                        <div className="text-3xl font-black text-white dark:text-zinc-900">
                            R$ {data.targetMeanPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
