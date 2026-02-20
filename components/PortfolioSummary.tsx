"use client";

import { useMemo } from "react";
import { Wallet, PieChart, LayoutGrid, ArrowUpRight, ArrowDownRight, Building2, Landmark } from "lucide-react";

interface PortfolioSummaryProps {
    data: any[]; // Portfolio items with current prices
}

export default function PortfolioSummary({ data }: PortfolioSummaryProps) {
    const totals = useMemo(() => {
        let totalValue = 0;
        let dayChange = 0;
        let prevTotalValue = 0;

        data.forEach(item => {
            const currentVal = (item.price || 0) * item.quantity;
            const prevVal = ((item.price || 0) - (item.change || 0)) * item.quantity;

            totalValue += currentVal;
            dayChange += (item.change || 0) * item.quantity;
            prevTotalValue += prevVal;
        });

        const dayChangePercent = prevTotalValue > 0 ? (dayChange / prevTotalValue) * 100 : 0;

        return {
            totalValue,
            dayChange,
            dayChangePercent
        };
    }, [data]);

    const allocationBySector = useMemo(() => {
        const sectors: Record<string, number> = {};
        data.forEach(item => {
            const sector = item.sector || "Outros";
            sectors[sector] = (sectors[sector] || 0) + (item.price * item.quantity);
        });

        return Object.entries(sectors)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value, percent: targetsTotalValue(value, totals.totalValue) }));
    }, [data, totals.totalValue]);

    const allocationByType = useMemo(() => {
        const types: Record<string, number> = {};
        data.forEach(item => {
            const type = item.type || "Ação";
            types[type] = (types[type] || 0) + (item.price * item.quantity);
        });

        return Object.entries(types)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value, percent: targetsTotalValue(value, totals.totalValue) }));
    }, [data, totals.totalValue]);

    function targetsTotalValue(val: number, total: number) {
        return total > 0 ? (val / total) * 100 : 0;
    }

    if (data.length === 0) return null;

    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Value Card */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm md:col-span-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <Wallet size={20} />
                        </div>
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Patrimônio Total</h3>
                    </div>
                    <div className="text-3xl font-black tracking-tight mb-2">
                        R$ {totals.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${totals.dayChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {totals.dayChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span>R$ {Math.abs(totals.dayChange).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        <span className="opacity-60">({totals.dayChangePercent.toFixed(2)}%)</span>
                    </div>
                </div>

                {/* Allocation by Type Card */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm md:col-span-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                            <LayoutGrid size={20} />
                        </div>
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Por Tipo</h3>
                    </div>
                    <div className="space-y-5">
                        {allocationByType.map((type, idx) => (
                            <div key={idx} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-lg ${type.name === 'Ação' ? 'bg-emerald-500/10 text-emerald-500' :
                                                type.name === 'FII' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-indigo-500/10 text-indigo-500'
                                            }`}>
                                            {type.name === 'Ação' ? <Landmark size={14} /> :
                                                type.name === 'FII' ? <Building2 size={14} /> :
                                                    <LayoutGrid size={14} />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">
                                            {type.name === 'Ação' ? 'Ações' : type.name === 'FII' ? 'Fundos Imob.' : 'ETFs'}
                                        </span>
                                    </div>
                                    <span className="text-xs font-black dark:text-white">{type.percent.toFixed(1)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden p-[2px]">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 shadow-sm ${type.name === 'Ação' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                                type.name === 'FII' ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                                    'bg-gradient-to-r from-indigo-600 to-indigo-400'
                                            }`}
                                        style={{ width: `${type.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] text-center mb-4">Legenda de Ativos</p>
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-[9px] font-black text-zinc-500 uppercase">Equity</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                <span className="text-[9px] font-black text-zinc-500 uppercase">Real Estate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                                <span className="text-[9px] font-black text-zinc-500 uppercase">Indexing</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Allocation by Sector Card */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                            <PieChart size={20} />
                        </div>
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Alocação por Setor</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {allocationBySector.map((sector, idx) => (
                            <div key={idx} className="group cursor-default">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest truncate max-w-[120px] group-hover:text-indigo-400 transition-colors">
                                        {sector.name}
                                    </span>
                                    <span className="text-[10px] font-black text-indigo-500">{sector.percent.toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-all duration-1000"
                                        style={{ width: `${sector.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
