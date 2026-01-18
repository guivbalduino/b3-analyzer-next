"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Info } from "lucide-react";

interface ComparisonChartProps {
    data: any[];
    ticker1: string;
    ticker2: string;
}

export default function ComparisonChart({ data, ticker1, ticker2 }: ComparisonChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="w-full h-[400px] bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-[0.2em]">
                Performance Relativa (%)
                <div className="relative group/info cursor-help">
                    <Info size={14} className="text-zinc-400 hover:text-emerald-500 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-4 bg-zinc-900 text-white text-xs font-medium rounded-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 shadow-xl pointer-events-none normal-case tracking-normal leading-relaxed text-center">
                        Compara a valorização percentual acumulada dos ativos no período, normalizando o início para 0%.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900"></div>
                    </div>
                </div>
            </h3>
            <ResponsiveContainer width="100%" height="85%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(str) => format(new Date(str), "dd/MM", { locale: ptBR })}
                        minTickGap={30}
                        stroke="#a1a1aa"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        stroke="#a1a1aa"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(24, 24, 27, 0.9)",
                            border: "none",
                            borderRadius: "16px",
                            color: "#fff",
                            padding: "16px",
                            fontSize: "12px",
                            backdropFilter: "blur(8px)"
                        }}
                        labelFormatter={(label) => format(new Date(label), "PPP", { locale: ptBR })}
                        formatter={(val: number | undefined) => {
                            if (val === undefined) return ["-", "Valor"];
                            return [`${val.toFixed(2)}%`, "Variação"];
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: "bold" }} />

                    <Line
                        type="monotone"
                        dataKey="t1Change"
                        name={ticker1}
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="t2Change"
                        name={ticker2}
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
