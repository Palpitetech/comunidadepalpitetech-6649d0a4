import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LOTERIAS = [
  { key: "lotofacil", label: "Lotofácil", fn: "sync-lotofacil", emoji: "🍀" },
  { key: "megasena", label: "Mega-Sena", fn: "sync-megasena", emoji: "💰" },
  { key: "duplasena", label: "Dupla Sena", fn: "sync-duplasena", emoji: "🎯" },
  { key: "quina", label: "Quina", fn: "sync-quina", emoji: "🌟" },
  { key: "lotomania", label: "Lotomania", fn: "sync-lotomania", emoji: "🎰" },
  { key: "diadesorte", label: "Dia de Sorte", fn: "sync-diadesorte", emoji: "🍀" },
] as const;

type Status = "idle" | "loading" | "success" | "error";

export default function AdminManutencao() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [results, setResults] = useState<Record<string, string>>({});

  const handleReprocess = async (loteria: typeof LOTERIAS[number]) => {
    setStatuses(s => ({ ...s, [loteria.key]: "loading" }));
    setResults(r => ({ ...r, [loteria.key]: "" }));

    try {
      const { data, error } = await supabase.functions.invoke(loteria.fn, {
        body: { action: "reprocess_history" },
      });

      if (error) throw error;

      const msg = `✅ ${data?.reprocessados ?? 0} reprocessados${data?.erros ? `, ${data.erros} erros` : ""}`;
      setStatuses(s => ({ ...s, [loteria.key]: "success" }));
      setResults(r => ({ ...r, [loteria.key]: msg }));
      toast.success(`${loteria.label}: ${msg}`);
    } catch (err: any) {
      const msg = err?.message || "Erro desconhecido";
      setStatuses(s => ({ ...s, [loteria.key]: "error" }));
      setResults(r => ({ ...r, [loteria.key]: msg }));
      toast.error(`${loteria.label}: ${msg}`);
    }
  };

  return (
    <AdminLayout>
      <div className="container-senior py-4 sm:py-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Manutenção</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Reprocessar histórico de resultados na tabela unificada
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
          <p className="font-medium text-yellow-800 dark:text-yellow-300">⚠️ Atenção</p>
          <p className="text-yellow-700 dark:text-yellow-400 mt-1">
            O reprocessamento busca cada concurso na API e atualiza a tabela unificada.
            Pode demorar vários minutos dependendo da quantidade de concursos.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOTERIAS.map((loteria) => {
            const status = statuses[loteria.key] || "idle";
            const result = results[loteria.key];

            return (
              <div key={loteria.key} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{loteria.emoji}</span>
                  <span className="font-semibold">{loteria.label}</span>
                  {status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                  {status === "error" && <AlertCircle className="h-4 w-4 text-destructive ml-auto" />}
                </div>

                {result && (
                  <p className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                    {result}
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  disabled={status === "loading"}
                  onClick={() => handleReprocess(loteria)}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reprocessando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Reprocessar histórico
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
