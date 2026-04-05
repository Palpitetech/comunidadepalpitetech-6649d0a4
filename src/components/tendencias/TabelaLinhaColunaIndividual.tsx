import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
import { getLinha, getColuna } from "@/lib/lotofacil";

interface Props {
  tipo: "linha" | "coluna";
  indice: number; // 1 a 5
}

interface EstatisticaQtd {
  qtdDezenas: number;
  ocorrencias: number;
  atrasoAtual: number;
  porcentagem: number;
  mediaOcorrencia: number;
  ultimaOcorrencia: number;
  ranking: number;
}

export function TabelaLinhaColunaIndividual({ tipo, indice }: Props) {
  const { data: estatisticas, isLoading } = useQuery({
    queryKey: [`estatisticas-${tipo}-${indice}`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_loterias")
        .select("concurso_id:concurso, dezenas")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const concursoMaisRecente = data[0].concurso_id;
      const totalConcursos = data.length;

      // Contar quantas dezenas de cada linha/coluna apareceram em cada concurso
      const agrupado = new Map<number, {
        qtd: number;
        ocorrencias: number;
        ultimaOcorrencia: number;
      }>();

      // Inicializar com 0-5 (possíveis quantidades)
      for (let i = 0; i <= 5; i++) {
        agrupado.set(i, { qtd: i, ocorrencias: 0, ultimaOcorrencia: 0 });
      }

      data.forEach((r) => {
        const dezenas = r.dezenas as number[];
        
        // Contar quantas dezenas do concurso pertencem à linha/coluna específica
        const qtdNaLinhaOuColuna = dezenas.filter((d) => {
          if (tipo === "linha") {
            return getLinha(d) === indice;
          } else {
            return getColuna(d) === indice;
          }
        }).length;

        const item = agrupado.get(qtdNaLinhaOuColuna)!;
        item.ocorrencias++;
        if (item.ultimaOcorrencia === 0) {
          item.ultimaOcorrencia = r.concurso_id;
        }
      });

      // Converter para array e calcular estatísticas
      const resultado: EstatisticaQtd[] = Array.from(agrupado.values())
        .filter((item) => item.ocorrencias > 0) // Só mostrar quantidades que já ocorreram
        .map((item) => ({
          qtdDezenas: item.qtd,
          ocorrencias: item.ocorrencias,
          atrasoAtual: item.ultimaOcorrencia > 0 
            ? concursoMaisRecente - item.ultimaOcorrencia 
            : totalConcursos,
          porcentagem: (item.ocorrencias / totalConcursos) * 100,
          mediaOcorrencia: item.ocorrencias > 0 ? totalConcursos / item.ocorrencias : 0,
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

  const getOcorrenciaBadgeColor = (ranking: number) => {
    if (ranking <= 1) return "bg-[#22C55E] text-white";
    if (ranking <= 2) return "bg-[#EAB308] text-white";
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
    if (media === 0) return "-";
    return `1 em ${Math.round(media)}`;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!estatisticas || estatisticas.length === 0) {
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
              <TableHead className="w-14 px-2 text-xs">Qtd</TableHead>
              <TableHead className="px-2 text-xs">Ocorr.</TableHead>
              <TableHead className="px-2 text-xs">Atraso</TableHead>
              <TableHead className="px-2 text-xs">Freq.</TableHead>
              <TableHead className="px-2 text-xs">Última</TableHead>
              <TableHead className="px-2 text-xs">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estatisticas.map((item) => (
              <TableRow
                key={item.qtdDezenas}
                className="border-b border-border/30 hover:bg-muted/30"
              >
                <TableCell className="px-2 py-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {item.qtdDezenas}
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
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.atrasoAtual >= item.mediaOcorrencia && "text-green-600"
                      )}
                    >
                      {item.atrasoAtual}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {formatMedia(item.mediaOcorrencia)}
                </TableCell>
                <TableCell className="px-2 py-2 text-xs text-muted-foreground">
                  {item.ultimaOcorrencia > 0 ? `#${item.ultimaOcorrencia}` : "-"}
                </TableCell>
                <TableCell className="px-2 py-2 text-xs font-medium">
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
