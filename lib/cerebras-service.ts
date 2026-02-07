import OpenAI from "openai";

const client = new OpenAI({
    baseURL: "https://api.cerebras.ai/v1",
    apiKey: process.env.CEREBRAS_API_KEY || "",
});

export async function getCerebrasModels() {
    try {
        if (!process.env.CEREBRAS_API_KEY) return [];

        const response = await client.models.list();
        return response.data.map((m: any) => ({
            id: m.id,
            name: m.id.toUpperCase().replace(/-/g, ' '),
            provider: "Cerebras (OSS)"
        }));
    } catch (error) {
        console.error("Error fetching Cerebras models:", error);
        return [
            { id: "gpt-oss-120b", name: "GPT OSS 120B", provider: "Cerebras" },
            { id: "llama-3.3-70b", name: "LLAMA 3.3 70B", provider: "Cerebras" }
        ];
    }
}

export async function generateCerebrasAnalysis(
    modelId: string,
    prompt: string
) {
    if (!process.env.CEREBRAS_API_KEY) {
        throw new Error("CEREBRAS_API_KEY não configurada.");
    }

    try {
        const completion = await client.chat.completions.create({
            model: modelId,
            messages: [
                { role: "user", content: prompt }
            ],
        });

        return completion.choices[0].message.content || "Erro ao gerar análise (resposta vazia).";
    } catch (error: any) {
        console.error("Error generating content with Cerebras:", error);
        throw new Error(`Cerebras API Error: ${error.message || error}`);
    }
}
