import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Webhook, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface KirvanoWebhookCardProps {
  functionPath?: string;
}

export function KirvanoWebhookCard({
  functionPath = "handle-kirvano-webhook",
}: KirvanoWebhookCardProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const baseWebhookUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/functions/v1/${functionPath}`
    : "";

  const fullUrl = token.trim()
    ? `${baseWebhookUrl}?token=${encodeURIComponent(token.trim())}`
    : baseWebhookUrl;

  const copy = async (text: string, label: string) => {
    if (!text) {
      toast.error("URL do backend não disponível neste ambiente");
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiada!`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-primary" />
          <CardTitle className="text-senior-lg">Webhook Kirvano</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cole o token da Kirvano abaixo para gerar a URL completa do webhook.
        </p>

        <div className="space-y-2">
          <Label htmlFor="kirvano-token">Token da Kirvano</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="kirvano-token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole o token aqui..."
                className="pr-10"
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
          </div>
        </div>

        <div className="space-y-2">
          <Label>URL do Webhook {token.trim() ? "(com token)" : "(base)"}</Label>
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
              disabled={!fullUrl}
            >
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {token.trim()
            ? "✅ URL completa pronta — cole na configuração de webhook da Kirvano."
            : "⚠️ Informe o token para gerar a URL completa com autenticação."}
        </p>
      </CardContent>
    </Card>
  );
}
