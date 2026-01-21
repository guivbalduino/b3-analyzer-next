"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain, Loader2, AlertCircle, ChevronDown, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface AIAnalysisCardProps {
    symbol: string;
}

const ANALYSIS_TYPES = [
    { id: "completa", name: "Completa", icon: "💎", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "tecnica", name: "Técnica", icon: "📈", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "fundamentalista", name: "Fundamental", icon: "🏦", color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "dividendos", name: "Dividendos", icon: "💰", color: "text-rose-500", bg: "bg-rose-500/10" },
    { id: "sentimento", name: "Sentimento", icon: "📰", color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

export default function AIAnalysisCard({ symbol }: AIAnalysisCardProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analysisType, setAnalysisType] = useState("completa");


    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const res = await fetch(`/api/stock/${symbol}/analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash-lite',
                    analysisType: analysisType
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Falha ao gerar análise");
            }

            const data = await res.json();
            setAnalysis(data.analysis);
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro ao gerar a análise por IA.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-500">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">Análise Inteligente</h3>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Powered by Gemini 2.5 Flash Lite</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tipo de análise:</span>
                            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                {ANALYSIS_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setAnalysisType(type.id)}
                                        disabled={loading}
                                        title={type.name}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all
                                            ${analysisType === type.id
                                                ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white'
                                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                            }
                                        `}
                                    >
                                        <span className="text-sm">{type.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-tight">{type.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="flex items-center gap-3 px-8 py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-zinc-900/10 dark:shadow-white/5 h-fit self-end md:self-center"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <Brain size={16} />
                                    Gerar Análise
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {(loading || error || analysis) && (
                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col gap-6 animate-pulse">
                            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
                            </div>
                            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/2 mt-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5"></div>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-32"></div>
                                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-32"></div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-red-500 bg-red-50/50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/20">
                            <AlertCircle size={48} className="mb-4 opacity-50" />
                            <h4 className="text-lg font-black uppercase tracking-tight mb-2">Ops! Algo deu errado</h4>
                            <p className="text-sm font-bold opacity-80 max-w-sm mx-auto">{error}</p>
                            <button
                                onClick={handleGenerate}
                                className="mt-6 px-6 py-2 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    ) : analysis ? (
                        <div className="prose prose-zinc dark:prose-invert max-w-none 
                            [&>h1]:text-2xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:tracking-tight [&>h1]:text-zinc-900 [&>h1]:dark:text-white
                            [&>h2]:text-lg [&>h2]:font-black [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:uppercase [&>h2]:tracking-widest [&>h2]:text-indigo-500 [&>h2]:flex [&>h2]:items-center [&>h2]:gap-2
                            [&>p]:text-zinc-600 [&>p]:dark:text-zinc-400 [&>p]:leading-relaxed [&>p]:mb-4 [&>p]:font-medium
                            [&>ul]:mb-6 [&>ul]:space-y-2 [&>li]:text-zinc-600 [&>li]:dark:text-zinc-400 [&>li]:font-semibold [&>li]:list-disc [&>li]:ml-4
                            [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:bg-zinc-50 [&>blockquote]:dark:bg-zinc-800/50 [&>blockquote]:py-2 [&>blockquote]:rounded-r-xl [&>blockquote]:mb-6
                            [&>strong]:text-zinc-900 [&>strong]:dark:text-white [&>strong]:font-black
                        ">
                            <ReactMarkdown>{analysis}</ReactMarkdown>

                            <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                                <p className="text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider italic">
                                    <span className="text-zinc-500 dark:text-zinc-400 font-black not-italic mr-1">Disclaimer:</span>
                                    Este relatório é baseado exclusivamente nos dados fornecidos e tem caráter analítico e informativo.
                                    Não constitui recomendação de compra ou venda de ativos.
                                    Investimentos em renda variável envolvem riscos e podem resultar em perdas de capital.
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
