import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Copy, Loader2, Link2, Send, Plus,
  CheckCircle2, XCircle, Pencil, Pause, Play, Trash2,
  ChevronDown, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadWebhook {
  id: string;
  name: string;
  token: string;
  source_tag: string;
  is_active: boolean;
  leads_count: number;
  last_lead_at: string | null;
  created_at: string;
}

const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const webhookBaseUrl = baseUrl
  ? `${baseUrl.replace(/\/$/, "")}/functions/v1/receive-lead`
  : "";

function buildUrl(token: string) {
  return `${webhookBaseUrl}?token=${encodeURIComponent(token)}`;
}

const TAG_REGEX = /^[a-z0-9_]+$/;

export default function Integracoes() {
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState<LeadWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formTag, setFormTag] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Test dialog
  const [testWebhook, setTestWebhook] = useState<LeadWebhook | null>(null);
  const [testNome, setTestNome] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testCelular, setTestCelular] = useState("");
  const [testSource, setTestSource] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    is_new?: boolean;
    user_id?: string;
    error?: string;
  } | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("lead_webhooks" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setWebhooks((data as any) || []);
    } catch (err) {
      console.error("Erro ao buscar webhooks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const copy = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // ─── Create / Edit ───
  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormTag("");
    setFormActive(true);
    setFormOpen(true);
  };

  const openEdit = (wh: LeadWebhook) => {
    setEditingId(wh.id);
    setFormName(wh.name);
    setFormTag(wh.source_tag);
    setFormActive(wh.is_active);
    setFormOpen(true);
  };

  const handleSave = async () => {
    const tag = formTag.toLowerCase().trim();
    if (!formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!tag || !TAG_REGEX.test(tag)) {
      toast.error("Tag deve conter apenas letras minúsculas, números e _");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("lead_webhooks" as any)
          .update({ name: formName.trim(), source_tag: tag, is_active: formActive, updated_at: new Date().toISOString() } as any)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Webhook atualizado!");
      } else {
        const { error } = await supabase
          .from("lead_webhooks" as any)
          .insert({ name: formName.trim(), source_tag: tag, is_active: formActive } as any);
        if (error) throw error;
        toast.success("Webhook criado!");
      }
      setFormOpen(false);
      fetchWebhooks();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle active ───
  const toggleActive = async (wh: LeadWebhook) => {
    try {
      const { error } = await supabase
        .from("lead_webhooks" as any)
        .update({ is_active: !wh.is_active, updated_at: new Date().toISOString() } as any)
        .eq("id", wh.id);
      if (error) throw error;
      toast.success(wh.is_active ? "Webhook pausado" : "Webhook ativado");
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err?.message || "Erro");
    }
  };

  // ─── Delete ───
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("lead_webhooks" as any)
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success("Webhook excluído");
      setDeleteId(null);
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Test ───
  const openTest = (wh: LeadWebhook) => {
    setTestWebhook(wh);
    setTestNome("");
    setTestEmail("");
    setTestCelular("");
    setTestSource("");
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!testWebhook) return;
    if (!testEmail && !testCelular) {
      toast.error("Informe pelo menos email ou celular");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(buildUrl(testWebhook.token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: testNome || undefined,
          email: testEmail || undefined,
          celular: testCelular || undefined,
          source: testSource || "teste-admin",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, user_id: data.user_id, is_new: data.is_new });
      } else {
        setTestResult({ success: false, error: data.error || `HTTP ${res.status}` });
      }
    } catch (err: unknown) {
      setTestResult({ success: false, error: err instanceof Error ? err.message : "Erro de rede" });
    } finally {
      setTesting(false);
    }
  };

  const examplePayload = `POST {URL_DO_WEBHOOK}
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "celular": "11999999999",
  "tags": ["tag_extra"],
  "source": "nome-da-pagina"
}`;

  if (loading) {
    return (
      <AdminLayout pageTitle="Integrações">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Integrações">
      <div className="px-4 py-4 md:container md:max-w-3xl md:py-8 space-y-5">
        {/* Page header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Integrações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie webhooks e conexões externas
          </p>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Webhooks de Leads</h2>
            <p className="text-xs text-muted-foreground">
              Capture leads de landing pages, formulários e ferramentas externas.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo Webhook
          </Button>
        </div>

        {/* API Loterias Integration */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">API Loterias (Caisa)</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] bg-background">Provedor de Dados</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Esta integração é utilizada pelos processos automáticos (Edge Functions) para sincronizar os resultados oficiais das loterias.
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8 text-xs flex-1 md:flex-none"
                onClick={() => window.open("https://apiloterias.com.br/", "_blank")}
              >
                <Link2 className="h-3.5 w-3.5" />
                Site Oficial
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8 text-xs flex-1 md:flex-none"
                onClick={() => window.open("https://apiloterias.com.br/meu-token", "_blank")}
              >
                <Copy className="h-3.5 w-3.5" />
                Obter Token
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhook cards */}
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Link2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum webhook configurado.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em <strong>+ Novo Webhook</strong> para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <Card key={wh.id} className={!wh.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold">{wh.name}</CardTitle>
                    </div>
                    <Badge
                      variant={wh.is_active ? "default" : "secondary"}
                      className={
                        wh.is_active
                          ? "bg-green-600/15 text-green-700 border-green-600/20 hover:bg-green-600/15"
                          : ""
                      }
                    >
                      {wh.is_active ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Tag exclusiva:{" "}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {wh.source_tag}
                      </Badge>
                    </span>
                    <span>Leads capturados: <strong className="text-foreground">{wh.leads_count}</strong></span>
                    {wh.last_lead_at && (
                      <span>
                        Último lead:{" "}
                        <strong className="text-foreground">
                          {formatDistanceToNow(new Date(wh.last_lead_at), { addSuffix: true, locale: ptBR })}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={buildUrl(wh.token)}
                      className="text-xs font-mono h-8"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5 shrink-0 h-8"
                      onClick={() => copy(buildUrl(wh.token), "URL do webhook")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => openEdit(wh)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8"
                      onClick={() => toggleActive(wh)}
                    >
                      {wh.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {wh.is_active ? "Pausar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(wh.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-8"
                      onClick={() => openTest(wh)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Testar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* How to integrate - collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-2 w-full justify-between text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Como integrar?
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-4 space-y-3">
                <div className="relative">
                  <pre className="text-[11px] bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                    {examplePayload}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7"
                    onClick={() => copy(examplePayload, "Exemplo de payload")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A tag exclusiva do webhook é aplicada automaticamente.
                  Você pode adicionar tags extras no campo <code className="text-primary">"tags"</code>.
                </p>
                <p className="text-xs text-muted-foreground">
                  ✅ Compatível com Elementor, Typeform, Make, Zapier e outros.
                </p>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ─── Create/Edit Dialog ─── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Webhook" : "Novo Webhook"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize as configurações do webhook."
                : "Crie um novo endpoint para captura de leads."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Landing Mega-Sena"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tag exclusiva *</Label>
              <Input
                value={formTag}
                onChange={(e) => setFormTag(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="landing_mega"
                className="h-9 font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Será adicionada automaticamente a todos os leads deste webhook.
                Use apenas letras, números e _.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Ativo</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Test Dialog ─── */}
      <Dialog open={!!testWebhook} onOpenChange={(o) => !o && setTestWebhook(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Webhook</DialogTitle>
            <DialogDescription>
              Envie um lead de teste para <strong>{testWebhook?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input value={testNome} onChange={(e) => setTestNome(e.target.value)} placeholder="João Silva" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="joao@email.com" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Celular</Label>
              <Input value={testCelular} onChange={(e) => setTestCelular(e.target.value)} placeholder="11999999999" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <Input value={testSource} onChange={(e) => setTestSource(e.target.value)} placeholder="teste-manual" className="h-9" />
            </div>

            {testResult && (
              <div
                className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                  testResult.success
                    ? "bg-green-600/10 text-green-700"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <div>
                  {testResult.success ? (
                    <>
                      <p className="font-medium">
                        {testResult.is_new ? "Lead criado!" : "Lead atualizado (já existia)"}
                      </p>
                      <p className="text-xs mt-0.5 font-mono">ID: {testResult.user_id}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Erro</p>
                      <p className="text-xs mt-0.5">{testResult.error}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleTest}
              disabled={testing || (!testEmail && !testCelular)}
              className="gap-2"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir webhook?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Leads futuros com este token receberão erro 403.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
