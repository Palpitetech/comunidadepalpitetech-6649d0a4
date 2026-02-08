import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  getDistribuicaoLinhas, 
  getDistribuicaoColunas 
} from "@/lib/lotofacil";

type TipoDistribuicao = "linhas" | "colunas";

interface Props {
  tipo: TipoDistribuicao;
}

interface EstatisticaDistribuicao {
  distribuicao: string;
  valores: number[];
  ocorrencias: number;
  atrasoAtual: number;
  porcentagem: number;
  mediaOcorrencia: number;
  ultimaOcorrencia: number;
  ranking: number;
}

type SortColumn = "ocorrencias" | "atrasoAtual" | "porcentagem" | "distribuicao";
type SortDirection = "asc" | "desc";

export function TabelaLinhasColunas({ tipo }: Props) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("ocorrencias");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: estatisticas, isLoading } = useQuery({
    queryKey: [`estatisticas-${tipo}`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados")
        .select("concurso_id, dezenas")
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const concursoMaisRecente = data[0].concurso_id;
      const totalConcursos = data.length;

      // Agrupar por distribuição
      const agrupado = new Map<string, {
        distribuicao: string;
        valores: number[];
        ocorrencias: number;
        ultimaOcorrencia: number;
      }>();

      data.forEach((r) => {
        const dezenas = r.dezenas as number[];
        const chave = tipo === "linhas" 
          ? getDistribuicaoLinhas(dezenas) 
          : getDistribuicaoColunas(dezenas);
        const valores = chave.split("-").map(Number);

        if (!agrupado.has(chave)) {
          agrupado.set(chave, {
            distribuicao: chave,
            valores,
            ocorrencias: 0,
            ultimaOcorrencia: r.concurso_id,
          });
        }

        const item = agrupado.get(chave)!;
        item.ocorrencias++;
      });

      // Converter para array e calcular estatísticas
      const resultado: EstatisticaDistribuicao[] = Array.from(agrupado.values())
        .map((item) => ({
          distribuicao: item.distribuicao,
          valores: item.valores,
          ocorrencias: item.ocorrencias,
          atrasoAtual: concursoMaisRecente - item.ultimaOcorrencia,
          porcentagem: (item.ocorrencias / totalConcursos) * 100,
          mediaOcorrencia: totalConcursos / item.ocorrencias,
          ultimaOcorrencia: item.ultimaOcorrencia,
          ranking: 0,
        }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({
          ...item,
          ranking: index + 1,
        }));

      return resultado;
    },
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedData = estatisticas?.slice().sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    if (sortColumn === "distribuicao") {
      return a.distribuicao.localeCompare(b.distribuicao) * multiplier;
    }
    return (a[sortColumn] - b[sortColumn]) * multiplier;
  });

  const getOcorrenciaBadgeColor = (ranking: number) => {
    if (ranking <= 3) return "bg-[#22C55E] text-white";
    if (ranking <= 5) return "bg-[#EAB308] text-white";
    return "bg-slate-400/80 text-white";
  };

  const getTrendIcon = (atraso: number, media: number) => {
    if (atraso === 0) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    if (atraso < media / 2) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    if (atraso > media * 1.5) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    return <TrendingUp className="h-4 w-4 text-orange-500" />;
  };

  const formatMedia = (media: number) => {
    return `1 em ${Math.round(media)}`;
  };

  const SortableHeader = ({
    column,
    children,
    className,
  }: {
    column: SortColumn;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={cn("cursor-pointer hover:bg-muted/50 select-none", className)}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Nenhum dado disponível.</p>
      </div>
    );
  }

  const labelItems = tipo === "linhas" 
    ? ["L1", "L2", "L3", "L4", "L5"] 
    : ["C1", "C2", "C3", "C4", "C5"];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortableHeader column="distribuicao">
                Distribuição
              </SortableHeader>
              {labelItems.map((label) => (
                <TableHead key={label} className="text-center w-10">
                  {label}
                </TableHead>
              ))}
              <SortableHeader column="ocorrencias">Ocorr.</SortableHeader>
              <SortableHeader column="porcentagem">Freq. %</SortableHeader>
              <SortableHeader column="atrasoAtual">Atraso</SortableHeader>
              <TableHead className="hidden md:table-cell">Média</TableHead>
              <TableHead>Última</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.slice(0, 20).map((item) => (
              <TableRow
                key={item.distribuicao}
                className="border-b border-border/30 hover:bg-muted/30"
              >
                <TableCell className="text-sm font-mono font-medium">
                  {item.distribuicao}
                </TableCell>
                {item.valores.map((valor, idx) => (
                  <TableCell 
                    key={idx} 
                    className="text-center text-sm font-medium"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs",
                        valor >= 4 && "bg-primary/20 text-primary font-bold",
                        valor <= 1 && "bg-muted text-muted-foreground",
                        valor > 1 && valor < 4 && "text-foreground"
                      )}
                    >
                      {valor}
                    </span>
                  </TableCell>
                ))}
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-semibold min-w-[45px]",
                      getOcorrenciaBadgeColor(item.ranking)
                    )}
                  >
                    {item.ocorrencias}
                  </span>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {item.porcentagem.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.atrasoAtual, item.mediaOcorrencia)}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.atrasoAtual >= item.mediaOcorrencia && "text-green-600"
                      )}
                    >
                      {item.atrasoAtual}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatMedia(item.mediaOcorrencia)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  #{item.ultimaOcorrencia}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {sortedData.length > 20 && (
        <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t">
          Mostrando 20 de {sortedData.length} distribuições
        </div>
      )}
    </div>
  );
}
