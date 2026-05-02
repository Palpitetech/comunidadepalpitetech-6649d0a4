import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Globe, Tag, ChevronDown, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { LeadStatus, LEAD_STATUS_OPTIONS, getLeadStatusConfig } from "@/types/crm";

export interface LeadInbox {
  id: string;
  nome: string | null;
  email: string | null;
  celular: string | null;
  slug: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  gclid: string | null;
  fbclid: string | null;
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


function AttrRow({ label, value, mono = true, link = false }: { label: string; value: string | null | undefined; mono?: boolean; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2 items-start text-xs">
      <span className="text-muted-foreground uppercase tracking-wider text-[10px] pt-0.5">{label}</span>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 break-all"
        >
          <span className="truncate">{value.replace(/^https?:\/\//, "")}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <span className={cn("break-all", mono && "font-mono")}>{value}</span>
      )}
    </div>
  );
}

export function LeadDetailSheet({ lead, open, onOpenChange, onChanged }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showFullAttribution, setShowFullAttribution] = useState(false);

  useEffect(() => {
    if (lead) {
      setNome(lead.nome || "");
      setEmail(lead.email || "");
      setCelular(lead.celular || "");
      setConfirmDelete(false);
      setShowFullAttribution(false);
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

  // Quick attribution summary (always visible)
  const hasAnyUtm = !!(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content || lead.utm_term);
  const hasAnyClickId = !!(lead.gclid || lead.fbclid);

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

          {/* Origin / Attribution */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Origem & atribuição</Label>

            {/* Always-visible essentials */}
            <div className="space-y-1.5">
              {lead.slug && (
                <div className="flex items-center gap-2 text-xs">
                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="font-mono">{lead.slug}</span>
                </div>
              )}
              {lead.utm_source && (
                <AttrRow label="Source" value={lead.utm_source} />
              )}
              {lead.utm_campaign && (
                <AttrRow label="Campaign" value={lead.utm_campaign} />
              )}
              {lead.pagina_origem && (
                <div className="flex items-start gap-2 text-xs">
                  <Globe className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <a
                    href={lead.pagina_origem}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate"
                    title={lead.pagina_origem}
                  >
                    {lead.pagina_origem.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>

            {/* Click IDs badges */}
            {hasAnyClickId && (
              <div className="flex flex-wrap gap-1.5">
                {lead.gclid && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] gap-1">
                    🔍 Google Ads
                  </Badge>
                )}
                {lead.fbclid && (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] gap-1">
                    📣 Meta Ads
                  </Badge>
                )}
              </div>
            )}

            {/* Collapsible: full attribution */}
            {(hasAnyUtm || hasAnyClickId || lead.referrer || lead.ip) && (
              <Collapsible open={showFullAttribution} onOpenChange={setShowFullAttribution}>
                <CollapsibleTrigger asChild>
                  <button className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
                    <ChevronDown className={cn("h-3 w-3 transition-transform", showFullAttribution && "rotate-180")} />
                    Atribuição completa
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-1.5 border-l-2 border-border pl-3 ml-1">
                  <AttrRow label="Source" value={lead.utm_source} />
                  <AttrRow label="Medium" value={lead.utm_medium} />
                  <AttrRow label="Campaign" value={lead.utm_campaign} />
                  <AttrRow label="Content" value={lead.utm_content} />
                  <AttrRow label="Term" value={lead.utm_term} />
                  <AttrRow label="Referrer" value={lead.referrer} link />
                  <AttrRow label="gclid" value={lead.gclid} />
                  <AttrRow label="fbclid" value={lead.fbclid} />
                  <AttrRow label="IP" value={lead.ip} />
                </CollapsibleContent>
              </Collapsible>
            )}
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
