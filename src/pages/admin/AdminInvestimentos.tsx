import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Loader2, Plus, RefreshCw, Pencil, Trash2, TrendingUp, Wallet, Calendar, AlertCircle, CalendarClock } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type PeriodoValidade = "1_mes" | "3_meses" | "6_meses" | "12_meses" | "nd" | "personalizado";

interface Investimento {
  id: string;
  identificacao: string;
  valor: number;
  provedor: string;
  periodo_validade: PeriodoValidade;
  periodo_dias_custom: number | null;
  data_inicio: string;
  data_fim: string | null;
  created_at: string;
  updated_at: string;
}

const PERIODO_LABELS: Record<PeriodoValidade, string> = {
  "1_mes": "1 mês",
  "3_meses": "3 meses",
  "6_meses": "6 meses",
  "12_meses": "12 meses",
  nd: "N/D",
  personalizado: "Personalizado",
};

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularMensal(inv: Investimento): number | null {
  const v = Number(inv.valor);
  switch (inv.periodo_validade) {
    case "1_mes": return v;
    case "3_meses": return v / 3;
    case "6_meses": return v / 6;
    case "12_meses": return v / 12;
    case "personalizado":
      if (!inv.periodo_dias_custom || inv.periodo_dias_custom <= 0) return null;
      return v / (inv.periodo_dias_custom / 30);
    case "nd": return null;
    default: return null;
  }
}

function getStatus(data_fim: string | null): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; days: number | null } {
  if (!data_fim) return { label: "Sem validade", variant: "outline", days: null };
  const fim = parseISO(data_fim);
  const days = differenceInDays(fim, new Date());
  if (days < 0) return { label: "Expirado", variant: "destructive", days };
  if (days <= 7) return { label: `${days}d restantes`, variant: "destructive", days };
  if (days <= 30) return { label: `${days}d restantes`, variant: "secondary", days };
  return { label: `${days}d restantes`, variant: "default", days };
}

interface FormState {
  identificacao: string;
  valor: string;
  provedor: string;
  periodo_validade: PeriodoValidade;
  periodo_dias_custom: string;
  data_inicio: string;
}

const initialForm = (): FormState => ({
  identificacao: "",
  valor: "",
  provedor: "",
  periodo_validade: "1_mes",
  periodo_dias_custom: "",
  data_inicio: new Date().toISOString().split("T")[0],
});

export default function AdminInvestimentos() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);

  const { data: investimentos, isLoading, refetch } = useQuery({
    queryKey: ["admin-investimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investimentos" as any)
        .select("*")
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Investimento[];
    },
  });

  const summary = useMemo(() => {
    const list = investimentos ?? [];
    const total = list.reduce((acc, i) => acc + Number(i.valor), 0);
    const ativos = list.filter((i) => {
      if (!i.data_fim) return true;
      return parseISO(i.data_fim) >= new Date();
    });
    const totalAtivo = ativos.reduce((acc, i) => acc + Number(i.valor), 0);
    const mensalAtivo = ativos.reduce((acc, i) => {
      const m = calcularMensal(i);
      return acc + (m ?? 0);
    }, 0);
    const expirando30 = list.filter((i) => {
      if (!i.data_fim) return false;
      const days = differenceInDays(parseISO(i.data_fim), new Date());
      return days >= 0 && days <= 30;
    }).length;
    return { total, totalAtivo, mensalAtivo, totalCount: list.length, ativosCount: ativos.length, expirando30 };
  }, [investimentos]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm());
    setDialogOpen(true);
  };

  const openEdit = (inv: Investimento) => {
    setEditingId(inv.id);
    setForm({
      identificacao: inv.identificacao,
      valor: String(inv.valor),
      provedor: inv.provedor,
      periodo_validade: inv.periodo_validade,
      periodo_dias_custom: inv.periodo_dias_custom != null ? String(inv.periodo_dias_custom) : "",
      data_inicio: inv.data_inicio,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.identificacao.trim()) {
      toast.error("Informe a identificação");
      return;
    }
    if (!form.provedor.trim()) {
      toast.error("Informe o provedor");
      return;
    }
    const valorNum = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valorNum) || valorNum < 0) {
      toast.error("Valor inválido");
      return;
    }
    if (form.periodo_validade === "personalizado") {
      const dias = parseInt(form.periodo_dias_custom, 10);
      if (isNaN(dias) || dias <= 0) {
        toast.error("Informe a quantidade de dias do período personalizado");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        identificacao: form.identificacao.trim(),
        valor: valorNum,
        provedor: form.provedor.trim(),
        periodo_validade: form.periodo_validade,
        periodo_dias_custom:
          form.periodo_validade === "personalizado"
            ? parseInt(form.periodo_dias_custom, 10)
            : null,
        data_inicio: form.data_inicio,
      };

      if (editingId) {
        const { error } = await supabase
          .from("investimentos" as any)
          .update(payload as any)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Investimento atualizado");
      } else {
        const { error } = await supabase.from("investimentos" as any).insert(payload as any);
        if (error) throw error;
        toast.success("Investimento criado");
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-investimentos"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("investimentos" as any).delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Investimento excluído");
      queryClient.invalidateQueries({ queryKey: ["admin-investimentos"] });
    }
    setDeleteId(null);
  };

  return (
    <AdminLayout>
      <div className="container-senior py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Investimentos</h1>
            <p className="text-sm text-muted-foreground">
              Controle de gastos com fornecedores e prazos de validade
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Investimento
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Wallet className="h-3.5 w-3.5" />
                Total Investido
              </div>
              <p className="text-xl font-bold">{formatBRL(summary.total)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.totalCount} {summary.totalCount === 1 ? "registro" : "registros"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                Ativo
              </div>
              <p className="text-xl font-bold text-green-600">{formatBRL(summary.totalAtivo)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary.ativosCount} {summary.ativosCount === 1 ? "ativo" : "ativos"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
                Custo Mensal
              </div>
              <p className="text-xl font-bold text-blue-600">{formatBRL(summary.mensalAtivo)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">equivalente/mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                Expirando (30d)
              </div>
              <p className="text-xl font-bold text-orange-600">{summary.expirando30}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Calendar className="h-3.5 w-3.5" />
                Total de Registros
              </div>
              <p className="text-xl font-bold">{summary.totalCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Mensal</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(investimentos ?? []).map((inv) => {
                  const status = getStatus(inv.data_fim);
                  const mensal = calcularMensal(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.identificacao}</TableCell>
                      <TableCell>{inv.provedor}</TableCell>
                      <TableCell className="text-right">{formatBRL(Number(inv.valor))}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {mensal != null ? formatBRL(mensal) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {PERIODO_LABELS[inv.periodo_validade]}
                          {inv.periodo_validade === "personalizado" && inv.periodo_dias_custom
                            ? ` (${inv.periodo_dias_custom}d)`
                            : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(parseISO(inv.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {inv.data_fim
                          ? format(parseISO(inv.data_fim), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(inv)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(inv.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!investimentos || investimentos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhum investimento registrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Investimento" : "Novo Investimento"}</DialogTitle>
            <DialogDescription>
              A data final é calculada automaticamente conforme o período escolhido.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="identificacao" className="text-xs">Identificação *</Label>
              <Input
                id="identificacao"
                value={form.identificacao}
                onChange={(e) => setForm((f) => ({ ...f, identificacao: e.target.value }))}
                placeholder="Ex: Plano Lovable Pro"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="valor" className="text-xs">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="provedor" className="text-xs">Provedor *</Label>
                <Input
                  id="provedor"
                  value={form.provedor}
                  onChange={(e) => setForm((f) => ({ ...f, provedor: e.target.value }))}
                  placeholder="Ex: Lovable, Supabase"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Período de Validade *</Label>
              <Select
                value={form.periodo_validade}
                onValueChange={(v) => setForm((f) => ({ ...f, periodo_validade: v as PeriodoValidade }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_mes">1 mês</SelectItem>
                  <SelectItem value="3_meses">3 meses</SelectItem>
                  <SelectItem value="6_meses">6 meses</SelectItem>
                  <SelectItem value="12_meses">12 meses</SelectItem>
                  <SelectItem value="nd">N/D (sem validade)</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.periodo_validade === "personalizado" && (
              <div>
                <Label htmlFor="dias" className="text-xs">Quantidade de dias *</Label>
                <Input
                  id="dias"
                  type="number"
                  min="1"
                  value={form.periodo_dias_custom}
                  onChange={(e) => setForm((f) => ({ ...f, periodo_dias_custom: e.target.value }))}
                  placeholder="Ex: 45"
                />
              </div>
            )}

            <div>
              <Label htmlFor="data_inicio" className="text-xs">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir investimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
