"use client";

import { useState } from "react";

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Line,
    Legend
} from "recharts";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { predictLinear, predictPolynomial, predictHolt, predictWMA, simulateMonteCarlo } from "@/lib/ml-utils";

interface ChartData {
    date: string;
    close?: number;
    predLinear?: number;
    predPoly?: number;
    predHolt?: number;
    predWMA?: number;
    upperBound?: number;
    lowerBound?: number;
    isPrediction?: boolean;
}

interface ChartSectionProps {
    data: ChartData[];
    loading: boolean;
}

export default function ChartSection({ data, loading }: ChartSectionProps) {
    if (loading) {
        return (
            <div className="w-full h-[400px] bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl animate-pulse flex items-center justify-center">
                <span className="text-zinc-400 font-medium">Carregando gráfico...</span>
            </div>
        );
    }

    if (!data || data.length === 0) return null;

    // ML Prediction Logic
    const nextDays = 5;
    const lookback = 60;
    const prices = data.slice(-lookback).map(d => d.close as number);

    // Backtesting for "Best Model" selection
    let bestModel = "";
    if (prices.length > nextDays * 2) {
        // We need at least enough data to train AND test
        // Train on data excluding the last 5 days
        const trainData = prices.slice(0, -nextDays);
        // "Truth" is the last 5 days
        const actualLast5 = prices.slice(-nextDays);

        const testStrategies = {
            "predLinear": predictLinear(trainData, nextDays),
            "predPoly": predictPolynomial(trainData, nextDays),
            "predHolt": predictHolt(trainData, nextDays),
            "predWMA": predictWMA(trainData, nextDays)
        };

        let minError = Infinity;

        Object.entries(testStrategies).forEach(([modelName, predictions]) => {
            let errorSum = 0;
            for (let i = 0; i < nextDays; i++) {
                errorSum += Math.abs(predictions[i] - actualLast5[i]);
            }
            const mae = errorSum / nextDays;

            if (mae < minError) {
                minError = mae;
                bestModel = modelName;
            }
        });

        console.log("Backtest winner:", bestModel, "MAE:", minError);
    }

    const pLinear = predictLinear(prices, nextDays);
    const pPoly = predictPolynomial(prices, nextDays);
    const pHolt = predictHolt(prices, nextDays);
    const pWMA = predictWMA(prices, nextDays);
    const { upper, lower } = simulateMonteCarlo(prices, nextDays);

    // Create augmented data
    const lastDate = new Date(data[data.length - 1].date);
    const predictionData: ChartData[] = pLinear.map((_, i) => ({
        date: addDays(lastDate, i + 1).toISOString(),
        predLinear: pLinear[i],
        predPoly: pPoly[i],
        predHolt: pHolt[i],
        predWMA: pWMA[i],
        upperBound: upper[i],
        lowerBound: lower[i],
        isPrediction: true
    }));

    const enhancedData: ChartData[] = [
        ...data.map(d => ({ ...d })),
        ...predictionData
    ];

    // Connect historical to predictions
    if (enhancedData.length > nextDays) {
        const idx = data.length - 1;
        const lastPrice = enhancedData[idx].close;
        enhancedData[idx] = {
            ...enhancedData[idx],
            predLinear: lastPrice,
            predPoly: lastPrice,
            predHolt: lastPrice,
            predWMA: lastPrice,
            upperBound: lastPrice,
            lowerBound: lastPrice
        };
    }

    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    return (
        <div className="w-full h-[500px] bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm relative group">
            <div className="absolute top-6 left-8 flex flex-col gap-2 z-10">
                <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-2 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Terminal de Predição Multi-Modelo (+5D)</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enhancedData}>
                    <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(str) => format(new Date(str), "MMM yy", { locale: ptBR })}
                        minTickGap={30}
                        stroke="#a1a1aa"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        domain={["auto", "auto"]}
                        stroke="#a1a1aa"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `R$ ${val.toFixed(0)}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(24, 24, 27, 0.95)",
                            border: "none",
                            borderRadius: "20px",
                            color: "#fff",
                            padding: "20px",
                            fontSize: "12px",
                            backdropFilter: "blur(10px)",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                        }}
                        labelFormatter={(label) => format(new Date(label), "PPP", { locale: ptBR })}
                        formatter={(val: number | undefined, name?: string) => {
                            // If a model is selected, hide others from tooltip too
                            if (selectedModel && name !== "close" && name !== selectedModel) return [];

                            const formatted = val?.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                            const isWinner = name === bestModel ? " 🏆" : "";

                            switch (name) {
                                case "close": return [`R$ ${formatted}`, "Preço Real"];
                                case "predLinear": return [`R$ ${formatted}`, `Regressão Linear${isWinner}`];
                                case "predPoly": return [`R$ ${formatted}`, `Curva Polinomial${isWinner}`];
                                case "predHolt": return [`R$ ${formatted}`, `Holt-Winters (Momentum)${isWinner}`];
                                case "predWMA": return [`R$ ${formatted}`, `Médias Ponderadas${isWinner}`];
                                case "upperBound": return [`R$ ${formatted}`, "Cenário Otimista"];
                                case "lowerBound": return [`R$ ${formatted}`, "Cenário Pessimista"];
                                default: return [val ?? "-", name ?? ""];
                            }
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: "0px", paddingBottom: "40px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", cursor: "pointer" }}
                        onClick={(e) => setSelectedModel(selectedModel === e.dataKey ? null : e.dataKey as string)}
                        formatter={(value, entry: any) => {
                            const { dataKey } = entry;
                            const isWinner = dataKey === bestModel;
                            // Dim others if one is selected
                            const opacity = selectedModel && selectedModel !== dataKey ? "opacity-30" : "opacity-100";

                            const descriptions: Record<string, string> = {
                                predLinear: "Regressão Linear: Assume uma tendência constante baseada na inclinação média dos preços.",
                                predPoly: "Polinomial (2º grau): Capta curvaturas na tendência (aceleração ou exaustão do movimento).",
                                predHolt: "Holt-Winters: Aplica suavização exponencial dupla, dando mais peso aos dados recentes e seguindo a tendência local.",
                                predWMA: "Médias Ponderadas: Previsão baseada no peso maior para dias recentes, detectando mudanças rápidas de direção.",
                                upperBound: "Limite Superior (90% Confiança): Onde o preço pode chegar em um cenário otimista (Monte Carlo).",
                                lowerBound: "Limite Inferior (90% Confiança): Onde o preço pode chegar em um cenário pessimista (Monte Carlo)."
                            };

                            const label = value === "predLinear" ? "Regressão Linear" :
                                value === "predPoly" ? "Curva Polinomial" :
                                    value === "predHolt" ? "Holt-Winters" :
                                        value === "predWMA" ? "Médias Ponderadas" :
                                            value === "upperBound" ? "Cenário Otimista" :
                                                value === "lowerBound" ? "Cenário Pessimista" : value;

                            return (
                                <div className={`group/item relative inline-flex items-center gap-1 ${opacity} transition-opacity duration-300`}>
                                    <span className="cursor-pointer hover:text-indigo-500 transition-colors">
                                        {label} {isWinner && "🏆"}
                                    </span>
                                    {descriptions[dataKey] && (
                                        <div className="absolute top-full right-0 mt-3 w-56 p-4 bg-zinc-900 dark:bg-zinc-800 text-white text-[11px] font-medium leading-relaxed rounded-2xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 transform translate-y-2 group-hover/item:translate-y-0 z-50 pointer-events-none shadow-2xl border border-white/10 dark:border-zinc-700">
                                            {descriptions[dataKey]}
                                            <div className="absolute bottom-full right-6 border-8 border-transparent border-b-zinc-900 dark:border-b-zinc-800"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        }}
                    />

                    {/* Monte Carlo Confidence Bounds */}
                    <Line
                        type="monotone"
                        dataKey="upperBound"
                        name="upperBound"
                        stroke="#6366f1"
                        strokeWidth={1}
                        strokeDasharray="2 4"
                        dot={false}
                        opacity={0.4}
                        hide={selectedModel !== null && selectedModel !== "upperBound"}
                    />
                    <Line
                        type="monotone"
                        dataKey="lowerBound"
                        name="lowerBound"
                        stroke="#6366f1"
                        strokeWidth={1}
                        strokeDasharray="2 4"
                        dot={false}
                        opacity={0.4}
                        hide={selectedModel !== null && selectedModel !== "lowerBound"}
                    />

                    {/* Historical Area */}
                    <Area
                        type="monotone"
                        dataKey="close"
                        name="close"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorClose)"
                        animationDuration={1500}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />

                    {/* Prediction Lines */}
                    <Line
                        type="monotone"
                        dataKey="predLinear"
                        name="predLinear"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        hide={selectedModel !== null && selectedModel !== "predLinear"}
                    />
                    <Line
                        type="monotone"
                        dataKey="predPoly"
                        name="predPoly"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        hide={selectedModel !== null && selectedModel !== "predPoly"}
                    />
                    <Line
                        type="monotone"
                        dataKey="predHolt"
                        name="predHolt"
                        stroke="#ec4899"
                        strokeWidth={3}
                        strokeDasharray="6 4"
                        dot={false}
                        hide={selectedModel !== null && selectedModel !== "predHolt"}
                    />
                    <Line
                        type="monotone"
                        dataKey="predWMA"
                        name="predWMA"
                        stroke="#6366f1"
                        strokeWidth={3}
                        strokeDasharray="6 4"
                        dot={false}
                        hide={selectedModel !== null && selectedModel !== "predWMA"}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
