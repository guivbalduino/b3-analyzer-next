"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Cpu, Sparkles, Check, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAiSettings } from "@/hooks/use-ai-settings";

interface Model {
    id: string;
    name: string;
    provider: string;
}

export default function AISettingsPage() {
    const { toggleModelVisibility, isVisible, isInitialized } = useAiSettings();
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchModels = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/stock/analysis/models');
            if (!res.ok) throw new Error("Falha ao carregar modelos");
            const data = await res.json();
            setModels(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const modelsByProvider = models.reduce((acc, model) => {
        if (!acc[model.provider]) acc[model.provider] = [];
        acc[model.provider].push(model);
        return acc;
    }, {} as Record<string, Model[]>);

    const getProviderIcon = (provider: string) => {
        switch (provider.toLowerCase()) {
            case 'google': return <Sparkles size={20} className="text-blue-500" />;
            case 'groq': return <Cpu size={20} className="text-orange-500" />;
            case 'cerebras': return <Brain size={20} className="text-purple-500" />;
            default: return <Brain size={20} className="text-emerald-500" />;
        }
    };

    if (!isInitialized) return null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-4 md:p-10">
            <main className="max-w-5xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">
                                    Gestão de <span className="text-indigo-500 text-glow">Modelos IA</span>
                                </h1>
                                <p className="text-zinc-500 text-sm font-medium">Selecione quais modelos estarão disponíveis para análise</p>
                            </div>
                        </div>

                        <button
                            onClick={fetchModels}
                            disabled={loading}
                            className="flex items-center gap-3 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-600 dark:text-zinc-300 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-sm"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin text-indigo-500" />
                            ) : (
                                <Sparkles size={16} className="text-indigo-500" />
                            )}
                            Sincronizar Modelos
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={48} className="animate-spin text-indigo-500" />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando Modelos...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-950/20 p-12 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 text-center flex flex-col items-center">
                        <AlertCircle size={48} className="text-red-500 mb-4 opacity-50" />
                        <p className="text-red-600 dark:text-red-400 font-black mb-2">Ops! {error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
                            <div key={provider} className="flex flex-col gap-6">
                                <div className="flex items-center gap-3 px-4">
                                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                        {getProviderIcon(provider)}
                                    </div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{provider}</h2>
                                </div>
                                <div className="space-y-4">
                                    {providerModels.map((model) => {
                                        const active = isVisible(model.id);
                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => toggleModelVisibility(model.id)}
                                                className={`
                                                    w-full p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden group
                                                    ${active
                                                        ? 'bg-white dark:bg-zinc-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                                        : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-transparent grayscale opacity-60 hover:opacity-80 hover:grayscale-0'}
                                                `}
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-sm font-black transition-colors ${active ? 'text-indigo-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                            {model.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                            {model.id}
                                                        </span>
                                                    </div>
                                                    <div className={`
                                                        w-10 h-10 rounded-2xl flex items-center justify-center transition-all
                                                        ${active
                                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}
                                                    `}>
                                                        {active ? <Eye size={18} strokeWidth={3} /> : <EyeOff size={18} />}
                                                    </div>
                                                </div>
                                                {active && (
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl -mr-8 -mt-8" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-zinc-900 dark:bg-zinc-100 rounded-[2.5rem] p-10 text-white dark:text-zinc-900 shadow-2xl shadow-zinc-950/20 relative overflow-hidden">
                    <div className="relative z-10 max-w-3xl">
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Visibilidade e Controle</p>
                        <h3 className="text-2xl font-black mb-4 leading-tight">Escolha os modelos que você realmente usa.</h3>
                        <p className="text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed opacity-80">
                            Ative apenas os modelos que você deseja ver no seletor de IA nas páginas de ativos. Isso mantém sua interface limpa e focada nos provedores que oferecem a melhor performance para sua estratégia de investimento.
                        </p>
                    </div>
                    <Brain size={240} className="absolute -right-20 -bottom-20 text-zinc-800 dark:text-zinc-200 opacity-50 rotate-12" />
                </div>
            </main>

            <style jsx global>{`
                .text-glow {
                    text-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
                }
            `}</style>
        </div>
    );
}
