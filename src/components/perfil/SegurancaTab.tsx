import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, LogOut, Shield, ChevronRight, MessageSquare, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SegurancaTabProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function SegurancaTab({ user, onSignOut }: SegurancaTabProps) {
  const navigate = useNavigate();
  const { updatePassword } = useAuthContext();
  const { plan } = usePermissionContext();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [open, setOpen] = useState(false);

  // Lógica do Grupo WhatsApp — espelha Comunidade.tsx / Index.tsx
  const isTrial = plan?.slug === "trial" || plan?.slug === "teste-gratis-3-dias";
  const isPaid = !!plan && !isTrial;
  const groupLink = isPaid
    ? "https://www.palpitetech.com.br/g/grupo-vip-assinantes"
    : "https://www.palpitetech.com.br/g/entrar-sala-secreta";
  const groupLabel = isPaid ? "Grupo VIP Assinantes" : "Sala Secreta";
  const groupSubtitle = isPaid
    ? "Acesso exclusivo dos assinantes"
    : "Comunidade aberta dos estudos";

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

  const PasswordForm = (
    <form onSubmit={handleUpdatePassword} className="space-y-4 px-4 pb-2">
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova Senha</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoFocus
          className="h-12 text-base"
        />
      </div>
    </form>
  );

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Seção: Conta */}
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 font-medium">
          Conta
        </p>
        <div className="rounded-2xl border bg-card overflow-hidden divide-y">
          <button
            onClick={() => setOpen(true)}
            className="w-full flex items-center gap-3 p-3.5 min-h-[64px] hover:bg-muted/50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Trocar Senha</p>
              <p className="text-xs text-muted-foreground">Mudar sua senha de acesso</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <Link to="/privacidade" className="block">
            <div className="flex items-center gap-3 p-3.5 min-h-[64px] hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Privacidade</p>
                <p className="text-xs text-muted-foreground">Política de privacidade</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>

      {/* Seção: Comunidade */}
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 font-medium">
          Comunidade
        </p>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <a
            href={groupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 min-h-[64px] hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{groupLabel}</p>
              <p className="text-xs text-muted-foreground truncate">{groupSubtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Logout com confirmação */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full gap-2 h-12 mt-4 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drawer/Dialog Trocar Senha */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Trocar Senha
              </DrawerTitle>
              <DrawerDescription>
                Digite sua nova senha. Use pelo menos 6 caracteres.
              </DrawerDescription>
            </DrawerHeader>
            {PasswordForm}
            <DrawerFooter className="pt-2">
              <Button
                onClick={(e) => handleUpdatePassword(e as any)}
                disabled={isChangingPassword}
                className="h-12"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Atualizar Senha"
                )}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isChangingPassword}>
                Cancelar
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Trocar Senha
              </DialogTitle>
              <DialogDescription>
                Digite sua nova senha. Use pelo menos 6 caracteres.
              </DialogDescription>
            </DialogHeader>
            {PasswordForm}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isChangingPassword}>
                Cancelar
              </Button>
              <Button onClick={(e) => handleUpdatePassword(e as any)} disabled={isChangingPassword}>
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
