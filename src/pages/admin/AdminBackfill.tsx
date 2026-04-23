import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Upload, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ImportResult = {
  message?: string;
  total_lidos?: number;
  normalizados?: number;
  upserted?: number;
  erros_linhas?: number;
  amostra_erros?: { linha: number; concurso?: number; motivo: string }[];
  erros_batches?: string[];
  error?: string;
};

export default function AdminBackfill() {
  const [file, setFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
  }

  async function executar() {
    if (!file) return;
    setConfirmOpen(false);
    setRunning(true);
    setResult(null);
    setProgress(5);

    // Pseudo-progress (a função roda inteira no servidor)
    const tick = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 5 : p));
    }, 800);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backfill-megasena-excel`;
      const fd = new FormData();
      fd.append("file", file);

      const resp = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json: ImportResult = await resp.json();
      clearInterval(tick);
      setProgress(100);

      if (!resp.ok) {
        setResult(json);
        toast.error(json.error || "Erro ao importar histórico");
      } else {
        setResult(json);
        toast.success(
          `Importação concluída: ${json.upserted ?? 0} concursos atualizados`,
        );
      }
    } catch (e) {
      clearInterval(tick);
      setProgress(0);
      const msg = (e as Error).message;
      setResult({ error: msg });
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }

  return (
    <AdminLayout pageTitle="Backfill de Resultados">
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Importar histórico Mega Sena (XLSX oficial)
            </CardTitle>
            <CardDescription>
              Carregue o arquivo <code className="bg-muted px-1 rounded">Mega-Sena.xlsx</code>{" "}
              da Caixa Econômica Federal. A operação é idempotente: rodar mais de uma vez não
              duplica registros (upsert por concurso).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Arquivo XLSX</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={running}
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!file || running}
              className="w-full sm:w-auto"
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar histórico
                </>
              )}
            </Button>

            {running && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">
                  Processando ~3000 concursos no servidor. Não feche esta aba.
                </p>
              </div>
            )}

            {result && !result.error && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.message}
                </div>
                <ul className="text-sm space-y-1 text-foreground">
                  <li>Total lido do arquivo: <strong>{result.total_lidos}</strong></li>
                  <li>Normalizados: <strong>{result.normalizados}</strong></li>
                  <li>Inseridos/atualizados no banco: <strong>{result.upserted}</strong></li>
                  <li>Linhas com erro: <strong>{result.erros_linhas ?? 0}</strong></li>
                </ul>
                {result.amostra_erros && result.amostra_erros.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Ver amostra de erros ({result.amostra_erros.length})
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                      {JSON.stringify(result.amostra_erros, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {result?.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 font-medium text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {result.error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta operação processará todas as linhas do XLSX (cerca de 3.000 concursos)
              e fará upsert na tabela de resultados. É seguro rodar mais de uma vez —
              registros existentes serão atualizados, não duplicados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executar}>Importar agora</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
