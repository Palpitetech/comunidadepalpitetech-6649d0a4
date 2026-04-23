import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { EstudoDisponivel } from "@/hooks/useEstudosDisponiveis";
import { labelDataRelativa } from "@/lib/dateLabel";

interface Props {
  estudos: EstudoDisponivel[];
  loading: boolean;
  value: string | null;
  onChange: (estudoId: string) => void;
  disabled?: boolean;
}

function montarLinhaResumo(e: EstudoDisponivel): string {
  const partes: string[] = [];
  partes.push(e.eh_futuro ? "Próximo" : "Já realizado");
  if (e.proximo_concurso != null) partes.push(String(e.proximo_concurso));
  const dataLabel = labelDataRelativa(e.data_sorteio);
  if (dataLabel) partes.push(dataLabel);
  return partes.join(" · ");
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant={selecionado.eh_futuro ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {selecionado.eh_futuro ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {montarLinhaResumo(selecionado)}
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant={e.eh_futuro ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {e.eh_futuro ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {montarLinhaResumo(e)}
                  </Badge>
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
