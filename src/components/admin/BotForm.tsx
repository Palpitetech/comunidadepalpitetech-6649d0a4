import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Bot, Sparkles } from "lucide-react";

const DEFAULT_SYSTEM_PROMPT = `Você é um especialista em Lotofácil da comunidade Palpite Tech.

Diretrizes:
- Seja prestativo e amigável
- Compartilhe conhecimento de forma clara
- Reconheça que loteria envolve sorte
- NUNCA mencione que é IA, bot ou modelo de linguagem`;

interface BotFormProps {
  onSaved: (botId: string) => void;
  onCancel: () => void;
}

export function BotForm({ onSaved, onCancel }: BotFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    avatar_url: "",
    badge_emoji: "🛡️",
  });

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

    if (!formData.nome.trim()) {
      toast.error("Informe o nome do bot");
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
      }

      // 3. Criar guide_personas com defaults
      const { data: guideData, error: guideError } = await supabase
        .from("guide_personas")
        .insert({
          perfil_id: authData.user.id,
          cargo: "Especialista",
          especialidade: "Lotofácil",
          badge_emoji: formData.badge_emoji,
          estilo_escrita: "profissional",
          system_prompt: DEFAULT_SYSTEM_PROMPT,
          ai_model: "google/gemini-3-flash-preview",
          ativo: false,
          can_create_posts: false,
          auto_reply_enabled: false,
          // Chat settings
          chat_enabled: false,
          chat_tags: [],
          chat_priority: 0,
          // Safety settings
          safety_enabled: true,
          safety_block_pii: false,
          safety_banned_topics: [],
          safety_banned_words: [],
          safety_style: "strict",
          // Comments
          can_comment_on_posts: true,
          max_comments_per_post: 10,
          // Bot interactions
          can_respond_to_bot_posts: false,
          can_reply_own_post_comments: false,
          is_strategy_author: false,
          is_free_tips_author: false,
          // CTA override
          cta_override_enabled: false,
          cta_override_buttons: {},
        })
        .select("id")
        .single();

      if (guideError) throw guideError;

      toast.success("Bot criado! Configure-o agora.");
      onSaved(guideData.id);
    } catch (err) {
      console.error("Erro ao criar bot:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao criar bot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Criação Rápida</p>
            <p className="text-muted-foreground">
              Crie o bot com as informações básicas. Você poderá configurar o prompt, 
              automações e permissões no painel de edição que abrirá em seguida.
            </p>
          </div>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Bot *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: Ana Silva"
          autoFocus
        />
        {formData.nome && (
          <p className="text-xs text-muted-foreground">
            Email: {generateEmail(formData.nome)}
          </p>
        )}
      </div>

      {/* Avatar */}
      <div className="space-y-2">
        <Label htmlFor="avatar_url">URL do Avatar (opcional)</Label>
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

      {/* Badge Emoji */}
      <div className="space-y-2">
        <Label htmlFor="badge_emoji">Badge Emoji</Label>
        <Input
          id="badge_emoji"
          value={formData.badge_emoji}
          onChange={(e) => setFormData((prev) => ({ ...prev, badge_emoji: e.target.value }))}
          placeholder="🛡️"
          maxLength={4}
          className="w-24"
        />
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
          Criar e Configurar
        </Button>
      </div>
    </form>
  );
}
