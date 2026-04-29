// =============================================================================
// Resolver único de mensagem para Disparo em Grupo.
// Substitui a antiga resolveMessageContent (que estava em send.ts).
//
// Regras:
//  - manual   → usa slot.message_content
//  - palpite  → generatePalpiteMessage(loteria, palpite_settings[loteria])
//  - ai       → busca último post da loteria + generateAIMessage
//  - fallback do slot palpite (quando pipeline falha) → ai do mesmo loteria
//
// Lê APENAS palpite_settings (sem fallback legacy include_palpites/vip_group_link).
// =============================================================================

import { generateAIMessage } from "./ai-message.ts";
import { generatePalpiteMessage } from "./palpite-message.ts";
import {
  getBlastLotteryConfig,
  type BlastLoteria,
} from "./lottery-config.ts";
import type { PalpiteSettingsByLoteria, Slot } from "./types.ts";

export interface ConfigForResolver {
  palpite_settings?: PalpiteSettingsByLoteria | null;
}

export interface ResolvedMessage {
  /** Texto pronto para envio. `null` = falha. */
  content: string | null;
  /** Origem para auditoria (gravada em group_blast_logs.message_source). */
  source: string;
}

function palpiteFor(
  cfg: ConfigForResolver | null | undefined,
  loteria: BlastLoteria,
): { include_palpites: boolean; vip_group_link: string | null } {
  const perLot = cfg?.palpite_settings?.[loteria];
  if (perLot && typeof perLot.include_palpites === "boolean") {
    return {
      include_palpites: perLot.include_palpites,
      vip_group_link: perLot.vip_group_link ?? null,
    };
  }
  return { include_palpites: true, vip_group_link: null };
}

async function fetchLatestPost(supabase: any, loteriaTag?: string) {
  let q = supabase
    .from("postagens")
    .select("id, slug, titulo, conteudo, tipo")
    .neq("tipo", "comentario")
    .eq("status", "publicado")
    .order("created_at", { ascending: false })
    .limit(1);
  if (loteriaTag) q = q.eq("loteria_tag", loteriaTag);
  const { data } = await q.maybeSingle();
  return data;
}

/**
 * Resolve a mensagem definitiva de um slot. Retorna `{ content, source }`.
 * Quando `content` é `null`, o caller deve gravar `failed` com o motivo em `source`.
 */
export async function resolveMessage(
  supabase: any,
  slot: Slot | undefined,
  config: ConfigForResolver | null,
  apiKey: string,
  baseUrl: string,
): Promise<ResolvedMessage> {
  if (!slot) return { content: null, source: "no_slot" };

  // Manual
  if (slot.message_type === "manual") {
    const t = slot.message_content?.trim();
    return t
      ? { content: t, source: "manual" }
      : { content: null, source: "manual:empty" };
  }

  const loteria: BlastLoteria = (slot.loteria as BlastLoteria) ?? "lotofacil";
  const lotCfg = getBlastLotteryConfig(loteria);

  // Palpite (com fallback para IA do mesmo loteria)
  if (slot.message_type === "palpite") {
    const { include_palpites, vip_group_link } = palpiteFor(config, loteria);
    const content = await generatePalpiteMessage(supabase, apiKey, baseUrl, {
      loteria,
      includePalpites: include_palpites,
      vipGroupLink: vip_group_link,
    });
    if (content && content.trim()) {
      return { content, source: `palpite:${loteria}` };
    }

    console.warn(`[resolver] palpite ${loteria} falhou, tentando IA fallback`);
    const post = await fetchLatestPost(supabase, lotCfg.loteriaTag);
    if (!post) return { content: null, source: `palpite:${loteria}:no_post` };
    const ai = await generateAIMessage(supabase, apiKey, baseUrl, post, loteria);
    return ai
      ? { content: ai, source: `palpite:${loteria}:fallback_ai` }
      : { content: null, source: `palpite:${loteria}:fallback_ai_failed` };
  }

  // AI (default)
  const post = await fetchLatestPost(supabase, lotCfg.loteriaTag);
  if (!post) return { content: null, source: `ai:${loteria}:no_post` };
  const ai = await generateAIMessage(supabase, apiKey, baseUrl, post, loteria);
  return ai
    ? { content: ai, source: `ai:${loteria}` }
    : { content: null, source: `ai:${loteria}:failed` };
}
