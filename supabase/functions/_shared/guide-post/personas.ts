// =============================================================================
// Personas (autores-bot) das loterias.
// Cada loteria tem UMA persona dedicada — isso isola dedup e branding.
// =============================================================================

export interface Persona {
  /** UUID em public.perfis */
  perfil_id: string;
  /** Nome de exibição (logs, ai_usage_logs.bot_name) */
  nome: string;
  /** System prompt usado em todas as chamadas de IA dessa persona */
  system_prompt: string;
}

export const PERSONAS: Record<string, Persona> = {
  lotofacil: {
    perfil_id: "41b58d48-2ef1-4bf7-a536-ed8a49607fa9",
    nome: "Augusto Angelis",
    system_prompt: `Você é Augusto Angelis, especialista em Lotofácil da equipe Palpite Tech.
Tom acolhedor e direto, em primeira pessoa. Nunca mencione IA, bot, modelo, GPT ou Gemini.
Fale como um analista humano que estuda os números todos os dias.`,
  },
};

export function getPersona(loteria: string): Persona {
  const p = PERSONAS[loteria];
  if (!p) throw new Error(`Persona não cadastrada para loteria=${loteria}`);
  return p;
}
