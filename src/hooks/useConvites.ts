import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  claimed_at: string | null;
}

interface UseConvitesReturn {
  referralCode: string | null;
  convidados: Convidado[];
  totalConvidados: number;
  totalVendas: number;
  rewards: Reward[];
  unclaimedRewards: Reward[];
  totalDaysEarned: number;
  totalDaysClaimed: number;
  progressCadastros: number;
  progressVendas: number;
  isLoading: boolean;
  isGenerating: boolean;
  isClaiming: boolean;
  generateCode: () => Promise<void>;
  claimReward: (rewardId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useConvites(): UseConvitesReturn {
  const { user } = useAuthContext();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

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
      .select("id, milestone_type, milestone_count, days_granted, created_at, claimed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setRewards((data as Reward[]) ?? []);
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

  const claimReward = useCallback(async (rewardId: string): Promise<boolean> => {
    if (!user?.id) return false;

    setIsClaiming(true);
    try {
      const { data, error } = await supabase.rpc("claim_referral_reward", {
        p_reward_id: rewardId,
      });

      if (error) {
        toast.error("Erro ao reinvindicar recompensa");
        return false;
      }

      const result = data as { success: boolean; message?: string; error?: string };
      
      if (result.success) {
        toast.success(result.message || "Recompensa reinvindicada!");
        await refetch();
        return true;
      } else {
        toast.error(result.error || "Não foi possível reinvindicar");
        return false;
      }
    } catch (e) {
      toast.error("Erro ao processar recompensa");
      return false;
    } finally {
      setIsClaiming(false);
    }
  }, [user?.id, refetch]);

  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  const totalConvidados = convidados.length;
  const totalVendas = convidados.filter(c => c.converted_at).length;
  const totalDaysEarned = rewards.reduce((sum, r) => sum + r.days_granted, 0);
  const totalDaysClaimed = rewards.filter(r => r.claimed_at).reduce((sum, r) => sum + r.days_granted, 0);
  const unclaimedRewards = rewards.filter(r => !r.claimed_at);
  const progressCadastros = totalConvidados % 50;
  const progressVendas = totalVendas % 10;

  return {
    referralCode,
    convidados,
    totalConvidados,
    totalVendas,
    rewards,
    unclaimedRewards,
    totalDaysEarned,
    totalDaysClaimed,
    progressCadastros,
    progressVendas,
    isLoading,
    isGenerating,
    isClaiming,
    generateCode,
    claimReward,
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
