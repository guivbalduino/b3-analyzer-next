"use client";

import { useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PortfolioImportPage() {
    const { bulkAddToPortfolio } = usePortfolio();
    const [text, setText] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleImport = async () => {
        // Parse lines: SYMBOL;QUANTITY or SYMBOL,QUANTITY or SYMBOL QUANTITY
        const lines = text.split("\n");
        const entries: { symbol: string, quantity: number }[] = [];

        lines.forEach(line => {
            const parts = line.split(/[;, ]+/).map(p => p.trim());
            if (parts.length >= 1) {
                const symbol = parts[0].toUpperCase();
                const quantity = parts.length >= 2 ? Number(parts[1]) : 1;

                if (symbol && !isNaN(quantity)) {
                    entries.push({ symbol, quantity });
                }
            }
        });

        if (entries.length === 0) return;

        await bulkAddToPortfolio(entries);
        setIsSuccess(true);

        // Redirect after a short delay
        setTimeout(() => {
            router.push("/carteira");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/carteira" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                            Importar Carteira
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2 font-medium">Cole seus ativos abaixo no formato: TICKER;QUANTIDADE</p>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-20 transition duration-1000 group-focus-within:duration-200"></div>
                    <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="PETR4;100&#10;VALE3;50&#10;MXRF11;1000"
                            className="w-full h-64 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-0 rounded-2xl p-6 font-mono text-lg outline-none transition-all resize-none dark:text-emerald-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-800"
                        />

                        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3 text-zinc-400 text-sm font-bold uppercase tracking-widest">
                                <AlertCircle size={16} className="text-emerald-500" />
                                <span>Ticker e quantidade separados por ponto-e-vírgula ou espaço</span>
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={!text.trim() || isSuccess}
                                className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isSuccess ? "bg-emerald-500 text-white" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"}`}
                            >
                                {isSuccess ? (
                                    <>
                                        <CheckCircle2 size={20} />
                                        Importado!
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Importar Ativos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-xs mb-3">Como Funciona</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Você pode colar uma lista de ativos com suas quantidades. O sistema irá carregar os preços e informações de cada um automaticamente para a sua nova carteira.
                        </p>
                    </div>
                    <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                        <h3 className="font-black text-emerald-500 uppercase tracking-widest text-xs mb-3">Formatos Aceitos</h3>
                        <ul className="text-zinc-500 text-sm space-y-1">
                            <li>• PETR4;100 (ponto e vírgula)</li>
                            <li>• VALE3 50 (espaço)</li>
                            <li>• ITUB4,200 (vírgula)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
