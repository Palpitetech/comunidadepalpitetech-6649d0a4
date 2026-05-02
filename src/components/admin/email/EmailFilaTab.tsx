import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RefreshCw, Trash2 } from "lucide-react";

interface QueueRow {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  priority: number;
  email_templates: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700",
  sent: "bg-emerald-500/10 text-emerald-700",
  failed: "bg-red-500/10 text-red-700",
  skipped: "bg-gray-500/10 text-gray-700",
};

export function EmailFilaTab() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("email_queue" as any)
      .select("id, recipient_email, recipient_name, status, scheduled_at, sent_at, error_message, priority, email_templates(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (statusFilter) q = q.eq("status", statusFilter);
    if (search) q = q.ilike("recipient_email", `%${search}%`);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  const retry = async (id: string) => {
    const { error } = await supabase.from("email_queue" as any).update({ status: "pending", error_message: null, scheduled_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reenviado para fila");
    load();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("email_queue" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    load();
  };

  const processNow = async () => {
    const { error } = await supabase.functions.invoke("process-email-queue");
    if (error) return toast.error(error.message);
    toast.success("Processamento disparado");
    setTimeout(load, 1500);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Buscar por email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="max-w-xs" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Todos status</option>
          <option value="pending">Pendentes</option>
          <option value="sent">Enviados</option>
          <option value="failed">Falhou</option>
          <option value="skipped">Pulados</option>
        </select>
        <Button variant="outline" size="sm" onClick={load}>Atualizar</Button>
        <Button size="sm" onClick={processNow}>Processar fila agora</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Fila vazia</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge>
                    <span className="font-medium text-sm truncate">{r.recipient_email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.email_templates?.name || "—"} · prioridade {r.priority} · {new Date(r.scheduled_at).toLocaleString("pt-BR")}
                  </div>
                  {r.error_message && <div className="text-xs text-red-600 truncate mt-0.5">{r.error_message}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {(r.status === "failed" || r.status === "skipped") && (
                    <Button size="icon" variant="ghost" onClick={() => retry(r.id)}><RefreshCw className="h-4 w-4" /></Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => cancel(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
