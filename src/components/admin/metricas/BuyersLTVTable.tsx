import { ReactNode, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Download } from "lucide-react";
import { AttributionMetrics, BuyerRow, fmtBRL, fmtDays } from "@/hooks/admin/useAttributionMetrics";

interface Props {
  data: AttributionMetrics;
  headerExtra?: ReactNode;
}

type SortCol = "diasAteComprar" | "receitaTotal" | "firstPurchaseAt";
type SortDir = "asc" | "desc";
type DiasFilter = "all" | "le7" | "8a30" | "gt30";

const fmtDate = (d: Date | null) => (d ? format(d, "dd/MM/yy", { locale: ptBR }) : "—");

function exportCsv(rows: BuyerRow[]) {
  const header = [
    "Email",
    "Nome",
    "1º Click",
    "Cadastro",
    "1ª Compra",
    "Dias até comprar",
    "Vendas",
    "Receita Total (R$)",
    "UTM Source",
    "UTM Campaign",
  ];
  const lines = rows.map((r) => [
    r.email || "",
    r.nome || "",
    r.firstClickAt?.toISOString() || "",
    r.signupAt?.toISOString() || "",
    r.firstPurchaseAt.toISOString(),
    r.diasAteComprar?.toFixed(1) || "",
    r.vendas,
    r.receitaTotal.toFixed(2),
    r.utmSource || "",
    r.utmCampaign || "",
  ]);
  const csv = [header.join(","), ...lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join(
    "\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compradores-ltv-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BuyersLTVTable({ data }: Props) {
  const [sortCol, setSortCol] = useState<SortCol>("firstPurchaseAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [diasFilter, setDiasFilter] = useState<DiasFilter>("all");

  const filtered = useMemo(() => {
    return data.buyers.filter((b) => {
      if (diasFilter === "all") return true;
      const d = b.diasAteComprar ?? 9999;
      if (diasFilter === "le7") return d <= 7;
      if (diasFilter === "8a30") return d > 7 && d <= 30;
      return d > 30;
    });
  }, [data.buyers, diasFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = sortCol === "firstPurchaseAt" ? a.firstPurchaseAt.getTime() : (a[sortCol] as number) ?? -1;
      const bv = sortCol === "firstPurchaseAt" ? b.firstPurchaseAt.getTime() : (b[sortCol] as number) ?? -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortCol, sortDir]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

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
        <CardTitle className="text-base">🧑‍💼 Compradores · LTV individual</CardTitle>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { v: "all" as const, l: "Todos" },
              { v: "le7" as const, l: "≤7d" },
              { v: "8a30" as const, l: "8-30d" },
              { v: "gt30" as const, l: ">30d" },
            ]
          ).map((o) => (
            <Button
              key={o.v}
              size="sm"
              variant={diasFilter === o.v ? "default" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setDiasFilter(o.v)}
            >
              {o.l}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5"
            onClick={() => exportCsv(sorted)}
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
                <TableHead>Email</TableHead>
                <TableHead>1º Click</TableHead>
                <TableHead>Cadastro</TableHead>
                <SortHead col="firstPurchaseAt">1ª Compra</SortHead>
                <SortHead col="diasAteComprar">Dias até comprar</SortHead>
                <TableHead>Vendas</TableHead>
                <SortHead col="receitaTotal" align="right">Receita Total</SortHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((b) => {
                const dias = b.diasAteComprar;
                const diasBadge =
                  dias == null
                    ? null
                    : dias <= 7
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : dias <= 30
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
                return (
                  <TableRow key={b.id}>
                    <TableCell className="max-w-[220px] truncate" title={b.email || ""}>
                      <div className="font-medium text-xs">{b.email || "—"}</div>
                      {b.nome && <div className="text-[11px] text-muted-foreground truncate">{b.nome}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{fmtDate(b.firstClickAt)}</TableCell>
                    <TableCell className="text-xs">{fmtDate(b.signupAt)}</TableCell>
                    <TableCell className="text-xs">{fmtDate(b.firstPurchaseAt)}</TableCell>
                    <TableCell>
                      {diasBadge ? (
                        <Badge variant="outline" className={`text-[11px] ${diasBadge}`}>
                          {fmtDays(dias)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{b.vendas}</TableCell>
                    <TableCell className="text-right font-medium text-xs">
                      {b.receitaTotal > 0 ? fmtBRL(b.receitaTotal) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="truncate max-w-[140px]" title={b.utmSource || ""}>
                        {b.utmSource || <span className="text-muted-foreground">(direto)</span>}
                      </div>
                      {b.utmCampaign && (
                        <div className="text-[10px] text-muted-foreground truncate" title={b.utmCampaign}>
                          {b.utmCampaign}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum comprador no período selecionado
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
