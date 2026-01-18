"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, TrendingUp, Calendar, Info, Activity, Star, ArrowUpRight } from "lucide-react";
import ChartSection from "@/components/ChartSection";
import StatisticsGrid from "@/components/StatisticsGrid";
import DividendChart from "@/components/DividendChart";
import AnalysisSection from "@/components/AnalysisSection";
import TimeMachine from "@/components/TimeMachine";
import { useUserActions } from "@/hooks/useUserActions";

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
  eps: number;
  bvps: number;
  dividendRate: number;
  targetMeanPrice: number;
}

interface HistoricalData {
  date: string;
  close: number;
  dividend: number | null;
  yieldPercent: number | null;
}

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [period, setPeriod] = useState("1Y");
  const [loading, setLoading] = useState(false);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [error, setError] = useState("");

  const { addToHistory, toggleFavorite, isFavorite, favorites, recentSearches } = useUserActions();

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

  const handleSearch = useCallback(async (e: React.FormEvent | string) => {
    let ticker = "";
    if (typeof e === "string") {
      ticker = e;
      setSymbol(e);
    } else {
      e.preventDefault();
      ticker = symbol;
    }

    if (!ticker) return;

    setLoading(true);
    setError("");
    setData(null);
    setHistoricalData([]);

    try {
      const res = await fetch(`/api/stock/${ticker}`);

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
      addToHistory(result.symbol); // Add to history on success
      // Busca o histórico inicial (1Y)
      fetchHistorical(ticker, period);
    } catch (err) {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }, [symbol, period, fetchHistorical, addToHistory]);

  // Handle URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("symbol");
    if (s) {
      handleSearch(s);
    }
  }, [handleSearch]);

  useEffect(() => {
    if (data?.symbol) {
      fetchHistorical(data.symbol, period);
    }
  }, [period, data?.symbol, fetchHistorical]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 p-4 md:p-10">
      <main className="max-w-full mx-auto flex flex-col gap-8">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <TrendingUp className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  B3 <span className="text-emerald-500">Analyzer</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium">Terminal de Análise Técnica</p>
              </div>
            </Link>

            <Link
              href={data ? `/compare?t1=${data.symbol}` : "/compare"}
              className="ml-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-xs hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Activity size={14} />
              COMPARAR
            </Link>

            <Link
              href="/favoritos"
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl text-xs hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Star size={14} />
              FAVORITOS
            </Link>
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

        {data ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Left Column: Price & Stats */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm h-fit">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-black">{data.symbol}</h2>
                    <p className="text-zinc-500 font-bold tracking-tight">{data.name}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(data.symbol, data.name)}
                    className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:scale-105 active:scale-95 transition-all text-amber-400"
                  >
                    <span className={`text-2xl ${isFavorite(data.symbol) ? "opacity-100" : "opacity-30 grayscale"}`}>⭐</span>
                  </button>
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

            {/* Middle Column: Charts */}
            <div className="lg:col-span-2 flex flex-col gap-8">
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
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <Activity size={12} />
                  Análise Técnica Expandida
                </div>
              </div>

              <ChartSection data={historicalData} loading={historicalLoading} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DividendChart data={historicalData} loading={historicalLoading} type="value" />
                <DividendChart data={historicalData} loading={historicalLoading} type="yield" />
              </div>

              <div className="p-8 bg-zinc-900 dark:bg-zinc-100 rounded-[2.5rem] text-white dark:text-zinc-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Dica Profissional</p>
                  <p className="font-bold">Analise as médias móveis, dividendos e Market Cap para decisões de longo prazo.</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black">
                    {data.changePercent > 0 ? "↗" : "↘"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Analysis */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              <AnalysisSection
                data={data}
                historicalData={historicalData}
                loading={historicalLoading}
              />
              <TimeMachine
                data={historicalData}
                currentPrice={data.price}
                symbol={data.symbol}
              />
            </div>
          </div>
        ) : !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            {/* Favorites Widget */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="flex items-center gap-2 text-zinc-400 uppercase tracking-widest text-[10px] font-black">
                  <span className="text-lg">⭐</span> Favoritos
                </h3>
                <Link href="/favoritos" className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  Simular Carteira <ArrowUpRight size={10} />
                </Link>
              </div>
              {favorites && favorites.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {favorites.map(fav => (
                    <button
                      key={fav.symbol}
                      onClick={() => handleSearch(fav.symbol)}
                      className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group group/fav"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-black text-lg">{fav.symbol}</span>
                        <span className="text-xs text-zinc-500 font-bold max-w-[150px] truncate text-left">{fav.name}</span>
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(fav.symbol, fav.name); }}
                        className="opacity-0 group-hover/fav:opacity-100 p-2 hover:text-red-500 transition-all"
                      >
                        ✖
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 font-medium text-sm text-center py-8">Você ainda não tem favoritos.</p>
              )}
            </div>

            {/* Recent Searches Widget */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-400 uppercase tracking-widest text-xs">
                <span className="text-xl">🕒</span> Recentes
              </h3>
              {recentSearches && recentSearches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleSearch(item.symbol)}
                      className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl font-bold cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {item.symbol}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 font-medium text-sm text-center py-8">Nenhuma busca recente.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
