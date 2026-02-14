"use client";

import { useState } from "react";
import { useUserActions } from "@/hooks/useUserActions";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BulkImportPage() {
    const { bulkAddFavorites } = useUserActions();
    const [text, setText] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleImport = async () => {
        // Split by comma, newline, or space and filter out empty strings
        const symbols = text
            .split(/[\n,\s]+/)
            .map(s => s.trim().toUpperCase())
            .filter(s => s.length > 0);

        if (symbols.length === 0) return;

        await bulkAddFavorites(symbols);
        setIsSuccess(true);

        // Redirect after a short delay
        setTimeout(() => {
            router.push("/favoritos");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/favoritos" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                            Importação em Massa
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2 font-medium">Cole seus tickers favoritos abaixo (PETR4, VALE3, etc.)</p>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-20 transition duration-1000 group-focus-within:duration-200"></div>
                    <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="PETR4&#10;VALE3&#10;ITUB4, BBAS3&#10;MGLU3 BTC3"
                            className="w-full h-64 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-0 rounded-2xl p-6 font-mono text-lg outline-none transition-all resize-none dark:text-emerald-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-800"
                        />

                        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3 text-zinc-400 text-sm font-bold uppercase tracking-widest">
                                <AlertCircle size={16} className="text-emerald-500" />
                                <span>Separe por vírgula, espaço ou quebra de linha</span>
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
                                        Adicionar Favoritos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                        <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-xs mb-3">Dica Pro</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Você pode copiar uma coluna inteira do Excel ou uma lista de um chat e simplesmente colar aqui. O sistema limpará e formatará cada ticker automaticamente.
                        </p>
                    </div>
                    <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                        <h3 className="font-black text-emerald-500 uppercase tracking-widest text-xs mb-3">Formatos Aceitos</h3>
                        <ul className="text-zinc-500 text-sm space-y-1">
                            <li>• PETR4, VALE3, ITUB4</li>
                            <li>• BBAS3 (espaço) SANB11</li>
                            <li>• Lista com linha individual</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
