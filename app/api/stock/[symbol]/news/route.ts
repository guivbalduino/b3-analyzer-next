import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { analyzeSentiment } from '@/lib/news-analysis';

const yf = new YahooFinance();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ error: 'Símbolo não fornecido' }, { status: 400 });
    }

    try {
        // We search for the ticker to get related news
        // For Brazilian stocks, searching for the name + ticker often yields better results in Portuguese
        const searchResults = await yf.search(symbol.toUpperCase());

        const news = searchResults.news || [];

        const analyzedNews = news.map(item => {
            const analysis = analyzeSentiment(`${item.title} ${item.publisher || ''}`);
            return {
                uuid: item.uuid,
                title: item.title,
                publisher: item.publisher,
                link: item.link,
                providerPublishTime: item.providerPublishTime,
                sentiment: analysis.sentiment,
                score: analysis.score,
                type: item.type
            };
        });

        // Filter and sort by date (newest first)
        const sortedNews = analyzedNews
            .sort((a, b) => new Date(b.providerPublishTime).getTime() - new Date(a.providerPublishTime).getTime());

        return NextResponse.json(sortedNews);
    } catch (error: any) {
        console.error('News API Error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar notícias do ativo' },
            { status: 500 }
        );
    }
}
