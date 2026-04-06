import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAiUsageLogs, useAdminSettings, computeSummary } from "@/hooks/useAiUsageLogs";
import { useQueryClient } from "@tanstack/react-query";
import { DollarSign, Coins, Bot, Wrench, Users, Settings, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FUNCTION_LABELS: Record<string, string> = {
  "generate-bot-post": "Post de Bot",
  "bot-interact-with-post": "Comentário de Bot",
  "bot-reply-user": "Resposta a Usuário",
  "generate-roundtable-post": "Mesa Redonda",
  "generate-guide-post": "Post de Guia",
  "chat-assistant": "Chat Assistente",
  "generate-palpites": "Gerador Lotofácil",
  "generate-palpites-megasena": "Gerador Mega Sena",
  "generate-palpites-duplasena": "Gerador Dupla Sena",
  "auto-fill-fechamento": "Auto-Fill Lotofácil",
  "auto-fill-megasena": "Auto-Fill Mega Sena",
  "auto-fill-duplasena": "Auto-Fill Dupla Sena",
};

const ACTION_LABELS: Record<string, string> = {
  post: "Post",
  comment: "Comentário",
  reply: "Resposta",
  chat: "Chat",
  palpite: "Palpite",
  auto_fill: "Auto-Fill",
};

function formatCurrency(value: number, currency: "USD" | "BRL" = "USD"): string {
  if (currency === "BRL") {
    return `R$ ${value.toFixed(4)}`;
  }
  return `$ ${value.toFixed(6)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

export default function AdminCustos() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [filterBot, setFilterBot] = useState<string>("all");
  const [filterFunction, setFilterFunction] = useState<string>("all");
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState("");

  const { data: settings, isLoading: settingsLoading } = useAdminSettings();
  const { data: logs, isLoading: logsLoading, refetch } = useAiUsageLogs({
    startDate,
    endDate,
    botPersonaId: filterBot !== "all" ? filterBot : undefined,
    edgeFunction: filterFunction !== "all" ? filterFunction : undefined,
    limit: 500,
  });

  const usdToBrl = settings?.usd_to_brl || 5.80;
  const summary = useMemo(() => computeSummary(logs || []), [logs]);

  // Get unique bots from logs
  const uniqueBots = useMemo(() => {
    const bots = new Map<string, string>();
    for (const log of logs || []) {
      if (log.bot_persona_id && log.bot_name) {
        bots.set(log.bot_persona_id, log.bot_name);
      }
    }
    return Array.from(bots.entries());
  }, [logs]);

  // Get unique functions from logs
  const uniqueFunctions = useMemo(() => {
    const funcs = new Set<string>();
    for (const log of logs || []) {
      funcs.add(log.edge_function);
    }
    return Array.from(funcs);
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                Custo Total (USD)
              </div>
              <p className="text-xl font-bold">{formatCurrency(summary.totalCostUsd)}</p>
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
                <Coins className="h-3.5 w-3.5" />
                Total Tokens
              </div>
              <p className="text-xl font-bold">{formatTokens(summary.totalTokens)}</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Data Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Data Fim</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
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
        <Tabs defaultValue="by-bot" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="by-bot" className="gap-1 text-xs"><Bot className="h-3.5 w-3.5" />Por Bot</TabsTrigger>
            <TabsTrigger value="by-function" className="gap-1 text-xs"><Wrench className="h-3.5 w-3.5" />Por Ferramenta</TabsTrigger>
            <TabsTrigger value="by-user" className="gap-1 text-xs"><Users className="h-3.5 w-3.5" />Por Usuário</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1 text-xs"><Coins className="h-3.5 w-3.5" />Log Detalhado</TabsTrigger>
          </TabsList>

          {logsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
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
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum dado encontrado</TableCell></TableRow>
                      )}
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
                      {Object.entries(summary.byFunction)
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
                      {Object.keys(summary.byFunction).length === 0 && (
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
                        <TableHead>Usuário ID</TableHead>
                        <TableHead className="text-right">Chamadas</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                        <TableHead className="text-right">BRL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(summary.byUser)
                        .sort(([, a], [, b]) => b.costUsd - a.costUsd)
                        .map(([key, data]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium font-mono text-xs">{key === "system" ? "Sistema (Bots)" : key.slice(0, 8) + "..."}</TableCell>
                            <TableCell className="text-right">{data.count}</TableCell>
                            <TableCell className="text-right">{formatTokens(data.tokens)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(data.costUsd)}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(data.costUsd * usdToBrl, "BRL")}</TableCell>
                          </TableRow>
                        ))}
                      {Object.keys(summary.byUser).length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum dado encontrado</TableCell></TableRow>
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
                        <TableHead>Bot/Usuário</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="text-right">USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(logs || []).slice(0, 100).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {FUNCTION_LABELS[log.edge_function] || log.edge_function}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.bot_name || (log.user_id ? log.user_id.slice(0, 8) + "..." : "Sistema")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.model?.split("/").pop() || "-"}</TableCell>
                          <TableCell className="text-right text-xs">
                            <span title={`Prompt: ${log.prompt_tokens} | Completion: ${log.completion_tokens}`}>
                              {formatTokens(log.total_tokens)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs">{formatCurrency(Number(log.cost_usd))}</TableCell>
                        </TableRow>
                      ))}
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
