import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Copy, Eye, EyeOff, RefreshCw, Loader2, Link2, Send,
  CheckCircle2, XCircle, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Integracoes() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  // Test dialog
  const [testOpen, setTestOpen] = useState(false);
  const [testNome, setTestNome] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testCelular, setTestCelular] = useState("");
  const [testTags, setTestTags] = useState("");
  const [testSource, setTestSource] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; user_id?: string; error?: string } | null>(null);

  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const webhookUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/functions/v1/receive-lead`
    : "";
  const fullUrl = token
    ? `${webhookUrl}?token=${encodeURIComponent(token)}`
    : webhookUrl;

  const fetchToken = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("lead_webhook_token")
        .eq("id", "default")
        .single();
      if (error) throw error;
      setToken((data as any)?.lead_webhook_token || "");
    } catch (err) {
      console.error("Erro ao buscar token:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchToken(); }, []);

  const regenerateToken = async () => {
    if (!confirm("Gerar um novo token? O token anterior será invalidado.")) return;
    setRegenerating(true);
    try {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const newToken = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
      const { error } = await supabase
        .from("admin_settings")
        .update({ lead_webhook_token: newToken } as any)
        .eq("id", "default");
      if (error) throw error;
      setToken(newToken);
      toast.success("Novo token gerado! Atualize nas suas landing pages.");
    } catch (err) {
      console.error("Erro ao regenerar token:", err);
      toast.error("Erro ao gerar novo token");
    } finally {
      setRegenerating(false);
    }
  };

  const copy = async (text: string, label: string) => {
    if (!text) { toast.error("Conteúdo não disponível"); return; }
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleTest = async () => {
    if (!testEmail && !testCelular) {
      toast.error("Informe pelo menos email ou celular");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const tags = testTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`${fullUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: testNome || undefined,
          email: testEmail || undefined,
          celular: testCelular || undefined,
          tags: tags.length > 0 ? tags : undefined,
          source: testSource || "teste-admin",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, user_id: data.user_id });
      } else {
        setTestResult({ success: false, error: data.error || `HTTP ${res.status}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro de rede";
      setTestResult({ success: false, error: msg });
    } finally {
      setTesting(false);
    }
  };

  const examplePayload = `{
  "nome": "João Silva",
  "email": "joao@email.com",
  "celular": "11999999999",
  "tags": ["landing_mega"],
  "source": "pagina-megasena"
}`;

  if (loading) {
    return (
      <MainLayout pageTitle="Integrações" onBack={() => navigate("/admin")}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Integrações" onBack={() => navigate("/admin")}>
      <div className="px-4 py-4 md:container md:max-w-3xl md:py-8 space-y-4">
        {/* Page header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Integrações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Conecte fontes externas ao sistema</p>
        </div>

        {/* Webhook de Leads Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Webhook de Leads</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Capture leads de qualquer landing page externa via POST
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={token ? "default" : "secondary"}
                className={token ? "bg-green-600/15 text-green-700 border-green-600/20 hover:bg-green-600/15" : ""}
              >
                {token ? "Ativo" : "Não configurado"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Compatível com Elementor, Typeform, Make, Zapier e outros.
            </p>

            {/* Token */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Token de Autenticação
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    type={showToken ? "text" : "password"}
                    value={token}
                    className="pr-10 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={regenerateToken}
                  disabled={regenerating}
                  title="Gerar novo token"
                >
                  {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL do Webhook
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={fullUrl}
                  placeholder="URL indisponível"
                  className="text-xs font-mono"
                />
                <Button
                  variant="secondary"
                  className="gap-2 shrink-0"
                  onClick={() => copy(fullUrl, "URL do webhook")}
                  disabled={!fullUrl || !token}
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tag exclusiva
              </Label>
              <p className="text-xs text-muted-foreground">
                Todo lead capturado por este webhook recebe automaticamente:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">lead</Badge>
                <Badge variant="secondary">fonte específica</Badge>
              </div>
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-muted-foreground">Tag de origem (configure no payload)</Label>
                <Input
                  readOnly
                  placeholder='landing_mega, pagina_vip...'
                  className="text-xs h-8 bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  Adicione no campo <code className="text-primary">"tags"</code> do payload JSON
                </p>
              </div>
            </div>

            {/* Evento */}
            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Evento disparado
              </Label>
              <p className="text-xs text-muted-foreground">
                Cada lead capturado gera um evento:
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">lead_externo</Badge>
                <button
                  onClick={() => navigate("/admin/eventos")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Ver eventos <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Payload example */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Exemplo de payload (POST JSON)
              </Label>
              <div className="relative">
                <pre className="text-[11px] bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground font-mono leading-relaxed">
                  {examplePayload}
                </pre>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => copy(examplePayload, "Payload de exemplo")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                variant="outline"
                className="gap-2 flex-1"
                onClick={() => {
                  setTestResult(null);
                  setTestOpen(true);
                }}
                disabled={!token}
              >
                <Send className="h-4 w-4" />
                Testar webhook
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              ✅ Configure esta URL no seu formulário (Elementor, Typeform, Make, Zapier, etc.).
              Leads criados receberão automaticamente a tag <code className="text-primary">lead</code> e,
              se houver template WhatsApp configurado, a mensagem de boas-vindas.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input
                value={testNome}
                onChange={(e) => setTestNome(e.target.value)}
                placeholder="João Silva"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="joao@email.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Celular</Label>
              <Input
                value={testCelular}
                onChange={(e) => setTestCelular(e.target.value)}
                placeholder="11999999999"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags (separadas por vírgula)</Label>
              <Input
                value={testTags}
                onChange={(e) => setTestTags(e.target.value)}
                placeholder="landing_mega, teste"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <Input
                value={testSource}
                onChange={(e) => setTestSource(e.target.value)}
                placeholder="teste-admin"
                className="h-9"
              />
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
                      <p className="font-medium">Sucesso!</p>
                      <p className="text-xs mt-0.5 font-mono">user_id: {testResult.user_id}</p>
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
    </MainLayout>
  );
}
