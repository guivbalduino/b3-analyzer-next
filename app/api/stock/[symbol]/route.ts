import { NextRequest, NextResponse } from 'next/server';
import { getStockData } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ error: 'Símbolo não fornecido' }, { status: 400 });
    }

    try {
        const data = await getStockData(symbol);
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados do ativo' },
            { status: 500 }
        );
    }
}
