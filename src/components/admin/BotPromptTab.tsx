import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save, Sparkles, Copy } from "lucide-react";
import { AI_MODELS, PROMPT_TEMPLATES } from "@/types/bots";
import type { BotWithStats } from "@/types/bots";

interface BotPromptTabProps {
  bot: BotWithStats;
  onUpdated: () => void;
}

export function BotPromptTab({ bot, onUpdated }: BotPromptTabProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    system_prompt: bot.system_prompt,
    ai_model: bot.ai_model,
    max_chars_post: bot.max_chars_post,
    max_chars_comment: bot.max_chars_comment,
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({ ...prev, system_prompt: template.prompt }));
    }
  };

  const handleTestPrompt = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simular chamada de teste (em produção, chamaria edge function)
      await new Promise((r) => setTimeout(r, 1500));
      setTestResult(
        `[Preview] Olá! Como ${bot.perfis?.nome || "bot"}, estou aqui para ajudar com análises da Lotofácil. ${formData.system_prompt.substring(0, 100)}...`
      );
    } catch (err) {
      toast.error("Erro ao testar prompt");
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("guide_personas")
        .update({
          system_prompt: formData.system_prompt,
          ai_model: formData.ai_model,
          max_chars_post: formData.max_chars_post,
          max_chars_comment: formData.max_chars_comment,
        })
        .eq("id", bot.id);

      if (error) throw error;

      toast.success("Configurações de IA atualizadas");
      onUpdated();
    } catch (err) {
      console.error("Erro ao atualizar prompt:", err);
      toast.error("Erro ao atualizar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Modelo de IA</Label>
        <Select
          value={formData.ai_model}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, ai_model: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o modelo" />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Template Base</Label>
          <span className="text-xs text-muted-foreground">Copiar para o prompt</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTemplateSelect(template.id)}
              className="gap-1"
            >
              <Copy className="h-3 w-3" />
              {template.nome}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="system_prompt">System Prompt</Label>
        <Textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => setFormData((prev) => ({ ...prev, system_prompt: e.target.value }))}
          placeholder="Instruções para a IA..."
          rows={12}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {formData.system_prompt.length} caracteres
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_chars_post">Max. Caracteres (Post)</Label>
          <Input
            id="max_chars_post"
            type="number"
            value={formData.max_chars_post}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, max_chars_post: parseInt(e.target.value) || 400 }))
            }
            min={100}
            max={2000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_chars_comment">Max. Caracteres (Comentário)</Label>
          <Input
            id="max_chars_comment"
            type="number"
            value={formData.max_chars_comment}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                max_chars_comment: parseInt(e.target.value) || 280,
              }))
            }
            min={50}
            max={1000}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestPrompt}
          disabled={testing}
          className="gap-2"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Testar Prompt
        </Button>

        <Button type="submit" className="flex-1 gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>

      {testResult && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Preview do Prompt:</p>
          <p className="text-sm text-muted-foreground">{testResult}</p>
        </div>
      )}
    </form>
  );
}
