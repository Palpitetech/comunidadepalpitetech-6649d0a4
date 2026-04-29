import { ReactNode, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Download } from "lucide-react";
import {
  AttributionDimension,
  AttributionMetrics,
  AttributionRow,
  DIMENSION_OPTIONS,
  fmtBRL,
  fmtNum,
  fmtPct,
} from "@/hooks/admin/useAttributionMetrics";

interface Props {
  data: AttributionMetrics;
  dimension: AttributionDimension;
  onDimensionChange: (d: AttributionDimension) => void;
  headerExtra?: ReactNode;
}

type SortCol = keyof Pick<
  AttributionRow,
  "leads" | "cadastros" | "compradores" | "vendas" | "convCadComprador" | "receita" | "ticketMedio"
>;
type SortDir = "asc" | "desc";

function exportCsv(rows: AttributionRow[], dimensionLabel: string) {
  const header = [
    dimensionLabel,
    "Leads",
    "Cadastros",
    "Compradores",
    "Vendas",
    "Conv. C→P (%)",
    "Receita (R$)",
    "Ticket Médio (R$)",
  ];
  const lines = rows.map((r) => [
    `"${r.origem.replace(/"/g, '""')}"`,
    r.leads,
    r.cadastros,
    r.compradores,
    r.vendas,
    r.convCadComprador.toFixed(1),
    r.receita.toFixed(2),
    r.ticketMedio.toFixed(2),
  ]);
  const csv = [header.join(","), ...lines.map((l) => l.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `atribuicao-${dimensionLabel.toLowerCase().replace(/\s+/g, "-")}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AttributionTable({ data, dimension, onDimensionChange, headerExtra }: Props) {
  const [sortCol, setSortCol] = useState<SortCol>("cadastros");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...data.rows].sort((a, b) => {
      const va = a[sortCol] as number;
      const vb = b[sortCol] as number;
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [data.rows, sortCol, sortDir]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const dimensionLabel = DIMENSION_OPTIONS.find((d) => d.value === dimension)?.label || dimension;

  const SortHead = ({ col, children, align }: { col: SortCol; children: React.ReactNode; align?: "right" }) => (
    <TableHead
      onClick={() => toggleSort(col)}
      className={`cursor-pointer select-none ${align === "right" ? "text-right" : ""}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortCol === col ? "opacity-100" : "opacity-40"}`} />
      </span>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base">📊 Atribuição por origem</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={dimension} onValueChange={(v) => onDimensionChange(v as AttributionDimension)}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIMENSION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => exportCsv(sorted, dimensionLabel)}
            disabled={sorted.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">CSV</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dimensionLabel}</TableHead>
                <SortHead col="leads">Leads</SortHead>
                <SortHead col="cadastros">Cadastros</SortHead>
                <SortHead col="compradores">Compradores</SortHead>
                <SortHead col="vendas">Vendas</SortHead>
                <SortHead col="convCadComprador">Conv. C→P</SortHead>
                <SortHead col="receita" align="right">Receita</SortHead>
                <SortHead col="ticketMedio" align="right">Ticket Médio</SortHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.origem}>
                  <TableCell className="font-medium max-w-[220px] truncate" title={row.origem}>
                    {row.origem}
                  </TableCell>
                  <TableCell>{fmtNum(row.leads)}</TableCell>
                  <TableCell>{fmtNum(row.cadastros)}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {fmtNum(row.compradores)}
                  </TableCell>
                  <TableCell>{fmtNum(row.vendas)}</TableCell>
                  <TableCell>{fmtPct(row.convCadComprador)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {row.receita > 0 ? fmtBRL(row.receita) : "—"}
                  </TableCell>
                  <TableCell className="text-right">{row.vendas > 0 ? fmtBRL(row.ticketMedio) : "—"}</TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum dado encontrado para o período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
