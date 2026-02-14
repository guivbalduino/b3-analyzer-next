import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalCDI } from '@/lib/cdi-service';
import { subMonths, subYears, parse } from 'date-fns';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '1Y';

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
        case '2Y':
            from = subYears(now, 2);
            break;
        case '5Y':
            from = subYears(now, 5);
            break;
        default:
            from = subYears(now, 1);
    }

    try {
        const data = await fetchHistoricalCDI(from, now);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
