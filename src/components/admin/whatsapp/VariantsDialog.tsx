import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Pencil, Trash2, Save, X, Repeat } from "lucide-react";
import type { MessageTemplateVariant } from "@/types/whatsapp";

const MAX_VARIANTS = 10;
const VARIABLES = ["{{nome}}", "{{telefone}}", "{{email}}", "{{produto}}", "{{link_grupo_vip}}"];

interface VariantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  templateName: string;
  onCountChange?: (count: number) => void;
}

export function VariantsDialog({ open, onOpenChange, templateId, templateName, onCountChange }: VariantsDialogProps) {
  const [variants, setVariants] = useState<MessageTemplateVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);
  const newRef = useRef<HTMLTextAreaElement>(null);

  const fetch = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("message_template_variants" as any)
      .select("*")
      .eq("template_id", templateId)
      .order("position", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar variantes");
    } else {
      const list = (data as any[]) || [];
      setVariants(list as MessageTemplateVariant[]);
      onCountChange?.(list.length);
    }
    setLoading(false);
  }, [templateId, onCountChange]);

  useEffect(() => {
    if (open && templateId) fetch();
    if (!open) {
      setEditingId(null);
      setAdding(false);
      setNewContent("");
    }
  }, [open, templateId, fetch]);

  const nextPosition = (): number => {
    const used = new Set(variants.map((v) => v.position));
    for (let i = 1; i <= MAX_VARIANTS; i++) {
      if (!used.has(i)) return i;
    }
    return -1;
  };

  const handleAdd = async () => {
    if (!templateId || !newContent.trim()) {
      toast.error("Conteúdo da variante é obrigatório");
      return;
    }
    const pos = nextPosition();
    if (pos === -1) {
      toast.error("Limite de 10 variantes atingido");
      return;
    }
    setSavingId("new");
    try {
      const { error } = await supabase.from("message_template_variants" as any).insert({
        template_id: templateId,
        content: newContent.trim(),
        position: pos,
      });
      if (error) throw error;
      toast.success(`Variante #${pos} criada`);
      setNewContent("");
      setAdding(false);
      fetch();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar variante");
    } finally {
      setSavingId(null);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editContent.trim()) {
      toast.error("Conteúdo não pode ser vazio");
      return;
    }
    setSavingId(id);
    try {
      const { error } = await supabase
        .from("message_template_variants" as any)
        .update({ content: editContent.trim() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Variante atualizada");
      setEditingId(null);
      fetch();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggle = async (v: MessageTemplateVariant) => {
    setSavingId(v.id);
    const { error } = await supabase
      .from("message_template_variants" as any)
      .update({ is_active: !v.is_active })
      .eq("id", v.id);
    if (error) {
      toast.error("Erro ao alterar status");
    } else {
      toast.success(v.is_active ? "Variante pausada" : "Variante ativada");
      fetch();
    }
    setSavingId(null);
  };

  const handleDelete = async (v: MessageTemplateVariant) => {
    if (!confirm(`Excluir variante #${v.position}?`)) return;
    setSavingId(v.id);
    const { error } = await supabase
      .from("message_template_variants" as any)
      .delete()
      .eq("id", v.id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Variante excluída");
      fetch();
    }
    setSavingId(null);
  };

  const insertVar = (target: "edit" | "new", v: string) => {
    const ref = target === "edit" ? editRef.current : newRef.current;
    const setter = target === "edit" ? setEditContent : setNewContent;
    const value = target === "edit" ? editContent : newContent;
    if (!ref) {
      setter(value + v);
      return;
    }
    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const next = value.slice(0, start) + v + value.slice(end);
    setter(next);
    requestAnimationFrame(() => {
      ref.focus();
      const pos = start + v.length;
      ref.setSelectionRange(pos, pos);
    });
  };

  const canAddMore = variants.length < MAX_VARIANTS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Variantes — {templateName}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground border border-border">
          Use até 10 variações que falem o <strong>mesmo conteúdo</strong> de formas diferentes.
          O sistema rotaciona automaticamente para evitar bloqueio por mensagens repetidas.
        </div>

        <ScrollArea className="max-h-[calc(88vh-220px)] pr-3">
          <div className="space-y-3 pt-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : variants.length === 0 && !adding ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhuma variante. O template usa apenas o conteúdo padrão.
              </div>
            ) : (
              variants.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        #{v.position}
                      </Badge>
                      {!v.is_active && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          Pausada
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        Enviada {v.times_used}×
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={v.is_active}
                        onCheckedChange={() => handleToggle(v)}
                        disabled={savingId === v.id}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingId(v.id);
                          setEditContent(v.content);
                        }}
                        disabled={savingId === v.id || editingId === v.id}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(v)}
                        disabled={savingId === v.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {editingId === v.id ? (
                    <div className="space-y-2">
                      <Textarea
                        ref={editRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        maxLength={2000}
                      />
                      <div className="flex flex-wrap gap-1">
                        {VARIABLES.map((va) => (
                          <button
                            key={va}
                            type="button"
                            onClick={() => insertVar("edit", va)}
                            className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground hover:bg-muted/80 border border-border"
                          >
                            {va}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(v.id)}
                          disabled={savingId === v.id}
                          className="gap-1.5"
                        >
                          {savingId === v.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="gap-1.5"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-3">
                      {v.content}
                    </p>
                  )}
                </div>
              ))
            )}

            {adding && (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    #{nextPosition()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setAdding(false);
                      setNewContent("");
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  ref={newRef}
                  placeholder="Conteúdo da nova variante..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
                <div className="flex flex-wrap gap-1">
                  {VARIABLES.map((va) => (
                    <button
                      key={va}
                      type="button"
                      onClick={() => insertVar("new", va)}
                      className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground hover:bg-muted/80 border border-border"
                    >
                      {va}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={savingId === "new" || !newContent.trim()}
                  className="gap-1.5"
                >
                  {savingId === "new" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Criar variante
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {variants.length}/{MAX_VARIANTS} variantes
          </span>
          <Button
            size="sm"
            onClick={() => setAdding(true)}
            disabled={!canAddMore || adding}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar variante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
