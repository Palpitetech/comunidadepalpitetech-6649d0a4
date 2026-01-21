import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Webhook } from "lucide-react";
import { toast } from "sonner";

interface KirvanoWebhookCardProps {
  functionPath?: string;
}

export function KirvanoWebhookCard({
  functionPath = "handle-kirvano-webhook",
}: KirvanoWebhookCardProps) {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const webhookUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/functions/v1/${functionPath}`
    : "";

  const copy = async () => {
    if (!webhookUrl) {
      toast.error("URL do backend não disponível neste ambiente");
      return;
    }

    await navigator.clipboard.writeText(webhookUrl);
    toast.success("URL do webhook copiada!");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-primary" />
          <CardTitle className="text-senior-lg">Webhook Kirvano</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Use esta URL para cadastrar o webhook na Kirvano.
        </p>

        <div className="flex gap-2">
          <Input readOnly value={webhookUrl} placeholder="URL indisponível" />
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={copy}
            disabled={!webhookUrl}
          >
            <Copy className="h-4 w-4" />
            Copiar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Dica: a URL deve terminar com <code>/functions/v1/{functionPath}</code>.
        </p>
      </CardContent>
    </Card>
  );
}
