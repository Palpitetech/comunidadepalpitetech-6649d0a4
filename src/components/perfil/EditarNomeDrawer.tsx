import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User as UserIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface EditarNomeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeAtual: string | null;
}

export function EditarNomeDrawer({ open, onOpenChange, nomeAtual }: EditarNomeDrawerProps) {
  const [nome, setNome] = useState(nomeAtual || "");
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();
  const { updateProfile } = useAuthContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setNome(nomeAtual || "");
  }, [open, nomeAtual]);

  const handleSave = async () => {
    const trimmed = nome.trim();
    if (trimmed.length < 2) {
      toast.error("Nome muito curto");
      return;
    }
    if (trimmed === (nomeAtual || "").trim()) {
      onOpenChange(false);
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await updateProfile({ nome: trimmed });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Nome atualizado!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar nome");
    } finally {
      setIsSaving(false);
    }
  };

  const Body = (
    <div className="space-y-2 px-4 pb-2">
      <Label htmlFor="nome">Nome completo</Label>
      <Input
        id="nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome completo"
        className="h-12 text-base"
        autoFocus
        maxLength={80}
      />
      <p className="text-xs text-muted-foreground">
        Esse nome aparece no seu perfil e nas mensagens da comunidade.
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" /> Editar nome
            </DrawerTitle>
            <DrawerDescription>Atualize seu nome de exibição.</DrawerDescription>
          </DrawerHeader>
          {Body}
          <DrawerFooter className="pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="h-12">
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : "Salvar"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" /> Editar nome
          </DialogTitle>
          <DialogDescription>Atualize seu nome de exibição.</DialogDescription>
        </DialogHeader>
        {Body}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
