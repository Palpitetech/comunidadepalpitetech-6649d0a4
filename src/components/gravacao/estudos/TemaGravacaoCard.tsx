import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  FileText,
  CheckCircle2,
  Clock,
  Lock,
  ChevronDown,
} from "lucide-react";
import type { TemaGravacao } from "./temasConfig";
import {
  useEstudosGravacaoLista,
  type EstudoListItem,
} from "@/hooks/useEstudosGravacaoLista";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  tema: TemaGravacao;
  loteriaTag: string;
}

function fmtData(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const hoje = new Date();
  const diff = (hoje.getTime() - d.getTime()) / 86_400_000;
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (diff < 1 && d.getDate() === hoje.getDate()) return `Hoje ${hora}`;
  if (diff < 2) return `Ontem ${hora}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + hora;
}

export default function TemaGravacaoCard({ tema, loteriaTag }: Props) {
  const navigate = useNavigate();
  const ehAtivo = tema.status === "ativo";

  const { data: estudos, isLoading } = useEstudosGravacaoLista({
    loteriaTag,
    temaEstudo: tema.tema_estudo,
    limit: 30,
    enabled: ehAtivo,
  });

  const lista = estudos || [];

  const { rascunhos, publicados } = useMemo(() => {
    return {
      rascunhos: lista.filter((e) => e.status === "rascunho"),
      publicados: lista.filter((e) => e.status === "publicado"),
    };
  }, [lista]);

  // Pré-seleciona o primeiro item disponível (rascunho mais recente, ou publicado)
  const inicial = rascunhos[0]?.id ?? publicados[0]?.id ?? "";
  const [selecionadoId, setSelecionadoId] = useState<string>("");
  const idAtivo = selecionadoId || inicial;
  const atual = lista.find((e) => e.id === idAtivo);

  const handlePlay = () => {
    if (!atual) return;
    navigate(`${tema.rotaBase}?postagem=${atual.id}`);
  };

  return (
    <article
      className="rounded-xl border bg-card overflow-hidden"
      style={{ borderLeft: `4px solid ${tema.cor}` }}
    >
      {/* Cabeçalho do tema */}
      <header className="px-5 py-4 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold">{tema.titulo}</h2>
              {!ehAtivo && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-muted text-muted-foreground flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Em breve
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tema.descricao}
            </p>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap"
            style={{ background: `${tema.cor}20`, color: tema.cor }}
          >
            Fullscreen · {tema.totalSlides} slides
          </span>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="p-4">
        {!ehAtivo ? (
          <div className="text-xs text-muted-foreground text-center py-6">
            Tema ainda não disponível para gravação.
          </div>
        ) : isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : lista.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <Clock className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">Aguardando rascunho do dia</p>
            <p className="text-[11px] mt-1">
              Estudos são gerados automaticamente após o resultado oficial.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Versão para gravar
              </label>
              <span className="text-[10px] text-muted-foreground">
                {lista.length} {lista.length === 1 ? "versão" : "versões"}
              </span>
            </div>

            <div className="flex gap-2">
              <Select value={idAtivo} onValueChange={setSelecionadoId}>
                <SelectTrigger className="flex-1 h-11">
                  <SelectValue placeholder="Selecione um estudo">
                    {atual && <ItemLabel estudo={atual} cor={tema.cor} compact />}
                  </SelectValue>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {rascunhos.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-[10px] uppercase tracking-wider text-amber-600">
                        Rascunhos · {rascunhos.length}
                      </SelectLabel>
                      {rascunhos.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="py-2">
                          <ItemLabel estudo={e} cor={tema.cor} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {rascunhos.length > 0 && publicados.length > 0 && <SelectSeparator />}
                  {publicados.length > 0 && (
                    <SelectGroup>
                      <SelectLabel
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: tema.cor }}
                      >
                        Publicados · {publicados.length}
                      </SelectLabel>
                      {publicados.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="py-2">
                          <ItemLabel estudo={e} cor={tema.cor} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>

              <Button
                onClick={handlePlay}
                disabled={!atual}
                className="h-11 px-4 gap-1.5 font-bold"
                style={{ background: tema.cor, color: "#0A0A0A" }}
              >
                <Play className="h-4 w-4 fill-current" />
                Gravar
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ItemLabel({
  estudo,
  cor,
  compact = false,
}: {
  estudo: EstudoListItem;
  cor: string;
  compact?: boolean;
}) {
  const isRascunho = estudo.status === "rascunho";
  return (
    <span className="flex items-center gap-2 min-w-0">
      {isRascunho ? (
        <FileText className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: cor }} />
      )}
      <span className="font-bold text-sm">#{estudo.proximo_concurso ?? "?"}</span>
      <span
        className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
        style={{
          background: isRascunho ? "rgba(245, 158, 11, 0.15)" : `${cor}26`,
          color: isRascunho ? "#D97706" : cor,
        }}
      >
        {isRascunho ? "Rascunho" : "Publicado"}
      </span>
      {!compact && (
        <span className="text-[10px] text-muted-foreground ml-auto pl-2">
          {fmtData(estudo.publicar_em ?? estudo.created_at)}
        </span>
      )}
      {compact && (
        <span className="text-[10px] text-muted-foreground truncate">
          · {fmtData(estudo.publicar_em ?? estudo.created_at)}
        </span>
      )}
    </span>
  );
}
