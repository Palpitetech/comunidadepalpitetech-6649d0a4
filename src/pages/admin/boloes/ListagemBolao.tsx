import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Eye, Plus, Printer, FileCheck, Receipt, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  ativo: "bg-green-500/20 text-green-400 border-green-500/30",
  encerrado: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  premiado: "bg-primary/20 text-primary border-primary/30",
  cancelado: "bg-destructive/20 text-destructive border-destructive/30",
};

const LOTERIA_COLORS: Record<string, string> = {
  lotofacil: "bg-green-600/20 text-green-400",
  megasena: "bg-blue-600/20 text-blue-400",
  duplasena: "bg-purple-600/20 text-purple-400",
  quina: "bg-orange-600/20 text-orange-400",
  lotomania: "bg-pink-600/20 text-pink-400",
};

const TASK_FIELDS = [
  { key: "task_impresso", label: "Imprimir", icon: Printer },
  { key: "task_registrado", label: "Registrar", icon: FileCheck },
  { key: "task_comprovantes", label: "Comprovantes", icon: Receipt },
  { key: "task_resgate", label: "Resgate", icon: Trophy },
] as const;

export default function ListagemBolao() {
  const queryClient = useQueryClient();
  const [filtroLoteria, setFiltroLoteria] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [confirmTask, setConfirmTask] = useState<{ bolaoId: string; field: string; value: boolean } | null>(null);

  const { data: boloes, isLoading } = useQuery({
    queryKey: ["admin-boloes", filtroLoteria, filtroStatus, busca],
    queryFn: async () => {
      let q = supabase
        .from("boloes")
        .select("*")
        .order("created_at", { ascending: false });

      if (filtroLoteria !== "todas") q = q.eq("loteria", filtroLoteria);
      if (filtroStatus !== "todos") q = q.eq("status", filtroStatus);
      if (busca) q = q.or(`codigo.ilike.%${busca}%,concurso_numero.ilike.%${busca}%`);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const handleToggleTask = async () => {
    if (!confirmTask) return;
    const { bolaoId, field, value } = confirmTask;
    const { error } = await supabase
      .from("boloes")
      .update({ [field]: value } as any)
      .eq("id", bolaoId);

    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-boloes"] });
    }
    setConfirmTask(null);
  };

  return (
    <MainLayout pageTitle="Bolões">
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-2xl font-bold">Listagem de Bolões</h1>
          <Link to="/admin/novo-bolao">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Bolão
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <Select value={filtroLoteria} onValueChange={setFiltroLoteria}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas loterias</SelectItem>
              <SelectItem value="lotofacil">Lotofácil</SelectItem>
              <SelectItem value="megasena">Mega-Sena</SelectItem>
              <SelectItem value="duplasena">Dupla Sena</SelectItem>
              <SelectItem value="quina">Quina</SelectItem>
              <SelectItem value="lotomania">Lotomania</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="encerrado">Encerrado</SelectItem>
              <SelectItem value="premiado">Premiado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar código ou concurso..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 text-xs flex-1 min-w-[160px]"
          />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !boloes?.length ? (
          <p className="text-center text-sm text-muted-foreground py-10">Nenhum bolão encontrado.</p>
        ) : (
          <div className="space-y-1.5">
            {boloes.map((b: any) => {
              const arrecadado = (b.cotas_vendidas || 0) * parseFloat(b.valor_cota);
              return (
                <Card key={b.id} className="border-border/60">
                  <CardContent className="py-2 px-3 space-y-1.5">
                    {/* Row 1 */}
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-bold">{b.codigo}</span>
                      <Badge variant="outline" className={`text-[10px] ${LOTERIA_COLORS[b.loteria] || ""}`}>
                        {b.loteria}
                      </Badge>
                      <span className="text-muted-foreground text-xs">C.{b.concurso_numero}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(b.data_concurso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <span className="text-xs">
                        {b.cotas_vendidas || 0}/{b.total_cotas} cotas
                      </span>
                      <span className="text-xs font-medium">
                        R${arrecadado.toFixed(2)}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ml-auto ${STATUS_COLORS[b.status] || ""}`}>
                        {b.status}
                      </Badge>
                    </div>

                    {/* Row 2: Tasks + Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {TASK_FIELDS.map(({ key, label, icon: Icon }) => {
                        const checked = !!(b as any)[key];
                        return (
                          <Popover
                            key={key}
                            open={confirmTask?.bolaoId === b.id && confirmTask?.field === key}
                            onOpenChange={(open) => {
                              if (!open) setConfirmTask(null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                className="flex items-center gap-1 text-[11px] cursor-pointer hover:opacity-80"
                                onClick={() => setConfirmTask({ bolaoId: b.id, field: key, value: !checked })}
                              >
                                <Checkbox checked={checked} className="h-3.5 w-3.5 pointer-events-none" />
                                <Icon className={`h-3 w-3 ${checked ? "text-green-500" : "text-muted-foreground"}`} />
                                <span className={checked ? "text-green-500" : "text-muted-foreground"}>{label}</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2" side="top">
                              <p className="text-xs mb-2">Confirmar?</p>
                              <div className="flex gap-1.5">
                                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => setConfirmTask(null)}>
                                  Cancelar
                                </Button>
                                <Button size="sm" className="h-7 text-xs flex-1" onClick={handleToggleTask}>
                                  ✅
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}

                      <div className="ml-auto flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
