import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, AlertTriangle, Tag, X } from "lucide-react";
import type { ExtendedProfile, Plan } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserDataTabProps {
  user: UserWithPlan;
  onUserUpdated: () => void;
}

export function UserDataTab({ user, onUserUpdated }: UserDataTabProps) {
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [nome, setNome] = useState(user.nome || "");
  const [email, setEmail] = useState(user.email || "");
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || "");
  const [isBlocked, setIsBlocked] = useState(user.is_blocked);
  const [adminNotes, setAdminNotes] = useState(user.admin_notes || "");

  // State para remoção de tag com confirmação
  const [tagToRemove, setTagToRemove] = useState<string | null>(null);
  const [confirmTagName, setConfirmTagName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [removingTag, setRemovingTag] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({
          nome: nome.trim() || null,
          email: email.trim() || null,
          whatsapp: whatsapp.trim() || null,
          is_blocked: isBlocked,
          admin_notes: adminNotes.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Dados atualizados");
      onUserUpdated();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar dados");
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user.email) {
      toast.error("Usuário não tem email cadastrado");
      return;
    }

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });

      if (error) throw error;
      toast.success("Email de redefinição enviado");
    } catch (error: any) {
      console.error("Erro ao enviar reset:", error);
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do usuário"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="celular">Celular (somente leitura)</Label>
          <Input
            id="celular"
            value={user.celular || ""}
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleSendPasswordReset}
          disabled={sendingReset || !user.email}
          className="w-full gap-2"
        >
          {sendingReset ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Enviar Email de Redefinição de Senha
        </Button>
      </div>

      <Separator />

      {/* Tags do usuário */}
      {user.tags && user.tags.length > 0 && (
        <>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {user.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                    onClick={async () => {
                      const newTags = user.tags.filter((t) => t !== tag);
                      const { error } = await supabase
                        .from("perfis")
                        .update({ tags: newTags })
                        .eq("id", user.id);
                      if (error) {
                        toast.error("Erro ao remover tag");
                      } else {
                        toast.success(`Tag "${tag}" removida`);
                        onUserUpdated();
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Notas Internas (Admin)</Label>
          <Textarea
            id="notes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Anotações sobre este usuário..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Bloquear Usuário</p>
              <p className="text-sm text-muted-foreground">
                Impede acesso ao sistema
              </p>
            </div>
          </div>
          <Switch
            checked={isBlocked}
            onCheckedChange={setIsBlocked}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
