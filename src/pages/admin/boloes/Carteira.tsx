import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Trophy,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

type Movimentacao = {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  bolao_id: string | null;
  referencia: string | null;
  created_at: string;
  created_by: string | null;
  bolao_codigo?: string;
};

export default function Carteira() {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lancamentoLoading, setLancamentoLoading] = useState<string | null>(null);
  const [novoTipo, setNovoTipo] = useState("saida_livre");
  const [novoValor, setNovoValor] = useState("");
  const [novoDescricao, setNovoDescricao] = useState("");
  const [novoReferencia, setNovoReferencia] = useState("");
  const [saving, setSaving] = useState(false);

  // Query movimentações com join no bolão
  const { data: movimentacoes = [], isLoading: loadingMov } = useQuery({
    queryKey: ["carteira-movimentacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carteira_movimentacoes")
        .select("*, boloes(codigo)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        bolao_codigo: m.boloes?.codigo ?? null,
      })) as Movimentacao[];
    },
  });

  // Bolões premiados sem lançamento
  const { data: boloesPendentes = [] } = useQuery({
    queryKey: ["carteira-boloes-pendentes"],
    queryFn: async () => {
      const { data: premiados, error: e1 } = await supabase
        .from("boloes")
        .select("id, codigo, concurso_numero, palpites_premiados, loteria")
        .eq("status", "premiado")
        .neq("palpites_premiados", "[]");
      if (e1) throw e1;
      if (!premiados?.length) return [];

      const { data: lancados } = await supabase
        .from("carteira_movimentacoes")
        .select("bolao_id")
        .eq("tipo", "entrada_premio")
        .not("bolao_id", "is", null);

      const idsLancados = new Set((lancados || []).map((l: any) => l.bolao_id));
      return premiados.filter((b: any) => !idsLancados.has(b.id));
    },
  });

  const totalEntradas = movimentacoes
    .filter((m) => m.tipo === "entrada_premio")
    .reduce((s, m) => s + Number(m.valor), 0);

  const totalSaidas = movimentacoes
    .filter((m) => m.tipo.startsWith("saida_"))
    .reduce((s, m) => s + Number(m.valor), 0);

  const saldo = totalEntradas - totalSaidas;

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const tipoLabel: Record<string, string> = {
    entrada_premio: "Prêmio",
    saida_registro: "Registro",
    saida_cotistas: "Cotistas",
    saida_livre: "Saída livre",
  };

  const lancarPremio = async (bolao: any) => {
    setLancamentoLoading(bolao.id);
    try {
      // Por enquanto, lançar com valor 0 — admin pode editar depois
      const { error } = await supabase
        .from("carteira_movimentacoes")
        .insert({
          tipo: "entrada_premio",
          valor: 0,
          descricao: `Prêmio do bolão ${bolao.codigo}`,
          bolao_id: bolao.id,
          referencia: `Concurso ${bolao.concurso_numero}`,
          created_by: profile?.id ?? null,
        });
      if (error) throw error;
      toast({ title: "Lançamento criado", description: `Prêmio de ${bolao.codigo} registrado. Edite o valor na listagem.` });
      queryClient.invalidateQueries({ queryKey: ["carteira-movimentacoes"] });
      queryClient.invalidateQueries({ queryKey: ["carteira-boloes-pendentes"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLancamentoLoading(null);
    }
  };

  const salvarMovimentacao = async () => {
    const valor = parseFloat(novoValor.replace(",", "."));
    if (!valor || valor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    if (!novoDescricao.trim()) {
      toast({ title: "Descrição obrigatória", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("carteira_movimentacoes")
        .insert({
          tipo: novoTipo,
          valor,
          descricao: novoDescricao.trim(),
          referencia: novoReferencia.trim() || null,
          created_by: profile?.id ?? null,
        });
      if (error) throw error;
      toast({ title: "Movimentação registrada" });
      setDialogOpen(false);
      setNovoValor("");
      setNovoDescricao("");
      setNovoReferencia("");
      queryClient.invalidateQueries({ queryKey: ["carteira-movimentacoes"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">💼 Carteira</h1>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova movimentação
          </Button>
        </div>

        {/* SEÇÃO 1: Saldo */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Saldo atual
          </p>
          <p
            className={`text-4xl font-bold ${
              saldo >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {formatCurrency(saldo)}
          </p>
          <div className="flex gap-6 mt-1">
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <ArrowUpCircle className="h-3.5 w-3.5" /> Entradas:{" "}
              {formatCurrency(totalEntradas)}
            </span>
            <span className="text-sm text-red-500 flex items-center gap-1">
              <ArrowDownCircle className="h-3.5 w-3.5" /> Saídas:{" "}
              {formatCurrency(totalSaidas)}
            </span>
          </div>
        </div>

        <Separator />

        {/* SEÇÃO 2: Bolões pendentes */}
        {boloesPendentes.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/30">
            <CardContent className="pt-4 space-y-3">
              <p className="text-sm font-medium">
                🏆 {boloesPendentes.length} bolão(ões) premiado(s) sem
                lançamento
              </p>
              {boloesPendentes.map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {b.codigo} · Concurso {b.concurso_numero}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={lancamentoLoading === b.id}
                    onClick={() => lancarPremio(b)}
                  >
                    {lancamentoLoading === b.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Lançar Prêmio"
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* SEÇÃO 3: Movimentações */}
        <div>
          <p className="text-sm font-medium mb-3">Movimentações</p>
          {loadingMov ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : movimentacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma movimentação registrada.
            </p>
          ) : (
            <div className="space-y-2">
              {movimentacoes.map((m) => {
                const isEntrada = m.tipo === "entrada_premio";
                return (
                  <div
                    key={m.id}
                    className="flex items-start justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {isEntrada ? (
                          <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          {m.descricao}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tipoLabel[m.tipo] || m.tipo}
                        </Badge>
                        {m.bolao_codigo && (
                          <span className="text-xs text-muted-foreground">
                            {m.bolao_codigo}
                          </span>
                        )}
                        {m.referencia && (
                          <span className="text-xs text-muted-foreground">
                            · {m.referencia}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-semibold ${
                          isEntrada ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {isEntrada ? "+" : "-"}{formatCurrency(Number(m.valor))}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(m.created_at), "dd/MM/yy HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog nova movimentação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={novoTipo} onValueChange={setNovoTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada_premio">Entrada — Prêmio</SelectItem>
                  <SelectItem value="saida_registro">Saída — Registro</SelectItem>
                  <SelectItem value="saida_cotistas">Saída — Cotistas</SelectItem>
                  <SelectItem value="saida_livre">Saída — Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                placeholder="0,00"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Ex: Prêmio Lotofácil concurso 3636"
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
              />
            </div>
            <div>
              <Label>Referência (opcional)</Label>
              <Input
                placeholder="Ex: Concurso 3636"
                value={novoReferencia}
                onChange={(e) => setNovoReferencia(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarMovimentacao} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
