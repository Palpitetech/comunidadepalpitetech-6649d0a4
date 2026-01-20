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
        .from("resultados")
        .select(`concurso_id, ${config.campoDb}`)
        .order("concurso_id", { ascending: false });

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
    className 
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

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortableHeader column="valorPrincipal">
                {config.labelColunaPrincipal}
              </SortableHeader>
              <TableHead>{config.labelColunaComplementar}</TableHead>
              <SortableHeader column="ocorrencias">Ocorrências</SortableHeader>
              <SortableHeader column="atrasoAtual">Atraso</SortableHeader>
              <SortableHeader column="porcentagem" className="hidden md:table-cell">
                %
              </SortableHeader>
              <TableHead>Frequência</TableHead>
              <TableHead>Última</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow 
                key={item.valorPrincipal}
                className="border-b border-border/30 hover:bg-muted/30"
              >
                <TableCell className="text-base font-medium">
                  {item.valorPrincipal}
                </TableCell>
                <TableCell className="text-base font-medium">
                  {item.valorComplementar}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg px-3 py-1 text-base font-semibold min-w-[50px]",
                      getOcorrenciaBadgeColor(item.ranking)
                    )}
                  >
                    {item.ocorrencias}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getTrendIcon(item.atrasoAtual, item.mediaOcorrencia)}
                    <span className="text-base">{item.atrasoAtual}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-base text-muted-foreground">
                  {item.porcentagem.toFixed(2)}%
                </TableCell>
                <TableCell className="text-base text-muted-foreground">
                  {formatMedia(item.mediaOcorrencia)}
                </TableCell>
                <TableCell className="text-base text-muted-foreground">
                  #{item.ultimaOcorrencia}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
