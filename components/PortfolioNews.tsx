"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

interface NewsItem {
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime: string;
    sentiment: 'HIGH_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'HIGH_NEGATIVE';
    symbol: string;
}

interface PortfolioNewsProps {
    symbols: string[];
}

export default function PortfolioNews({ symbols }: PortfolioNewsProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAllNews() {
            if (symbols.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const results = await Promise.all(
                    symbols.map(s =>
                        fetch(`/api/stock/${s}/news`)
                            .then(res => res.ok ? res.json() : [])
                            .then(data => data.map((item: any) => ({ ...item, symbol: s })))
                            .catch(() => [])
                    )
                );

                // Flatten and sort by time
                const flattened = results.flat().sort((a, b) =>
                    new Date(b.providerPublishTime).getTime() - new Date(a.providerPublishTime).getTime()
                );

                setNews(flattened.slice(0, 10)); // Top 10 latest
            } catch (err) {
                console.error("Error fetching portfolio news:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchAllNews();
    }, [symbols]);

    const getSentimentBadge = (sentiment: NewsItem['sentiment']) => {
        switch (sentiment) {
            case 'HIGH_POSITIVE':
                return <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-500"><TrendingUp size={12} /></div>;
            case 'POSITIVE':
                return <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400"><TrendingUp size={12} /></div>;
            case 'NEGATIVE':
                return <div className="p-1.5 rounded-full bg-red-500/10 text-red-400"><TrendingDown size={12} /></div>;
            case 'HIGH_NEGATIVE':
                return <div className="p-1.5 rounded-full bg-red-500/20 text-red-500"><TrendingDown size={12} /></div>;
            default:
                return <div className="p-1.5 rounded-full bg-zinc-500/10 text-zinc-400"><Minus size={12} /></div>;
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm animate-pulse">
                <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    if (symbols.length === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <Newspaper size={20} />
                </div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Radar de Notícias da Carteira</h3>
            </div>

            <div className="space-y-4">
                {news.length > 0 ? (
                    news.map((item) => (
                        <a
                            key={item.uuid}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all border border-transparent hover:border-emerald-500/20"
                        >
                            <div className="shrink-0 mt-1">
                                {getSentimentBadge(item.sentiment)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-black rounded-md">
                                        {item.symbol}
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                        {item.publisher}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold leading-tight group-hover:text-emerald-500 transition-colors line-clamp-2">
                                    {item.title}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400 font-medium">
                                    <Clock size={10} />
                                    {new Date(item.providerPublishTime).toLocaleString('pt-BR')}
                                </div>
                            </div>

                            <ExternalLink size={14} className="text-zinc-300 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                    ))
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-zinc-500 font-medium italic">Nenhuma notícia relevante encontrada para seus ativos.</p>
                    </div>
                )}
            </div>

            {news.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 text-center">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Exibindo os últimos 10 acontecimentos
                    </p>
                </div>
            )}
        </div>
    );
}
