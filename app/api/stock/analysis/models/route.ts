import { NextResponse } from 'next/server';
import { listAvailableModels } from '@/lib/ai-service';

export async function GET() {
    try {
        const models = await listAvailableModels();
        return NextResponse.json(models);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar modelos' }, { status: 500 });
    }
}
