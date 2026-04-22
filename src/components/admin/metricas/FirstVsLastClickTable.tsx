import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  AttributionMetrics,
  AttributionDimension,
  fmtBRL,
  fmtNum,
  fmtPct,
} from "@/hooks/admin/useAttributionMetrics";
import { cn } from "@/lib/utils";

type Mode = "first" | "last" | "compare";

const CLICK_DIMENSIONS: { value: AttributionDimension; label: string }[] = [
  { value: "utm_source", label: "UTM Source" },
  { value: "utm_medium", label: "UTM Medium" },
  { value: "utm_campaign", label: "UTM Campaign" },
  { value: "utm_content", label: "UTM Content" },
  { value: "utm_term", label: "UTM Term" },
];

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";"),
    )
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exportado");
}

interface Props {
  data: AttributionMetrics;
}

export function FirstVsLastClickTable({ data }: Props) {
  const [dimension, setDimension] = useState<AttributionDimension>("utm_source");
  const [mode, setMode] = useState<Mode>("compare");

  const totalVendas =
    data.firstClickByDim[dimension]?.reduce((acc, r) => acc + r.vendas, 0) || 0;
  const pctFirst = totalVendas > 0 ? (data.vendasComFirstClick / totalVendas) * 100 : 0;
  const pctLast = totalVendas > 0 ? (data.vendasComLastClick / totalVendas) * 100 : 0;

  const singleRows = useMemo(() => {
    if (mode === "first") return data.firstClickByDim[dimension] || [];
    if (mode === "last") return data.lastClickByDim[dimension] || [];
    return [];
  }, [mode, dimension, data]);

  const compareRows = data.comparisonByDim[dimension] || [];

  const handleExport = () => {
    const dimLabel = CLICK_DIMENSIONS.find((d) => d.value === dimension)?.label || dimension;
    if (mode === "compare") {
      const rows: (string | number)[][] = [
        [
          dimLabel,
          "Vendas (1º click)",
          "Receita (1º click)",
          "Vendas (último click)",
          "Receita (último click)",
          "Δ Vendas",
          "Δ Receita",
        ],
        ...compareRows.map((r) => [
          r.origem,
          r.vendasFirst,
          r.receitaFirst.toFixed(2),
          r.vendasLast,
          r.receitaLast.toFixed(2),
          r.deltaVendas,
          r.deltaReceita.toFixed(2),
        ]),
      ];
      downloadCSV(`first-vs-last-${dimension}-comparar.csv`, rows);
    } else {
      const rows: (string | number)[][] = [
        [dimLabel, "Vendas", "Compradores únicos", "Receita", "Ticket médio", "% do total"],
        ...singleRows.map((r) => [
          r.origem,
          r.vendas,
          r.compradoresUnicos,
          r.receita.toFixed(2),
          r.ticketMedio.toFixed(2),
          r.pctTotal.toFixed(1),
        ]),
      ];
      downloadCSV(`${mode}-click-${dimension}.csv`, rows);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">🎯 First-Click vs Last-Click</CardTitle>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs cobertura */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <KPI
            label="Com 1º click"
            value={`${fmtNum(data.vendasComFirstClick)} / ${fmtNum(totalVendas)}`}
            sub={fmtPct(pctFirst)}
          />
          <KPI
            label="Com último click"
            value={`${fmtNum(data.vendasComLastClick)} / ${fmtNum(totalVendas)}`}
            sub={fmtPct(pctLast)}
          />
          <KPI
            label="Mesmo canal"
            value={fmtNum(data.vendasMesmoCanal)}
            sub="single-touch"
          />
          <KPI
            label="Canal divergente"
            value={fmtNum(data.vendasCanalDivergente)}
            sub="multi-touch"
          />
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Dimensão:</span>
            <Select value={dimension} onValueChange={(v) => setDimension(v as AttributionDimension)}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLICK_DIMENSIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            {([
              { v: "first", l: "1º Click" },
              { v: "last", l: "Último Click" },
              { v: "compare", l: "Comparar" },
            ] as { v: Mode; l: string }[]).map(({ v, l }) => (
              <Button
                key={v}
                size="sm"
                variant={mode === v ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => setMode(v)}
              >
                {l}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-x-auto">
          {mode === "compare" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Origem</TableHead>
                  <TableHead className="text-xs text-right">Vendas (1º)</TableHead>
                  <TableHead className="text-xs text-right">Receita (1º)</TableHead>
                  <TableHead className="text-xs text-right">Vendas (último)</TableHead>
                  <TableHead className="text-xs text-right">Receita (último)</TableHead>
                  <TableHead className="text-xs text-right">Δ Vendas</TableHead>
                  <TableHead className="text-xs text-right">Δ Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compareRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">
                      Sem dados de atribuição no período
                    </TableCell>
                  </TableRow>
                ) : (
                  compareRows.map((r) => (
                    <TableRow key={r.origem}>
                      <TableCell className="text-xs font-medium">{r.origem}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtNum(r.vendasFirst)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtBRL(r.receitaFirst)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtNum(r.vendasLast)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtBRL(r.receitaLast)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        <DeltaCell value={r.deltaVendas} format="num" />
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        <DeltaCell value={r.deltaReceita} format="brl" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Origem</TableHead>
                  <TableHead className="text-xs text-right">Vendas</TableHead>
                  <TableHead className="text-xs text-right">Compradores</TableHead>
                  <TableHead className="text-xs text-right">Receita</TableHead>
                  <TableHead className="text-xs text-right">Ticket médio</TableHead>
                  <TableHead className="text-xs text-right">% total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {singleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                      Sem dados de atribuição no período
                    </TableCell>
                  </TableRow>
                ) : (
                  singleRows.map((r) => (
                    <TableRow key={r.origem}>
                      <TableCell className="text-xs font-medium">{r.origem}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtNum(r.vendas)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtNum(r.compradoresUnicos)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtBRL(r.receita)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtBRL(r.ticketMedio)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{fmtPct(r.pctTotal)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {mode === "compare" && (
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">Δ positivo</strong> em "último click" = canal que <em>fecha</em> vendas (bottom-funnel).
            <strong className="text-foreground"> Δ negativo</strong> = canal que <em>traz</em> o cliente mas perde o crédito final (top-funnel).
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-semibold tabular-nums mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function DeltaCell({ value, format }: { value: number; format: "num" | "brl" }) {
  const isZero = value === 0;
  const isPos = value > 0;
  const Icon = isZero ? Minus : isPos ? ArrowUpRight : ArrowDownRight;
  const color = isZero
    ? "text-muted-foreground"
    : isPos
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";
  const formatted =
    format === "brl" ? fmtBRL(Math.abs(value)) : fmtNum(Math.abs(value));
  return (
    <span className={cn("inline-flex items-center justify-end gap-0.5 font-medium", color)}>
      <Icon className="h-3 w-3" />
      {isZero ? "0" : `${isPos ? "+" : "−"}${formatted}`}
    </span>
  );
}
