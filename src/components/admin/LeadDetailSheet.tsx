import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Mail, Phone, Globe, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface LeadInbox {
  id: string;
  nome: string | null;
  email: string | null;
  celular: string | null;
  source: string | null;
  utm_source: string | null;
  pagina_origem: string | null;
  tags: string[] | null;
  webhook_name: string | null;
  ip: string | null;
  raw_payload: Record<string, unknown> | null;
  status: string;
  perfil_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  lead: LeadInbox | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const STATUS_OPTIONS: { key: string; label: string; className: string }[] = [
  { key: "novo", label: "Novo", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { key: "contatado", label: "Contatado", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { key: "convertido", label: "Convertido", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { key: "descartado", label: "Descartado", className: "bg-muted text-muted-foreground border-border" },
];

export function LeadDetailSheet({ lead, open, onOpenChange, onChanged }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (lead) {
      setNome(lead.nome || "");
      setEmail(lead.email || "");
      setCelular(lead.celular || "");
      setConfirmDelete(false);
    }
  }, [lead]);

  if (!lead) return null;

  const handleStatus = async (newStatus: string) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("leads_inbox" as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
        .eq("id", lead.id);
      if (error) throw error;
      toast.success(`Status atualizado para "${newStatus}"`);
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("leads_inbox" as any).delete().eq("id", lead.id);
      if (error) throw error;
      toast.success("Lead excluído");
      onChanged();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir");
    } finally {
      setBusy(false);
    }
  };

  const handlePromote = async () => {
    if (!nome.trim() || !email.trim() || !celular.trim()) {
      toast.error("Preencha nome, email e celular para promover");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("promote-lead-to-user", {
        body: {
          lead_id: lead.id,
          nome: nome.trim(),
          email: email.trim(),
          celular: celular.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data?.is_new ? "Usuário criado com sucesso!" : "Usuário existente vinculado ao lead");
      onChanged();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao promover lead");
    } finally {
      setBusy(false);
    }
  };

  const currentStatusOpt = STATUS_OPTIONS.find((s) => s.key === lead.status) || STATUS_OPTIONS[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Detalhes do Lead
            <Badge variant="outline" className={currentStatusOpt.className}>
              {currentStatusOpt.label}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Capturado {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {lead.webhook_name && ` · via ${lead.webhook_name}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-5">
          {/* Status actions */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mudar status</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  size="sm"
                  variant={lead.status === opt.key ? "default" : "outline"}
                  disabled={busy || lead.status === opt.key}
                  onClick={() => handleStatus(opt.key)}
                  className="h-7 text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Editable contact data (used for promote) */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dados do contato</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-9" placeholder="Nome completo" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" placeholder="email@dominio.com" />
              </div>
              <div>
                <Label className="text-xs">Celular</Label>
                <Input value={celular} onChange={(e) => setCelular(e.target.value)} className="h-9" placeholder="11999999999" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Origin info */}
          <div className="space-y-2 text-sm">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Origem</Label>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {lead.source && (
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Source:</span>
                  <span className="font-mono">{lead.source}</span>
                </div>
              )}
              {lead.utm_source && (
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">UTM:</span>
                  <span className="font-mono">{lead.utm_source}</span>
                </div>
              )}
              {lead.pagina_origem && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Página:</span>
                  <a href={lead.pagina_origem} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                    {lead.pagina_origem}
                  </a>
                </div>
              )}
              {lead.ip && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono">{lead.ip}</span>
                </div>
              )}
            </div>
          </div>

          {lead.tags && lead.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {lead.tags.map((t) => (
                    <span key={t} className="inline-block px-2 py-0.5 rounded bg-muted text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {lead.raw_payload && (
            <>
              <Separator />
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Payload bruto (debug)</summary>
                <pre className="mt-2 p-2 bg-muted/50 rounded text-[10px] overflow-x-auto max-h-48">
                  {JSON.stringify(lead.raw_payload, null, 2)}
                </pre>
              </details>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handlePromote}
              disabled={busy || lead.status === "convertido"}
              className="gap-2"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Promover a usuário
            </Button>
            {!confirmDelete ? (
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" />
                Excluir lead
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={busy}>
                  Cancelar
                </Button>
                <Button variant="destructive" className="flex-1 gap-2" onClick={handleDelete} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar exclusão
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
