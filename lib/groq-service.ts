import OpenAI from "openai";

const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || "",
});

export async function getGroqModels() {
    try {
        if (!process.env.GROQ_API_KEY) return [];

        // Dynamic fetch of Groq models
        const response = await client.models.list();
        return response.data
            .filter((m: any) => m.id.includes('llama-3') || m.id.includes('mixtral') || m.id.includes('gemma'))
            .map((m: any) => ({
                id: m.id,
                name: m.id.toUpperCase().replace(/-/g, ' '),
                provider: "Groq (Fast)"
            }));
    } catch (error) {
        console.error("Error fetching Groq models:", error);
        // Fallback static list
        return [
            { id: "llama-3.1-70b-versatile", name: "LLAMA 3.1 70B", provider: "Groq" },
            { id: "mixtral-8x7b-32768", name: "MIXTRAL 8X7B", provider: "Groq" }
        ];
    }
}

export async function generateGroqAnalysis(
    modelId: string,
    prompt: string
) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY não configurada.");
    }

    try {
        const completion = await client.chat.completions.create({
            model: modelId,
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.1, // Lower temperature for more consistent financial analysis
        });

        return completion.choices[0].message.content || "Erro ao gerar análise (resposta vazia).";
    } catch (error: any) {
        console.error("Error generating content with Groq:", error);
        throw new Error(`Groq API Error: ${error.message || error}`);
    }
}
