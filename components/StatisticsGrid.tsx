"use client";

import { TrendingUp, TrendingDown, BarChart3, Activity, PieChart, Maximize2 } from "lucide-react";

interface StatisticsGridProps {
    data: {
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        regularMarketVolume?: number;
        averageDailyVolume3Month?: number;
        marketCap?: number;
        trailingPE?: number;
    };
}

export default function StatisticsGrid({ data }: StatisticsGridProps) {
    const formatCurrency = (val?: number) => {
        if (val === undefined) return "-";
        return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    const formatNumber = (val?: number) => {
        if (val === undefined) return "-";
        if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
        return val.toLocaleString("pt-BR");
    };

    const metrics = [
        {
            label: "Máxima (52 sem)",
            value: formatCurrency(data.fiftyTwoWeekHigh),
            icon: TrendingUp,
            color: "text-emerald-500",
        },
        {
            label: "Mínima (52 sem)",
            value: formatCurrency(data.fiftyTwoWeekLow),
            icon: TrendingDown,
            color: "text-red-500",
        },
        {
            label: "Volume Atual",
            value: formatNumber(data.regularMarketVolume),
            icon: BarChart3,
            color: "text-blue-500",
        },
        {
            label: "Volume Médio",
            value: formatNumber(data.averageDailyVolume3Month),
            icon: Activity,
            color: "text-zinc-500",
        },
        {
            label: "Market Cap",
            value: formatNumber(data.marketCap),
            icon: PieChart,
            color: "text-purple-500",
        },
        {
            label: "P/L (TTM)",
            value: data.trailingPE?.toFixed(2) || "-",
            icon: Maximize2,
            color: "text-orange-500",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {metrics.map((metric, idx) => (
                <div
                    key={idx}
                    className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <metric.icon size={16} className={metric.color} />
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            {metric.label}
                        </span>
                    </div>
                    <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">
                        {metric.value}
                    </p>
                </div>
            ))}
        </div>
    );
}
