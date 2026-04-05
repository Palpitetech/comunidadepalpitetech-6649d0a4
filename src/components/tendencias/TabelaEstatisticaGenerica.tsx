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

type CampoDb = "qtd_pares" | "qtd_moldura" | "qtd_primos" | "qtd_repetidas";

export interface TabelaEstatisticaConfig {
  queryKey: string;
  campoDb: CampoDb;
  labelColunaPrincipal: string;
  labelColunaComplementar: string;
}

interface EstatisticaItem {
  valorPrincipal: number;
  valorComplementar: number;
  ocorrencias: number;
  atrasoAtual: number;
  porcentagem: number;
  mediaOcorrencia: number;
  ultimaOcorrencia: number;
  ranking: number;
}

type SortColumn = "ocorrencias" | "atrasoAtual" | "porcentagem" | "valorPrincipal";
type SortDirection = "asc" | "desc";

interface Props {
  config: TabelaEstatisticaConfig;
}

export function TabelaEstatisticaGenerica({ config }: Props) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("ocorrencias");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: estatisticas, isLoading } = useQuery({
    queryKey: [config.queryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_loterias")
        .select(`concurso_id, ${config.campoDb}`)
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const concursoMaisRecente = data[0].concurso_id;
      const totalConcursos = data.length;

      // Agrupar por quantidade
      const agrupado = new Map<number, {
        valor: number;
        ocorrencias: number;
        ultimaOcorrencia: number;
      }>();

      data.forEach((r) => {
        const qtd = (r as Record<string, unknown>)[config.campoDb] as number ?? 0;
        
        if (!agrupado.has(qtd)) {
          agrupado.set(qtd, {
            valor: qtd,
            ocorrencias: 0,
            ultimaOcorrencia: r.concurso_id,
          });
        }
        
        const item = agrupado.get(qtd)!;
        item.ocorrencias++;
      });

      // Converter para array e calcular estatísticas
      const resultado: EstatisticaItem[] = Array.from(agrupado.values())
        .map((item) => ({
          valorPrincipal: item.valor,
          valorComplementar: 15 - item.valor,
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
    return (a[sortColumn] - b[sortColumn]) * multiplier;
  });

  const getOcorrenciaBadgeColor = (ranking: number) => {
    if (ranking <= 3) return "bg-emerald-500 text-white";
    if (ranking <= 5) return "bg-amber-500 text-white";
    return "bg-muted text-muted-foreground";
  };

  const getTrendIcon = (atraso: number, media: number) => {
    if (atraso === 0) {
      return <TrendingDown className="h-4 w-4 text-emerald-600" />;
    }
    if (atraso < media / 2) {
      return <TrendingDown className="h-4 w-4 text-emerald-600" />;
    }
    if (atraso > media * 1.5) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
    return <TrendingUp className="h-4 w-4 text-amber-500" />;
  };

  const formatMedia = (media: number) => {
    return `1 em ${Math.round(media)}`;
  };

  const SortableHeader = ({ 
    column, 
    children, 
    className 
  }: { 
    column: SortColumn; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 select-none px-2 text-xs", className)}
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

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortableHeader column="valorPrincipal">
                Princ.
              </SortableHeader>
              <TableHead className="px-2 text-xs">Compl.</TableHead>
              <SortableHeader column="ocorrencias">Ocorr.</SortableHeader>
              <SortableHeader column="atrasoAtual">Atraso</SortableHeader>
              <TableHead className="px-2 text-xs whitespace-nowrap">Freq.</TableHead>
              <TableHead className="px-2 text-xs">Última</TableHead>
              <SortableHeader column="porcentagem" className="hidden md:table-cell">
                %
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow 
                key={item.valorPrincipal}
                className="border-b border-border/30 hover:bg-muted/30"
              >
                <TableCell className="px-2 py-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {item.valorPrincipal}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground font-medium text-xs">
                    {item.valorComplementar}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-semibold min-w-[45px]",
                      getOcorrenciaBadgeColor(item.ranking)
                    )}
                  >
                    {item.ocorrencias}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.atrasoAtual, item.mediaOcorrencia)}
                    <span className={cn(
                      "text-xs font-medium",
                      item.atrasoAtual >= item.mediaOcorrencia && "text-emerald-600 font-semibold"
                    )}>
                      {item.atrasoAtual}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {formatMedia(item.mediaOcorrencia)}
                </TableCell>
                <TableCell className="px-2 py-2 text-xs text-muted-foreground">
                  #{item.ultimaOcorrencia}
                </TableCell>
                <TableCell className="hidden md:table-cell px-2 py-2 text-xs font-medium">
                  {item.porcentagem.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
