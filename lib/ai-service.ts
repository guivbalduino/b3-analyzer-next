import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCerebrasModels, generateCerebrasAnalysis } from "./cerebras-service";
import { getGroqModels, generateGroqAnalysis } from "./groq-service";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AIModel {
    id: string;
    name: string;
    provider: string;
}

export async function listAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let geminiModels: AIModel[] = [];
    let cerebrasModels: AIModel[] = [];
    let groqModels: AIModel[] = [];

    // 1. Fetch Gemini Models
    if (apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();

            if (data.models) {
                geminiModels = data.models
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
            }
        } catch (error) {
            console.error("Error listing Gemini models:", error);
            geminiModels = [
                { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
                { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google" },
            ];
        }
    }

    // 2. Fetch Cerebras Models
    if (cerebrasKey) {
        try {
            cerebrasModels = await getCerebrasModels();
        } catch (error) {
            console.error("Error listing Cerebras models:", error);
        }
    }

    // 3. Fetch Groq Models
    if (groqKey) {
        try {
            groqModels = await getGroqModels();
        } catch (error) {
            console.error("Error listing Groq models:", error);
        }
    }

    // Combine and return
    return [...geminiModels, ...cerebrasModels, ...groqModels];
}

export async function generateStockAnalysis(
    symbol: string,
    priceData: any,
    historicalData: any[],
    newsData: any[],
    modelName: string = "gemini-2.5-flash",
    analysisType: string = "completa"
) {
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

    // ROUTE REQUEST based on modelName
    if (modelName.startsWith("gemini-")) {
        // Google Gemini Direct
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY não configurada no servidor.");
        }
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        return response.text();
    } else if (modelName.includes("llama") || modelName.includes("mixtral") || modelName.includes("gemma")) {
        // Determine if it's Groq or Cerebras
        // Usually Groq models in our fetch have specific IDs. 
        // Let's check for CEREBRAS specifically if it's 'gpt-oss' or if it matches cerebras list.
        // For simplicity, we can look at the provider from the listAvailableModels but here we only have the modelName.

        // Strategy: Try Groq for llama/mixtral if key is present, fallback to Cerebras if appropriate or specific IDs.
        if (modelName === "gpt-oss-120b" || modelName.startsWith("zai-") || modelName.includes("qwen")) {
            return await generateCerebrasAnalysis(modelName, finalPrompt);
        }

        // Preferred fast provider for Llama/Mixtral: Groq
        if (process.env.GROQ_API_KEY) {
            return await generateGroqAnalysis(modelName, finalPrompt);
        }

        // Fallback to Cerebras if Groq key missing
        return await generateCerebrasAnalysis(modelName, finalPrompt);
    } else {
        // Fallback or explicit Cerebras
        return await generateCerebrasAnalysis(modelName, finalPrompt);
    }
}

export async function generateBatchJointAnalysis(
    analyses: { symbol: string; content: string }[],
    modelName: string = "gemini-2.5-flash"
) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY não configurada no servidor.");
    }

    const analysesXml = analyses.map(a => `
<analysis symbol="${a.symbol}">
${a.content}
</analysis>`).join('\n');

    const prompt = `
Aja como um Estrategista de Investimentos Sênior e Analista Quântico.
Você recebeu uma série de análises individuais de ativos da B3 (bolsa brasileira). 
Sua tarefa é consolidar essas informações em um relatório de estratégia de carteira.

Aqui estão as análises individuais:
${analysesXml}

---
### TAREFAS:
1. **Análise Conjunta**: Crie um resumo executivo (Markdown) sobre o conjunto desses ativos. Identifique correlações, riscos do setor e oportunidades de diversificação.
2. **Ranking e Recomendação**: Gere uma lista JSON rigorosa no final do seu texto, seguindo o esquema abaixo.
3. **Tom**: Profissional, direto e estratégico.

### ESQUEMA DO RANKING (JSON):
Atribua para cada ativo:
- **signal**: ["FORTE COMPRA", "COMPRA", "MANTER", "VENDA", "FORTE VENDA"]
- **score**: 0 a 100 (onde 100 é a melhor oportunidade custo-benefício/risco no momento)

### FORMATO DE RESPOSTA OBRIGATÓRIO:
# 💎 Análise Conjunta da Carteira
[Seu texto de análise estratégica aqui...]

## 📊 Ranking de Ativos
[Sua tabela Markdown aqui com Símbolo, Recomendação e Score...]

---
### JSON_DATA_START
[
  {"symbol": "ABCD3", "signal": "COMPRA", "score": 85},
  ...
]
### JSON_DATA_END
`;

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
