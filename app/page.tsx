"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, TrendingUp, Calendar, Info, Activity } from "lucide-react";
import ChartSection from "@/components/ChartSection";
import StatisticsGrid from "@/components/StatisticsGrid";

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  name: string;
  currency: string;
  updatedAt: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketVolume: number;
  averageDailyVolume3Month: number;
  marketCap: number;
  trailingPE: number;
}

interface HistoricalData {
  date: string;
  close: number;
}

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [period, setPeriod] = useState("1Y");
  const [loading, setLoading] = useState(false);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistorical = useCallback(async (s: string, p: string) => {
    setHistoricalLoading(true);
    try {
      const res = await fetch(`/api/stock/${s}/historical?period=${p}`);
      if (res.ok) {
        const hData = await res.json();
        setHistoricalData(hData);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico");
    } finally {
      setHistoricalLoading(false);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return;

    setLoading(true);
    setError("");
    setData(null);
    setHistoricalData([]);

    try {
      const res = await fetch(`/api/stock/${symbol}`);

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          setError(errorJson.error || "Erro no servidor.");
        } catch {
          setError(`Erro ${res.status}: Ativo não encontrado.`);
        }
        return;
      }

      const result = await res.json();
      setData(result);
      // Busca o histórico inicial (1Y)
      fetchHistorical(symbol, period);
    } catch (err) {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.symbol) {
      fetchHistorical(data.symbol, period);
    }
  }, [period, data?.symbol, fetchHistorical]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-4 md:p-8">
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
              <TrendingUp className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                B3 <span className="text-emerald-500">Analyzer</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Terminal de Análise Técnica</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md w-full relative">
            <input
              type="text"
              placeholder="Digite o ticker (ex: PETR4)"
              className="w-full h-14 pl-14 pr-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 focus:outline-none transition-all font-bold text-lg"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={24} />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              {loading ? "..." : "Analisar"}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <Info size={20} />
            {error}
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Left Column: Price & Stats */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm h-fit">
                <div className="mb-6">
                  <h2 className="text-4xl font-black">{data.symbol}</h2>
                  <p className="text-zinc-500 font-bold tracking-tight">{data.name}</p>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="text-5xl font-black tracking-tighter">
                    R$ {data.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-black ${data.change >= 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-red-100 text-red-600 dark:bg-red-500/10"}`}>
                    {data.change >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-zinc-50 dark:border-zinc-800">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Moeda</span>
                    <span className="font-black">{data.currency}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Atualizado</span>
                    <div className="flex items-center gap-2 font-black text-sm">
                      <Calendar size={14} className="text-zinc-400" />
                      {new Date(data.updatedAt).toLocaleTimeString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>

              <StatisticsGrid data={data} />
            </div>

            {/* Right Column: Chart */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex gap-2">
                  {["1M", "6M", "1Y", "5Y"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-5 py-2 rounded-2xl font-black text-xs transition-all ${period === p
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 border border-zinc-100 dark:border-zinc-800"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} />
                  Volume em Tempo Real
                </div>
              </div>

              <ChartSection data={historicalData} loading={historicalLoading} />

              <div className="p-8 bg-zinc-900 dark:bg-zinc-100 rounded-[2.5rem] text-white dark:text-zinc-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Dica Profissional</p>
                  <p className="font-bold">Analise as médias móveis e o Market Cap para decisões de longo prazo.</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black">
                    {data.changePercent > 0 ? "↗" : "↘"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!data && !error && (
          <div className="flex flex-col items-center justify-center py-32 opacity-20 filter grayscale">
            <Image src="/next.svg" alt="B3" width={200} height={40} className="dark:invert" />
            <p className="mt-8 font-black uppercase tracking-[0.3em] text-sm">Aguardando Análise</p>
          </div>
        )}
      </main>
    </div>
  );
}
