"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCw, Trophy, Star, Clock, Hourglass, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnalysisItem {
    symbol: string;
    name: string;
    status: 'pending' | 'processing' | 'cooldown' | 'completed' | 'error';
    retries: number;
    result?: string;
    error?: string;
    lastAttempt?: number;
}

interface BatchAnalysisProps {
    favorites: { symbol: string; name: string }[];
}

export default function BatchAnalysis({ favorites }: BatchAnalysisProps) {
    const [queue, setQueue] = useState<AnalysisItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [jointAnalysis, setJointAnalysis] = useState<string | null>(null);
    const [rankedList, setRankedList] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    // Critical state for sequential lock
    const isFetchingRef = useRef(false);
    const queueRef = useRef<AnalysisItem[]>([]);
    const cooldownRef = useRef(0);
    const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Keep queueRef in sync with state for access in async calls without closure issues
    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    const startAnalysis = () => {
        const initialQueue: AnalysisItem[] = favorites.map(f => ({
            symbol: f.symbol,
            name: f.name,
            status: 'pending',
            retries: 0
        }));
        setQueue(initialQueue);
        queueRef.current = initialQueue;
        setIsProcessing(true);
        setJointAnalysis(null);
        setRankedList([]);
        setShowResults(false);
        isFetchingRef.current = false;
        setCooldownTime(0);
        cooldownRef.current = 0;
        setExpandedItem(null);
    };

    const runAnalysisLoop = useCallback(async () => {
        // Guard against multiple concurrent loops or cooldown
        if (isFetchingRef.current || cooldownRef.current > 0 || !isProcessing) return;

        const currentQueue = queueRef.current;
        const nextIdx = currentQueue.findIndex(item => {
            const isPending = item.status === 'pending';
            const canRetry = item.status === 'error' && item.retries < 2 && (Date.now() - (item.lastAttempt || 0) > 60000);
            return isPending || canRetry;
        });

        if (nextIdx === -1) {
            // Check if finished
            const allFinished = currentQueue.every(item => item.status === 'completed' || (item.status === 'error' && item.retries >= 2));
            if (allFinished && currentQueue.length > 0 && !jointAnalysis) {
                await generateJoint();
            }
            return;
        }

        // LOCK
        isFetchingRef.current = true;
        const item = currentQueue[nextIdx];

        setQueue(prev => prev.map((q, i) => i === nextIdx ? { ...q, status: 'processing', lastAttempt: Date.now() } : q));

        try {
            const response = await fetch(`/api/stock/${item.symbol}/analysis`, {
                method: 'POST',
                body: JSON.stringify({ analysisType: 'completa', model: 'gemini-2.5-flash' }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha na requisição');
            }

            setQueue(prev => prev.map((q, i) => i === nextIdx ? { ...q, status: 'completed', result: data.analysis } : q));

            // Success -> Start 30s cooldown
            startCooldown(30);

        } catch (error: any) {
            console.error(`Error analyzing ${item.symbol}:`, error);
            setQueue(prev => prev.map((q, i) => i === nextIdx ? {
                ...q,
                status: 'error',
                retries: q.retries + 1,
                error: error.message || 'Erro de requisição'
            } : q));

            // Wait 30s even on error to follow rate limits
            startCooldown(30);
        } finally {
            isFetchingRef.current = false;
        }
    }, [isProcessing, jointAnalysis]);

    const startCooldown = (seconds: number) => {
        setCooldownTime(seconds);
        cooldownRef.current = seconds;
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

        cooldownIntervalRef.current = setInterval(() => {
            setCooldownTime(prev => {
                const next = prev - 1;
                cooldownRef.current = next;
                if (next <= 0) {
                    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
                    return 0;
                }
                return next;
            });
        }, 1000);
    };

    const generateJoint = async () => {
        isFetchingRef.current = true;
        const successful = queueRef.current.filter(q => q.status === 'completed').map(q => ({
            symbol: q.symbol,
            content: q.result || ''
        }));

        if (successful.length === 0) {
            setIsProcessing(false);
            isFetchingRef.current = false;
            return;
        }

        try {
            const response = await fetch('/api/stock/batch-analysis/joint', {
                method: 'POST',
                body: JSON.stringify({ analyses: successful }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Falha na análise conjunta');

            const data = await response.json();
            const text = data.analysis;

            const jsonStart = text.indexOf('### JSON_DATA_START');
            const jsonEnd = text.indexOf('### JSON_DATA_END');

            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = text.substring(jsonStart + 19, jsonEnd).trim();
                try {
                    setRankedList(JSON.parse(jsonStr));
                } catch (e) { }
                setJointAnalysis(text.substring(0, jsonStart).trim());
            } else {
                setJointAnalysis(text);
            }

            setIsProcessing(false);
            setShowResults(true);
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
        } finally {
            isFetchingRef.current = false;
        }
    };

    // Controller effect: runs every second to check if it can move forward
    useEffect(() => {
        const interval = setInterval(() => {
            if (isProcessing) {
                runAnalysisLoop();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isProcessing, runAnalysisLoop]);

    if (!favorites || favorites.length === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-zinc-100 dark:ring-zinc-800">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-none tracking-tighter">Análise em Lote</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Estrategista IA</p>
                    </div>
                </div>

                {!isProcessing && !showResults && (
                    <button
                        onClick={startAnalysis}
                        className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black text-xs uppercase tracking-tighter hover:scale-[1.02] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                        Analisar Carteira
                    </button>
                )}

                {isProcessing && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                                <Loader2 size={10} className="animate-spin" />
                                {isFetchingRef.current ? 'Extraindo Dados...' : 'Em Fila'}
                            </div>
                            {cooldownTime > 0 && (
                                <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                    <Hourglass size={10} className="animate-spin" />
                                    <span>Cooldown: {cooldownTime}s</span>
                                </div>
                            )}
                        </div>
                        {/* Overall Progress Bar */}
                        {/* Overall Progress Bar */}
                        <div className="flex flex-col gap-1.5 mt-1">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                <span>Progresso Total</span>
                                <span>{Math.round((queue.filter(q => q.status === 'completed').length / queue.length) * 100)}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${(queue.filter(q => q.status === 'completed').length / queue.length) * 100}%` }}
                                />
                            </div>
                            <div className="text-[8px] font-bold text-zinc-400 text-right">
                                {queue.filter(q => q.status === 'completed').length} de {queue.length} ativos
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Queue - Vertical List */}
            {queue.length > 0 && (
                <div className="flex-1 overflow-y-auto max-h-[600px] p-4 bg-zinc-50/20 dark:bg-black/10">
                    <div className="space-y-3">
                        {queue.map((item) => (
                            <div key={item.symbol} className="flex flex-col gap-1">
                                <div
                                    className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${item.status === 'completed' ? 'bg-white dark:bg-zinc-800 border-emerald-500/20 text-zinc-900 dark:text-white' :
                                        item.status === 'processing' ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-md ring-1 ring-zinc-900/5' :
                                            item.status === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-500/20 text-red-700 dark:text-red-400' :
                                                'bg-white/50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-60'
                                        }`}
                                    onClick={() => item.status === 'completed' && setExpandedItem(expandedItem === item.symbol ? null : item.symbol)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black ${item.status === 'completed' ? 'bg-emerald-500 text-white' :
                                            item.status === 'processing' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' :
                                                item.status === 'error' ? 'bg-red-500 text-white' :
                                                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {item.status === 'completed' ? <CheckCircle2 size={12} /> :
                                                item.status === 'processing' ? <Loader2 size={12} className="animate-spin" /> :
                                                    item.status === 'error' ? <AlertCircle size={12} /> :
                                                        <Hourglass size={10} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs uppercase tracking-tight">{item.symbol}</span>
                                            {item.status === 'error' && item.retries < 2 && (
                                                <span className="text-[8px] font-bold text-red-500 uppercase mt-0.5">Aguardando retry</span>
                                            )}
                                        </div>
                                    </div>

                                    {item.status === 'completed' && (
                                        <div className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                                            {expandedItem === item.symbol ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                    )}
                                </div>

                                {/* Collapsible Analysis Content */}
                                {expandedItem === item.symbol && item.result && (
                                    <div className="mt-1 p-5 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl shadow-inner animate-in slide-in-from-top-2 duration-300">
                                        <div className="prose prose-zinc dark:prose-invert prose-xs max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {item.result}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showResults && jointAnalysis && (
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        onClick={() => setShowResults(true)} // Re-open results modal if needed, or just scroll to it
                        className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trophy size={14} />
                        Ver Análise Estratégica
                    </button>

                    {/* Final Result Modal / Overlay */}
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800">
                            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                        <Trophy size={20} />
                                    </div>
                                    <h2 className="text-xl font-black tracking-tighter dark:text-white uppercase">Estratégia de Carteira</h2>
                                </div>
                                <button
                                    onClick={() => setShowResults(false)}
                                    className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                >
                                    <ChevronDown size={20} className="text-zinc-600 dark:text-white" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Joint Analysis Content */}
                                <div className="prose prose-zinc dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {jointAnalysis}
                                    </ReactMarkdown>
                                </div>

                                {/* Ranking */}
                                {rankedList.length > 0 && (
                                    <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8">
                                        <h3 className="text-white font-black uppercase text-sm mb-6 flex items-center gap-2 tracking-widest">
                                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                            Ranking de Ativos
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-white/10">
                                                        <th className="pb-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Ativo</th>
                                                        <th className="pb-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Sinal IA</th>
                                                        <th className="pb-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 text-right">IA Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rankedList.sort((a, b) => b.score - a.score).map((item) => (
                                                        <tr key={item.symbol} className="border-b border-white/5 last:border-0">
                                                            <td className="py-4 text-white font-black px-2">{item.symbol}</td>
                                                            <td className="py-4 px-2">
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${item.signal.includes('COMPRA') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                    item.signal.includes('VENDA') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                                                    }`}>
                                                                    {item.signal}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-right px-2">
                                                                <span className="text-white font-black text-lg">{item.score}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
