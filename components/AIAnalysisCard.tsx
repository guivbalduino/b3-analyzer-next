"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Brain, Loader2, AlertCircle, ChevronDown, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAiSettings } from "@/hooks/use-ai-settings";

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

interface Model {
    id: string;
    name: string;
    provider: string;
}

export default function AIAnalysisCard({ symbol }: AIAnalysisCardProps) {
    const { selectedModel, updateSelectedModel, visibleModels, isInitialized } = useAiSettings();
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analysisType, setAnalysisType] = useState("completa");

    // Model Selection State
    const [allModels, setAllModels] = useState<Model[]>([]);
    const [showModelMenu, setShowModelMenu] = useState(false);

    useEffect(() => {
        // Fetch available models
        fetch('/api/stock/analysis/models')
            .then(res => res.json())
            .then((data: Model[]) => {
                if (data && data.length > 0) {
                    setAllModels(data);
                }
            })
            .catch(err => console.error("Failed to load models", err));
    }, []);

    // Filter models based on visibility settings
    const availableModels = allModels.filter(m => visibleModels.includes(m.id));

    // Ensure selected model is actually available
    useEffect(() => {
        if (isInitialized && availableModels.length > 0 && !visibleModels.includes(selectedModel)) {
            updateSelectedModel(availableModels[0].id);
        }
    }, [isInitialized, visibleModels, selectedModel, availableModels, updateSelectedModel]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const res = await fetch(`/api/stock/${symbol}/analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
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

    const currentModelName = allModels.find(m => m.id === selectedModel)?.name || "Gemini 2.5 Flash Lite";

    // Cleanup function for markdown
    const cleanMarkdown = (text: string) => {
        if (!text) return "";
        let cleaned = text.trim();
        // Remove markdown code block wrappers
        if (cleaned.startsWith("```markdown")) {
            cleaned = cleaned.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }
        // Remove common introductory phrases if they exist as a single line
        cleaned = cleaned.replace(/^Analista Financeiro CNPI:.*?\n/i, "");
        cleaned = cleaned.replace(/^Aqui está a sua análise.*?:\n/i, "");

        return cleaned;
    };

    if (!isInitialized) return null;

    return (
        <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all duration-500">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Sparkles size={24} />
                        </div>
                        <div className="relative">
                            <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">Análise Inteligente</h3>
                            <button
                                onClick={() => setShowModelMenu(!showModelMenu)}
                                className="group flex items-center gap-1.5 focus:outline-none"
                            >
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                                    Powered by {currentModelName}
                                </span>
                                <ChevronDown size={12} className={`text-indigo-500 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown de Modelos */}
                            {showModelMenu && (
                                <div className="absolute mt-2 w-72 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl shadow-xl z-50 overflow-hidden left-0">
                                    <div className="p-2 max-h-80 overflow-y-auto">
                                        <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                            Selecione o Modelo
                                        </div>
                                        {availableModels.map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    updateSelectedModel(model.id);
                                                    setShowModelMenu(false);
                                                }}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors
                                                    ${selectedModel === model.id
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-600 dark:text-zinc-300'}
                                                `}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{model.name}</span>
                                                    <span className="text-[10px] text-zinc-400 font-medium">{model.provider}</span>
                                                </div>
                                                {selectedModel === model.id && <Check size={14} />}
                                            </button>
                                        ))}
                                        {availableModels.length === 0 && (
                                            <div className="p-4 text-center">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Nenhum modelo ativo</p>
                                                <Link href="/config/ai" className="text-[10px] font-black text-indigo-500 uppercase mt-2 block">Configurar Modelos</Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="prose prose-zinc dark:prose-invert max-w-none 
                                [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-8 [&>h1]:tracking-tighter [&>h1]:text-zinc-900 [&>h1]:dark:text-white
                                [&>h1]:bg-gradient-to-r [&>h1]:from-zinc-900 [&>h1]:to-zinc-500 [&>h1]:bg-clip-text [&>h1]:text-transparent
                                [&>h2]:text-lg [&>h2]:font-black [&>h2]:mb-4 [&>h2]:mt-10 [&>h2]:uppercase [&>h2]:tracking-widest [&>h2]:text-indigo-600 [&>h2]:dark:text-indigo-400 [&>h2]:border-l-4 [&>h2]:border-indigo-500 [&>h2]:pl-4
                                [&>h3]:text-sm [&>h3]:font-black [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-zinc-500 [&>h3]:dark:text-zinc-400 [&>h3]:uppercase [&>h3]:tracking-widest
                                [&>p]:text-zinc-600 [&>p]:dark:text-zinc-300 [&>p]:leading-relaxed [&>p]:mb-6 [&>p]:text-[15px]
                                [&>ul]:mb-8 [&>ul]:space-y-3 [&>li]:text-zinc-600 [&>li]:dark:text-zinc-300 [&>li]:font-medium [&>li]:list-disc [&>li]:ml-6
                                [&>blockquote]:border-l-4 [&>blockquote]:border-zinc-200 [&>blockquote]:dark:border-zinc-800 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:bg-zinc-50/50 [&>blockquote]:dark:bg-zinc-800/30 [&>blockquote]:py-4 [&>blockquote]:rounded-r-3xl [&>blockquote]:mb-8 [&>blockquote]:text-zinc-500
                                [&>strong]:text-zinc-900 [&>strong]:dark:text-white [&>strong]:font-black
                                [&>table]:w-full [&>table]:border-collapse [&>table]:mb-10 [&>table]:rounded-2xl [&>table]:overflow-hidden [&>table]:border [&>table]:border-zinc-100 [&>table]:dark:border-zinc-800
                                [&>table_thead]:bg-zinc-50 [&>table_thead]:dark:bg-zinc-800/50
                                [&>table_th]:p-4 [&>table_th]:text-left [&>table_th]:text-[10px] [&>table_th]:font-black [&>table_th]:uppercase [&>table_th]:tracking-widest [&>table_th]:text-zinc-500
                                [&>table_td]:p-4 [&>table_td]:text-sm [&>table_td]:border-t [&>table_td]:border-zinc-100 [&>table_td]:dark:border-zinc-800 [&>table_td]:text-zinc-600 [&>table_td]:dark:text-zinc-400 [&>table_td]:font-medium
                                [&>table_tr:nth-child(even)]:bg-zinc-50/30 [&>table_tr:nth-child(even)]:dark:bg-zinc-800/20
                            ">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {cleanMarkdown(analysis)}
                                </ReactMarkdown>

                                <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider italic">
                                        <span className="text-zinc-500 dark:text-zinc-400 font-black not-italic mr-1">Disclaimer:</span>
                                        Este relatório é baseado exclusivamente nos dados fornecidos e tem caráter analítico e informativo.
                                        Não constitui recomendação de compra ou venda de ativos.
                                        Investimentos em renda variável envolvem riscos e podem resultar em perdas de capital.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
