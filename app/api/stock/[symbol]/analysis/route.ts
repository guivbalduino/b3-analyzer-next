import { NextRequest, NextResponse } from 'next/server';
import { getStockData, getHistoricalData } from '@/lib/yahoo-finance';
import YahooFinance from 'yahoo-finance2';
import { analyzeSentiment } from '@/lib/news-analysis';
import { generateStockAnalysis } from '@/lib/ai-service';

const yf = new YahooFinance();

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    const body = await request.json();
    const { model, analysisType } = body;

    if (!symbol) {
        return NextResponse.json({ error: 'Símbolo não fornecido' }, { status: 400 });
    }

    try {
        // Fetch all necessary data
        const [priceData, historicalData, searchResults] = await Promise.all([
            getStockData(symbol),
            getHistoricalData(symbol, '2Y'), // 2 years of data for analysis
            yf.search(symbol.toUpperCase())
        ]);

        if (!priceData) {
            return NextResponse.json({ error: 'Ativo não encontrado' }, { status: 404 });
        }

        const news = searchResults.news || [];
        const analyzedNews = news.slice(0, 10).map(item => {
            const analysis = analyzeSentiment(`${item.title} ${item.publisher || ''}`);
            return {
                uuid: item.uuid,
                title: item.title,
                publisher: item.publisher,
                sentiment: analysis.sentiment,
                score: analysis.score,
                providerPublishTime: item.providerPublishTime
            };
        });

        const analysis = await generateStockAnalysis(
            symbol,
            priceData,
            historicalData,
            analyzedNews,
            model || 'gemini-2.5-flash-lite',
            analysisType || 'completa'
        );

        return NextResponse.json({ analysis });
    } catch (error: any) {
        console.error('AI Analysis API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao gerar análise por IA' },
            { status: 500 }
        );
    }
}
