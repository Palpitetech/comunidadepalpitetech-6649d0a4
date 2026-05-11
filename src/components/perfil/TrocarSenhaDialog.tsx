import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
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

interface TrocarSenhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrocarSenhaDialog({ open, onOpenChange }: TrocarSenhaDialogProps) {
  const { updatePassword, user } = useAuthContext();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showAtual, setShowAtual] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const rules = {
    minLength: novaSenha.length >= 8,
    hasNumber: /\d/.test(novaSenha),
    hasLetter: /[a-zA-Z]/.test(novaSenha),
    match: novaSenha.length > 0 && novaSenha === confirmar,
    different: novaSenha.length > 0 && novaSenha !== senhaAtual,
  };
  const allValid = rules.minLength && rules.hasNumber && rules.hasLetter && rules.match && rules.different;

  const reset = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmar("");
    setShowAtual(false);
    setShowPwd(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.email) {
      toast({ title: "Erro", description: "Usuário não identificado.", variant: "destructive" });
      return;
    }
    if (!senhaAtual) {
      toast({ title: "Informe a senha atual", variant: "destructive" });
      return;
    }
    if (!allValid) {
      toast({
        title: "Verifique as regras da nova senha",
        description: "A nova senha precisa atender todos os requisitos.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual,
      });
      if (signErr) {
        toast({
          title: "Senha atual incorreta",
          description: "Confira sua senha atual e tente novamente.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      await updatePassword(novaSenha);
      toast({ title: "Senha atualizada!", description: "Sua nova senha já está ativa." });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <li className={`flex items-center gap-2 text-xs ${ok ? "text-primary" : "text-muted-foreground"}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-60" />}
      {text}
    </li>
  );

  const Form = (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-2">
      <div className="space-y-2">
        <Label htmlFor="senha-atual">Senha Atual</Label>
        <div className="relative">
          <Input
            id="senha-atual"
            type={showAtual ? "text" : "password"}
            placeholder="Sua senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            autoFocus
            className="h-12 text-base pr-10"
          />
          <button
            type="button"
            onClick={() => setShowAtual((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            tabIndex={-1}
          >
            {showAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nova-senha">Nova Senha</Label>
        <div className="relative">
          <Input
            id="nova-senha"
            type={showPwd ? "text" : "password"}
            placeholder="Crie uma nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="h-12 text-base pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            tabIndex={-1}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
        <Input
          id="confirmar-senha"
          type={showPwd ? "text" : "password"}
          placeholder="Repita a nova senha"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className="h-12 text-base"
        />
      </div>
      <ul className="space-y-1 pt-1">
        <Rule ok={rules.minLength} text="Pelo menos 8 caracteres" />
        <Rule ok={rules.hasLetter} text="Pelo menos 1 letra" />
        <Rule ok={rules.hasNumber} text="Pelo menos 1 número" />
        <Rule ok={rules.match} text="As senhas coincidem" />
        <Rule ok={rules.different} text="Diferente da senha atual" />
      </ul>
      <button type="submit" hidden />
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Trocar Senha
            </DrawerTitle>
            <DrawerDescription>
              Defina uma nova senha de acesso. Use pelo menos 6 caracteres.
            </DrawerDescription>
          </DrawerHeader>
          {Form}
          <DrawerFooter className="pt-2">
            <Button onClick={() => handleSubmit()} disabled={saving} className="h-12">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : "Atualizar Senha"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Trocar Senha
          </DialogTitle>
          <DialogDescription>
            Defina uma nova senha de acesso. Use pelo menos 6 caracteres.
          </DialogDescription>
        </DialogHeader>
        {Form}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => handleSubmit()} disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : "Atualizar Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
