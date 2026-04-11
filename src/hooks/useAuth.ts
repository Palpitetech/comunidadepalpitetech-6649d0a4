import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });

        if (session?.user) {
          // Fetch profile with setTimeout to avoid race conditions
          setTimeout(async () => {
            const { data } = await supabase
              .from("perfis")
              .select("id, nome, celular, is_bot, avatar_url, email_verificado, trial_used, status_assinatura")
              .eq("id", session.user.id)
              .maybeSingle();

            setProfile(data);
          }, 0);

          // Vincular OneSignal external_id ao user_id
          try {
            (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
            (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
              await OneSignal.login(session.user.id);
            });
          } catch (e) {
            console.warn("OneSignal login error:", e);
          }
        } else {
          setProfile(null);

          // Desvincular OneSignal ao deslogar
          try {
            (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
            (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
              await OneSignal.logout();
            });
          } catch (e) {
            console.warn("OneSignal logout error:", e);
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + "/home",
      },
    });

    if (error) throw error;
    return data;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(
    async (email: string, password?: string, nome?: string, celular?: string, referralCode?: string) => {
      // Se não houver senha, usamos signInWithOtp
      if (!password) {
        return signInWithOtp(email);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nome: nome || email.split("@")[0],
            celular,
            referral_code: referralCode || null,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    [signInWithOtp]
  );

  const signIn = useCallback(async (email: string, password?: string) => {
    // Se não houver senha, usamos signInWithOtp
    if (!password) {
      return signInWithOtp(email);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }, [signInWithOtp]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!authState.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("perfis")
        .update(updates)
        .eq("id", authState.user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    },
    [authState.user]
  );

  return {
    user: authState.user,
    session: authState.session,
    profile,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    signUp,
    signIn,
    signInWithOtp,
    verifyOtp,
    signOut,
    updateProfile,
  };
}
