/**
 * Lógica pura de deduplicação para retargeting de leads.
 *
 * Regra padrão: a mesma combinação (template_id + recipient_phone) não pode
 * gerar uma nova entrada em `message_queue` enquanto existir um registro
 * criado nos últimos 7 dias (independente de status: pending, sent, failed).
 *
 * Filtro opcional: é possível restringir a checagem a um subconjunto de
 * status (ex.: só `["sent"]` para permitir reenfileirar caso falhas
 * anteriores, ou `["pending","sent"]` para ignorar `failed`). Quando
 * `statuses` é omitido ou vazio, mantém o comportamento "qualquer status".
 *
 * Isolada do `Deno.serve` para permitir testes unitários sem rede.
 */

export const DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60_000;

export type QueueStatus = "pending" | "sending" | "sent" | "failed";

export interface DedupeOptions {
  /**
   * Lista de status que CONTAM como duplicata. Quando omitida ou vazia,
   * conta linhas de qualquer status (comportamento padrão).
   */
  statuses?: QueueStatus[];
}

/**
 * Cliente mínimo necessário para checar duplicatas.
 * Tipado como interface para facilitar mocks em testes.
 */
export interface DedupeQueueClient {
  countRecentForTemplatePhone(args: {
    templateId: string;
    phone: string;
    sinceIso: string;
    statuses?: QueueStatus[];
  }): Promise<{ count: number; error: string | null }>;
}

/**
 * Calcula o ISO timestamp do início da janela de dedupe (now - 7d).
 */
export function dedupeLowerBoundIso(now: Date = new Date()): string {
  return new Date(now.getTime() - DEDUPE_WINDOW_MS).toISOString();
}

/**
 * Normaliza a lista de status para um array possivelmente undefined.
 * Retorna `undefined` quando não há filtro a aplicar — isso simplifica
 * a checagem nos adapters (`if (statuses)` evita query .in() vazia).
 */
export function normalizeStatuses(
  statuses?: QueueStatus[]
): QueueStatus[] | undefined {
  if (!statuses || statuses.length === 0) return undefined;
  // dedupe + ordem estável para previsibilidade nos testes
  return Array.from(new Set(statuses)).sort();
}

/**
 * Retorna true se NÃO houver duplicata na janela de 7 dias
 * (ou seja, o lead pode ser enfileirado).
 *
 * Em caso de erro de banco, retorna `{ allowed: false, error }` —
 * preferimos pular o lead a arriscar enviar duplicado (fail-closed).
 */
export async function isEnqueueAllowed(
  client: DedupeQueueClient,
  templateId: string,
  phone: string,
  now: Date = new Date(),
  options: DedupeOptions = {}
): Promise<{ allowed: boolean; error: string | null }> {
  const sinceIso = dedupeLowerBoundIso(now);
  const statuses = normalizeStatuses(options.statuses);
  const { count, error } = await client.countRecentForTemplatePhone({
    templateId,
    phone,
    sinceIso,
    statuses,
  });
  if (error) return { allowed: false, error };
  return { allowed: (count ?? 0) === 0, error: null };
}

/**
 * Adapter que envolve um SupabaseClient já criado, expondo apenas
 * a query de contagem usada pela função de retargeting.
 *
 * Aplica `.in("status", statuses)` apenas quando há filtro definido.
 */
type GteResult = Promise<{
  count: number | null;
  error: { message: string } | null;
}>;
type GteBuilder = {
  gte: (col: string, val: string) => GteResult;
  in?: (col: string, vals: string[]) => GteBuilder;
};
type EqBuilder = {
  eq: (col: string, val: string) => EqBuilder;
} & GteBuilder;

export function makeSupabaseDedupeClient(supabase: {
  from: (table: string) => {
    select: (
      cols: string,
      opts: { count: "exact"; head: true }
    ) => EqBuilder;
  };
}): DedupeQueueClient {
  return {
    async countRecentForTemplatePhone({
      templateId,
      phone,
      sinceIso,
      statuses,
    }) {
      let q: EqBuilder = supabase
        .from("message_queue")
        .select("id", { count: "exact", head: true })
        .eq("template_id", templateId)
        .eq("recipient_phone", phone);

      if (statuses && statuses.length > 0 && q.in) {
        q = q.in("status", statuses);
      }

      const { count, error } = await q.gte("created_at", sinceIso);
      return { count: count ?? 0, error: error?.message ?? null };
    },
  };
}
