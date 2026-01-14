"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartData {
    date: string;
    close: number;
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

    return (
        <div className="w-full h-[400px] bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(str) => format(new Date(str), "MMM yy", { locale: ptBR })}
                        minTickGap={30}
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={["auto", "auto"]}
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `R$ ${val.toFixed(0)}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(24, 24, 27, 0.9)",
                            border: "none",
                            borderRadius: "16px",
                            color: "#fff",
                            padding: "12px",
                        }}
                        labelFormatter={(label) => format(new Date(label), "PPP", { locale: ptBR })}
                        formatter={(val: number | undefined) => [
                            val !== undefined ? `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-",
                            "Fechamento"
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="close"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorClose)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
