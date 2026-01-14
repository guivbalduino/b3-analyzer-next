import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalData } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1Y';

    if (!symbol) {
        return NextResponse.json({ error: 'Símbolo não fornecido' }, { status: 400 });
    }

    try {
        const data = await getHistoricalData(symbol, period);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar dados históricos' },
            { status: 500 }
        );
    }
}
