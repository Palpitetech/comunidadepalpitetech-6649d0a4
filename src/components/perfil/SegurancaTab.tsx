import { Button } from "@/components/ui/button";
import { Lock, LogOut, Shield, ChevronRight, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Lock, LogOut, Trash2, Loader2, Shield, ChevronRight, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface SegurancaTabProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function SegurancaTab({ user, onSignOut }: SegurancaTabProps) {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Sessão expirada");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao excluir conta");
      await supabase.auth.signOut();
      toast.success("Conta excluída com sucesso.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir conta");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    await onSignOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden divide-y">
        <Link to="/recuperar-senha" className="block">
          <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Trocar Senha</p>
              <p className="text-[11px] text-muted-foreground">Altere sua senha de acesso</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <Link to="/privacidade" className="block">
          <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Privacidade</p>
              <p className="text-[11px] text-muted-foreground">Política de privacidade</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <a href="https://chat.whatsapp.com/J89dx46Lo97G9YdAaGmR78" target="_blank" rel="noopener noreferrer" className="block">
          <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Grupo WhatsApp</p>
              <p className="text-[11px] text-muted-foreground">Entre no nosso grupo</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </a>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sair da Conta
      </Button>

      {/* Excluir conta */}
      <div className="rounded-xl border border-destructive/20 bg-card overflow-hidden">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3.5 hover:bg-destructive/5 transition-colors text-left">
              <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Excluir Conta</p>
                <p className="text-[11px] text-muted-foreground">Ação irreversível</p>
              </div>
              <ChevronRight className="h-4 w-4 text-destructive/50" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Excluindo...</>
                ) : (
                  "Sim, excluir minha conta"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
