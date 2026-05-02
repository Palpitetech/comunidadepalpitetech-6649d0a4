import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LogRow {
  id: string;
  recipient_email: string;
  status: string;
  resend_message_id: string | null;
  error_message: string | null;
  created_at: string;
}

const COLORS: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-700",
  delivered: "bg-emerald-500/10 text-emerald-700",
  opened: "bg-blue-500/10 text-blue-700",
  clicked: "bg-indigo-500/10 text-indigo-700",
  bounced: "bg-red-500/10 text-red-700",
  complained: "bg-red-500/10 text-red-700",
  failed: "bg-red-500/10 text-red-700",
  skipped: "bg-gray-500/10 text-gray-700",
};

export function EmailLogsTab() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("email_send_logs" as any).select("*").order("created_at", { ascending: false }).limit(300);
    if (search) q = q.ilike("recipient_email", `%${search}%`);
    const { data } = await q;
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-2">
        <Input placeholder="Buscar por email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="max-w-xs" />
        <Button size="sm" variant="outline" onClick={load}>Buscar</Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-1.5">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={COLORS[r.status] || ""}>{r.status}</Badge>
                    <span className="text-sm font-medium truncate">{r.recipient_email}</span>
                  </div>
                  {r.error_message && <div className="text-xs text-red-600 truncate mt-0.5">{r.error_message}</div>}
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0 text-right">
                  <div>{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                  {r.resend_message_id && <div className="font-mono">{r.resend_message_id.slice(0, 8)}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
