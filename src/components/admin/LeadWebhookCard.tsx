import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Globe, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function LeadWebhookCard() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

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

  useEffect(() => {
    fetchToken();
  }, []);

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
    if (!text) {
      toast.error("URL não disponível neste ambiente");
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiada!`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const examplePayload = `{
  "nome": "João Silva",
  "email": "joao@email.com",
  "celular": "11999999999",
  "tags": ["landing_mega"],
  "source": "pagina-megasena"
}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Webhook de Leads</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Token de autenticação</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                readOnly
                type={showToken ? "text" : "password"}
                value={token}
                className="pr-10 text-xs"
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
              type="button"
              variant="outline"
              size="icon"
              onClick={regenerateToken}
              disabled={regenerating}
              title="Gerar novo token"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>URL do Webhook (com token)</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={fullUrl}
              placeholder="URL indisponível"
              className="text-xs"
            />
            <Button
              type="button"
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

        <div className="space-y-2">
          <Label>Exemplo de payload (POST JSON)</Label>
          <div className="relative">
            <pre className="text-[11px] bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground">
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

        <p className="text-xs text-muted-foreground">
          ✅ Configure esta URL no seu formulário (Elementor, Typeform, Make, Zapier, etc.). 
          Leads criados receberão automaticamente a tag <code className="text-primary">lead</code> e, 
          se houver template WhatsApp configurado, a mensagem de boas-vindas.
        </p>
      </CardContent>
    </Card>
  );
}
