import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface Template { id: string; name: string; subject: string; event_trigger: string; }

export function EmailDisparoManualTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTpl, setSelectedTpl] = useState("");
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [tpls, tagsRes] = await Promise.all([
        supabase.from("email_templates" as any).select("id, name, subject, event_trigger").eq("is_active", true).order("name"),
        supabase.rpc("get_distinct_tags" as any),
      ]);
      setTemplates((tpls.data as any) || []);
      if (tagsRes.data) {
        setAllTags(((tagsRes.data as any[]) || []).map((r: any) => r.tag || r).sort());
      }
    })();
  }, []);

  const fetchCount = async () => {
    let q = supabase.from("perfis").select("id", { count: "exact", head: true }).not("email", "is", null).neq("email", "").eq("is_bot", false);
    if (includeTags.length > 0) q = q.overlaps("tags", includeTags);
    if (excludeTags.length > 0) {
      for (const t of excludeTags) q = q.not("tags", "cs", `{${t}}`);
    }
    const { count, error } = await q;
    if (error) toast.error(error.message);
    setCount(count ?? 0);
  };

  useEffect(() => { fetchCount(); /* eslint-disable-next-line */ }, [includeTags, excludeTags]);

  const dispatch = async () => {
    if (!selectedTpl) return;
    setConfirmOpen(false);
    setLoading(true);
    try {
      let q = supabase.from("perfis").select("nome, email, celular, tags").not("email", "is", null).neq("email", "").eq("is_bot", false);
      if (includeTags.length > 0) q = q.overlaps("tags", includeTags);
      if (excludeTags.length > 0) {
        for (const t of excludeTags) q = q.not("tags", "cs", `{${t}}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      const tpl = templates.find((t) => t.id === selectedTpl);
      if (!tpl) throw new Error("Template inválido");

      const items = (data || []).map((p: any) => ({
        event_trigger: tpl.event_trigger,
        recipient_email: p.email,
        recipient_name: p.nome,
        variables: { nome: p.nome || "", email: p.email, telefone: p.celular || "" },
        tags: p.tags || [],
        priority: 0,
      }));

      // Send in batches of 100
      let ok = 0, skipped = 0;
      for (let i = 0; i < items.length; i += 100) {
        const batch = items.slice(i, i + 100);
        const { data: res, error: invErr } = await supabase.functions.invoke("enqueue-email", { body: batch });
        if (invErr) throw invErr;
        for (const r of (res?.results || [])) {
          if (r.ok && !r.skipped) ok++;
          else skipped++;
        }
      }
      toast.success(`${ok} emails enfileirados (${skipped} pulados)`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string, list: string[], set: (l: string[]) => void) => {
    set(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  return (
    <div className="space-y-3 pt-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Template</CardTitle></CardHeader>
        <CardContent>
          <select value={selectedTpl} onChange={(e) => setSelectedTpl(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Selecione um template ativo...</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Filtros por tag</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Incluir (qualquer destas)</Label>
            <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
              {allTags.map((t) => (
                <Badge key={`in-${t}`} variant={includeTags.includes(t) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(t, includeTags, setIncludeTags)}>
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Excluir</Label>
            <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
              {allTags.map((t) => (
                <Badge key={`ex-${t}`} variant={excludeTags.includes(t) ? "destructive" : "outline"} className="cursor-pointer" onClick={() => toggleTag(t, excludeTags, setExcludeTags)}>
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between bg-muted/50 rounded-md px-4 py-3">
        <div>
          <div className="text-2xl font-bold">{count ?? "—"}</div>
          <div className="text-xs text-muted-foreground">destinatários com email válido</div>
        </div>
        <Button disabled={!selectedTpl || !count || loading} onClick={() => setConfirmOpen(true)}>
          <Send className="h-4 w-4 mr-1" /> Disparar
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar disparo</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Você está prestes a enfileirar <strong>{count} emails</strong> com o template <strong>{templates.find((t) => t.id === selectedTpl)?.name}</strong>.
            <br /><br />
            Emails na lista de bloqueados e duplicados nos últimos 7 dias serão pulados automaticamente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={dispatch}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
