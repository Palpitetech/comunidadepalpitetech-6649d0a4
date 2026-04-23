export interface Slot {
  id: string;
  schedule_times: string[];
  last_scheduled_index: number;
  message_type?: "ai" | "manual" | "palpite";
  message_content?: string;
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
