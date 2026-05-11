import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Loader2, AlertTriangle, Tag, X, Copy, KeyRound, User,
  Mail, MessageCircle, Save, StickyNote, Check,
} from "lucide-react";
import type { ExtendedProfile, Plan } from "@/types/plans";

const LOGIN_URL = "https://palpitetech.com.br/login";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserDataTabProps {
  user: UserWithPlan;
  onUserUpdated: () => void;
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopied(false), 1500);
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
      {copied ? (
        <Check className="h-3 w-3 text-primary shrink-0 ml-2" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
      )}
    </button>
  );
}

export function UserDataTab({ user, onUserUpdated }: UserDataTabProps) {
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [nome, setNome] = useState(user.nome || "");
  const [email, setEmail] = useState(user.email || "");
  const [celular, setCelular] = useState(user.celular || "");
  const [isBlocked, setIsBlocked] = useState(user.is_blocked);
  const [adminNotes, setAdminNotes] = useState(user.admin_notes || "");

  const [tagToRemove, setTagToRemove] = useState<string | null>(null);
  const [confirmTagName, setConfirmTagName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [removingTag, setRemovingTag] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const emailChanged = email.trim().toLowerCase() !== (user.email || "").toLowerCase();

      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: {
          user_id: user.id,
          nome: nome.trim() || null,
          email: email.trim() || null,
          celular: celular.trim() || null,
          is_blocked: isBlocked,
          admin_notes: adminNotes.trim() || null,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.sucesso) throw new Error(data?.error || "Erro ao salvar dados");

      toast.success(
        emailChanged
          ? "Dados atualizados — email atualizado no login também"
          : "Dados atualizados"
      );
      onUserUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar dados";
      console.error("Erro ao salvar:", err);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleResetPassword = async () => {
    if (!user.email) {
      toast.error("Usuário não tem email cadastrado");
      return;
    }

    setResettingPassword(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "recuperar-senha",
        { body: { identificador: user.email } }
      );

      if (fnError) throw new Error(fnError.message || "Erro ao resetar senha");
      if (!data?.sucesso) throw new Error(data?.erro || "Erro ao resetar senha");

      toast.success("Senha redefinida para 12345678 — usuário notificado por email");

      // Notifica também por WhatsApp se houver celular + instância online
      const telefone = user.celular;
      if (telefone) {
        try {
          const { data: instances } = await supabase
            .from("whatsapp_instances")
            .select("evolution_instance_id")
            .eq("status", "online")
            .limit(1);

          if (instances && instances.length > 0) {
            const numero = telefone.replace(/\D/g, "");
            const numeroBR = numero.startsWith("55") ? numero : `55${numero}`;
            const nomeUsuario = user.nome || "Usuário";

            const mensagem = [
              `Olá ${nomeUsuario}! 👋`,
              ``,
              `Sua senha do *Palpite Tech* foi redefinida.`,
              ``,
              `🔑 Nova senha: *12345678*`,
              ``,
              `Acesse: https://www.palpitetech.com.br/login`,
              ``,
              `⚠️ Recomendamos trocar a senha após o primeiro acesso.`,
            ].join("\n");

            await supabase.functions.invoke("evolution-proxy", {
              body: {
                action: "sendText",
                instanceName: instances[0].evolution_instance_id,
                number: `${numeroBR}@s.whatsapp.net`,
                text: mensagem,
              },
            });

            toast.success("Aviso enviado por WhatsApp!");
          }
        } catch (whatsErr) {
          console.error("Erro ao enviar WhatsApp:", whatsErr);
        }
      }
    } catch (error: any) {
      console.error("Erro ao resetar senha:", error);
      toast.error(error.message || "Erro ao resetar senha");
    } finally {
      setResettingPassword(false);
      setConfirmResetOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Dados Pessoais */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" /> Dados Pessoais
        </h3>
        <div className="bg-muted/50 rounded-lg p-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-xs text-muted-foreground">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do usuário"
              className="h-9"
            />
            {user.nome && <CopyableField label="Nome" value={user.nome} />}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email (também atualiza o login)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="h-9"
            />
            {user.email && <CopyableField label="Email" value={user.email} />}
          </div>

          {/* Celular = WhatsApp (campo único — sincronizado por trigger no banco) */}
          <div className="space-y-1.5">
            <Label htmlFor="celular" className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> Celular / WhatsApp
            </Label>
            <Input
              id="celular"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="(11) 99999-9999"
              className="h-9"
            />
            {user.celular && <CopyableField label="Celular" value={user.celular} />}
          </div>

          {/* WhatsApp direct link */}
          {(() => {
            const phone = user.celular;
            if (!phone) return null;
            const digits = phone.replace(/\D/g, "");
            const waNumber = digits.startsWith("55") ? digits : `55${digits}`;
            return (
              <Button variant="outline" size="sm" className="w-full gap-2 mt-1" asChild>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Enviar WhatsApp
                </a>
              </Button>
            );
          })()}
        </div>
      </div>

      {/* Senha */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Senha
        </h3>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Define a senha para <span className="font-mono font-semibold text-foreground">12345678</span> e notifica o usuário por email e WhatsApp.
          </p>
          <Button
            variant="outline"
            onClick={() => setConfirmResetOpen(true)}
            disabled={resettingPassword || !user.email}
            className="w-full gap-2"
            size="sm"
          >
            {resettingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Resetar para 12345678
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha do usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              A senha de <span className="font-semibold">{user.nome || user.email}</span> será definida como{" "}
              <span className="font-mono font-bold">12345678</span>. O usuário receberá a nova senha por email
              {user.celular ? " e WhatsApp" : ""}. Esta ação é imediata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resettingPassword}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleResetPassword(); }}
              disabled={resettingPassword}
            >
              {resettingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tags */}
      {user.tags && user.tags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4" /> Tags
          </h3>
          <div className="bg-muted/50 rounded-lg p-3">
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
        </div>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <StickyNote className="h-4 w-4" /> Notas Internas
        </h3>
        <div className="bg-muted/50 rounded-lg p-3">
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Anotações sobre este usuário..."
            rows={3}
            className="bg-background"
          />
        </div>
      </div>

      {/* Bloquear */}
      <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/50 bg-destructive/5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-sm">Bloquear Usuário</p>
            <p className="text-xs text-muted-foreground">Impede acesso ao sistema</p>
          </div>
        </div>
        <Switch checked={isBlocked} onCheckedChange={setIsBlocked} />
      </div>

      {/* Salvar */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Alterações
      </Button>

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
    </div>
  );
}
