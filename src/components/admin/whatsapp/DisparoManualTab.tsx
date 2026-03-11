import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Send, Users, Check, X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateOption {
  id: string;
  name: string;
  content: string;
}

const VARIABLES = ["{{nome}}", "{{telefone}}", "{{email}}", "{{produto}}"];

export function DisparoManualTab() {
  // ── Tags state ──
  const [allTags, setAllTags] = useState<string[]>([]);
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [exactMatch, setExactMatch] = useState(false);
  const [includeOpen, setIncludeOpen] = useState(false);
  const [excludeOpen, setExcludeOpen] = useState(false);

  // ── Contact count ──
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // ── Message state ──
  const [messageMode, setMessageMode] = useState<"template" | "livre">("template");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [freeMessage, setFreeMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Dispatch state ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // ── Load tags + templates on mount ──
  useEffect(() => {
    const loadInitial = async () => {
      const [tagsRes, tplRes] = await Promise.all([
        supabase.rpc("get_distinct_tags" as any),
        supabase
          .from("message_templates")
          .select("id, name, content")
          .order("name"),
      ]);

      // Fallback: if RPC doesn't exist, fetch from perfis
      if (tagsRes.error) {
        const { data } = await supabase.from("perfis").select("tags");
        if (data) {
          const set = new Set<string>();
          data.forEach((p: any) => (p.tags || []).forEach((t: string) => set.add(t)));
          setAllTags([...set].sort());
        }
      } else {
        setAllTags(((tagsRes.data as any[]) || []).map((r: any) => r.tag || r).sort());
      }

      setTemplates((tplRes.data as any[]) || []);
    };
    loadInitial();
  }, []);

  // ── Count contacts whenever filters change ──
  const fetchCount = useCallback(async () => {
    setCountLoading(true);
    try {
      let query = supabase
        .from("perfis")
        .select("id", { count: "exact", head: true })
        .eq("is_bot", false)
        .not("celular", "is", null)
        .neq("celular", "");

      if (includeTags.length > 0) {
        if (exactMatch) {
          query = query.contains("tags", includeTags);
        } else {
          query = query.overlaps("tags", includeTags);
        }
      }

      if (excludeTags.length > 0) {
        // NOT overlaps — exclude anyone who has any of these tags
        for (const tag of excludeTags) {
          query = query.not("tags", "cs", `{${tag}}`);
        }
      }

      const { count, error } = await query;
      if (error) throw error;
      setContactCount(count ?? 0);
    } catch (err) {
      console.error(err);
      setContactCount(null);
    } finally {
      setCountLoading(false);
    }
  }, [includeTags, excludeTags, exactMatch]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // ── Helpers ──
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const toggleTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setFreeMessage((m) => m + variable);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = freeMessage.slice(0, start) + variable + freeMessage.slice(end);
    setFreeMessage(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + variable.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const canDispatch =
    (contactCount ?? 0) > 0 &&
    (messageMode === "template" ? !!selectedTemplateId : freeMessage.trim().length > 0);

  // ── Dispatch logic ──
  const handleDispatch = async () => {
    setConfirmOpen(false);
    setDispatching(true);
    try {
      // Fetch matching profiles
      let query = supabase
        .from("perfis")
        .select("id, nome, celular, email")
        .eq("is_bot", false)
        .not("celular", "is", null)
        .neq("celular", "");

      if (includeTags.length > 0) {
        if (exactMatch) {
          query = query.contains("tags", includeTags);
        } else {
          query = query.overlaps("tags", includeTags);
        }
      }
      if (excludeTags.length > 0) {
        for (const tag of excludeTags) {
          query = query.not("tags", "cs", `{${tag}}`);
        }
      }

      const { data: profiles, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      if (!profiles || profiles.length === 0) {
        toast.error("Nenhum contato encontrado");
        return;
      }

      // Build queue rows
      const now = new Date().toISOString();
      const rows = profiles.map((p: any) => {
        const variables: Record<string, string> = {
          nome: p.nome || "",
          telefone: p.celular || "",
          email: p.email || "",
        };

        if (messageMode === "livre") {
          variables.mensagem_livre = freeMessage.trim();
        }

        return {
          recipient_phone: p.celular,
          recipient_name: p.nome || "",
          template_id: messageMode === "template" ? selectedTemplateId : null,
          variables,
          status: "pending",
          scheduled_at: now,
        };
      });

      // Insert in batches of 500
      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("message_queue" as any).insert(batch);
        if (error) throw error;
      }

      toast.success(`${rows.length} mensagens adicionadas à fila!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao disparar mensagens");
    } finally {
      setDispatching(false);
    }
  };

  // ── Tag selector component ──
  const TagSelector = ({
    label,
    selected,
    onToggle,
    open,
    onOpenChange,
  }: {
    label: string;
    selected: string[];
    onToggle: (tag: string) => void;
    open: boolean;
    onOpenChange: (v: boolean) => void;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal min-h-[40px] h-auto"
          >
            {selected.length === 0 ? (
              <span className="text-muted-foreground">Selecionar tags...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selected.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px] gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(tag);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar tag..." />
            <CommandList>
              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => onToggle(tag)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(tag) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── FILTRO DE PÚBLICO ── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Selecionar Público
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <TagSelector
            label="Contém as tags"
            selected={includeTags}
            onToggle={(tag) => toggleTag(tag, includeTags, setIncludeTags)}
            open={includeOpen}
            onOpenChange={setIncludeOpen}
          />
          <TagSelector
            label="Não contém as tags"
            selected={excludeTags}
            onToggle={(tag) => toggleTag(tag, excludeTags, setExcludeTags)}
            open={excludeOpen}
            onOpenChange={setExcludeOpen}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={exactMatch}
            onCheckedChange={setExactMatch}
          />
          <Label className="text-xs">
            Correspondência exata: <span className="font-semibold">{exactMatch ? "E" : "OU"}</span>
          </Label>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {countLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Badge variant="outline" className="text-xs">
              {contactCount ?? "—"} contatos encontrados
            </Badge>
          )}
        </div>
      </div>

      {/* ── MENSAGEM ── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4" />
          Mensagem
        </h2>

        <Tabs value={messageMode} onValueChange={(v) => setMessageMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" className="text-xs">Template</TabsTrigger>
            <TabsTrigger value="livre" className="text-xs">Mensagem livre</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-3 mt-3">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <div className="rounded-lg bg-muted/50 border border-border p-3">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {selectedTemplate.content}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="livre" className="space-y-3 mt-3">
            <Textarea
              ref={textareaRef}
              placeholder="Digite a mensagem..."
              value={freeMessage}
              onChange={(e) => setFreeMessage(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-0.5 rounded-md bg-muted text-xs font-mono text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors border border-border"
                >
                  {v}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── BOTÃO DISPARAR ── */}
      <Button
        className="w-full gap-2"
        size="lg"
        disabled={!canDispatch || dispatching}
        onClick={() => setConfirmOpen(true)}
      >
        {dispatching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Disparar para {contactCount ?? 0} contatos
      </Button>

      {/* ── CONFIRMAÇÃO ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar disparo</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a enviar mensagem para{" "}
              <span className="font-semibold text-foreground">{contactCount}</span> contatos.
              Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDispatch}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
