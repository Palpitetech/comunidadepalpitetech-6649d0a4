import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Bot, Sparkles } from "lucide-react";

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
      // Chamar edge function que usa Service Role (não afeta sessão)
      const { data, error } = await supabase.functions.invoke("create-bot", {
        body: {
          nome: formData.nome.trim(),
          avatar_url: formData.avatar_url || null,
          badge_emoji: formData.badge_emoji || "🛡️",
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao criar bot");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Bot criado! Configure-o agora.");
      onSaved(data.bot_id);
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
