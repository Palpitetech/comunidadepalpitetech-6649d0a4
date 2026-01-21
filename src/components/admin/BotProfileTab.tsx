import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import type { BotWithStats } from "@/types/bots";

interface BotProfileTabProps {
  bot: BotWithStats;
  onUpdated: () => void;
}

export function BotProfileTab({ bot, onUpdated }: BotProfileTabProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: bot.perfis?.nome || "",
    avatar_url: bot.perfis?.avatar_url || "",
    cargo: bot.cargo,
    especialidade: bot.especialidade,
    badge_emoji: bot.badge_emoji,
    estilo_escrita: bot.estilo_escrita,
    ativo: bot.ativo,
    is_roundtable_author: bot.is_roundtable_author,
    can_create_posts: bot.can_create_posts,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar perfil
      const { error: perfilError } = await supabase
        .from("perfis")
        .update({
          nome: formData.nome,
          avatar_url: formData.avatar_url || null,
        })
        .eq("id", bot.perfil_id);

      if (perfilError) throw perfilError;

      // Atualizar guide_personas
      const { error: guideError } = await supabase
        .from("guide_personas")
        .update({
          cargo: formData.cargo,
          especialidade: formData.especialidade,
          badge_emoji: formData.badge_emoji,
          estilo_escrita: formData.estilo_escrita,
          ativo: formData.ativo,
          is_roundtable_author: formData.is_roundtable_author,
          can_create_posts: formData.can_create_posts,
        })
        .eq("id", bot.id);

      if (guideError) throw guideError;

      toast.success("Perfil atualizado com sucesso");
      onUpdated();
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Bot</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
            placeholder="Nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar_url">URL do Avatar</Label>
          <Input
            id="avatar_url"
            value={formData.avatar_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={formData.cargo}
              onChange={(e) => setFormData((prev) => ({ ...prev, cargo: e.target.value }))}
              placeholder="Ex: Analista de Dados"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input
              id="especialidade"
              value={formData.especialidade}
              onChange={(e) => setFormData((prev) => ({ ...prev, especialidade: e.target.value }))}
              placeholder="Ex: Estatísticas"
            />
          </div>
        </div>

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
            <Input
              id="estilo_escrita"
              value={formData.estilo_escrita}
              onChange={(e) => setFormData((prev) => ({ ...prev, estilo_escrita: e.target.value }))}
              placeholder="profissional, acolhedor..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <Label>Bot Ativo</Label>
            <p className="text-sm text-muted-foreground">O bot participa da comunidade</p>
          </div>
          <Switch
            checked={formData.ativo}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Autor da Mesa Redonda</Label>
            <p className="text-sm text-muted-foreground">Cria os posts principais do roundtable</p>
          </div>
          <Switch
            checked={formData.is_roundtable_author}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, is_roundtable_author: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Pode Criar Posts</Label>
            <p className="text-sm text-muted-foreground">Bot pode publicar posts próprios</p>
          </div>
          <Switch
            checked={formData.can_create_posts}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, can_create_posts: checked }))
            }
          />
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Alterações
      </Button>
    </form>
  );
}
