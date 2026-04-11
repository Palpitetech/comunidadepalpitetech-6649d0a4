import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, LogOut, Shield, ChevronRight, MessageSquare, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SegurancaTabProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function SegurancaTab({ user, onSignOut }: SegurancaTabProps) {
  const navigate = useNavigate();
  const { updatePassword } = useAuthContext();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await onSignOut();
    navigate("/login", { replace: true });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      toast({
        title: "Sucesso!",
        description: "Sua senha foi atualizada.",
      });
      setOpen(false);
      setNewPassword("");
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a senha.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-xl border bg-card overflow-hidden divide-y">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors text-left">
              <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Trocar Senha</p>
                <p className="text-[11px] text-muted-foreground">Mudar sua senha de acesso</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[90%] sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Mudar Senha</DialogTitle>
              <DialogDescription>
                Digite sua nova senha abaixo. Use pelo menos 6 caracteres.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" disabled={isChangingPassword} className="w-full sm:w-auto">
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Atualizar Senha"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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

      <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sair da Conta
      </Button>
    </div>
  );
}
