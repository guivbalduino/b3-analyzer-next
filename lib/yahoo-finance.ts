import YahooFinance from 'yahoo-finance2';
import { subMonths, subYears, startOfDay } from 'date-fns';

const yf = new YahooFinance();

export async function getStockData(symbol: string) {
  const yahooSymbol = symbol.toUpperCase().endsWith('.SA')
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}.SA`;

  try {
    const result: any = await yf.quote(yahooSymbol);

    if (!result) {
      throw new Error('Ativo não encontrado.');
    }

    return {
      symbol: result.symbol,
      price: result.regularMarketPrice,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent,
      name: result.longName || result.shortName || result.symbol,
      currency: result.currency,
      updatedAt: result.regularMarketTime,
      // Dados adicionais para análise profissional
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
      regularMarketVolume: result.regularMarketVolume,
      averageDailyVolume3Month: result.averageDailyVolume3Month,
      marketCap: result.marketCap,
      trailingPE: result.trailingPE,
    };
  } catch (error: any) {
    console.error(`[Yahoo Finance Service Error] ${yahooSymbol}:`, error.message);
    throw new Error(error.message || 'Falha ao buscar dados do ativo.');
  }
}

export async function getHistoricalData(symbol: string, period: string = '1Y') {
  const yahooSymbol = symbol.toUpperCase().endsWith('.SA')
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}.SA`;

  const now = new Date();
  let from: Date;

  switch (period) {
    case '1M':
      from = subMonths(now, 1);
      break;
    case '6M':
      from = subMonths(now, 6);
      break;
    case '1Y':
      from = subYears(now, 1);
      break;
    case '5Y':
      from = subYears(now, 5);
      break;
    default:
      from = subYears(now, 1);
  }

  try {
    // Migrado de historical() para chart() pois historical() está depreciado e instável
    const queryOptions = {
      period1: startOfDay(from),
      period2: now,
      interval: (period === '5Y' ? '1wk' : '1d') as any,
    };

    const result = await yf.chart(yahooSymbol, queryOptions);

    // O retorno do chart() no modo array tem uma estrutura result.quotes
    return (result.quotes || []).map(item => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));
  } catch (error: any) {
    console.error(`[Yahoo Finance Chart Error] ${yahooSymbol}:`, error.message);
    throw new Error('Falha ao buscar dados históricos via Chart API.');
  }
}
