import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 });
    }

    try {
        const { portfolio } = await request.json();

        if (!portfolio || !Array.isArray(portfolio)) {
            return NextResponse.json({ error: 'Dados da carteira inválidos' }, { status: 400 });
        }

        // Format portfolio data for the prompt
        const portfolioData = portfolio.map(item => {
            const historyText = item.history.slice(-10).map((h: any) =>
                `${new Date(h.date).toLocaleDateString('pt-BR')}: R$ ${h.close}`
            ).join('\n');

            const newsText = item.news.slice(0, 3).map((n: any) =>
                `- ${n.title} (Sentimento: ${n.sentiment})`
            ).join('\n');

            return `
### ATIVO: ${item.symbol} (${item.name})
- **Quantidade:** ${item.quantity}
- **Preço Atual:** R$ ${item.price}
- **Setor:** ${item.sector}
- **Histórico Recente (2 anos de tendência):**
${historyText}
  *(Nota: Foram enviados dados de 2 anos, os últimos 10 pontos estão acima)*
- **Notícias de Impacto:**
${newsText}
`;
        }).join('\n---\n');

        const prompt = `
Aja como um Gestor de Portfólio (CFA) e Estrategista Chefe. 
Sua tarefa é analisar a carteira de investimentos abaixo e fornecer um relatório estratégico de alto nível.

---
## DADOS DA CARTEIRA
${portfolioData}

---
## TAREFAS DE ANÁLISE:
1. **PULSO DO MERCADO**: Avalie como os setores da carteira estão performando perante o cenário macro descrito nas notícias.
2. **ANÁLISE DE RISCO/RETORNO**: Identifique ativos que estão em tendência de queda prolongada (baseado no histórico) ou com newsflow negativo.
3. **SUGESTÕES TÁTICAS**: 
    - Recomende se o usuário deve 'Aumentar', 'Reduzir' ou 'Manter' as posições.
    - Sugira diversificação se houver concentração excessiva em algum setor.
4. **CONCLUSÃO ESTRATÉGICA**: Um veredito final sobre a saúde da carteira.

### REGRAS DE FORMATAÇÃO:
- Use **Markdown rico** (Títulos, Negrito, Listas).
- Use **Emojis específicos** para ações (ex: 🟢 Aumentar, 🟡 Manter, 🔴 Reduzir).
- **CRÍTICO: Adicione uma seção de "Legenda de Símbolos" ao final do relatório** explicando cada emoji ou ícone utilizado.
- Tom: **Sério, Profissional e Analítico**.
- Não adicione intros ou conclusões genéricas sobre "não ser recomendação". 
- Seja direto ao ponto.

Responda em Português do Brasil.
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ analysis: text });
    } catch (error: any) {
        console.error('Portfolio Analysis Error:', error);
        return NextResponse.json({ error: 'Erro ao processar análise da carteira' }, { status: 500 });
    }
}
