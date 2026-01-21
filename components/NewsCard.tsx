"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsItem {
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime: string;
    sentiment: 'HIGH_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'HIGH_NEGATIVE';
    score: number;
}

interface NewsCardProps {
    symbol: string;
}

export default function NewsCard({ symbol }: NewsCardProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchNews() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/stock/${symbol}/news`);
                if (!res.ok) throw new Error("Falha ao carregar notícias");
                const data = await res.json();
                setNews(data);
            } catch (err) {
                setError("Não foi possível carregar as notícias.");
            } finally {
                setLoading(false);
            }
        }

        if (symbol) {
            fetchNews();
        }
    }, [symbol]);

    const getSentimentBadge = (sentiment: NewsItem['sentiment']) => {
        switch (sentiment) {
            case 'HIGH_POSITIVE':
                return (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
                        <TrendingUp size={10} /> Forte Positivo
                    </div>
                );
            case 'POSITIVE':
                return (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">
                        <TrendingUp size={10} /> Positivo
                    </div>
                );
            case 'NEGATIVE':
                return (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase">
                        <TrendingDown size={10} /> Negativo
                    </div>
                );
            case 'HIGH_NEGATIVE':
                return (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-black uppercase">
                        <TrendingDown size={10} /> Forte Negativo
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 text-[10px] font-black uppercase">
                        <Minus size={10} /> Neutro
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm animate-pulse">
                <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-3 text-red-500 text-sm font-bold">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-zinc-400 uppercase tracking-widest text-xs font-black">
                    <Newspaper size={16} className="text-emerald-500" />
                    Últimas Notícias
                </h3>
            </div>

            <div className="flex flex-col gap-4">
                {news.length > 0 ? (
                    news.slice(0, 5).map((item) => (
                        <a
                            key={item.uuid}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all border border-transparent hover:border-emerald-500/20"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <h4 className="text-sm font-bold leading-tight group-hover:text-emerald-500 transition-colors line-clamp-2">
                                    {item.title}
                                </h4>
                                <ExternalLink size={14} className="text-zinc-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                    <span>{item.publisher}</span>
                                    <span>•</span>
                                    <span>{new Date(item.providerPublishTime).toLocaleDateString('pt-BR')}</span>
                                </div>
                                {getSentimentBadge(item.sentiment)}
                            </div>
                        </a>
                    ))
                ) : (
                    <p className="text-zinc-500 text-sm font-medium text-center py-4">Nenhuma notícia recente encontrada.</p>
                )}
            </div>

            {news.length > 5 && (
                <p className="text-[10px] text-center font-bold text-zinc-500 uppercase tracking-widest">
                    Exibindo as 5 notícias mais recentes
                </p>
            )}
        </div>
    );
}
