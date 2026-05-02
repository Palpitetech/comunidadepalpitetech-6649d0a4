import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  event_trigger: string;
  category: "transactional" | "marketing";
  is_active: boolean;
  delay_minutes: number;
  include_tags: string[];
  exclude_tags: string[];
  plan_ids: string[];
  tags_match_mode: string;
  from_name: string;
  reply_to: string | null;
}

const EVENTS = [
  "novo_cadastro",
  "pix_gerado",
  "sale_confirmed",
  "lead_pre_checkout_abandono",
  "trial_iniciado",
  "assinatura_expirada",
  "acesso_cortado",
];

const VARIABLES = ["{{nome}}", "{{email}}", "{{telefone}}", "{{produto}}", "{{plano_nome}}", "{{site}}", "{{suporte}}"];

const EMPTY: Partial<EmailTemplate> = {
  name: "",
  subject: "",
  html: "",
  event_trigger: "novo_cadastro",
  category: "marketing",
  is_active: true,
  delay_minutes: 0,
  include_tags: [],
  exclude_tags: [],
  plan_ids: [],
  tags_match_mode: "any",
  from_name: "Palpite Tech",
  reply_to: null,
};

export function EmailTemplatesTab() {
  const [items, setItems] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EmailTemplate> | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("email_templates" as any).select("*").order("name");
    if (error) toast.error(error.message);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || !editing?.subject || !editing?.html) {
      toast.error("Nome, assunto e HTML são obrigatórios");
      return;
    }
    const payload = { ...editing };
    delete (payload as any).id;
    if (editing.id) {
      const { error } = await supabase.from("email_templates" as any).update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("email_templates" as any).insert(payload as any);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo!");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este template?")) return;
    const { error } = await supabase.from("email_templates" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    load();
  };

  const insertVar = (v: string) => {
    setEditing((e) => ({ ...e, html: (e?.html || "") + v }));
  };

  return (
    <div className="space-y-3">
      {/* Header banner removed - centralized in CommunicationQuickMetrics if needed */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} templates de email</p>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="h-4 w-4 mr-1" /> Novo template
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-2">
          {items.map((tpl) => (
            <Card key={tpl.id}>
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{tpl.name}</span>
                    <Badge 
                      variant={tpl.category === 'transactional' ? "default" : "secondary"} 
                      className={cn(
                        "text-[9px] uppercase tracking-wider py-0 px-1.5 h-4",
                        tpl.category === 'transactional' 
                          ? "bg-emerald-500 hover:bg-emerald-600 border-none text-white" 
                          : "bg-blue-500 hover:bg-blue-600 border-none text-white"
                      )}
                    >
                      {tpl.category === 'transactional' ? 'Transacional' : 'Marketing'}
                    </Badge>
                    {!tpl.is_active && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    <Badge variant="secondary" className="mr-1">{tpl.event_trigger}</Badge>
                    {tpl.subject}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(tpl); setPreviewOpen(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(tpl)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(tpl.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing && !previewOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar template" : "Novo template"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="flex gap-4 p-1 bg-muted/50 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setEditing(e => ({ ...e, category: 'marketing' }))}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                    editing.category === 'marketing' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Marketing
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(e => ({ ...e, category: 'transactional' }))}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                    editing.category === 'transactional' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Transacional
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome interno</Label>
                  <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>Evento gatilho</Label>
                  <Select value={editing.event_trigger} onValueChange={(v) => setEditing({ ...editing, event_trigger: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENTS.map((ev) => <SelectItem key={ev} value={ev}>{ev}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Assunto (subject)</Label>
                <Input value={editing.subject || ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Remetente (nome)</Label>
                  <Input value={editing.from_name || ""} onChange={(e) => setEditing({ ...editing, from_name: e.target.value })} />
                </div>
                <div>
                  <Label>Reply-to (opcional)</Label>
                  <Input value={editing.reply_to || ""} onChange={(e) => setEditing({ ...editing, reply_to: e.target.value })} />
                </div>
                <div>
                  <Label>Atraso (min)</Label>
                  <Input type="number" min={0} value={editing.delay_minutes ?? 0} onChange={(e) => setEditing({ ...editing, delay_minutes: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div>
                <Label>HTML do email</Label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {VARIABLES.map((v) => (
                    <Button key={v} size="sm" variant="outline" type="button" onClick={() => insertVar(v)} className="h-6 text-xs px-2">
                      {v}
                    </Button>
                  ))}
                </div>
                <Textarea
                  rows={12}
                  className="font-mono text-xs"
                  value={editing.html || ""}
                  onChange={(e) => setEditing({ ...editing, html: e.target.value })}
                  placeholder="<p>Olá {{nome}}, ...</p>"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>Ativo</Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                  <Eye className="h-4 w-4 mr-1" /> Pré-visualizar
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização: {editing?.subject}</DialogTitle>
          </DialogHeader>
          <div className="border rounded bg-white p-4">
            <iframe
              title="preview"
              srcDoc={(editing?.html || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => `<mark>${k}</mark>`)}
              className="w-full min-h-[400px] border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
