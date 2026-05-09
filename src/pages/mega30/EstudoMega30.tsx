import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";
import { getEstudo } from "@/lib/mega30/estudosCatalog";
import { useEstudoMega30 } from "@/hooks/useEstudoMega30";
import { NarrativaIA } from "@/components/mega30/NarrativaIA";
import type { PeriodoFiltro } from "@/lib/megaEspecialEngine";

export default function EstudoMega30() {
  const { id = "" } = useParams<{ id: string }>();
  const estudo = getEstudo(id);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>({ tipo: "total" });

  if (!estudo) return <Navigate to="/mega-30" replace />;
  if (!estudo.disponivel) return <Navigate to="/mega-30" replace />;

  const { data, isLoading, isError } = useEstudoMega30({
    estudoId: estudo.id,
    agrupamento: estudo.agrupamentoBase,
    periodo,
    topN: estudo.agrupamentoBase === "dezena" ? 15 : 16,
  });

  return (
    <MainLayout pageTitle={`Estudo ${estudo.numero.toString().padStart(2, "0")}`}>
      <div className="max-w-3xl mx-auto px-4 py-5">
        <h1 className="text-xl font-bold text-foreground mb-1">{estudo.titulo}</h1>
        <p className="text-sm text-muted-foreground mb-4">{estudo.descricao}</p>

        {/* Filtros de período */}
        <div className="flex gap-2 flex-wrap mb-4">
          <FiltroChip label="30 anos" ativo={periodo.tipo === "total"} onClick={() => setPeriodo({ tipo: "total" })} />
          <FiltroChip label="1º Sem" ativo={periodo.tipo === "semestre" && periodo.valor === 1} onClick={() => setPeriodo({ tipo: "semestre", valor: 1 })} />
          <FiltroChip label="2º Sem" ativo={periodo.tipo === "semestre" && periodo.valor === 2} onClick={() => setPeriodo({ tipo: "semestre", valor: 2 })} />
          <FiltroChip label="Mega da Virada" ativo={periodo.tipo === "virada"} onClick={() => setPeriodo({ tipo: "virada" })} />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {isError && <p className="text-sm text-destructive">Erro ao carregar dados.</p>}

        {data && (
          <>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 flex justify-between text-xs font-semibold text-muted-foreground uppercase">
                <span>Posição / {estudo.agrupamentoBase}</span>
                <span>Frequência</span>
              </div>
              {data.ranking.map((it) => (
                <div key={it.chave} className="flex justify-between items-center px-4 py-2.5 border-t border-border text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-6">#{it.posicao}</span>
                    <span className="font-semibold text-foreground">{it.label}</span>
                  </div>
                  <span className="font-mono font-bold text-primary">{it.freq}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground mt-2 text-right">
              {data.meta.totalConcursos} concursos · {data.meta.engineVersion}
            </p>

            <NarrativaIA resultado={data} />
          </>
        )}
      </div>
    </MainLayout>
  );
}

function FiltroChip({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
        ativo
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
