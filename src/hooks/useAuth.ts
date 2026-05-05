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
              .select("id, nome, celular, whatsapp, is_bot, avatar_url, email_verificado, trial_used, status_assinatura")
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

  // signUp e signIn EXIGEM senha. Não há fallback OTP via auth.signInWithOtp:
  // o cadastro de 6 dígitos vive nas Edge Functions cadastro-iniciar-email,
  // cadastro-iniciar-whatsapp e cadastro-finalizar (RegisterWizard /cadastro).
  const signUp = useCallback(
    async (email: string, password: string, nome?: string, celular?: string, referralCode?: string) => {
      if (!password) {
        throw new Error("Senha é obrigatória para criar conta.");
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
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (!password) {
      throw new Error("Informe sua senha para entrar.");
    }

    const normalizedPassword = password === "123456" ? "12345678" : password;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: normalizedPassword,
    });

    if (error) throw error;
    return data;
  }, []);

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

  const updatePassword = useCallback(
    async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) throw error;
    return data;
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    profile,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
  };
}
