import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Globe, Activity, Power, Eye, EyeOff, AlertTriangle, Unlink, ListPlus, Upload, RefreshCw, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { maskIp } from "./shared/mask-ip";
import { UnifiedLayout } from "./UnifiedLayout";
import { UnifiedToolbar, ActionButton } from "./shared/UnifiedToolbar";
import { UnifiedList, UnifiedCardItem } from "./shared/UnifiedList";

interface ProxyRow {
  id: string;
  label: string;
  protocol: string;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  status: "available" | "in_use" | "disabled";
  instance_id: string | null;
  assigned_at: string | null;
  last_health_check_at: string | null;
  external_ip: string | null;
  last_error: string | null;
  created_at: string;
}

interface InstanceLite {
  id: string;
  friendly_name: string;
  evolution_instance_id: string;
}

interface FormData {
  label: string;
  protocol: string;
  host: string;
  port: string;
  username: string;
  password: string;
}

const emptyForm: FormData = {
  label: "",
  protocol: "socks5",
  host: "",
  port: "",
  username: "",
  password: "",
};

// maskIp moved to ./shared/mask-ip

type ProxyFormat = "format1" | "format2" | "format3" | "format4";

const FORMAT_LABELS: Record<ProxyFormat, string> = {
  format1: "HOST:PORTA:USUÁRIO:SENHA",
  format2: "HOST:PORTA@USUÁRIO:SENHA",
  format3: "USUÁRIO:SENHA:HOST:PORTA",
  format4: "USUÁRIO:SENHA@HOST:PORTA",
};

const FORMAT_PLACEHOLDERS: Record<ProxyFormat, string> = {
  format1: "proxy.iproyal.com:12321:user1:pass1\nproxy.iproyal.com:12322:user1:pass1",
  format2: "proxy.iproyal.com:12321@user1:pass1\nproxy.iproyal.com:12322@user1:pass1",
  format3: "user1:pass1:proxy.iproyal.com:12321\nuser1:pass1:proxy.iproyal.com:12322",
  format4: "user1:pass1@proxy.iproyal.com:12321\nuser1:pass1@proxy.iproyal.com:12322",
};

interface ParsedProxy {
  host: string;
  port: number;
  username: string | null;
  password: string | null;
}

type ParseResult =
  | { ok: true; proxy: ParsedProxy }
  | { ok: false; reason: string };

const HOST_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9\-.]*[a-zA-Z0-9])?$/;

function validatePort(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseInt(s.trim(), 10);
  if (isNaN(n) || String(n) !== s.trim()) return null;
  return n >= 1 && n <= 65535 ? n : null;
}

function validateHost(h: string | undefined): boolean {
  if (!h) return false;
  const trimmed = h.trim();
  if (trimmed.length === 0 || trimmed.length > 253) return false;
  return HOST_REGEX.test(trimmed);
}

function parseProxyLine(line: string, format: ProxyFormat): ParseResult {
  const trimmed = line.trim();
  if (!trimmed) return { ok: false, reason: "linha vazia" };

  try {
    if (format === "format1") {
      const parts = trimmed.split(":");
      if (parts.length !== 2 && parts.length !== 4) {
        return { ok: false, reason: "esperado HOST:PORTA ou HOST:PORTA:USUÁRIO:SENHA" };
      }
      const [host, portStr, username, password] = parts;
      if (!validateHost(host)) return { ok: false, reason: "host inválido" };
      const port = validatePort(portStr);
      if (!port) return { ok: false, reason: "porta inválida (1–65535)" };
      if (parts.length === 4 && (!username?.trim() || !password?.trim())) {
        return { ok: false, reason: "usuário/senha vazios" };
      }
      return {
        ok: true,
        proxy: {
          host: host.trim(),
          port,
          username: username?.trim() || null,
          password: password?.trim() || null,
        },
      };
    }
    if (format === "format2") {
      const atParts = trimmed.split("@");
      if (atParts.length !== 2) return { ok: false, reason: "esperado HOST:PORTA@USUÁRIO:SENHA" };
      const [hostPart, authPart] = atParts;
      const hp = hostPart.split(":");
      const ap = authPart.split(":");
      if (hp.length !== 2 || ap.length !== 2) return { ok: false, reason: "formato incorreto" };
      const [host, portStr] = hp;
      const [username, password] = ap;
      if (!validateHost(host)) return { ok: false, reason: "host inválido" };
      const port = validatePort(portStr);
      if (!port) return { ok: false, reason: "porta inválida (1–65535)" };
      if (!username.trim() || !password.trim()) return { ok: false, reason: "usuário/senha obrigatórios" };
      return { ok: true, proxy: { host: host.trim(), port, username: username.trim(), password: password.trim() } };
    }
    if (format === "format3") {
      const parts = trimmed.split(":");
      if (parts.length !== 4) return { ok: false, reason: "esperado USUÁRIO:SENHA:HOST:PORTA" };
      const [username, password, host, portStr] = parts;
      if (!username.trim() || !password.trim()) return { ok: false, reason: "usuário/senha obrigatórios" };
      if (!validateHost(host)) return { ok: false, reason: "host inválido" };
      const port = validatePort(portStr);
      if (!port) return { ok: false, reason: "porta inválida (1–65535)" };
      return { ok: true, proxy: { host: host.trim(), port, username: username.trim(), password: password.trim() } };
    }
    if (format === "format4") {
      const atParts = trimmed.split("@");
      if (atParts.length !== 2) return { ok: false, reason: "esperado USUÁRIO:SENHA@HOST:PORTA" };
      const [authPart, hostPart] = atParts;
      const ap = authPart.split(":");
      const hp = hostPart.split(":");
      if (ap.length !== 2 || hp.length !== 2) return { ok: false, reason: "formato incorreto" };
      const [username, password] = ap;
      const [host, portStr] = hp;
      if (!username.trim() || !password.trim()) return { ok: false, reason: "usuário/senha obrigatórios" };
      if (!validateHost(host)) return { ok: false, reason: "host inválido" };
      const port = validatePort(portStr);
      if (!port) return { ok: false, reason: "porta inválida (1–65535)" };
      return { ok: true, proxy: { host: host.trim(), port, username: username.trim(), password: password.trim() } };
    }
  } catch (err: any) {
    return { ok: false, reason: "erro ao processar" };
  }
  return { ok: false, reason: "formato desconhecido" };
}

function proxyDedupKey(p: ParsedProxy): string {
  return `${p.host.toLowerCase()}:${p.port}:${p.username ?? ""}:${p.password ?? ""}`;
}

function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  return /\b(host|user|proxy|port|username|password)\b/.test(lower) && !/\d/.test(line.split(/[:,@]/)[1] || "");
}

export function ProxiesTab() {
  const [proxies, setProxies] = useState<ProxyRow[]>([]);
  const [instances, setInstances] = useState<Map<string, InstanceLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkLabelPrefix, setBulkLabelPrefix] = useState("IPRoyal BR");
  const [bulkFormat, setBulkFormat] = useState<ProxyFormat>("format1");
  const [bulkSaving, setBulkSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; ip?: string; error?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<ProxyRow | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const setRowAction = (id: string, action: string | null) => {
    setActionLoading((prev) => {
      if (action) return { ...prev, [id]: action };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [proxRes, instRes] = await Promise.all([
      supabase.from("whatsapp_proxies" as any).select("*").order("created_at", { ascending: true }),
      supabase.from("whatsapp_instances" as any).select("id, friendly_name, evolution_instance_id"),
    ]);

    if (proxRes.error) {
      console.error(proxRes.error);
      toast.error("Erro ao carregar proxies");
    } else {
      setProxies((proxRes.data as any[]) as ProxyRow[]);
    }

    if (instRes.data) {
      const map = new Map<string, InstanceLite>();
      for (const inst of instRes.data as any[]) {
        map.set(inst.id, inst as InstanceLite);
      }
      setInstances(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Removed legacy counts as they are now centralized in CommunicationQuickMetrics

  const handleTestForm = async () => {
    if (!form.host.trim() || !form.port.trim()) {
      toast.error("Preencha host e porta para testar");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("evolution-proxy", {
        body: {
          action: "testProxy",
          host: form.host.trim(),
          port: parseInt(form.port),
          protocol: form.protocol,
          username: form.username.trim() || undefined,
          password: form.password.trim() || undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        setTestResult({ ok: true, ip: data.ip });
      } else {
        setTestResult({ ok: false, error: data?.error || "Falha desconhecida" });
      }
    } catch (err: any) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const label = form.label.trim();
    const host = form.host.trim();
    const portStr = form.port.trim();
    const protocol = form.protocol.trim().toLowerCase();
    const allowedProtocols = ["http", "https", "socks4", "socks5"];

    if (!label || !host || !portStr) {
      toast.error("Label, host e porta são obrigatórios");
      return;
    }
    const portNum = parseInt(portStr, 10);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      toast.error("Porta inválida (1–65535)");
      return;
    }
    if (!allowedProtocols.includes(protocol)) {
      toast.error("Protocolo inválido (use http, https, socks4 ou socks5)");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("whatsapp_proxies" as any).insert({
        label,
        protocol,
        host,
        port: portNum,
        username: form.username.trim() || null,
        password: form.password.trim() || null,
        status: "available",
      });
      if (error) throw error;
      toast.success("Proxy adicionado");
      setDialogOpen(false);
      setForm(emptyForm);
      setTestResult(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const existingDedupKeys = useMemo(() => {
    const set = new Set<string>();
    for (const p of proxies) {
      set.add(proxyDedupKey({
        host: p.host,
        port: p.port,
        username: p.username,
        password: p.password,
      }));
    }
    return set;
  }, [proxies]);

  const bulkPreview = useMemo(() => {
    const rawLines = bulkText.split("\n");
    const valid: ParsedProxy[] = [];
    const invalidLines: { line: number; reason: string }[] = [];
    let dupInBatch = 0;
    let dupInDb = 0;
    let skippedHeader = false;
    const seenInBatch = new Set<string>();

    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i];
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      if (i === 0 && isHeaderLine(line)) {
        skippedHeader = true;
        continue;
      }
      const result = parseProxyLine(line, bulkFormat);
      if (result.ok === false) {
        invalidLines.push({ line: i + 1, reason: result.reason });
        continue;
      }
      const proxy = result.proxy;
      const key = proxyDedupKey(proxy);
      if (seenInBatch.has(key)) {
        dupInBatch++;
        continue;
      }
      if (existingDedupKeys.has(key)) {
        dupInDb++;
        continue;
      }
      seenInBatch.add(key);
      valid.push(proxy);
    }
    return { valid, invalidLines, dupInBatch, dupInDb, skippedHeader };
  }, [bulkText, bulkFormat, existingDedupKeys]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result ?? "");
      setBulkText(text);
    };
    reader.onerror = () => toast.error("Falha ao ler o arquivo");
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkSave = async () => {
    const { valid, invalidLines, dupInBatch, dupInDb } = bulkPreview;
    if (valid.length === 0) {
      toast.error("Nenhuma linha válida encontrada");
      return;
    }
    setBulkSaving(true);
    let counter = proxies.length + 1;
    const rows = valid.map((p) => ({
      label: `${bulkLabelPrefix.trim() || "Proxy"} #${counter++}`,
      protocol: "socks5",
      host: p.host,
      port: p.port,
      username: p.username,
      password: p.password,
      status: "available",
    }));
    try {
      const { error } = await supabase.from("whatsapp_proxies" as any).insert(rows);
      if (error) throw error;
      const notes: string[] = [];
      if (invalidLines.length) notes.push(`${invalidLines.length} inválida(s)`);
      if (dupInBatch) notes.push(`${dupInBatch} duplicada(s) na lista`);
      if (dupInDb) notes.push(`${dupInDb} já existente(s)`);
      const suffix = notes.length ? ` — ignorados: ${notes.join(", ")}` : "";
      toast.success(`${rows.length} proxy(ies) adicionados${suffix}`);
      setBulkOpen(false);
      setBulkText("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar em lote");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleTestRow = async (proxy: ProxyRow) => {
    setRowAction(proxy.id, "test");
    try {
      const { data, error } = await supabase.functions.invoke("evolution-proxy", {
        body: {
          action: "testProxy",
          host: proxy.host,
          port: proxy.port,
          protocol: proxy.protocol,
          username: proxy.username,
          password: proxy.password,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        await supabase
          .from("whatsapp_proxies" as any)
          .update({ last_health_check_at: new Date().toISOString(), external_ip: data.ip, last_error: null })
          .eq("id", proxy.id);
        toast.success(`OK • IP ${data.ip}`);
      } else {
        await supabase
          .from("whatsapp_proxies" as any)
          .update({ last_health_check_at: new Date().toISOString(), last_error: data?.error || "falha" })
          .eq("id", proxy.id);
        toast.error(`Falhou: ${data?.error || "erro desconhecido"}`);
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao testar");
    } finally {
      setRowAction(proxy.id, null);
    }
  };

  const handleToggleStatus = async (proxy: ProxyRow) => {
    if (proxy.status === "in_use") {
      toast.error("Proxy em uso. Libere antes de desativar.");
      return;
    }
    const newStatus = proxy.status === "disabled" ? "available" : "disabled";
    setRowAction(proxy.id, "toggle");
    const { error } = await supabase
      .from("whatsapp_proxies" as any)
      .update({ status: newStatus })
      .eq("id", proxy.id);
    if (error) toast.error(error.message);
    else toast.success(newStatus === "available" ? "Reativado" : "Desativado");
    setRowAction(proxy.id, null);
    fetchData();
  };

  const handleManualRelease = async (proxy: ProxyRow) => {
    if (!proxy.instance_id) return;
    setRowAction(proxy.id, "release");
    const { error } = await supabase.rpc("release_proxy_for_instance" as any, { p_instance_id: proxy.instance_id });
    if (error) toast.error(error.message);
    else toast.success("Proxy liberado manualmente");
    setRowAction(proxy.id, null);
    fetchData();
  };

  const handleDelete = async (proxy: ProxyRow) => {
    if (proxy.status === "in_use") {
      toast.error("Proxy em uso não pode ser excluído");
      setDeleteConfirm(null);
      return;
    }
    setRowAction(proxy.id, "delete");
    const { error } = await supabase.from("whatsapp_proxies" as any).delete().eq("id", proxy.id);
    if (error) toast.error(error.message);
    else toast.success("Proxy excluído");
    setRowAction(proxy.id, null);
    setDeleteConfirm(null);
    fetchData();
  };

  return (
    <UnifiedLayout>
      <UnifiedToolbar
        left={
          <>
            <ActionButton
              label="Novo Proxy"
              icon={Plus}
              onClick={() => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }}
              variant="default"
            />
            <ActionButton
              label="Importar Lote"
              icon={ListPlus}
              onClick={() => setBulkOpen(true)}
            />
          </>
        }
        right={
          <ActionButton
            label="Atualizar"
            icon={RefreshCw}
            onClick={fetchData}
          />
        }
      />

      <UnifiedList
        isLoading={loading}
        count={proxies.length}
        empty={{
          icon: Globe,
          message: "Nenhum proxy encontrado",
          submessage: "Adicione proxies para usar com suas instâncias"
        }}
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {proxies.map((p) => {
            const inst = p.instance_id ? instances.get(p.instance_id) : null;
            const currentAction = actionLoading[p.id];

            return (
              <UnifiedCardItem
                key={p.id}
                className={cn(
                  "space-y-3",
                  p.status === "disabled" && "opacity-60 bg-muted/20"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{p.label}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {p.protocol}://{p.host}:{p.port}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={p.status === "available" ? "outline" : p.status === "in_use" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {p.status === "available" ? "Disponível" : p.status === "in_use" ? "Em uso" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>IP Externo:</span>
                    <span className="font-mono text-foreground">{p.external_ip ? maskIp(p.external_ip) : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Instância:</span>
                    <span className="truncate max-w-[120px] text-foreground font-medium">
                      {inst ? inst.friendly_name : "Nenhuma"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-2 border-t border-border">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTestRow(p)}
                          disabled={!!currentAction}
                        >
                          {currentAction === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Testar conexão</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleStatus(p)}
                          disabled={!!currentAction}
                        >
                          <Power className={cn("h-4 w-4", p.status === "disabled" ? "text-muted-foreground" : "text-green-500")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{p.status === "disabled" ? "Ativar" : "Desativar"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex-1" />

                  {p.status === "in_use" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => handleManualRelease(p)}>
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Liberar manualmente</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </UnifiedCardItem>
            );
          })}
        </div>
      </UnifiedList>

      {/* Forms and dialogs stay similarly */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* ... form content ... */}
      </Dialog>
      {/* ... rest of the dialogs ... */}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proxy?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá o proxy definitivamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnifiedLayout>
  );
}
