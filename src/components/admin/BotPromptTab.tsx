import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Target, FileText, MessageSquare, ShieldAlert, X, Plus } from "lucide-react";
import { AI_MODELS } from "@/types/bots";
import type { BotWithStats } from "@/types/bots";

interface BotPromptTabProps {
  bot: BotWithStats;
  onUpdated: () => void;
}

export function BotPromptTab({ bot, onUpdated }: BotPromptTabProps) {
  const [loading, setLoading] = useState(false);
  const [newBannedTopic, setNewBannedTopic] = useState("");
  const [newBannedWord, setNewBannedWord] = useState("");
  
  const [formData, setFormData] = useState({
    ai_model: bot.ai_model || "google/gemini-3-flash-preview",
    max_chars_post: bot.max_chars_post || 400,
    max_chars_comment: bot.max_chars_comment || 280,
    // Prompt segmentado
    prompt_objetivo: bot.prompt_objetivo || "",
    prompt_estrutura_post: bot.prompt_estrutura_post || "",
    prompt_modelos_mensagem: bot.prompt_modelos_mensagem || "",
    // Segurança
    safety_enabled: bot.safety_enabled ?? true,
    safety_block_pii: bot.safety_block_pii ?? true,
    safety_banned_topics: bot.safety_banned_topics || [],
    safety_banned_words: bot.safety_banned_words || [],
  });

  const handleAddBannedTopic = () => {
    if (newBannedTopic.trim() && !formData.safety_banned_topics.includes(newBannedTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        safety_banned_topics: [...prev.safety_banned_topics, newBannedTopic.trim()]
      }));
      setNewBannedTopic("");
    }
  };

  const handleRemoveBannedTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      safety_banned_topics: prev.safety_banned_topics.filter(t => t !== topic)
    }));
  };

  const handleAddBannedWord = () => {
    if (newBannedWord.trim() && !formData.safety_banned_words.includes(newBannedWord.trim())) {
      setFormData(prev => ({
        ...prev,
        safety_banned_words: [...prev.safety_banned_words, newBannedWord.trim()]
      }));
      setNewBannedWord("");
    }
  };

  const handleRemoveBannedWord = (word: string) => {
    setFormData(prev => ({
      ...prev,
      safety_banned_words: prev.safety_banned_words.filter(w => w !== word)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Montar o system_prompt combinado para compatibilidade
      const combinedPrompt = [
        formData.prompt_objetivo && `## OBJETIVO\n${formData.prompt_objetivo}`,
        formData.prompt_estrutura_post && `## ESTRUTURA DE POSTAGEM\n${formData.prompt_estrutura_post}`,
        formData.prompt_modelos_mensagem && `## MODELOS DE MENSAGEM\n${formData.prompt_modelos_mensagem}`,
      ].filter(Boolean).join("\n\n");

      const { error } = await supabase
        .from("guide_personas")
        .update({
          ai_model: formData.ai_model,
          max_chars_post: formData.max_chars_post,
          max_chars_comment: formData.max_chars_comment,
          system_prompt: combinedPrompt || bot.system_prompt,
          prompt_objetivo: formData.prompt_objetivo,
          prompt_estrutura_post: formData.prompt_estrutura_post,
          prompt_modelos_mensagem: formData.prompt_modelos_mensagem,
          safety_enabled: formData.safety_enabled,
          safety_block_pii: formData.safety_block_pii,
          safety_banned_topics: formData.safety_banned_topics,
          safety_banned_words: formData.safety_banned_words,
        })
        .eq("id", bot.id);

      if (error) throw error;

      toast.success("Configurações salvas com sucesso");
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
      {/* Modelo e Limites */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurações de IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Orientações Segmentadas */}
      <Accordion type="multiple" defaultValue={["objetivo"]} className="space-y-2">
        {/* Principal Objetivo */}
        <AccordionItem value="objetivo" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Principal Objetivo</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <Textarea
              value={formData.prompt_objetivo}
              onChange={(e) => setFormData((prev) => ({ ...prev, prompt_objetivo: e.target.value }))}
              placeholder="Qual é a missão principal deste bot? Ex: Educar usuários sobre padrões estatísticos da Lotofácil de forma clara e acessível..."
              rows={4}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.prompt_objetivo.length} caracteres
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Estrutura de Postagem */}
        <AccordionItem value="estrutura" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium">Estrutura de Postagem</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <Textarea
              value={formData.prompt_estrutura_post}
              onChange={(e) => setFormData((prev) => ({ ...prev, prompt_estrutura_post: e.target.value }))}
              placeholder="Como as postagens devem ser estruturadas? Ex: Sempre iniciar com um emoji, seguido de título chamativo. Incluir dados estatísticos quando relevante..."
              rows={4}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.prompt_estrutura_post.length} caracteres
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Modelos de Mensagem */}
        <AccordionItem value="modelos" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-medium">Modelos de Mensagem</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <Textarea
              value={formData.prompt_modelos_mensagem}
              onChange={(e) => setFormData((prev) => ({ ...prev, prompt_modelos_mensagem: e.target.value }))}
              placeholder="Exemplos de mensagens que o bot deve seguir. Ex: Para saudação usar 'Olá, apostador!' Para encerramento usar 'Boa sorte no próximo concurso!'"
              rows={4}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.prompt_modelos_mensagem.length} caracteres
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Itens Proibidos */}
        <AccordionItem value="proibidos" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="font-medium">Itens Proibidos</span>
              {(formData.safety_banned_topics.length > 0 || formData.safety_banned_words.length > 0) && (
                <Badge variant="secondary" className="ml-2">
                  {formData.safety_banned_topics.length + formData.safety_banned_words.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-4">
            {/* Temas Proibidos */}
            <div className="space-y-2">
              <Label className="text-sm">Temas Proibidos</Label>
              <div className="flex gap-2">
                <Input
                  value={newBannedTopic}
                  onChange={(e) => setNewBannedTopic(e.target.value)}
                  placeholder="Ex: apostas ilegais, pirâmides..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBannedTopic())}
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddBannedTopic}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.safety_banned_topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.safety_banned_topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="gap-1">
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveBannedTopic(topic)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Palavras Proibidas */}
            <div className="space-y-2">
              <Label className="text-sm">Palavras Proibidas</Label>
              <div className="flex gap-2">
                <Input
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  placeholder="Ex: garantido, certeza..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBannedWord())}
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddBannedWord}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.safety_banned_words.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.safety_banned_words.map((word) => (
                    <Badge key={word} variant="secondary" className="gap-1">
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveBannedWord(word)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Botão Salvar */}
      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Configurações
      </Button>
    </form>
  );
}
