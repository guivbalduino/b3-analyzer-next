"use client";

import { useState } from "react";
import { Brain, Sparkles, Loader2, TrendingUp, TrendingDown, Target, AlertTriangle, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PortfolioAIAdvisorProps {
    portfolio: any[];
}

export default function PortfolioAIAdvisor({ portfolio }: PortfolioAIAdvisorProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState("");

    const analyzePortfolio = async () => {
        if (portfolio.length === 0) return;

        setLoading(true);
        setError("");
        setAnalysis(null);

        try {
            // 1. Fetch deep context for each asset (2Y history + news)
            const deepData = await Promise.all(
                portfolio.map(async (item) => {
                    const [histRes, newsRes] = await Promise.all([
                        fetch(`/api/stock/${item.symbol}/historical?period=2Y`),
                        fetch(`/api/stock/${item.symbol}/news`)
                    ]);

                    const history = histRes.ok ? await histRes.json() : [];
                    const news = newsRes.ok ? await newsRes.json() : [];

                    return {
                        symbol: item.symbol,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        sector: item.sector,
                        history,
                        news
                    };
                })
            );

            // 2. Call specialized AI Analysis endpoint (or simulate with a local prompt to existing service)
            // For now, we'll create a dedicated prompt for portfolio strategy
            const res = await fetch("/api/portfolio/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ portfolio: deepData })
            });

            if (!res.ok) throw new Error("Falha na análise da IA");

            const result = await res.json();
            setAnalysis(result.analysis);
        } catch (err: any) {
            setError(err.message || "Erro ao processar análise estratégica");
        } finally {
            setLoading(false);
        }
    };

    if (portfolio.length === 0) return null;

    return (
        <section className="mt-12">
            {!analysis && !loading ? (
                <div className="p-10 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-[3rem] text-white shadow-2xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain size={120} />
                    </div>

                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                                <Sparkles className="text-white" size={24} />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Estrategista de Carteira IA</h2>
                        </div>

                        <p className="text-zinc-400 font-medium leading-relaxed mb-8">
                            Nossa IA analisará o histórico de <span className="text-white font-bold">2 anos</span> de cada ativo, comparando tendências técnicas com o <span className="text-white font-bold">sentimento das notícias</span> mais recentes para sugerir ajustes estratégicos.
                        </p>

                        <button
                            onClick={analyzePortfolio}
                            className="px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center gap-3"
                        >
                            Gerar Relatório de Estratégia
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            ) : loading ? (
                <div className="p-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center gap-6">
                    <div className="relative">
                        <Loader2 className="animate-spin text-emerald-500" size={60} />
                        <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500/40" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black dark:text-white">Processando Bilhões de Pontos de Dados...</h3>
                        <p className="text-zinc-500 font-medium mt-2">Correlacionando histórico de 2 anos e notícias em tempo real.</p>
                    </div>
                </div>
            ) : analysis && (
                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
                    <div className="p-10 bg-gradient-to-r from-zinc-900 to-zinc-800 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-emerald-500 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20">
                                <Brain size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Estrategista de Portfólio IA</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Relatório Estratégico em Tempo Real</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setAnalysis(null)}
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                        >
                            Nova Análise
                        </button>
                    </div>

                    <div className="p-10 md:p-14 max-w-none prose prose-zinc dark:prose-invert">
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => <h1 className="text-4xl font-black tracking-tighter mb-8 bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-black tracking-tight text-emerald-500 uppercase mt-12 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>
                                    {children}
                                </h2>,
                                h3: ({ children }) => <h3 className="text-lg font-black tracking-tight text-zinc-800 dark:text-zinc-200 mt-8 mb-4">{children}</h3>,
                                p: ({ children }) => <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-[1.8] mb-6">{children}</p>,
                                ul: ({ children }) => <ul className="space-y-4 my-8 list-none p-0">{children}</ul>,
                                li: ({ children }) => (
                                    <li className="flex items-start gap-4 text-zinc-600 dark:text-zinc-300 font-bold p-6 bg-zinc-50 dark:bg-zinc-800/40 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500/50 shrink-0"></div>
                                        {children}
                                    </li>
                                ),
                                strong: ({ children }) => <strong className="font-black text-zinc-900 dark:text-white bg-emerald-500/5 px-1 rounded">{children}</strong>,
                            }}
                        >
                            {analysis}
                        </ReactMarkdown>
                    </div>

                    <div className="px-10 py-8 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                <AlertTriangle size={20} />
                            </div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed max-w-xl">
                                Esta análise é gerada por IA baseada em dados históricos e fluxo de notícias.
                                Não constitui recomendação de investimento.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">IA Engine:</span>
                            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">GEMINI 2.5 FLASH</span>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-6 p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3">
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}
        </section>
    );
}
