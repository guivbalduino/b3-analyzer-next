"use client";

import { useState, useMemo } from "react";
import { Trash2, TrendingUp, TrendingDown, Tag, Star, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { useUserActions } from "@/hooks/useUserActions";
import Link from "next/link";

interface PortfolioTableProps {
    data: any[];
    onUpdateQuantity: (symbol: string, quantity: number) => void;
    onRemove: (symbol: string) => void;
}

type SortKey = "symbol" | "quantity" | "price" | "totalValue" | "changePercent";
type SortOrder = "asc" | "desc";

export default function PortfolioTable({ data, onUpdateQuantity, onRemove }: PortfolioTableProps) {
    const { toggleFavorite, isFavorite, bulkAddFavorites } = useUserActions();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("totalValue");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("desc");
        }
    };

    const sortedData = useMemo(() => {
        const sorted = [...data].sort((a, b) => {
            let valA, valB;

            if (sortKey === "totalValue") {
                valA = a.price * a.quantity;
                valB = b.price * b.quantity;
            } else {
                valA = a[sortKey];
                valB = b[sortKey];
            }

            if (typeof valA === "string") {
                return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortOrder === "asc" ? valA - valB : valB - valA;
        });
        return sorted;
    }, [data, sortKey, sortOrder]);

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) return <ArrowUpDown size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />;
        return sortOrder === "asc" ? <ArrowUp size={12} className="text-emerald-500" /> : <ArrowDown size={12} className="text-emerald-500" />;
    };

    if (data.length === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden mb-8 transition-all">
            <div className="px-8 py-6 border-b border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500">
                        <Tag size={18} />
                    </div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Minhas Posições</h3>
                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[10px] font-black text-zinc-500">{data.length} ATIVOS</span>

                    <button
                        onClick={() => bulkAddFavorites(data.map(item => ({ symbol: item.symbol, name: item.name })))}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 ml-2"
                    >
                        <Star size={12} fill="currentColor" />
                        Favoritar Todos
                    </button>
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2 duration-300">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-50 dark:border-zinc-800">
                                <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort("symbol")}>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        Ativo <SortIcon column="symbol" />
                                    </div>
                                </th>
                                <th className="px-8 py-6 cursor-pointer group text-center" onClick={() => handleSort("quantity")}>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        Qtd <SortIcon column="quantity" />
                                    </div>
                                </th>
                                <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort("price")}>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        Preço <SortIcon column="price" />
                                    </div>
                                </th>
                                <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort("totalValue")}>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        Total <SortIcon column="totalValue" />
                                    </div>
                                </th>
                                <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort("changePercent")}>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        Variação <SortIcon column="changePercent" />
                                    </div>
                                </th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {sortedData.map((item) => {
                                const totalValue = item.price * item.quantity;
                                const fav = isFavorite(item.symbol);
                                return (
                                    <tr key={item.symbol} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleFavorite(item.symbol, item.name)}
                                                    className={`p-1.5 rounded-lg transition-all ${fav ? "text-amber-500 bg-amber-500/10" : "text-zinc-300 hover:text-amber-500"}`}
                                                >
                                                    <Star size={16} fill={fav ? "currentColor" : "none"} />
                                                </button>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/?s=${item.symbol}`}
                                                            className="font-black text-lg text-zinc-900 dark:text-white hover:text-emerald-500 transition-colors flex items-center gap-1.5 group/link"
                                                        >
                                                            {item.symbol}
                                                            <ExternalLink size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity text-zinc-400" />
                                                        </Link>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${item.type === "FII" ? "bg-amber-500/10 text-amber-500" :
                                                                item.type === "ETF" ? "bg-indigo-500/10 text-indigo-500" :
                                                                    "bg-emerald-500/10 text-emerald-500"
                                                            }`}>
                                                            {item.type || "Ação"}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[150px]">
                                                        {item.sector || "Outros"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => onUpdateQuantity(item.symbol, Number(e.target.value))}
                                                    className="w-24 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-black text-center focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-black text-zinc-900 dark:text-zinc-300">
                                                R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-black text-emerald-500">
                                                R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`flex items-center gap-1 text-sm font-black ${item.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                {item.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {Math.abs(item.changePercent).toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => onRemove(item.symbol)}
                                                className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
