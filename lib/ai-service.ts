import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function listAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];

    try {
        // Fetch real available models from Google AI API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (!data.models) return [
            { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google" },
            { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google" },
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
        ];

        return data.models
            .filter((m: any) =>
                m.supportedGenerationMethods.includes('generateContent') &&
                m.name.includes('gemini') &&
                !m.name.includes('vision') &&
                !m.name.includes('audio') &&
                !m.name.includes('tts') &&
                !m.name.includes('imaging') &&
                !m.name.includes('experimental') &&
                !m.name.includes('nano') &&
                !m.name.includes('preview')
            )
            .map((m: any) => ({
                id: m.name.replace('models/', ''),
                name: m.displayName,
                provider: "Google"
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error listing models:", error);
        return [
            { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google" },
            { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google" },
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
        ];
    }
}

export async function generateStockAnalysis(
    symbol: string,
    priceData: any,
    historicalData: any[],
    newsData: any[],
    modelName: string = "gemini-2.5-flash-lite",
    analysisType: string = "completa"
) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY não configurada no servidor.");
    }

    const model = genAI.getGenerativeModel({ model: modelName });

    // Format data into XML for better LLM parsing
    const historicalXml = historicalData.map(d => `
    <record>
        <date>${new Date(d.date).toLocaleDateString('pt-BR')}</date>
        <close>${d.close}</close>
        ${d.dividend ? `<dividend>${d.dividend}</dividend>` : ''}
    </record>`).join('');

    const newsXml = newsData.map(n => `
    <news>
        <title>${n.title}</title>
        <publisher>${n.publisher}</publisher>
        <sentiment>${n.sentiment}</sentiment>
        <date>${new Date(n.providerPublishTime).toLocaleDateString('pt-BR')}</date>
    </news>`).join('');

    const baseContext = `
Aja como um analista financeiro sênior certificado (CNPI) e gestor de portfólio especializado no mercado brasileiro (B3).
Sua tarefa é gerar um relatório de análise para o ativo ${symbol} com base nos dados abaixo:

<current_price>
    <symbol>${symbol}</symbol>
    <price>${priceData.price}</price>
    <change_percent>${priceData.changePercent}</change_percent>
    <name>${priceData.name}</name>
</current_price>

<historical_data>
    ${historicalXml}
</historical_data>

<latest_news>
    ${newsXml}
</latest_news>
`;

    const prompts: Record<string, string> = {
        completa: `
${baseContext}
Gere uma **ANÁLISE ESTRATÉGICA COMPLETA** "PREMIUM".
Estrutura Obrigatória:
- # 💎 Análise Estratégica: ${symbol} - ${priceData.name}
- ## 📊 Panorama Atual: Resumo executivo do preço e variação.
- ## 📈 Análise de Tendência (2 Anos): Comente suporte, resistência e padrões.
- ## 📰 Sentimento & Notícias: Impacto das notícias recentes.
- ## 🎯 Veredito & Perspectivas: Escala [FORTE COMPRA à FORTE VENDA].
- ## 🛡️ Riscos: 2-3 pontos de atenção.
`,
        tecnica: `
${baseContext}
Gere uma **ANÁLISE TÉCNICA DETALHADA**.
Foque exclusivamente em:
- # 📈 Análise Técnica: ${symbol}
- ## 📉 Movimentação de Preço: Analise as variações nos últimos 2 anos.
- ## 🧱 Suportes e Resistências: Identifique níveis críticos de preço.
- ## 🔄 Tendência: Defina se a tendência é de Alta, Baixa ou Lateral.
- ## ⏱️ Timing de Entrada: Melhor momento técnico para operação.
Use terminologia técnica (Médias Móveis, IFR/RSI se possível deduzir, Padrões de Candlestick).
`,
        fundamentalista: `
${baseContext}
Gere uma **ANÁLISE FUNDAMENTALISTA & CONTEXTO**.
Foque em:
- # 🏦 Análise Fundamentalista: ${symbol}
- ## 🏢 Sobre a Empresa: Perfil e setor de atuação.
- ## 💰 Avaliação de Preço: O valor atual parece justo perante o histórico?
- ## 📊 Dividendos & Proventos: Analise o histórico de distribuição presente nos dados.
- ## 🚀 Perspectivas de Longo Prazo: O ativo é resiliente?
`,
        dividendos: `
${baseContext}
Gere um **RELATÓRIO DE DIVIDENDOS (YIELD FOCUS)**.
Foque em:
- # 💰 Relatório de Dividendos: ${symbol}
- ## 🗓️ Histórico de Pagamentos: Regularidade e valores.
- ## 📉 Dividend Yield: Estimativa baseada no preço atual ${priceData.price}.
- ## ⚖️ Sustentabilidade: O preço atual permite um bom Yield Futuro?
- ## 🏁 Conclusão: É uma boa "Vaca Leiteira" para o portfólio?
`,
        sentimento: `
${baseContext}
Gere um **RELATÓRIO DE SENTIMENTO & NEWSFLOW**.
Foque em:
- # 📰 Termômetro do Mercado: ${symbol}
- ## 🚨 Notícias de Impacto: Analise as manchetes fornecidas.
- ## 📉 Reação do Preço: Como o preço reagiu às últimas notícias enviadas?
- ## 🗣️ Buzz do Mercado: O sentimento geral é de pânico, euforia ou cautela?
- ## ⚡ Alerta de Curto Prazo: O que esperar para os próximos dias?
`
    };

    const finalPrompt = (prompts[analysisType] || prompts.completa) + `
---
### INSTRUÇÕES CRÍTICAS DE FORMATAÇÃO:
1. **Markdown rico** e **Emojis** pertinentes.
2. Tom **Profissional** e **Analítico**.
3. **NÃO ADICIONE ADVERTÊNCIAS OU DISCLAIMERS** (ex: "Isso não é uma recomendação..."). Já temos um disclaimer padrão no sistema. 
4. Responda em Português do Brasil.
5. Não adicione intros vazias. Comece direto no título.
`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    return response.text();
}
