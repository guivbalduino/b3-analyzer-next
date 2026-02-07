/**
 * Extrai o veredito de uma string markdown de análise
 * Busca pelo padrão do título de Veredito definido nos prompts
 */
export function extractVerdict(markdown: string): string {
    if (!markdown) return "N/A";

    const normalized = markdown.toUpperCase();

    // Busca na seção de Veredito (Prompt Completa usa ## 🎯 Veredito)
    const verdictSection = normalized.split('VEREDITO')[1];

    if (!verdictSection) return "MANTER";

    // Padrões comuns de indicação
    if (verdictSection.includes('FORTE COMPRA')) return 'FORTE COMPRA';
    if (verdictSection.includes('FORTE VENDA')) return 'FORTE VENDA';
    if (verdictSection.includes('COMPRA')) return 'COMPRA';
    if (verdictSection.includes('VENDA')) return 'VENDA';
    if (verdictSection.includes('MANTER') || verdictSection.includes('NEUTRO')) return 'MANTER';

    return "MANTER";
}

export function getVerdictColor(verdict: string): string {
    switch (verdict) {
        case 'FORTE COMPRA': return 'text-emerald-500 bg-emerald-500/10';
        case 'COMPRA': return 'text-emerald-400 bg-emerald-400/10';
        case 'FORTE VENDA': return 'text-rose-500 bg-rose-500/10';
        case 'VENDA': return 'text-rose-400 bg-rose-400/10';
        default: return 'text-zinc-400 bg-zinc-400/10';
    }
}
