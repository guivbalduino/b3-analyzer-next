type Sentiment = 'HIGH_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'HIGH_NEGATIVE';

interface Keywords {
    positive: string[];
    negative: string[];
    strongPositive: string[];
    strongNegative: string[];
}

const keywords: Keywords = {
    positive: [
        'lucro', 'crescimento', 'alta', 'subida', 'dividendos', 'proventos', 'recorde',
        'acima do esperado', 'supera', 'compra', 'recomendação', 'expansão', 'novo contrato',
        'parceria', 'aquisição', 'ebitda', 'margem', 'reforma', 'aprovação', 'otimismo',
        'profit', 'growth', 'buy', 'upgrade', 'expansion', 'record', 'exceeds', 'beats'
    ],
    negative: [
        'prejuízo', 'queda', 'baixa', 'perda', 'abaixo do esperado', 'frustra', 'venda',
        'rebaixamento', 'corte', 'crise', 'investigação', 'denúncia', 'fraude', 'multa',
        'déficit', 'incerteza', 'pessimismo', 'risco', 'conflito', 'greve', 'interrupção',
        'loss', 'drop', 'fall', 'sell', 'downgrade', 'miss', 'penalty', 'risk', 'crisis'
    ],
    strongPositive: [
        'lucro recorde', 'salto', 'dispara', 'explosão de lucro', 'fusão', 'privatização',
        'dobra', 'triplica', 'maior da história', 'surpreende positivamente'
    ],
    strongNegative: [
        'colapso', 'falência', 'rombo', 'calote', 'corrupção', 'desastre', 'impeachmet',
        'bloqueio de bens', 'escândalo', 'intervenção', 'crash'
    ]
};

export function analyzeSentiment(text: string): { sentiment: Sentiment; score: number } {
    const lowerText = text.toLowerCase();
    let score = 0;

    keywords.strongPositive.forEach(word => {
        if (lowerText.includes(word.toLowerCase())) score += 5;
    });

    keywords.positive.forEach(word => {
        if (lowerText.includes(word.toLowerCase())) score += 1;
    });

    keywords.strongNegative.forEach(word => {
        if (lowerText.includes(word.toLowerCase())) score -= 5;
    });

    keywords.negative.forEach(word => {
        if (lowerText.includes(word.toLowerCase())) score -= 1;
    });

    if (score >= 4) return { sentiment: 'HIGH_POSITIVE', score };
    if (score > 0) return { sentiment: 'POSITIVE', score };
    if (score === 0) return { sentiment: 'NEUTRAL', score };
    if (score > -4) return { sentiment: 'NEGATIVE', score };
    return { sentiment: 'HIGH_NEGATIVE', score };
}

export function getImpactDescription(sentiment: Sentiment): string {
    switch (sentiment) {
        case 'HIGH_POSITIVE': return 'Impacto Altamente Positivo';
        case 'POSITIVE': return 'Impacto Positivo';
        case 'NEUTRAL': return 'Impacto Neutro';
        case 'NEGATIVE': return 'Impacto Negativo';
        case 'HIGH_NEGATIVE': return 'Impacto Altamente Negativo';
    }
}
