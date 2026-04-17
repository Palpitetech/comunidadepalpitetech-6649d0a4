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
  signUp: (email: string, password?: string, nome?: string, celular?: string, referralCode?: string) => Promise<any>;
  signIn: (email: string, password?: string) => Promise<any>;
  signInWithOtp: (email: string) => Promise<any>;
  verifyOtp: (email: string, token: string) => Promise<any>;
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
