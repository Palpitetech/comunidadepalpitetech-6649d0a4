import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface Convidado {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UseConvitesReturn {
  referralCode: string | null;
  convidados: Convidado[];
  totalConvidados: number;
  isLoading: boolean;
  isGenerating: boolean;
  generateCode: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useConvites(): UseConvitesReturn {
  const { user } = useAuthContext();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [convidados, setConvidados] = useState<Convidado[]>([]);
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
      .select(`
        id,
        created_at,
        referred_id
      `)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Fetch profile info for each referred user
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
      }));

      setConvidados(mapped);
    } else {
      setConvidados([]);
    }
  }, [user?.id]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchReferralCode(), fetchConvidados()]);
    setIsLoading(false);
  }, [fetchReferralCode, fetchConvidados]);

  const generateCode = useCallback(async () => {
    if (!user?.id || referralCode) return;

    setIsGenerating(true);
    try {
      // Call RPC to generate unique code
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

  return {
    referralCode,
    convidados,
    totalConvidados: convidados.length,
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
