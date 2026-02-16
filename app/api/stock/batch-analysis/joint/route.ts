import { NextRequest, NextResponse } from 'next/server';
import { generateBatchJointAnalysis } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { analyses, model } = body;

        if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
            return NextResponse.json({ error: 'Nenhuma análise fornecida para consolidação' }, { status: 400 });
        }

        const jointAnalysis = await generateBatchJointAnalysis(
            analyses,
            model || 'gemini-2.5-flash'
        );

        return NextResponse.json({ analysis: jointAnalysis });
    } catch (error: any) {
        console.error('Batch Joint Analysis API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao gerar análise conjunta' },
            { status: 500 }
        );
    }
}
