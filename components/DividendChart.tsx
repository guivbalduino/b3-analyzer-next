"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartData {
    date: string;
    dividend: number | null;
    yieldPercent: number | null;
    close: number;
}

interface DividendChartProps {
    data: ChartData[];
    loading: boolean;
    type: "value" | "yield";
}

export default function DividendChart({ data, loading, type }: DividendChartProps) {
    if (loading) {
        return (
            <div className="w-full h-[300px] bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl animate-pulse flex items-center justify-center">
                <span className="text-zinc-400 font-medium">Carregando dividendos...</span>
            </div>
        );
    }

    // Filter only entries with dividends
    const dividendData = data
        .filter((item) => item.dividend !== null && item.dividend > 0)
        .map((item) => ({
            ...item,
            displayDate: format(new Date(item.date), "dd/MM/yyyy"),
        }));

    if (dividendData.length === 0) {
        return (
            <div className="w-full h-[200px] bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center">
                <span className="text-zinc-400">Nenhum dividendo pago no período selecionado.</span>
            </div>
        );
    }

    const isValue = type === "value";
    const color = isValue ? "#10b981" : "#3b82f6";
    const dataKey = isValue ? "dividend" : "yieldPercent";
    const title = isValue ? "Histórico de Dividendos (R$)" : "Dividend Yield (%)";
    const gradientId = isValue ? "colorDiv" : "colorYield";

    return (
        <div className="w-full h-[300px] bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-[0.2em] text-center">
                {title}
            </h3>
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={dividendData}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(str) => format(new Date(str), "MMM yy", { locale: ptBR })}
                        stroke="#a1a1aa"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#a1a1aa"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => isValue ? `R$ ${val.toFixed(2)}` : `${val.toFixed(1)}%`}
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
                            return isValue
                                ? [`R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor Pago"]
                                : [`${val.toFixed(2)}%`, "Yield na Data"];
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={4}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                        animationDuration={1500}
                        dot={{ fill: color, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
