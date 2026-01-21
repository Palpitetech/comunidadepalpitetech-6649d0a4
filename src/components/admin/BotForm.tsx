import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Bot } from "lucide-react";
import { AI_MODELS, PROMPT_TEMPLATES, type PromptTemplateId } from "@/types/bots";

interface BotFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

export function BotForm({ onSaved, onCancel }: BotFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplateId | "">("");
  const [formData, setFormData] = useState({
    nome: "",
    avatar_url: "",
    cargo: "",
    especialidade: "",
    badge_emoji: "🛡️",
    estilo_escrita: "profissional",
    system_prompt: "",
    ai_model: "google/gemini-3-flash-preview",
  });

  const handleTemplateChange = (templateId: PromptTemplateId) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData((prev) => ({
        ...prev,
        cargo: template.cargo,
        especialidade: template.especialidade,
        estilo_escrita: template.estilo,
        system_prompt: template.prompt,
      }));
    }
  };

  const generateEmail = (nome: string) => {
    const slug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);
    return `${slug}@guia.palpitetech.com`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.cargo || !formData.system_prompt) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const email = generateEmail(formData.nome);

      // 1. Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: `bot_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        options: {
          data: {
            nome: formData.nome,
            is_bot: true,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Usuário não criado");

      // 2. Atualizar perfil com is_bot e avatar
      const { error: perfilError } = await supabase
        .from("perfis")
        .update({
          is_bot: true,
          avatar_url: formData.avatar_url || null,
          nome: formData.nome,
          email,
        })
        .eq("id", authData.user.id);

      if (perfilError) {
        console.error("Erro ao atualizar perfil:", perfilError);
        // Continuar mesmo com erro, pois o trigger pode ter criado o perfil
      }

      // 3. Criar guide_personas
      const { error: guideError } = await supabase.from("guide_personas").insert({
        perfil_id: authData.user.id,
        cargo: formData.cargo,
        especialidade: formData.especialidade,
        badge_emoji: formData.badge_emoji,
        estilo_escrita: formData.estilo_escrita,
        system_prompt: formData.system_prompt,
        ai_model: formData.ai_model,
        ativo: true,
        can_create_posts: true,
        auto_reply_enabled: true,
      });

      if (guideError) throw guideError;

      toast.success("Bot criado com sucesso!");
      onSaved();
    } catch (err) {
      console.error("Erro ao criar bot:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao criar bot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Selector */}
      <div className="space-y-2">
        <Label>Usar Template Base</Label>
        <Select value={selectedTemplate} onValueChange={(v) => handleTemplateChange(v as PromptTemplateId)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um template (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {PROMPT_TEMPLATES.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.nome} - {template.especialidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Templates pré-configurados para diferentes tipos de bot
        </p>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Bot *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: Ana Silva"
          required
        />
        {formData.nome && (
          <p className="text-xs text-muted-foreground">
            Email: {generateEmail(formData.nome)}
          </p>
        )}
      </div>

      {/* Avatar */}
      <div className="space-y-2">
        <Label htmlFor="avatar_url">URL do Avatar</Label>
        <Input
          id="avatar_url"
          value={formData.avatar_url}
          onChange={(e) => setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))}
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Dica: use dicebear.com para gerar avatars
        </p>
      </div>

      {/* Cargo e Especialidade */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo *</Label>
          <Input
            id="cargo"
            value={formData.cargo}
            onChange={(e) => setFormData((prev) => ({ ...prev, cargo: e.target.value }))}
            placeholder="Ex: Analista de Dados"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="especialidade">Especialidade *</Label>
          <Input
            id="especialidade"
            value={formData.especialidade}
            onChange={(e) => setFormData((prev) => ({ ...prev, especialidade: e.target.value }))}
            placeholder="Ex: Estatísticas"
            required
          />
        </div>
      </div>

      {/* Badge e Estilo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="badge_emoji">Badge Emoji</Label>
          <Input
            id="badge_emoji"
            value={formData.badge_emoji}
            onChange={(e) => setFormData((prev) => ({ ...prev, badge_emoji: e.target.value }))}
            placeholder="🛡️"
            maxLength={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estilo_escrita">Estilo de Escrita</Label>
          <Select
            value={formData.estilo_escrita}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, estilo_escrita: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profissional">Profissional</SelectItem>
              <SelectItem value="acolhedor">Acolhedor</SelectItem>
              <SelectItem value="entusiasta">Entusiasta</SelectItem>
              <SelectItem value="didatico">Didático</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modelo IA */}
      <div className="space-y-2">
        <Label>Modelo de IA</Label>
        <Select
          value={formData.ai_model}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, ai_model: value }))}
        >
          <SelectTrigger>
            <SelectValue />
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

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="system_prompt">System Prompt *</Label>
        <Textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => setFormData((prev) => ({ ...prev, system_prompt: e.target.value }))}
          placeholder="Instruções para a personalidade e comportamento do bot..."
          rows={10}
          className="font-mono text-sm"
          required
        />
        <p className="text-xs text-muted-foreground">
          {formData.system_prompt.length} caracteres
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          Criar Bot
        </Button>
      </div>
    </form>
  );
}
