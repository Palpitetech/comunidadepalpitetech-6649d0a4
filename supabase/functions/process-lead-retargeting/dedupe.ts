/**
 * Lógica pura de deduplicação para retargeting de leads.
 *
 * Regra: a mesma combinação (template_id + recipient_phone) não pode
 * gerar uma nova entrada em `message_queue` enquanto existir um registro
 * criado nos últimos 7 dias (independente de status: pending, sent, failed).
 *
 * Isolada do `Deno.serve` para permitir testes unitários sem rede.
 */

export const DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60_000;

/**
 * Cliente mínimo necessário para checar duplicatas.
 * Tipado como interface para facilitar mocks em testes.
 */
export interface DedupeQueueClient {
  countRecentForTemplatePhone(args: {
    templateId: string;
    phone: string;
    sinceIso: string;
  }): Promise<{ count: number; error: string | null }>;
}

/**
 * Calcula o ISO timestamp do início da janela de dedupe (now - 7d).
 */
export function dedupeLowerBoundIso(now: Date = new Date()): string {
  return new Date(now.getTime() - DEDUPE_WINDOW_MS).toISOString();
}

/**
 * Retorna true se NÃO houver duplicata na janela de 7 dias
 * (ou seja, o lead pode ser enfileirado).
 *
 * Em caso de erro de banco, retorna `{ allowed: false, error }` —
 * preferimos pular o lead a arriscar enviar duplicado.
 */
export async function isEnqueueAllowed(
  client: DedupeQueueClient,
  templateId: string,
  phone: string,
  now: Date = new Date()
): Promise<{ allowed: boolean; error: string | null }> {
  const sinceIso = dedupeLowerBoundIso(now);
  const { count, error } = await client.countRecentForTemplatePhone({
    templateId,
    phone,
    sinceIso,
  });
  if (error) return { allowed: false, error };
  return { allowed: (count ?? 0) === 0, error: null };
}

/**
 * Adapter que envolve um SupabaseClient já criado, expondo apenas
 * a query de contagem usada pela função de retargeting.
 */
export function makeSupabaseDedupeClient(supabase: {
  from: (table: string) => {
    select: (cols: string, opts: { count: "exact"; head: true }) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => {
          gte: (col: string, val: string) => Promise<{
            count: number | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}): DedupeQueueClient {
  return {
    async countRecentForTemplatePhone({ templateId, phone, sinceIso }) {
      const { count, error } = await supabase
        .from("message_queue")
        .select("id", { count: "exact", head: true })
        .eq("template_id", templateId)
        .eq("recipient_phone", phone)
        .gte("created_at", sinceIso);
      return { count: count ?? 0, error: error?.message ?? null };
    },
  };
}
