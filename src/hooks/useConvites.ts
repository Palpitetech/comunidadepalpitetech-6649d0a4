import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface Convidado {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  created_at: string;
  converted_at: string | null;
}

interface Reward {
  id: string;
  milestone_type: string;
  milestone_count: number;
  days_granted: number;
  created_at: string;
}

interface UseConvitesReturn {
  referralCode: string | null;
  convidados: Convidado[];
  totalConvidados: number;
  totalVendas: number;
  rewards: Reward[];
  totalDaysEarned: number;
  progressCadastros: number; // 0-50 current progress toward next milestone
  progressVendas: number; // 0-10 current progress toward next milestone
  isLoading: boolean;
  isGenerating: boolean;
  generateCode: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useConvites(): UseConvitesReturn {
  const { user } = useAuthContext();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchReferralCode = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("perfis")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    setReferralCode(data?.referral_code ?? null);
  }, [user?.id]);

  const fetchConvidados = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("convites")
      .select("id, created_at, referred_id, converted_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const referredIds = data.map(c => c.referred_id);
      const { data: profiles } = await supabase
        .from("perfis_publicos")
        .select("id, nome, avatar_url")
        .in("id", referredIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const mapped: Convidado[] = data.map(c => ({
        id: c.id,
        nome: profileMap.get(c.referred_id)?.nome ?? "Usuário",
        avatar_url: profileMap.get(c.referred_id)?.avatar_url ?? null,
        created_at: c.created_at,
        converted_at: c.converted_at,
      }));

      setConvidados(mapped);
    } else {
      setConvidados([]);
    }
  }, [user?.id]);

  const fetchRewards = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("referral_rewards")
      .select("id, milestone_type, milestone_count, days_granted, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setRewards(data ?? []);
  }, [user?.id]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchReferralCode(), fetchConvidados(), fetchRewards()]);
    setIsLoading(false);
  }, [fetchReferralCode, fetchConvidados, fetchRewards]);

  const generateCode = useCallback(async () => {
    if (!user?.id || referralCode) return;

    setIsGenerating(true);
    try {
      const { data: newCode } = await supabase.rpc("generate_referral_code");

      if (newCode) {
        const { error } = await supabase
          .from("perfis")
          .update({ referral_code: newCode })
          .eq("id", user.id);

        if (!error) {
          setReferralCode(newCode);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id, referralCode]);

  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  const totalConvidados = convidados.length;
  const totalVendas = convidados.filter(c => c.converted_at).length;
  const totalDaysEarned = rewards.reduce((sum, r) => sum + r.days_granted, 0);
  const progressCadastros = totalConvidados % 50;
  const progressVendas = totalVendas % 10;

  return {
    referralCode,
    convidados,
    totalConvidados,
    totalVendas,
    rewards,
    totalDaysEarned,
    progressCadastros,
    progressVendas,
    isLoading,
    isGenerating,
    generateCode,
    refetch,
  };
}

// Helper to capture referral code from URL
export function captureReferralCode(): void {
  if (typeof window === "undefined") return;
  
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  
  if (ref && ref.length === 6) {
    localStorage.setItem("referral_code", ref);
  }
}

// Helper to get stored referral code
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("referral_code");
}

// Helper to clear referral code after use
export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("referral_code");
}
