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
import { Loader2, AlertTriangle, Tag, X, Copy, KeyRound } from "lucide-react";
import type { ExtendedProfile, Plan } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserDataTabProps {
  user: UserWithPlan;
  onUserUpdated: () => void;
}

function CopyableField({ label, value }: { label: string; value: string }) {
  if (!value) return <span className="text-muted-foreground text-sm">—</span>;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error("Erro ao copiar");
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center justify-between w-full group hover:bg-accent/50 -mx-1 px-1 rounded transition-colors cursor-pointer"
      title={`Copiar ${label}`}
    >
      <span className="text-muted-foreground truncate text-sm">{value}</span>
      <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
    </button>
  );
}

export function UserDataTab({ user, onUserUpdated }: UserDataTabProps) {
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
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

  const handleResetPassword = async () => {
    const identificador = user.email || user.celular;
    if (!identificador) {
      toast.error("Usuário não tem email nem celular cadastrado");
      return;
    }

    setResettingPassword(true);
    try {
      // 1. Reset password via edge function (sets to 123456 + sends email)
      const { data, error: fnError } = await supabase.functions.invoke("recuperar-senha", {
        body: { identificador },
      });

      if (fnError) throw new Error("Erro ao redefinir senha");
      if (!data?.sucesso) throw new Error(data?.erro || "Erro ao redefinir senha");

      toast.success("Senha redefinida para 123456" + (data.email_enviado ? " — email enviado" : ""));

      // 2. Send WhatsApp notification
      const telefone = user.whatsapp || user.celular;
      if (telefone) {
        try {
          // Find an online instance
          const { data: instances } = await supabase
            .from("whatsapp_instances")
            .select("evolution_instance_id")
            .eq("status", "online")
            .limit(1);

          if (instances && instances.length > 0) {
            const numero = telefone.replace(/\D/g, "");
            const numeroBR = numero.startsWith("55") ? numero : `55${numero}`;
            const nomeUsuario = user.nome || "Usuário";

            const mensagem = `Olá ${nomeUsuario}, tudo bem? Estou passando para confirmar que deu tudo certo com sua nova senha. Faça seu login com as credenciais abaixo:\n\n${user.email || identificador}\nSenha: 123456\n\nhttps://comunidadepalpitetech.lovable.app/login\n\nRecomendo que troque sua senha assim que acessar o sistema.`;

            await supabase.functions.invoke("evolution-proxy", {
              body: {
                action: "sendText",
                instanceName: instances[0].evolution_instance_id,
                number: `${numeroBR}@s.whatsapp.net`,
                text: mensagem,
              },
            });

            toast.success("Mensagem WhatsApp enviada!");
          } else {
            toast.info("Nenhuma instância WhatsApp online — apenas email enviado");
          }
        } catch (whatsErr) {
          console.error("Erro ao enviar WhatsApp:", whatsErr);
          toast.info("WhatsApp não enviado, mas email foi");
        }
      }
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setResettingPassword(false);
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
          <div className="flex items-center gap-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="flex-1"
            />
          </div>
          {user.email && <CopyableField label="Email" value={user.email} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <div className="flex items-center gap-2">
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              className="flex-1"
            />
          </div>
          {user.whatsapp && <CopyableField label="WhatsApp" value={user.whatsapp} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="celular">Celular (somente leitura)</Label>
          <Input
            id="celular"
            value={user.celular || ""}
            disabled
            className="bg-muted"
          />
          {user.celular && <CopyableField label="Celular" value={user.celular} />}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleResetPassword}
          disabled={resettingPassword || (!user.email && !user.celular)}
          className="w-full gap-2"
        >
          {resettingPassword ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Gerar Nova Senha (123456)
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Redefine a senha para 123456, envia email e WhatsApp automaticamente
        </p>
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
                    onClick={() => {
                      setTagToRemove(tag);
                      setConfirmTagName("");
                      setConfirmPassword("");
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

      {/* Dialog de confirmação para remover tag */}
      <AlertDialog open={!!tagToRemove} onOpenChange={(open) => !open && setTagToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tag "{tagToRemove}"</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Para confirmar, digite o nome da tag e sua senha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-tag" className="text-sm">
                Digite <span className="font-semibold text-foreground">{tagToRemove}</span> para confirmar
              </Label>
              <Input
                id="confirm-tag"
                value={confirmTagName}
                onChange={(e) => setConfirmTagName(e.target.value)}
                placeholder={tagToRemove || ""}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-sm">Senha do admin</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingTag}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmTagName !== tagToRemove || !confirmPassword || removingTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!tagToRemove || confirmTagName !== tagToRemove) return;

                setRemovingTag(true);
                try {
                  const { data: { user: currentUser } } = await supabase.auth.getUser();
                  if (!currentUser?.email) throw new Error("Sessão inválida");

                  const { error: authError } = await supabase.auth.signInWithPassword({
                    email: currentUser.email,
                    password: confirmPassword,
                  });

                  if (authError) {
                    toast.error("Senha incorreta");
                    return;
                  }

                  const newTags = user.tags.filter((t) => t !== tagToRemove);
                  const { error } = await supabase
                    .from("perfis")
                    .update({ tags: newTags })
                    .eq("id", user.id);

                  if (error) throw error;

                  toast.success(`Tag "${tagToRemove}" removida`);
                  setTagToRemove(null);
                  onUserUpdated();
                } catch (err: any) {
                  toast.error(err.message || "Erro ao remover tag");
                } finally {
                  setRemovingTag(false);
                }
              }}
            >
              {removingTag && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
