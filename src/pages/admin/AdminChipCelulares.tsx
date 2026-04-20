import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Loader2, Plus, RefreshCw, Pencil, Trash2, Smartphone, Wallet, CalendarClock,
  Zap, Clock, ShoppingBag, TrendingUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Operadora = "tim" | "claro" | "vivo";
type PlanoTipo = "pre" | "pos" | "controle";

interface ChipCelular {
  id: string;
  numero_id: number;
  numero: string;
  operadora: Operadora;
  plano_tipo: PlanoTipo;
  valor_plano: number;
  custo_chip: number;
  data_compra: string;
  ultima_recarga_at: string | null;
  ultima_recarga_valor: number | null;
  ativo: boolean;
  observacao: string | null;
  aparelho_conectado: string | null;
  created_at: string;
  updated_at: string;
}

interface ChipRecarga {
  id: string;
  chip_id: string;
  valor: number;
  data_recarga: string;
  metodo: string | null;
  observacao: string | null;
  created_at: string;
}

const OPERADORA_LABELS: Record<Operadora, string> = { tim: "TIM", claro: "Claro", vivo: "Vivo" };
const OPERADORA_CLASSES: Record<Operadora, string> = {
  tim: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  claro: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  vivo: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
};
const PLANO_LABELS: Record<PlanoTipo, string> = { pre: "Pré", pos: "Pós", controle: "Controle" };

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatId(n: number) { return `#${String(n).padStart(4, "0")}`; }

interface FormState {
  numero: string;
  operadora: Operadora;
  plano_tipo: PlanoTipo;
  valor_plano: string;
  custo_chip: string;
  data_compra: string;
  ativo: boolean;
  observacao: string;
  aparelho_conectado: string;
}

const initialForm = (lastCusto?: number): FormState => ({
  numero: "",
  operadora: "tim",
  plano_tipo: "pre",
  valor_plano: "",
  custo_chip: lastCusto != null ? String(lastCusto) : "",
  data_compra: new Date().toISOString().split("T")[0],
  ativo: true,
  observacao: "",
  aparelho_conectado: "",
});

interface RecargaFormState {
  valor: string;
  data_recarga: string;
  metodo: string;
  observacao: string;
}

export default function AdminChipCelulares() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);

  // Recarga state
  const [recargaChip, setRecargaChip] = useState<ChipCelular | null>(null);
  const [recargaForm, setRecargaForm] = useState<RecargaFormState>({
    valor: "", data_recarga: new Date().toISOString().split("T")[0], metodo: "", observacao: "",
  });
  const [savingRecarga, setSavingRecarga] = useState(false);

  // Histórico
  const [historicoChip, setHistoricoChip] = useState<ChipCelular | null>(null);
  const [deleteRecargaId, setDeleteRecargaId] = useState<string | null>(null);

  const { data: chips, isLoading, refetch } = useQuery({
    queryKey: ["admin-chip-celulares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chip_celulares" as any)
        .select("*")
        .order("numero_id", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChipCelular[];
    },
  });

  const { data: recargasMes } = useQuery({
    queryKey: ["admin-chip-recargas-mes"],
    queryFn: async () => {
      const inicio = new Date();
      inicio.setDate(1);
      const inicioStr = inicio.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("chip_recargas" as any)
        .select("valor")
        .gte("data_recarga", inicioStr);
      if (error) throw error;
      return (data ?? []) as unknown as { valor: number }[];
    },
  });

  const { data: historicoData, isLoading: loadingHistorico } = useQuery({
    queryKey: ["admin-chip-recargas", historicoChip?.id],
    queryFn: async () => {
      if (!historicoChip) return [];
      const { data, error } = await supabase
        .from("chip_recargas" as any)
        .select("*")
        .eq("chip_id", historicoChip.id)
        .order("data_recarga", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ChipRecarga[];
    },
    enabled: !!historicoChip,
  });

  const summary = useMemo(() => {
    const list = chips ?? [];
    const ativos = list.filter((c) => c.ativo);
    const custoChips = ativos.reduce((acc, c) => acc + Number(c.custo_chip), 0);
    const custoMensal = ativos.reduce((acc, c) => acc + Number(c.valor_plano), 0);
    const totalRecargasMes = (recargasMes ?? []).reduce((acc, r) => acc + Number(r.valor), 0);
    return {
      total: list.length,
      ativos: ativos.length,
      custoChips,
      custoMensal,
      totalRecargasMes,
    };
  }, [chips, recargasMes]);

  const lastCustoChip = useMemo(() => {
    if (!chips || chips.length === 0) return undefined;
    const sorted = [...chips].sort((a, b) => b.numero_id - a.numero_id);
    return Number(sorted[0].custo_chip);
  }, [chips]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm(lastCustoChip));
    setDialogOpen(true);
  };

  const openEdit = (chip: ChipCelular) => {
    setEditingId(chip.id);
    setForm({
      numero: chip.numero,
      operadora: chip.operadora,
      plano_tipo: chip.plano_tipo,
      valor_plano: String(chip.valor_plano),
      custo_chip: String(chip.custo_chip),
      data_compra: chip.data_compra,
      ativo: chip.ativo,
      observacao: chip.observacao ?? "",
      aparelho_conectado: chip.aparelho_conectado ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.numero.trim()) { toast.error("Informe o número"); return; }
    const valorPlano = parseFloat(form.valor_plano.replace(",", "."));
    const custoChip = parseFloat(form.custo_chip.replace(",", "."));
    if (isNaN(valorPlano) || valorPlano < 0) { toast.error("Valor do plano inválido"); return; }
    if (isNaN(custoChip) || custoChip < 0) { toast.error("Custo do chip inválido"); return; }

    setSaving(true);
    try {
      const payload = {
        numero: form.numero.trim(),
        operadora: form.operadora,
        plano_tipo: form.plano_tipo,
        valor_plano: valorPlano,
        custo_chip: custoChip,
        data_compra: form.data_compra,
        ativo: form.ativo,
        observacao: form.observacao.trim() || null,
        aparelho_conectado: form.aparelho_conectado.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("chip_celulares" as any).update(payload as any).eq("id", editingId);
        if (error) throw error;
        toast.success("Chip atualizado");
      } else {
        const { error } = await supabase.from("chip_celulares" as any).insert(payload as any);
        if (error) throw error;
        toast.success("Chip cadastrado");
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-chip-celulares"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("chip_celulares" as any).delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Chip excluído");
      queryClient.invalidateQueries({ queryKey: ["admin-chip-celulares"] });
    }
    setDeleteId(null);
  };

  // Open recarga
  const openRecarga = (chip: ChipCelular) => {
    setRecargaChip(chip);
    setRecargaForm({
      valor: String(chip.valor_plano || ""),
      data_recarga: new Date().toISOString().split("T")[0],
      metodo: "",
      observacao: "",
    });
  };

  const handleSaveRecarga = async () => {
    if (!recargaChip) return;
    const valor = parseFloat(recargaForm.valor.replace(",", "."));
    if (isNaN(valor) || valor < 0) { toast.error("Valor inválido"); return; }
    setSavingRecarga(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        chip_id: recargaChip.id,
        valor,
        data_recarga: recargaForm.data_recarga,
        metodo: recargaForm.metodo.trim() || null,
        observacao: recargaForm.observacao.trim() || null,
        created_by: user?.id ?? null,
      };
      const { error } = await supabase.from("chip_recargas" as any).insert(payload as any);
      if (error) throw error;
      toast.success("Recarga registrada");
      setRecargaChip(null);
      queryClient.invalidateQueries({ queryKey: ["admin-chip-celulares"] });
      queryClient.invalidateQueries({ queryKey: ["admin-chip-recargas-mes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-chip-recargas"] });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao registrar");
    } finally {
      setSavingRecarga(false);
    }
  };

  const handleDeleteRecarga = async () => {
    if (!deleteRecargaId) return;
    const { error } = await supabase.from("chip_recargas" as any).delete().eq("id", deleteRecargaId);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Recarga excluída");
      queryClient.invalidateQueries({ queryKey: ["admin-chip-recargas", historicoChip?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-chip-celulares"] });
      queryClient.invalidateQueries({ queryKey: ["admin-chip-recargas-mes"] });
    }
    setDeleteRecargaId(null);
  };

  const historicoStats = useMemo(() => {
    const list = historicoData ?? [];
    const total = list.reduce((acc, r) => acc + Number(r.valor), 0);
    const meses = new Set(list.map((r) => r.data_recarga.slice(0, 7))).size || 1;
    return { total, media: total / meses, count: list.length };
  }, [historicoData]);

  return (
    <AdminLayout>
      <div className="container-senior py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Chip Celulares</h1>
            <p className="text-sm text-muted-foreground">
              Gestão de chips, planos e recargas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Chip
            </Button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Smartphone className="h-3.5 w-3.5" /> Total de Chips
              </div>
              <p className="text-xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Chips Ativos
              </div>
              <p className="text-xl font-bold text-green-600">{summary.ativos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <ShoppingBag className="h-3.5 w-3.5" /> Custo Total dos Chips
              </div>
              <p className="text-xl font-bold">{formatBRL(summary.custoChips)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">aquisição (ativos)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CalendarClock className="h-3.5 w-3.5 text-blue-500" /> Custo Mensal de Planos
              </div>
              <p className="text-xl font-bold text-blue-600">{formatBRL(summary.custoMensal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="h-3.5 w-3.5 text-orange-500" /> Recargas no Mês
              </div>
              <p className="text-xl font-bold text-orange-600">{formatBRL(summary.totalRecargasMes)}</p>
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
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Operadora</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Aparelho</TableHead>
                  <TableHead className="text-right">Valor/mês</TableHead>
                  <TableHead>Última recarga</TableHead>
                  <TableHead className="text-right">Custo chip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(chips ?? []).map((chip) => (
                  <TableRow key={chip.id}>
                    <TableCell className="font-mono text-xs">{formatId(chip.numero_id)}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{chip.numero}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${OPERADORA_CLASSES[chip.operadora]}`}>
                        {OPERADORA_LABELS[chip.operadora]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {PLANO_LABELS[chip.plano_tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {chip.aparelho_conectado ? (
                        chip.aparelho_conectado
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatBRL(Number(chip.valor_plano))}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {chip.ultima_recarga_at ? (
                        <span>
                          {format(parseISO(chip.ultima_recarga_at), "dd/MM/yyyy", { locale: ptBR })}
                          <span className="text-muted-foreground ml-1">
                            · {formatBRL(Number(chip.ultima_recarga_valor ?? 0))}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs">{formatBRL(Number(chip.custo_chip))}</TableCell>
                    <TableCell>
                      <Badge variant={chip.ativo ? "default" : "secondary"} className="text-[10px]">
                        {chip.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => openRecarga(chip)}
                          title="Registrar recarga"
                        >
                          <Zap className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          onClick={() => setHistoricoChip(chip)}
                          title="Ver histórico"
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEdit(chip)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(chip.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!chips || chips.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhum chip cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Form Dialog (Novo / Editar) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Chip" : "Novo Chip"}</DialogTitle>
            <DialogDescription>
              O ID sequencial (#0001…) é gerado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="numero" className="text-xs">Número (com DDD) *</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                placeholder="Ex: 51 9 9999-9999"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Operadora *</Label>
                <Select value={form.operadora} onValueChange={(v) => setForm((f) => ({ ...f, operadora: v as Operadora }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tim">TIM</SelectItem>
                    <SelectItem value="claro">Claro</SelectItem>
                    <SelectItem value="vivo">Vivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Plano *</Label>
                <Select value={form.plano_tipo} onValueChange={(v) => setForm((f) => ({ ...f, plano_tipo: v as PlanoTipo }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre">Pré</SelectItem>
                    <SelectItem value="pos">Pós</SelectItem>
                    <SelectItem value="controle">Controle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="valor_plano" className="text-xs">Valor mensal (R$) *</Label>
                <Input
                  id="valor_plano"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor_plano}
                  onChange={(e) => setForm((f) => ({ ...f, valor_plano: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="custo_chip" className="text-xs">Custo do chip (R$) *</Label>
                <Input
                  id="custo_chip"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.custo_chip}
                  onChange={(e) => setForm((f) => ({ ...f, custo_chip: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="data_compra" className="text-xs">Data da compra *</Label>
              <Input
                id="data_compra"
                type="date"
                value={form.data_compra}
                onChange={(e) => setForm((f) => ({ ...f, data_compra: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="aparelho_conectado" className="text-xs">Aparelho conectado</Label>
              <Input
                id="aparelho_conectado"
                value={form.aparelho_conectado}
                onChange={(e) => setForm((f) => ({ ...f, aparelho_conectado: e.target.value }))}
                placeholder="Ex: Samsung A15, iPhone 12, Modem 4G..."
              />
            </div>

            <div>
              <Label htmlFor="observacao" className="text-xs">Observação</Label>
              <Textarea
                id="observacao"
                rows={2}
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                placeholder="Opcional"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
              />
              <Label htmlFor="ativo" className="text-xs">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recarga Dialog */}
      <Dialog open={!!recargaChip} onOpenChange={(o) => !o && setRecargaChip(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Recarga</DialogTitle>
            <DialogDescription>
              {recargaChip && (
                <>
                  {formatId(recargaChip.numero_id)} · {recargaChip.numero} · {OPERADORA_LABELS[recargaChip.operadora]}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="r_valor" className="text-xs">Valor (R$) *</Label>
                <Input
                  id="r_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={recargaForm.valor}
                  onChange={(e) => setRecargaForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="r_data" className="text-xs">Data *</Label>
                <Input
                  id="r_data"
                  type="date"
                  value={recargaForm.data_recarga}
                  onChange={(e) => setRecargaForm((f) => ({ ...f, data_recarga: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="r_metodo" className="text-xs">Método</Label>
              <Input
                id="r_metodo"
                value={recargaForm.metodo}
                onChange={(e) => setRecargaForm((f) => ({ ...f, metodo: e.target.value }))}
                placeholder="Pix, cartão, app..."
              />
            </div>
            <div>
              <Label htmlFor="r_obs" className="text-xs">Observação</Label>
              <Textarea
                id="r_obs"
                rows={2}
                value={recargaForm.observacao}
                onChange={(e) => setRecargaForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecargaChip(null)} disabled={savingRecarga}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRecarga} disabled={savingRecarga} className="bg-green-600 hover:bg-green-700">
              {savingRecarga && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Histórico Dialog */}
      <Dialog open={!!historicoChip} onOpenChange={(o) => !o && setHistoricoChip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Recargas</DialogTitle>
            <DialogDescription>
              {historicoChip && (
                <>
                  {formatId(historicoChip.numero_id)} · {historicoChip.numero} · {OPERADORA_LABELS[historicoChip.operadora]}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <Card><CardContent className="pt-3 pb-3">
              <div className="text-[11px] text-muted-foreground">Total recarregado</div>
              <div className="text-base font-bold">{formatBRL(historicoStats.total)}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-3 pb-3">
              <div className="text-[11px] text-muted-foreground">Média mensal</div>
              <div className="text-base font-bold">{formatBRL(historicoStats.media)}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-3 pb-3">
              <div className="text-[11px] text-muted-foreground">Recargas</div>
              <div className="text-base font-bold">{historicoStats.count}</div>
            </CardContent></Card>
          </div>

          <div className="max-h-96 overflow-auto">
            {loadingHistorico ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(historicoData ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(parseISO(r.data_recarga), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">{formatBRL(Number(r.valor))}</TableCell>
                      <TableCell className="text-xs">{r.metodo ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.observacao ?? "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteRecargaId(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!historicoData || historicoData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Nenhuma recarga registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete chip */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir chip?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o chip e todas as suas recargas. Não pode ser desfeita.
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

      {/* Delete recarga */}
      <AlertDialog open={!!deleteRecargaId} onOpenChange={(o) => !o && setDeleteRecargaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recarga?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecarga} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
