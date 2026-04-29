// Hook compartilhado para buscar group_blast_configs (usado no Disparo e no Monitor).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BlastSlot {
  id: string;
  schedule_times: string[];
  last_scheduled_index: number;
  message_type: "ai" | "manual" | "palpite";
  message_content: string;
  loteria: "lotofacil" | "megasena";
}

export interface PalpiteSettingsByLoteria {
  lotofacil?: { include_palpites: boolean; vip_group_link: string | null };
  megasena?: { include_palpites: boolean; vip_group_link: string | null };
}

export interface BlastConfig {
  id: string;
  name: string;
  group_jids: string[];
  slots: BlastSlot[];
  is_active: boolean;
  include_palpites: boolean;
  vip_group_link: string | null;
  member_tag: string | null;
  palpite_settings: PalpiteSettingsByLoteria;
  created_at: string;
  updated_at: string;
}

export function useGroupBlastConfigs() {
  const [configs, setConfigs] = useState<BlastConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("group_blast_configs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) {
      const parsed = (data || []).map((c: any) => ({
        ...c,
        slots: Array.isArray(c.slots) ? c.slots : [],
      })) as BlastConfig[];
      setConfigs(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { configs, loading, refetch };
}
