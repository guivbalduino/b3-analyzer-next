"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Loader2, Sparkles, AlertCircle, TrendingUp, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAiSettings } from "@/hooks/use-ai-settings";
import { extractVerdict, getVerdictColor } from "@/lib/ai-utils";

interface Model {
    id: string;
    name: string;
    provider: string;
}

interface AnalysisResult {
    modelId: string;
    modelName: string;
    analysis: string | null;
    verdict: string;
    loading: boolean;
    error: string | null;
}

function BattleContent() {
    const searchParams = useSearchParams();
    const symbol = searchParams.get("symbol");
    const { visibleModels, isInitialized } = useAiSettings();

    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [allModels, setAllModels] = useState<Model[]>([]);
    const [stats, setStats] = useState({ compra: 0, venda: 0, manter: 0, total: 0 });

    const fetchAnalyses = async (availableModels: Model[]) => {
        const initialResults = availableModels
            .filter(m => visibleModels.includes(m.id))
            .map(m => ({
                modelId: m.id,
                modelName: m.name,
                analysis: null,
                verdict: "N/A",
                loading: true,
                error: null
            }));

        setResults(initialResults);

        // Run analyses in parallel
        initialResults.forEach(res => {
            fetch(`/api/stock/${symbol}/analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: res.modelId, analysisType: 'completa' })
            })
                .then(async r => {
                    const data = await r.json();
                    if (!r.ok) throw new Error(data.error || "Erro na análise");

                    setResults(prev => prev.map(p =>
                        p.modelId === res.modelId
                            ? { ...p, analysis: data.analysis, verdict: extractVerdict(data.analysis), loading: false }
                            : p
                    ));
                })
                .catch(err => {
                    setResults(prev => prev.map(p =>
                        p.modelId === res.modelId
                            ? { ...p, loading: false, error: err.message }
                            : p
                    ));
                });
        });
    };

    useEffect(() => {
        if (!symbol) return;

        // Load models information
        fetch('/api/stock/analysis/models')
            .then(res => res.json())
            .then((data: Model[]) => {
                setAllModels(data);
                fetchAnalyses(data);
            });
    }, [symbol, visibleModels]);

    // Update statistics when results change
    useEffect(() => {
        const activeResults = results.filter(r => !r.loading && !r.error && r.analysis);
        const compra = activeResults.filter(r => r.verdict.includes('COMPRA')).length;
        const venda = activeResults.filter(r => r.verdict.includes('VENDA')).length;
        const manter = activeResults.filter(r => r.verdict === 'MANTER').length;

        setStats({ compra, venda, manter, total: activeResults.length });
    }, [results]);

    if (!symbol) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle size={48} className="text-zinc-400 mb-4" />
                <h2 className="text-xl font-bold">Nenhum ativo selecionado</h2>
                <Link href="/" className="text-indigo-500 font-bold mt-4">Voltar para a Home</Link>
            </div>
        );
    }

    const cleanMarkdown = (text: string) => {
        if (!text) return "";
        let cleaned = text.trim();
        if (cleaned.startsWith("```markdown")) cleaned = cleaned.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
        else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
        return cleaned;
    };

    const handleRetry = () => {
        fetchAnalyses(allModels);
    };

    // Filter results to hide errors from the grid
    const visibleResults = results.filter(r => !r.error);

    return (
        <div className="flex flex-col gap-10">
            {/* Header & Scoreboard */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest">IA Battle Mode</span>
                                <h1 className="text-4xl font-black">{symbol}</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-zinc-500 font-bold">Consenso entre Inteligências</p>
                                <button
                                    onClick={handleRetry}
                                    className="flex items-center gap-2 px-3 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    <TrendingUp size={12} />
                                    Refazer Duelo
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center p-6 bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl min-w-[120px] border border-emerald-100 dark:border-emerald-500/10">
                            <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.compra}/{stats.total}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Compra</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl min-w-[120px] border border-zinc-100 dark:border-zinc-800">
                            <MinusCircle className="text-zinc-400 mb-2" size={24} />
                            <span className="text-2xl font-black">{stats.manter}/{stats.total}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Manter</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-red-50 dark:bg-red-500/5 rounded-3xl min-w-[120px] border border-red-100 dark:border-red-500/10">
                            <XCircle className="text-red-500 mb-2" size={24} />
                            <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats.venda}/{stats.total}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Venda</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {visibleResults.map((res) => (
                    <div key={res.modelId} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 rounded-2xl text-white">
                                    <Brain size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-tight text-sm">{res.modelName}</h3>
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{res.modelId}</span>
                                </div>
                            </div>

                            {res.loading ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                    <Loader2 size={14} className="animate-spin text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Analisando...</span>
                                </div>
                            ) : res.error ? (
                                <div className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Erro na análise</div>
                            ) : (
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getVerdictColor(res.verdict)}`}>
                                    {res.verdict}
                                </div>
                            )}
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                            {res.loading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4"></div>
                                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-full"></div>
                                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6"></div>
                                    <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded w-full mt-8"></div>
                                </div>
                            ) : res.error ? (
                                <div className="text-zinc-400 text-sm font-medium py-10 text-center flex flex-col items-center gap-4">
                                    <AlertCircle size={32} className="opacity-20" />
                                    {res.error}
                                </div>
                            ) : (
                                <div className="prose prose-zinc dark:prose-invert max-w-none 
                                    text-sm leading-relaxed
                                    [&>h2]:text-base [&>h2]:font-black [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:uppercase [&>h2]:tracking-widest [&>h2]:text-indigo-600 [&>h2]:dark:text-indigo-400 [&>h2]:border-l-4 [&>h2]:border-indigo-500 [&>h2]:pl-4
                                    [&>h3]:text-xs [&>h3]:font-black [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-zinc-500 [&>h3]:dark:text-zinc-400 [&>h3]:uppercase [&>h3]:tracking-widest
                                    [&>p]:text-zinc-600 [&>p]:dark:text-zinc-400 [&>p]:mb-4
                                    [&>ul]:mb-6 [&>ul]:space-y-2 [&>li]:text-zinc-600 [&>li]:dark:text-zinc-400 [&>li]:list-disc [&>li]:ml-4
                                    [&>table]:w-full [&>table]:text-[10px] [&>table]:border-collapse [&>table]:mb-6 [&>table]:rounded-xl [&>table]:overflow-hidden
                                    [&>table_td]:p-2 [&>table_td]:border [&>table_td]:border-zinc-100 [&>table_td]:dark:border-zinc-800
                                ">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {cleanMarkdown(res.analysis || "")}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    );
}

export default function AISettingsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-4 md:p-10">
            <main className="max-w-[1600px] mx-auto">
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <Loader2 size={48} className="animate-spin text-indigo-500" />
                    </div>
                }>
                    <BattleContent />
                </Suspense>
            </main>
        </div>
    );
}
