import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { useState } from "react";

interface EstatisticaRow {
  valorPrincipal: number;
  valorComplementar?: number;
  ocorrencias: number;
  porcentagem: number;
  atrasoAtual: number;
  ultimaVez: number | null;
}

interface TabelaEstatisticaProps {
  dados: EstatisticaRow[];
  labelPrincipal: string;
  labelComplementar?: string;
  showComplementar?: boolean;
}

type SortColumn = "valorPrincipal" | "ocorrencias" | "atrasoAtual" | "porcentagem";
type SortDirection = "asc" | "desc";

export function TabelaEstatistica({
  dados,
  labelPrincipal,
  labelComplementar,
  showComplementar = true,
}: TabelaEstatisticaProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("ocorrencias");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedDados = [...dados].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return (a[sortColumn] - b[sortColumn]) * multiplier;
  });

  // Top 3 por ocorrência
  const top3 = [...dados]
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 3)
    .map((d) => d.valorPrincipal);

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
      className={cn("px-2 text-xs cursor-pointer hover:bg-muted/50", className)}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column &&
          (sortDirection === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          ))}
      </div>
    </TableHead>
  );

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <SortableHeader column="valorPrincipal">Princ.</SortableHeader>
            {showComplementar && labelComplementar && (
              <TableHead className="px-2 text-xs">Compl.</TableHead>
            )}
            <SortableHeader column="ocorrencias">Ocorr.</SortableHeader>
            <SortableHeader column="atrasoAtual">Atraso</SortableHeader>
            <TableHead className="px-2 text-xs whitespace-nowrap">Freq.</TableHead>
            <SortableHeader column="porcentagem" className="hidden md:table-cell">%</SortableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDados.map((row) => {
            const isTop3 = top3.includes(row.valorPrincipal);
            const isTop5 = [...dados]
              .sort((a, b) => b.ocorrencias - a.ocorrencias)
              .slice(0, 5)
              .map((d) => d.valorPrincipal)
              .includes(row.valorPrincipal);

            // Oportunidade de fixar: atraso >= frequência média
            const freqMedia = dados.reduce((acc, d) => acc + d.ocorrencias, 0) / dados.length;
            const isOportunidade = row.atrasoAtual >= freqMedia && row.ocorrencias > 0;

            return (
              <TableRow
                key={row.valorPrincipal}
                className={cn(
                  "text-xs",
                  isTop3 && "bg-green-50 dark:bg-green-950/30",
                  !isTop3 && isTop5 && "bg-yellow-50 dark:bg-yellow-950/20"
                )}
              >
                <TableCell className="px-2 py-2 font-medium">
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                        isTop3
                          ? "bg-green-500 text-white"
                          : isTop5
                          ? "bg-yellow-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {row.valorPrincipal}
                    </span>
                  </div>
                </TableCell>
                {showComplementar && labelComplementar && (
                  <TableCell className="px-2 py-2 text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {row.valorComplementar}
                    </span>
                  </TableCell>
                )}
                <TableCell className="px-2 py-2 font-semibold">{row.ocorrencias}</TableCell>
                <TableCell className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    {row.atrasoAtual}
                    {isOportunidade && (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-2 whitespace-nowrap text-muted-foreground">
                  {row.ultimaVez ? `#${row.ultimaVez}` : "-"}
                </TableCell>
                <TableCell className="px-2 py-2 hidden md:table-cell">
                  {row.porcentagem.toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
