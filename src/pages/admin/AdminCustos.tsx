import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAiUsageLogs, useAdminSettings, computeSummary, type Origem } from "@/hooks/useAiUsageLogs";
import { useQueryClient } from "@tanstack/react-query";
import { DollarSign, Coins, Bot, Wrench, Users, Settings, Loader2, RefreshCw, Cpu, UserCheck, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FUNCTION_LABELS: Record<string, string> = {
  // Automáticas (bots)
  "generate-roundtable-post": "Post Automático Mesa Redonda (bot)",
  "generate-guide-post": "Post Analítico (bot)",
  "bot-interact-with-post": "Comentário Automático de Bot",
  "bot-reply-user": "Resposta a Comentário de Usuário (bot)",
  // Disparadas por usuário
  "chat-assistant": "Chat IA (usuário ↔ bot)",
  "generate-palpites": "Gerador Lotofácil (usuário)",
  "generate-palpites-megasena": "Gerador Mega Sena (usuário)",
  "generate-palpites-duplasena": "Gerador Dupla Sena (usuário)",
  "generate-palpites-quina": "Gerador Quina (usuário)",
  "auto-fill-fechamento": "Auto-Fill Lotofácil (usuário)",
  "auto-fill-megasena": "Auto-Fill Mega Sena (usuário)",
  "auto-fill-duplasena": "Auto-Fill Dupla Sena (usuário)",
};

const ORIGEM_LABELS: Record<Origem, string> = {
  automatico: "Automático (bots)",
  usuario: "Usuário (humano)",
};

function formatCurrency(value: number, currency: "USD" | "BRL" = "USD"): string {
  if (currency === "BRL") return `R$ ${value.toFixed(4)}`;
  return `$ ${value.toFixed(6)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

function pct(part: number, total: number): string {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

export default function AdminCustos() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [filterBot, setFilterBot] = useState<string>("all");
  const [filterFunction, setFilterFunction] = useState<string>("all");
  const [filterOrigem, setFilterOrigem] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState("");

  const { data: settings } = useAdminSettings();
  const { data: logs, isLoading: logsLoading, refetch } = useAiUsageLogs({
    startDate,
    endDate,
    botPersonaId: filterBot !== "all" ? filterBot : undefined,
    edgeFunction: filterFunction !== "all" ? filterFunction : undefined,
    userId: filterUser !== "all" ? filterUser : undefined,
    origem: filterOrigem !== "all" ? (filterOrigem as Origem) : undefined,
    limit: 1000,
  });

  const usdToBrl = settings?.usd_to_brl || 5.80;
  const summary = useMemo(() => computeSummary(logs || []), [logs]);

  const uniqueBots = useMemo(() => {
    const bots = new Map<string, string>();
    for (const log of logs || []) {
      if (log.bot_persona_id && log.bot_name) bots.set(log.bot_persona_id, log.bot_name);
    }
    return Array.from(bots.entries());
  }, [logs]);

  const uniqueFunctions = useMemo(() => {
    const funcs = new Set<string>();
    for (const log of logs || []) funcs.add(log.edge_function);
    return Array.from(funcs);
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>();
    for (const log of logs || []) {
      if (log.user_id) {
        users.set(log.user_id, log.user_name || log.user_email || log.user_id.slice(0, 8));
      }
    }
    return Array.from(users.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [logs]);

  const handleUpdateRate = async () => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Valor inválido");
      return;
    }
    const { error } = await supabase
      .from("admin_settings" as any)
      .update({ usd_to_brl: rate, updated_at: new Date().toISOString() } as any)
      .eq("id", "default");
    if (error) {
      toast.error("Erro ao atualizar câmbio");
    } else {
      toast.success(`Câmbio atualizado para R$ ${rate.toFixed(2)}`);
      setEditingRate(false);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    }
  };

  const autoCost = summary.byOrigem.automatico.costUsd;
  const userCost = summary.byOrigem.usuario.costUsd;

  return (
    <AdminLayout>
      <div className="container-senior py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Controle de Custos IA</h1>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards (5) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                Custo Total (USD)
              </div>
              <p className="text-xl font-bold">{formatCurrency(summary.totalCostUsd)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{summary.totalCalls} chamadas · {formatTokens(summary.totalTokens)} tokens</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5 text-green-500" />
                Custo Total (BRL)
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(summary.totalCostUsd * usdToBrl, "BRL")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Cpu className="h-3.5 w-3.5 text-orange-500" />
                Custo Automático
              </div>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(autoCost)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {pct(autoCost, summary.totalCostUsd)} · {summary.byOrigem.automatico.count} chamadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                Custo de Usuários
              </div>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(userCost)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {pct(userCost, summary.totalCostUsd)} · {summary.byOrigem.usuario.count} chamadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Settings className="h-3.5 w-3.5" />
                Câmbio USD→BRL
              </div>
              {editingRate ? (
                <div className="flex gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="5.80"
                  />
                  <Button size="sm" onClick={handleUpdateRate} className="h-8 text-xs">OK</Button>
                </div>
              ) : (
                <p
                  className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
                  onClick={() => { setEditingRate(true); setNewRate(usdToBrl.toString()); }}
                  title="Clique para editar"
                >
                  R$ {usdToBrl.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <Label className="text-xs">Data Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Data Fim</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Origem</Label>
                <Select value={filterOrigem} onValueChange={setFilterOrigem}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="automatico">Automático (bot)</SelectItem>
                    <SelectItem value="usuario">Usuário (humano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Usuário</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueUsers.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Bot</Label>
                <Select value={filterBot} onValueChange={setFilterBot}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueBots.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ferramenta</Label>
                <Select value={filterFunction} onValueChange={setFilterFunction}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {uniqueFunctions.map((fn) => (
                      <SelectItem key={fn} value={fn}>{FUNCTION_LABELS[fn] || fn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="by-origem" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="by-origem" className="gap-1 text-xs"><Cpu className="h-3.5 w-3.5" />Por Origem</TabsTrigger>
            <TabsTrigger value="by-function" className="gap-1 text-xs"><Wrench className="h-3.5 w-3.5" />Por Ferramenta</TabsTrigger>
            <TabsTrigger value="by-user" className="gap-1 text-xs"><Users className="h-3.5 w-3.5" />Por Usuário</TabsTrigger>
            <TabsTrigger value="by-bot" className="gap-1 text-xs"><Bot className="h-3.5 w-3.5" />Por Bot</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1 text-xs"><Coins className="h-3.5 w-3.5" />Log</TabsTrigger>
          </TabsList>

          {logsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="by-origem">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Origem</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                        <TableHead className="text-right">BRL</TableHead>
                        <TableHead className="text-right">% Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(["automatico", "usuario"] as Origem[]).map((o) => {
                        const data = summary.byOrigem[o];
                        return (
                          <TableRow key={o}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {o === "automatico" ? <Cpu className="h-3.5 w-3.5 text-orange-500" /> : <UserCheck className="h-3.5 w-3.5 text-blue-500" />}
                                {ORIGEM_LABELS[o]}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{data.count}</TableCell>
                            <TableCell className="text-right">{formatTokens(data.tokens)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.costUsd)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(data.costUsd * usdToBrl, "BRL")}</TableCell>
                            <TableCell className="text-right font-semibold">{pct(data.costUsd, summary.totalCostUsd)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="by-function">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ferramenta</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                        <TableHead className="text-right">BRL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(summary.byFerramenta)
                        .sort(([, a], [, b]) => b.costUsd - a.costUsd)
                        .map(([key, data]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{FUNCTION_LABELS[key] || key}</TableCell>
                            <TableCell className="text-right">{data.count}</TableCell>
                            <TableCell className="text-right">{formatTokens(data.tokens)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.costUsd)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(data.costUsd * usdToBrl, "BRL")}</TableCell>
                          </TableRow>
                        ))}
                      {Object.keys(summary.byFerramenta).length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum dado encontrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="by-user">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                        <TableHead className="text-right">BRL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(summary.byUsuario)
                        .sort(([, a], [, b]) => b.costUsd - a.costUsd)
                        .map(([key, data]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{data.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{data.email || "—"}</TableCell>
                            <TableCell className="text-right">{data.count}</TableCell>
                            <TableCell className="text-right">{formatTokens(data.tokens)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.costUsd)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(data.costUsd * usdToBrl, "BRL")}</TableCell>
                          </TableRow>
                        ))}
                      {Object.keys(summary.byUsuario).length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário com custo no período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="by-bot">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                        <TableHead className="text-right">BRL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(summary.byBot)
                        .sort(([, a], [, b]) => b.costUsd - a.costUsd)
                        .map(([key, data]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{data.name}</TableCell>
                            <TableCell className="text-right">{data.count}</TableCell>
                            <TableCell className="text-right">{formatTokens(data.tokens)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.costUsd)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(data.costUsd * usdToBrl, "BRL")}</TableCell>
                          </TableRow>
                        ))}
                      {Object.keys(summary.byBot).length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum bot envolvido no período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Ferramenta</TableHead>
                        <TableHead>Quem</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(logs || []).slice(0, 200).map((log) => {
                        const userLabel = log.user_name || (log.user_id ? log.user_id.slice(0, 8) + "..." : null);
                        let quem: React.ReactNode;
                        if (log.user_id && log.bot_persona_id) {
                          quem = (
                            <span title={log.user_email || ""}>
                              <span className="font-medium">{userLabel}</span>
                              <span className="text-muted-foreground"> → </span>
                              <span>{log.bot_name}</span>
                            </span>
                          );
                        } else if (log.user_id) {
                          quem = <span title={log.user_email || ""} className="font-medium">{userLabel}</span>;
                        } else if (log.bot_persona_id) {
                          quem = (
                            <span className="flex items-center gap-1">
                              {log.bot_name}
                              <Badge variant="secondary" className="text-[9px] px-1 py-0">auto</Badge>
                            </span>
                          );
                        } else {
                          quem = <span className="text-muted-foreground">Sistema</span>;
                        }
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {FUNCTION_LABELS[log.edge_function] || log.edge_function}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{quem}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{log.model?.split("/").pop() || "-"}</TableCell>
                            <TableCell className="text-right text-xs">
                              <span title={`Prompt: ${log.prompt_tokens} | Completion: ${log.completion_tokens}`}>
                                {formatTokens(log.total_tokens)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-xs">{formatCurrency(Number(log.cost_usd))}</TableCell>
                          </TableRow>
                        );
                      })}
                      {(!logs || logs.length === 0) && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum log encontrado no período</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
