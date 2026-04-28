import React, { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, nome?: string, celular?: string, referralCode?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  // OTP via auth.signInWithOtp foi removido — cadastro novo usa Edge Functions
  // dedicadas (cadastro-iniciar-email/whatsapp). Confirmação de email de leads
  // existentes (Kirvano) usa enviar-codigo-email + verificar-codigo direto.
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
