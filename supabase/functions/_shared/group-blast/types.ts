import type { BlastLoteria } from "./lottery-config.ts";

export interface Slot {
  id: string;
  schedule_times: string[];
  last_scheduled_index: number;
  message_type?: "ai" | "manual" | "palpite";
  message_content?: string;
  /** Rotação de textos manuais. Quando presente, ignora message_content e cicla
   *  pelos textos usando o mesmo índice de schedule_times (1 texto por dia). */
  message_contents?: string[];
  /** Loteria associada ao slot (relevante para "ai" e "palpite"). Default: lotofacil */
  loteria?: BlastLoteria;
}

export interface PalpiteSettingsByLoteria {
  lotofacil?: { include_palpites: boolean; vip_group_link: string | null };
  megasena?: { include_palpites: boolean; vip_group_link: string | null };
}

export interface PreparePayload {
  config_id?: string;
  force?: boolean;
}

export interface PostForAI {
  id: string;
  slug?: string | null;
  titulo: string | null;
  conteudo: string;
  tipo: string | null;
}
