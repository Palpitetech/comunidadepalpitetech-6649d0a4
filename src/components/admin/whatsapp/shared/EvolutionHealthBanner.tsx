import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthIssue {
  type: "error" | "warning";
  message: string;
}

interface HealthResult {
  ok: boolean;
  url: string;
  normalizedUrl: string;
  hasTrailingSlash: boolean;
  reachable: boolean;
  authValid: boolean;
  httpStatus: number;
  evolutionVersion: string | null;
  issues: HealthIssue[];
}

/**
 * Banner que valida configuração da Evolution API:
 * - Detecta barra '/' final em EVOLUTION_API_URL
 * - Testa conectividade com o servidor
 * - Valida EVOLUTION_API_KEY
 */
export function EvolutionHealthBanner() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("evolution-proxy", {
        body: { action: "healthCheck" },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error && !data?.issues) throw new Error(data.error);
      setResult(data as HealthResult);
    } catch (err: any) {
      setError(err?.message || "Falha ao validar Evolution API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (loading && !result) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Validando conexão com Evolution API…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        <div className="flex items-center gap-2">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Não foi possível validar a Evolution API: {error}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={check}>
          <RefreshCw className="h-3 w-3" />
          Tentar
        </Button>
      </div>
    );
  }

  if (!result) return null;

  const hasErrors = result.issues.some((i) => i.type === "error");
  const hasWarnings = result.issues.some((i) => i.type === "warning");

  // Tudo certo
  if (result.ok && !hasWarnings) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="truncate">
            <span className="text-foreground font-medium">Evolution API conectada</span>
            {result.evolutionVersion ? <span className="text-muted-foreground"> · v{result.evolutionVersion}</span> : null}
            <span className="text-muted-foreground"> · {result.url}</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs shrink-0" onClick={check} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  // Tem erros ou avisos
  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs ${
        hasErrors
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <p className="font-medium">
              {hasErrors ? "Problemas na configuração da Evolution API" : "Aviso na configuração da Evolution API"}
            </p>
            <ul className="space-y-0.5 list-disc list-inside opacity-90">
              {result.issues.map((issue, idx) => (
                <li key={idx}>{issue.message}</li>
              ))}
            </ul>
            <p className="text-[11px] opacity-70 pt-1 break-all">
              URL atual: <code className="font-mono">{result.url}</code>
            </p>
            {result.hasTrailingSlash && (
              <p className="text-[11px] opacity-90">
                Sugerido: <code className="font-mono">{result.normalizedUrl}</code> · Atualize em Cloud → Secrets → <strong>EVOLUTION_API_URL</strong>.
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs shrink-0" onClick={check} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}
