import { RefObject } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import type { TemplateOption } from "@/hooks/useDisparoManual";

interface DisparoMessageComposerProps {
  messageMode: "template" | "livre";
  onModeChange: (mode: "template" | "livre") => void;
  templates: TemplateOption[];
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  selectedTemplate: TemplateOption | undefined;
  freeMessage: string;
  onFreeMessageChange: (msg: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  onInsertVariable: (variable: string) => void;
  variables: string[];
}

export function DisparoMessageComposer({
  messageMode,
  onModeChange,
  templates,
  selectedTemplateId,
  onTemplateChange,
  selectedTemplate,
  freeMessage,
  onFreeMessageChange,
  textareaRef,
  onInsertVariable,
  variables,
}: DisparoMessageComposerProps) {
  // Preview message with sample data
  const previewMessage = (() => {
    const content = messageMode === "template" ? selectedTemplate?.content || "" : freeMessage;
    if (!content) return null;

    return content
      .replace(/\{\{nome\}\}/g, "João Silva")
      .replace(/\{\{telefone\}\}/g, "11999999999")
      .replace(/\{\{email\}\}/g, "joao@email.com")
      .replace(/\{\{produto\}\}/g, "Plano Mensal")
      .replace(/\{\{plano_nome\}\}/g, "Plano Mensal");
  })();

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <Send className="h-4 w-4" />
        Mensagem
      </h2>

      <Tabs value={messageMode} onValueChange={(v) => onModeChange(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template" className="text-xs">Template</TabsTrigger>
          <TabsTrigger value="livre" className="text-xs">Mensagem livre</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-3 mt-3">
          <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
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
            onChange={(e) => onFreeMessageChange(e.target.value)}
            rows={5}
            maxLength={2000}
          />
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onInsertVariable(v)}
                className="px-2 py-0.5 rounded-md bg-muted text-xs font-mono text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors border border-border"
              >
                {v}
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Message preview */}
      {previewMessage && (
        <div className="border-t border-border pt-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Preview (dados fictícios)</Label>
          <div className="rounded-lg bg-green-950/30 border border-green-900/30 p-3">
            <p className="text-xs text-green-200 whitespace-pre-wrap font-mono">
              {previewMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
