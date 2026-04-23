// =============================================================================
// Runner de IA reusável — retry/backoff e tratamento de 402/429.
// Genérico: qualquer engine de loteria usa o mesmo runner.
// =============================================================================

export interface IAResult {
  ok: boolean;
  status: number;
  content?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  errorBody?: string;
}

export async function chamarIAComRetry(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<IAResult> {
  const delays = [1000, 2000, 4000];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 0.8,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      // 402/429 → não retentar; sair limpo
      if (resp.status === 402 || resp.status === 429) {
        const errorBody = await resp.text();
        return { ok: false, status: resp.status, errorBody };
      }

      if (resp.ok) {
        const data = await resp.json();
        return {
          ok: true,
          status: 200,
          content: data.choices?.[0]?.message?.content,
          usage: data.usage,
        };
      }

      // 5xx → retry
      if (resp.status >= 500 && attempt < 2) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
        continue;
      }

      const errorBody = await resp.text();
      return { ok: false, status: resp.status, errorBody };
    } catch (err) {
      console.error(`[IA] tentativa ${attempt + 1} falhou:`, err);
      if (attempt < 2) await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
  return { ok: false, status: 0, errorBody: "Falha de rede após 3 tentativas" };
}
