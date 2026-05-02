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
import { Loader2, Plus, Trash2, Globe, Activity, Power, Eye, EyeOff, AlertTriangle, Unlink, ListPlus, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { maskIp } from "./shared/mask-ip";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Disponíveis</p>
          <p className="text-2xl font-semibold text-accent tabular-nums">{counts.available}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Em uso</p>
          <p className="text-2xl font-semibold tabular-nums">{counts.in_use}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Desativados</p>
          <p className="text-2xl font-semibold text-muted-foreground tabular-nums">{counts.disabled}</p>
        </div>
      </div>

      {/* Aviso sem proxies disponíveis */}
      {counts.available === 0 && proxies.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-destructive">Sem proxies livres</p>
            <p className="text-muted-foreground">Novas instâncias não conseguirão conectar. Adicione mais proxies abaixo.</p>
          </div>
        </div>
      )}

      {/* Header com ações */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground">{proxies.length} proxy(ies) cadastrados</p>
        <div className="flex gap-2">
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1 sm:flex-none">
                <ListPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar em lote</span>
                <span className="sm:hidden">Em lote</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar proxies em lote</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label>Prefixo do label</Label>
                  <Input value={bulkLabelPrefix} onChange={(e) => setBulkLabelPrefix(e.target.value)} placeholder="IPRoyal BR" />
                </div>
                <div className="space-y-1.5">
                  <Label>Formato do arquivo</Label>
                  <Select value={bulkFormat} onValueChange={(v) => setBulkFormat(v as ProxyFormat)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FORMAT_LABELS) as ProxyFormat[]).map((k) => (
                        <SelectItem key={k} value={k} className="font-mono text-xs">
                          {FORMAT_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,text/plain,text/csv"
                  hidden
                  onChange={handleFilePick}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Importar CSV / TXT
                </Button>

                <div className="space-y-1.5">
                  <Label>Cole as linhas abaixo</Label>
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={FORMAT_PLACEHOLDERS[bulkFormat]}
                    rows={8}
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Linhas em branco e iniciadas com <code>#</code> são ignoradas. Cabeçalho do CSV é detectado automaticamente. Todos serão criados como <strong>SOCKS5</strong> e <strong>disponíveis</strong>.
                  </p>
                </div>

                {bulkText.trim() && (
                  <div className="rounded-md border bg-muted/30 p-2.5 text-xs space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-accent font-medium tabular-nums">{bulkPreview.valid.length} válidas</span>
                      {bulkPreview.invalidLines.length > 0 && (
                        <span className="text-destructive tabular-nums">{bulkPreview.invalidLines.length} inválidas</span>
                      )}
                      {bulkPreview.dupInBatch > 0 && (
                        <span className="text-muted-foreground tabular-nums">{bulkPreview.dupInBatch} dup. na lista</span>
                      )}
                      {bulkPreview.dupInDb > 0 && (
                        <span className="text-muted-foreground tabular-nums">{bulkPreview.dupInDb} já existem</span>
                      )}
                      {bulkPreview.skippedHeader && (
                        <span className="text-muted-foreground">cabeçalho ignorado</span>
                      )}
                    </div>

                    {bulkPreview.valid.length > 0 && (
                      <div className="space-y-0.5 pt-1.5 border-t font-mono text-[11px] text-muted-foreground">
                        {bulkPreview.valid.slice(0, 3).map((p, i) => (
                          <div key={i}>
                            • {p.host}:{p.port}
                            {p.username && <span className="opacity-60"> · auth ••••••</span>}
                          </div>
                        ))}
                        {bulkPreview.valid.length > 3 && (
                          <div className="text-[10px] opacity-70">… e mais {bulkPreview.valid.length - 3}</div>
                        )}
                      </div>
                    )}

                    {bulkPreview.invalidLines.length > 0 && (
                      <div className="space-y-0.5 pt-1.5 border-t border-destructive/20 font-mono text-[11px] text-destructive/90 max-h-28 overflow-y-auto">
                        {bulkPreview.invalidLines.slice(0, 5).map((err, i) => (
                          <div key={i}>✗ linha {err.line}: {err.reason}</div>
                        ))}
                        {bulkPreview.invalidLines.length > 5 && (
                          <div className="text-[10px] opacity-70">… e mais {bulkPreview.invalidLines.length - 5} erro(s)</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={handleBulkSave} disabled={bulkSaving || bulkPreview.valid.length === 0} className="w-full">
                  {bulkSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Importar {bulkPreview.valid.length > 0 ? `${bulkPreview.valid.length} proxies` : ""}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(emptyForm); setTestResult(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                Adicionar Proxy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Proxy</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label>Label *</Label>
                  <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="IPRoyal BR #1" />
                </div>
                <div className="space-y-1.5">
                  <Label>Protocolo</Label>
                  <Select value={form.protocol} onValueChange={(v) => setForm((f) => ({ ...f, protocol: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="socks5">SOCKS5</SelectItem>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="https">HTTPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Host *</Label>
                    <Input value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} placeholder="proxy.iproyal.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Porta *</Label>
                    <Input type="number" value={form.port} onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))} placeholder="12321" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Usuário</Label>
                  <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                </div>

                {testResult && (
                  <div className={`rounded-md border p-2 text-xs ${testResult.ok ? "border-accent/30 bg-accent/5 text-accent" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
                    {testResult.ok ? `✓ Conectou — IP externo: ${testResult.ip}` : `✗ ${testResult.error}`}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleTestForm} disabled={testing} className="flex-1">
                    {testing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Testar conexão
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      {proxies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Globe className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhum proxy cadastrado</p>
          <p className="text-xs">Use "Adicionar em lote" para colar a lista da IPRoyal</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={300}>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.4fr_1.4fr_0.8fr_1.2fr_1fr_auto] gap-3 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b bg-muted/30">
              <span>Label</span>
              <span>Host:Port</span>
              <span>Status</span>
              <span>Instância</span>
              <span>Última verificação</span>
              <span className="text-right">Ações</span>
            </div>
            {proxies.map((p) => {
              const inst = p.instance_id ? instances.get(p.instance_id) : null;
              const action = actionLoading[p.id];
              const statusBadge = p.status === "available"
                ? "bg-accent/10 text-accent border-accent/20"
                : p.status === "in_use"
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted text-muted-foreground border-border";
              const statusLabel = p.status === "available" ? "Livre" : p.status === "in_use" ? "Em uso" : "Desativado";

              return (
                <div key={p.id} className="grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_0.8fr_1.2fr_1fr_auto] gap-2 md:gap-3 px-4 py-3 border-b last:border-b-0 items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground uppercase">{p.protocol}</p>
                  </div>
                  <div className="min-w-0 flex items-center gap-2">
                    <code className="text-xs font-mono truncate">{p.host}:{p.port}</code>
                    {p.username && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => setShowPassword((s) => ({ ...s, [p.id]: !s[p.id] }))}
                          >
                            {showPassword[p.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {showPassword[p.id]
                            ? `${p.username} / ${p.password ?? ""}`
                            : `${p.username} / ••••••••`}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div>
                    <Badge variant="outline" className={`text-[10px] ${statusBadge}`}>{statusLabel}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground min-w-0 truncate">
                    {inst ? (
                      <span className="text-card-foreground">{inst.friendly_name}</span>
                    ) : p.instance_id ? (
                      <span className="text-destructive">Órfão</span>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.last_health_check_at ? (
                      <div className="flex flex-col">
                        <span>{format(new Date(p.last_health_check_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        {p.external_ip && <span className="font-mono text-[10px]">{maskIp(p.external_ip)}</span>}
                        {p.last_error && <span className="text-destructive text-[10px] truncate" title={p.last_error}>{p.last_error}</span>}
                      </div>
                    ) : "—"}
                  </div>
                  <div className="flex items-center justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTestRow(p)} disabled={!!action}>
                          {action === "test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Testar</TooltipContent>
                    </Tooltip>
                    {p.status === "in_use" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleManualRelease(p)} disabled={!!action}>
                            {action === "release" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Liberar manualmente</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleStatus(p)} disabled={!!action || p.status === "in_use"}>
                          {action === "toggle" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{p.status === "disabled" ? "Reativar" : "Desativar"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(p)} disabled={!!action || p.status === "in_use"}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proxy?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{deleteConfirm?.label}" do pool. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
