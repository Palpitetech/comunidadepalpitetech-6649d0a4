import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { EstudoDisponivel } from "@/hooks/useEstudosDisponiveis";

interface Props {
  estudos: EstudoDisponivel[];
  loading: boolean;
  value: string | null;
  onChange: (estudoId: string) => void;
  disabled?: boolean;
}

export function EstudoSelector({ estudos, loading, value, onChange, disabled }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando estudos disponíveis...
      </div>
    );
  }

  if (!estudos.length) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Nenhum estudo publicado disponível ainda.
      </div>
    );
  }

  const selecionado = estudos.find((e) => e.id === value);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Estudo escolhido</p>
      <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full h-auto min-h-[3.25rem] py-2">
          <SelectValue placeholder="Selecione um estudo">
            {selecionado && (
              <div className="flex flex-col items-start gap-1 text-left">
                <span className="text-sm font-medium line-clamp-1">{selecionado.titulo || "Estudo"}</span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={
                      selecionado.eh_futuro
                        ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px]"
                        : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400 text-[10px]"
                    }
                  >
                    {selecionado.eh_futuro ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    Concurso {selecionado.proximo_concurso ?? "—"}
                  </Badge>
                  {selecionado.status === "rascunho" && (
                    <Badge variant="secondary" className="text-[10px]">Rascunho</Badge>
                  )}
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover z-50 max-w-[calc(100vw-2rem)]">
          {estudos.map((e) => (
            <SelectItem key={e.id} value={e.id} className="py-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium line-clamp-1">{e.titulo || "Estudo"}</span>
                <div className="flex items-center gap-1.5">
                  {e.eh_futuro ? (
                    <Badge variant="outline" className="border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Próximo · {e.proximo_concurso ?? "—"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400 text-[10px]">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Já realizado · {e.proximo_concurso ?? "—"}
                    </Badge>
                  )}
                  {e.status === "rascunho" && (
                    <Badge variant="secondary" className="text-[10px]">Rascunho</Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
