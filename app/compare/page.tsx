"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, TrendingUp } from "lucide-react";
import ComparisonChart from "@/components/ComparisonChart";

interface StockData {
    symbol: string;
    price: number;
    changePercent: number;
    name: string;
    marketCap: number;
    trailingPE: number;
    dividendRate: number;
    regularMarketVolume: number;
}

interface HistoricalPoint {
    date: string;
    close: number;
}

function CompareContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initial ticker state from URL
    const [t1, setT1] = useState(searchParams.get("t1") || "");
    const [t2, setT2] = useState(searchParams.get("t2") || "");

    const [data1, setData1] = useState<StockData | null>(null);
    const [data2, setData2] = useState<StockData | null>(null);
    const [hist1, setHist1] = useState<HistoricalPoint[]>([]);
    const [hist2, setHist2] = useState<HistoricalPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (ticker: string, isFirst: boolean) => {
        if (!ticker) return;
        try {
            const [infoRes, histRes] = await Promise.all([
                fetch(`/api/stock/${ticker}`),
                fetch(`/api/stock/${ticker}/historical?period=1Y`)
            ]);

            if (infoRes.ok) {
                const info = await infoRes.json();
                if (isFirst) setData1(info); else setData2(info);
            }
            if (histRes.ok) {
                const hist = await histRes.json();
                if (isFirst) setHist1(hist); else setHist2(hist);
            }
        } catch (error) {
            console.error("Error fetching", ticker, error);
        }
    }, []);

    // Effect to auto-load if params exist
    useEffect(() => {
        const p1 = searchParams.get("t1");
        const p2 = searchParams.get("t2");

        async function load() {
            setLoading(true);
            const promises = [];
            if (p1 && p1 !== data1?.symbol) promises.push(fetchData(p1, true));
            if (p2 && p2 !== data2?.symbol) promises.push(fetchData(p2, false));
            await Promise.all(promises);
            setLoading(false);
        }
        load();
    }, [searchParams, fetchData, data1?.symbol, data2?.symbol]);

    const handleCompare = (e: React.FormEvent) => {
        e.preventDefault();
        const url = `/compare?t1=${t1}&t2=${t2}`;
        router.push(url);
    };

    // Prepare Chart Data (Normalized)
    const chartData: { date: string; t1Price: number; t2Price: number; t1Change?: number; t2Change?: number }[] = [];
    if (hist1.length > 0 && hist2.length > 0) {
        // Find common start date or just merge by date index if loosely aligned
        // For simplicity, we map based on date strings intersection
        const map2 = new Map(hist2.map(h => [h.date.split('T')[0], h.close]));
        const start1 = hist1[0].close;
        // Find corresponding start for 2 needed for normalization baseline
        // We will do a simpler approach: iterate hist1, find match in hist2

        for (const h1 of hist1) {
            const dateKey = h1.date.split('T')[0];
            const close2 = map2.get(dateKey);
            if (close2 !== undefined) {
                // Determine baseline (first common point)
                // Actually, let's normalize to the very first common point found
                chartData.push({
                    date: h1.date,
                    t1Price: h1.close,
                    t2Price: close2
                });
            }
        }

        // Normalize
        if (chartData.length > 0) {
            const base1 = chartData[0].t1Price;
            const base2 = chartData[0].t2Price;

            for (const p of chartData) {
                p.t1Change = ((p.t1Price - base1) / base1) * 100;
                p.t2Change = ((p.t2Price - base2) / base2) * 100;
            }
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-4 md:p-10">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-3 bg-white dark:bg-zinc-900 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-black">Comparador de Ativos</h1>
                </div>

                {/* Search Inputs */}
                <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto] gap-4 items-center bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <input
                            className="w-full h-12 pl-12 pr-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold uppercase"
                            placeholder="Ativo 1 (ex: PETR4)"
                            value={t1}
                            onChange={e => setT1(e.target.value)}
                        />
                    </div>
                    <span className="text-zinc-400 font-bold mx-auto">VS</span>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <input
                            className="w-full h-12 pl-12 pr-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold uppercase"
                            placeholder="Ativo 2 (ex: VALE3)"
                            value={t2}
                            onChange={e => setT2(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all disabled:opacity-50"
                    >
                        {loading ? "..." : "COMPARAR"}
                    </button>
                </form>

                {/* Comparison Content */}
                {(data1 || data2) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Stats Comparison */}
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm h-fit">
                            <h3 className="font-black text-lg mb-6">Fundamentos</h3>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-3 gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                    <span>Indicador</span>
                                    <span className="text-right text-emerald-600 dark:text-emerald-400">{t1}</span>
                                    <span className="text-right text-indigo-600 dark:text-indigo-400">{t2}</span>
                                </div>

                                <StatRow
                                    label="Preço Atual"
                                    v1={data1?.price}
                                    v2={data2?.price}
                                    isCurrency
                                    description="Valor da última negociação do ativo na B3."
                                />
                                <StatRow
                                    label="Variação %"
                                    v1={data1?.changePercent}
                                    v2={data2?.changePercent}
                                    suffix="%"
                                    description="Variação percentual do preço em relação ao fechamento anterior."
                                />
                                <StatRow
                                    label="P/L (P/E)"
                                    v1={data1?.trailingPE}
                                    v2={data2?.trailingPE}
                                    description="Preço sobre Lucro. Estima quantos anos o lucro da empresa pagaria o investimento. Menor geralmente é melhor/barato."
                                />
                                <StatRow
                                    label="Div. Yield"
                                    v1={data1?.dividendRate}
                                    v2={data2?.dividendRate}
                                    suffix="%"
                                    description="Rendimento de Dividendos. Quanto a empresa pagou em proventos nos últimos 12 meses sobre o preço atual."
                                />
                                <StatRow
                                    label="Market Cap"
                                    v1={data1?.marketCap}
                                    v2={data2?.marketCap}
                                    isCompact
                                    description="Valor de Mercado total da empresa (Preço da Ação × Quantidade de Ações)."
                                />
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="lg:col-span-2">
                            <ComparisonChart data={chartData} ticker1={t1} ticker2={t2} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatRow({ label, v1, v2, isCurrency, suffix, isCompact, description }: any) {
    const format = (v: number) => {
        if (v === undefined || v === null) return "-";
        if (isCompact) {
            if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
            return `${(v / 1e6).toFixed(1)}M`;
        }
        if (isCurrency) return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        return v.toFixed(2) + (suffix || "");
    }

    // Highlight winner (simple logic: higher is better usually, except P/E maybe, but keeping simple)
    const highlight1 = v1 > v2 ? "font-black" : "";
    const highlight2 = v2 > v1 ? "font-black" : "";

    return (
        <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-0 relative group/tooltip">
            <div className="flex items-center gap-2 cursor-help">
                <span className="text-sm font-medium text-zinc-500 border-b border-dotted border-zinc-400">{label}</span>
                {/* Tooltip */}
                <div className="absolute left-0 bottom-full mb-2 w-48 p-3 bg-zinc-900 text-white text-xs rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 shadow-xl pointer-events-none">
                    {description}
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-zinc-900"></div>
                </div>
            </div>
            <span className={`text-right ${highlight1}`}>{format(v1)}</span>
            <span className={`text-right ${highlight2}`}>{format(v2)}</span>
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <CompareContent />
        </Suspense>
    );
}
