import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, CreditCard, FileText, Undo2, CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";


function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Bolao = {
  id: string;
  codigo: string;
  loteria: string;
  sigla: string;
  concurso_numero: string;
  data_concurso: string;
  total_palpites: number;
  cotas_vendidas: number | null;
  valor_cota: number;
  valor_registro: number | null;
  task_pago: boolean | null;
  pago_em: string | null;
  pdf_url: string | null;
  status: string | null;
};

function RegistroInput({ bolao, onSaved }: { bolao: Bolao; onSaved: () => void }) {
  const [value, setValue] = useState(String(bolao.valor_registro ?? 0));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(String(bolao.valor_registro ?? 0));
  }, [bolao.valor_registro]);

  const save = useCallback(async () => {
    const num = parseFloat(value) || 0;
    if (num === (bolao.valor_registro ?? 0)) return;
    setSaving(true);
    const { error } = await supabase
      .from("boloes")
      .update({ valor_registro: num } as any)
      .eq("id", bolao.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Salvo" });
      onSaved();
    }
  }, [value, bolao.id, bolao.valor_registro, onSaved]);

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="whitespace-nowrap">Reg.</span>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          className="w-20 h-7 pl-7 pr-1 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="0,00"
          step="0.01"
          disabled={saving}
        />
      </div>
    </div>
  );
}

export default function BoloesPagamento() {
  const queryClient = useQueryClient();
  const [confirmPagar, setConfirmPagar] = useState<Bolao | null>(null);
  const [confirmDesfazer, setConfirmDesfazer] = useState<Bolao | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: boloes = [], isLoading } = useQuery({
    queryKey: ["boloes-pagamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boloes")
        .select("id, codigo, loteria, sigla, concurso_numero, data_concurso, total_palpites, cotas_vendidas, valor_cota, valor_registro, task_pago, pago_em, pdf_url, status")
        .eq("task_comprovantes", true)
        .order("task_pago", { ascending: true })
        .order("data_concurso", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Bolao[];
    },
  });

  const pendentes = boloes.filter((b) => !b.task_pago);
  const pagos = boloes.filter((b) => b.task_pago);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["boloes-pagamento"] });

  const handlePagar = async () => {
    if (!confirmPagar) return;
    setLoading(true);
    const { error } = await supabase
      .from("boloes")
      .update({ task_pago: true, pago_em: new Date().toISOString() } as any)
      .eq("id", confirmPagar.id);
    setLoading(false);
    setConfirmPagar(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Bolão marcado como pago!" });
      refetch();
    }
  };

  const handleDesfazer = async () => {
    if (!confirmDesfazer) return;
    setLoading(true);
    const { error } = await supabase
      .from("boloes")
      .update({ task_pago: false, pago_em: null } as any)
      .eq("id", confirmDesfazer.id);
    setLoading(false);
    setConfirmDesfazer(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pagamento desfeito" });
      refetch();
    }
  };

  const calcTotal = (b: Bolao) => {
    const totalCotas = (b.cotas_vendidas ?? 0) * b.valor_cota;
    const totalReg = (b.valor_registro as number) ?? 0;
    return totalCotas + totalReg;
  };

  const renderRow = (b: Bolao) => {
    const isPago = !!b.task_pago;
    const totalFinal = calcTotal(b);
    const dataFormatted = (() => {
      try { return format(parseISO(b.data_concurso), "dd/MM"); } catch { return b.data_concurso; }
    })();

    return (
      <div
        key={b.id}
        className={`flex items-center justify-between py-3 px-4 border-b border-border/50 hover:bg-muted/20 gap-4 ${isPago ? "opacity-50" : ""}`}
      >
        {/* LEFT — Identity */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-semibold text-sm whitespace-nowrap">{b.codigo}</span>
          <Badge variant="secondary" className="text-[10px] shrink-0">{b.loteria}</Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            C.{b.concurso_numero} · {dataFormatted} · {b.total_palpites} jogos
          </span>
        </div>

        {/* RIGHT — Values + Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Registro input */}
          <RegistroInput bolao={b} onSaved={refetch} />

          <div className="h-4 w-px bg-border" />

          {/* Total */}
          <div className="text-right">
            <span className="text-sm font-semibold whitespace-nowrap">R$ {formatCurrency(totalFinal)}</span>
            <div className="text-xs text-muted-foreground">total</div>
          </div>

          {/* PDF */}
          {b.pdf_url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => window.open(b.pdf_url!, "_blank")}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              PDF
            </Button>
          )}

          {/* Action */}
          {!isPago ? (
            <Button
              size="sm"
              className="h-7 text-xs whitespace-nowrap bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => setConfirmPagar(b)}
            >
              ✅ Pagar
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-emerald-600 whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Pago {b.pago_em ? format(parseISO(b.pago_em), "dd/MM HH:mm") : ""}</span>
              <button
                onClick={() => setConfirmDesfazer(b)}
                className="text-muted-foreground hover:text-foreground ml-1 text-xs underline"
              >
                desfazer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Bolões com comprovante aprovado aguardando pagamento</p>
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <div className="px-4 py-2 rounded-lg border text-sm flex items-center gap-2">
          <span className="text-muted-foreground">⏳ Pendentes</span>
          <span className="font-bold">{pendentes.length}</span>
        </div>
        <div className="px-4 py-2 rounded-lg border text-sm flex items-center gap-2">
          <span className="text-muted-foreground">✅ Pagos</span>
          <span className="font-bold">{pagos.length}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : boloes.length === 0 ? (
        <div className="text-center py-16 space-y-2 text-muted-foreground">
          <CreditCard className="h-10 w-10 mx-auto opacity-40" />
          <p className="font-medium">Nenhum bolão aguardando pagamento.</p>
          <p className="text-xs">Os bolões aparecerão aqui após o upload do comprovante na listagem.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {/* Header */}
          <div className="flex items-center justify-between py-2 px-4 text-xs text-muted-foreground border-b font-medium">
            <span>Bolão</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-32 text-center">Registro (R$)</span>
              <div className="w-px" />
              <span className="w-20 text-right">Total</span>
              <span className="w-16 text-right">Ação</span>
            </div>
          </div>
          {boloes.map(renderRow)}
        </div>
      )}

      {/* Confirm Pagar Dialog */}
      <Dialog open={!!confirmPagar} onOpenChange={(open) => !open && setConfirmPagar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar pagamento?</DialogTitle>
            <DialogDescription>
              Bolão: <strong>{confirmPagar?.codigo}</strong>
              <br />
              Total: <strong>R$ {confirmPagar ? formatCurrency(calcTotal(confirmPagar)) : "0,00"}</strong>
              <br /><br />
              Esta ação registra que o bolão foi pago na lotérica.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPagar(null)} disabled={loading}>Cancelar</Button>
            <Button onClick={handlePagar} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              ✅ Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Desfazer Dialog */}
      <Dialog open={!!confirmDesfazer} onOpenChange={(open) => !open && setConfirmDesfazer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desfazer pagamento?</DialogTitle>
            <DialogDescription>
              Bolão: <strong>{confirmDesfazer?.codigo}</strong>
              <br />
              Deseja reverter o status de pagamento deste bolão?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDesfazer(null)} disabled={loading}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDesfazer} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              ↩️ Desfazer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
