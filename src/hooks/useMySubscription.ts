import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StatusAssinatura } from "@/types/plans";

type MySubscriptionData = {
  status: StatusAssinatura;
  validade: string | null;
  trial_used?: boolean;
  isFree: boolean;
};

export function useMySubscription(userId?: string) {
  const [data, setData] = useState<MySubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setData({ status: "inativa", validade: null, trial_used: false, isFree: true });
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: row, error: queryError } = await supabase
        .from("perfis")
        .select("status_assinatura, validade_assinatura, trial_used")
        .eq("id", userId)
        .maybeSingle();

      if (queryError) throw queryError;

      const status = ((row?.status_assinatura || "inativa") as StatusAssinatura) ?? "inativa";
      const validade = row?.validade_assinatura ?? null;
      const trial_used = row?.trial_used ?? false;
      const isFree = status === "inativa";

      setData({ status, validade, trial_used, isFree });
    } catch (e) {
      console.error("Erro ao buscar assinatura do usuário:", e);
      setError(e instanceof Error ? e.message : "Erro ao buscar assinatura");
      setData({ status: "inativa", validade: null, trial_used: false, isFree: true });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    data,
    loading,
    error,
    refetch: fetchSubscription,
  };
}
