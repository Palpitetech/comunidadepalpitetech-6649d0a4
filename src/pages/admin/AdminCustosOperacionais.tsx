import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Wallet,
  Smartphone,
  FileText,
  Hand,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Origem = "assinatura" | "recarga_chip" | "chip_aquisicao" | "manual";
type Categoria = "infraestrutura" | "servico" | "marketing" | "outro";

interface CustoRow {
  origem: Origem;
  origem_id: string;
  descricao: string;
  categoria: string;
  periodo: string | null;
  valor: number;
  data_custo: string;
  mes_ref: string;
}

const PERIODO_LABEL: Record<string, string> = {
  "1_mes": "Mensal",
  "3_meses": "Trimestral",
  "6_meses": "Semestral",
  "12_meses": "Anual",
  mensal_recorrente: "Mensal recorrente",
  avulso: "Avulso",
  unico: "Único",
};

const PERIODO_BADGE: Record<string, string> = {
  "1_mes": "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "3_meses": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "6_meses": "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  "12_meses": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  mensal_recorrente: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  avulso: "bg-muted text-muted-foreground border-border",
  unico: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

function periodoLabel(p: string | null): string {
  if (!p) return "—";
  return PERIODO_LABEL[p] ?? p.replace(/_/g, " ");
}

function periodoBadgeClass(p: string | null): string {
  if (!p) return "bg-muted text-muted-foreground border-border";
  return PERIODO_BADGE[p] ?? "bg-muted text-muted-foreground border-border";
}

interface CustoManual {
  id: string;
  descricao: string;
  valor: number;
  categoria: Categoria;
  data_custo: string;
  recorrente: boolean;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

const ORIGEM_LABEL: Record<Origem, string> = {
  assinatura: "Assinatura",
  recarga_chip: "Recarga Chip",
  chip_aquisicao: "Aquisição Chip",
  manual: "Manual",
};

const ORIGEM_BADGE: Record<Origem, string> = {
  assinatura: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  recarga_chip: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
  chip_aquisicao:
    "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  manual: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
};

const CATEGORIAS_MANUAIS: { value: Categoria; label: string }[] = [
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "servico", label: "Serviço" },
  { value: "marketing", label: "Marketing" },
  { value: "outro", label: "Outro" },
];

function formatBRL(v: number): string {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonth(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface FormState {
  descricao: string;
  valor: string;
  categoria: Categoria;
  data_custo: string;
  recorrente: boolean;
  observacao: string;
}

const initialForm = (): FormState => ({
  descricao: "",
  valor: "",
  categoria: "servico",
  data_custo: new Date().toISOString().split("T")[0],
  recorrente: false,
  observacao: "",
});

export default function AdminCustosOperacionais() {
  const queryClient = useQueryClient();
  const [mes, setMes] = useState<string>(currentMonth());
  const [origemFiltro, setOrigemFiltro] = useState<"todas" | Origem>("todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState<"todas" | string>("todas");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ["admin-custos-operacionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_custos_operacionais" as any)
        .select("*")
        .order("data_custo", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CustoRow[];
    },
  });

  const filtered = useMemo(() => {
    const list = rows ?? [];
    return list.filter((r) => {
      if (r.mes_ref !== mes) return false;
      if (origemFiltro !== "todas" && r.origem !== origemFiltro) return false;
      if (categoriaFiltro !== "todas" && r.categoria !== categoriaFiltro) return false;
      return true;
    });
  }, [rows, mes, origemFiltro, categoriaFiltro]);

  const summary = useMemo(() => {
    const list = rows ?? [];
    const mesAtual = list.filter((r) => r.mes_ref === mes);
    const mesAnterior = list.filter((r) => r.mes_ref === previousMonth(mes));

    const sum = (arr: CustoRow[]) => arr.reduce((a, b) => a + Number(b.valor || 0), 0);

    const totalGeral = sum(mesAtual);
    const totalAssin = sum(mesAtual.filter((r) => r.origem === "assinatura"));
    const totalChips = sum(
      mesAtual.filter((r) => r.origem === "recarga_chip" || r.origem === "chip_aquisicao"),
    );
    const totalManuais = sum(mesAtual.filter((r) => r.origem === "manual"));
    const totalAnterior = sum(mesAnterior);
    const variacao =
      totalAnterior > 0 ? ((totalGeral - totalAnterior) / totalAnterior) * 100 : null;

    return { totalGeral, totalAssin, totalChips, totalManuais, totalAnterior, variacao };
  }, [rows, mes]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    const { data, error } = await supabase
      .from("custos_operacionais_manuais" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      toast.error("Erro ao carregar lançamento");
      return;
    }
    const m = data as unknown as CustoManual;
    setEditingId(m.id);
    setForm({
      descricao: m.descricao,
      valor: String(m.valor),
      categoria: m.categoria,
      data_custo: m.data_custo,
      recorrente: m.recorrente,
      observacao: m.observacao ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim()) {
      toast.error("Informe a descrição");
      return;
    }
    const valorNum = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valorNum) || valorNum < 0) {
      toast.error("Valor inválido");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload: any = {
        descricao: form.descricao.trim(),
        valor: valorNum,
        categoria: form.categoria,
        data_custo: form.data_custo,
        recorrente: form.recorrente,
        observacao: form.observacao.trim() || null,
      };
      if (!editingId) payload.created_by = userData.user?.id ?? null;

      if (editingId) {
        const { error } = await supabase
          .from("custos_operacionais_manuais" as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Lançamento atualizado");
      } else {
        const { error } = await supabase
          .from("custos_operacionais_manuais" as any)
          .insert(payload);
        if (error) throw error;
        toast.success("Lançamento criado");
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-custos-operacionais"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("custos_operacionais_manuais" as any)
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Lançamento excluído");
      queryClient.invalidateQueries({ queryKey: ["admin-custos-operacionais"] });
    }
    setDeleteId(null);
  };

  const linkOrigem = (r: CustoRow): string | null => {
    if (r.origem === "assinatura") return "/admin/assinaturas-operacionais";
    if (r.origem === "recarga_chip" || r.origem === "chip_aquisicao")
      return "/admin/chip-celulares";
    return null;
  };

  return (
    <AdminLayout>
      <div className="container-senior py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Custos Operacionais</h1>
            <p className="text-sm text-muted-foreground">
              Visão consolidada: assinaturas, chips e lançamentos manuais
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo lançamento
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Mês</Label>
              <Input
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value || currentMonth())}
                className="w-40"
              />
            </div>
            <div>
              <Label className="text-xs">Origem</Label>
              <Select
                value={origemFiltro}
                onValueChange={(v) => setOrigemFiltro(v as any)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="assinatura">Assinaturas</SelectItem>
                  <SelectItem value="recarga_chip">Recargas</SelectItem>
                  <SelectItem value="chip_aquisicao">Aquisição Chips</SelectItem>
                  <SelectItem value="manual">Manuais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria (manuais)</Label>
              <Select
                value={categoriaFiltro}
                onValueChange={(v) => setCategoriaFiltro(v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {CATEGORIAS_MANUAIS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Wallet className="h-3.5 w-3.5" />
                Total Geral
              </div>
              <p className="text-xl font-bold">{formatBRL(summary.totalGeral)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{mes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                Assinaturas
              </div>
              <p className="text-xl font-bold text-blue-600">
                {formatBRL(summary.totalAssin)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Smartphone className="h-3.5 w-3.5 text-green-500" />
                Chips
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatBRL(summary.totalChips)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">recargas + aquisição</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Hand className="h-3.5 w-3.5 text-orange-500" />
                Manuais
              </div>
              <p className="text-xl font-bold text-orange-600">
                {formatBRL(summary.totalManuais)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                {summary.variacao !== null && summary.variacao >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                )}
                vs Mês Anterior
              </div>
              <p
                className={`text-xl font-bold ${
                  summary.variacao === null
                    ? ""
                    : summary.variacao >= 0
                    ? "text-destructive"
                    : "text-green-600"
                }`}
              >
                {summary.variacao === null
                  ? "—"
                  : `${summary.variacao >= 0 ? "+" : ""}${summary.variacao.toFixed(1)}%`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ant: {formatBRL(summary.totalAnterior)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const origemHref = linkOrigem(r);
                  const isManual = r.origem === "manual";
                  return (
                    <TableRow key={`${r.origem}-${r.origem_id}-${r.data_custo}`}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(parseISO(r.data_custo), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${ORIGEM_BADGE[r.origem]}`}
                        >
                          {ORIGEM_LABEL[r.origem]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{r.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {r.categoria.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${periodoBadgeClass(r.periodo)}`}
                        >
                          {periodoLabel(r.periodo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(Number(r.valor))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isManual ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => openEdit(r.origem_id)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(r.origem_id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : origemHref ? (
                            <Link to={origemHref}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground"
                                title="Ver na origem"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Nenhum custo no período selecionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Dialog form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar lançamento" : "Novo lançamento manual"}
            </DialogTitle>
            <DialogDescription>
              Lançamentos manuais aparecem somados aos custos automáticos de assinaturas e
              chips.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="descricao" className="text-xs">
                Descrição *
              </Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
                placeholder="Ex: Domínio palpitetech.com.br"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="valor" className="text-xs">
                  Valor (R$) *
                </Label>
                <Input
                  id="valor"
                  inputMode="decimal"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="data_custo" className="text-xs">
                  Data *
                </Label>
                <Input
                  id="data_custo"
                  type="date"
                  value={form.data_custo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, data_custo: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Categoria *</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria: v as Categoria }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_MANUAIS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label className="text-xs font-medium">Recorrente mensal</Label>
                <p className="text-[11px] text-muted-foreground">
                  Repete automaticamente todo mês a partir da data
                </p>
              </div>
              <Switch
                checked={form.recorrente}
                onCheckedChange={(v) => setForm((f) => ({ ...f, recorrente: v }))}
              />
            </div>
            <div>
              <Label htmlFor="observacao" className="text-xs">
                Observação
              </Label>
              <Textarea
                id="observacao"
                value={form.observacao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacao: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
