// OpenAI-compatible AI client — works with OpenAI, Gemini (OpenAI-compat endpoint),
// Groq, OpenRouter, Azure (via compat proxy). Configure via .env:
//   AI_BASE_URL=https://api.openai.com/v1
//   AI_API_KEY=sk-...
//   AI_MODEL=gpt-4o-mini

export function aiConfig() {
  return {
    baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey: process.env.AI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    region: process.env.AI_REGION ?? "southafricanorth",
    dataResidency: process.env.AI_DATA_RESIDENCY ?? "South Africa",
  };
}

export function aiEnabled() {
  return aiConfig().apiKey.length > 0;
}

export async function chatCompletion(system: string, user: string): Promise<string> {
  const { baseUrl, apiKey, model } = aiConfig();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}
