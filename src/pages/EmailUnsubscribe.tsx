import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function EmailUnsubscribe() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email) return;
    setStatus("loading");
    try {
      const { error } = await supabase.functions.invoke("email-unsubscribe", { body: { email } });
      if (error) throw error;
      setStatus("ok");
    } catch (err: any) {
      setError(err.message || "Erro");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Cancelar inscrição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!email && (
            <p className="text-sm text-muted-foreground">Link inválido — email não fornecido.</p>
          )}
          {email && status === "idle" && (
            <>
              <p className="text-sm">Confirmar que <strong>{email}</strong> não deseja mais receber emails da Palpite Tech?</p>
              <Button onClick={submit} className="w-full">Confirmar descadastro</Button>
            </>
          )}
          {status === "loading" && (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Processando...</div>
          )}
          {status === "ok" && (
            <div className="flex items-start gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Pronto!</p>
                <p className="text-sm text-muted-foreground">{email} foi removido das nossas listas de email.</p>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
