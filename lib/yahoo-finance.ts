import YahooFinance from 'yahoo-finance2';
import { subMonths, subYears, startOfDay } from 'date-fns';

const yf = new YahooFinance();

export async function getStockData(symbol: string) {
  const yahooSymbol = symbol.toUpperCase().endsWith('.SA')
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}.SA`;

  try {
    const [quote, summary]: any = await Promise.all([
      yf.quote(yahooSymbol),
      yf.quoteSummary(yahooSymbol, {
        modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData']
      })
    ]);

    if (!quote) {
      throw new Error('Ativo não encontrado.');
    }

    const { summaryDetail, defaultKeyStatistics, financialData } = summary;

    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      name: quote.longName || quote.shortName || quote.symbol,
      currency: quote.currency,
      updatedAt: quote.regularMarketTime,
      // Dados adicionais para análise profissional
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      regularMarketVolume: quote.regularMarketVolume,
      averageDailyVolume3Month: quote.averageDailyVolume3Month,
      marketCap: quote.marketCap,
      trailingPE: quote.trailingPE,
      // Dados para cálculos (Graham, Bazin, etc)
      eps: defaultKeyStatistics?.trailingEps || 0,
      bvps: defaultKeyStatistics?.bookValue || 0,
      dividendRate: summaryDetail?.dividendRate || 0,
      dividendYield: summaryDetail?.dividendYield || 0,
      targetLowPrice: financialData?.targetLowPrice || 0,
      targetMeanPrice: financialData?.targetMeanPrice || 0,
      targetHighPrice: financialData?.targetHighPrice || 0,
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
      events: 'div', // Fetch dividend events
    };

    const result = await yf.chart(yahooSymbol, queryOptions);

    const quotes = result.quotes || [];
    const dividends = result.events?.dividends || [];

    // O retorno do chart() no modo array tem uma estrutura result.quotes
    return quotes.map(item => {
      // Find dividend for this date (if any)
      const dateStr = item.date.toISOString().split('T')[0];
      const dividend = dividends.find(d => d.date.toISOString().split('T')[0] === dateStr);

      return {
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        dividend: dividend ? dividend.amount : null,
        yieldPercent: (dividend && item.close) ? (dividend.amount / item.close) * 100 : null,
      };
    });
  } catch (error: any) {
    console.error(`[Yahoo Finance Chart Error] ${yahooSymbol}:`, error.message);
    throw new Error('Falha ao buscar dados históricos via Chart API.');
  }
}
