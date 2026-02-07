import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Save, Upload, User, Trash2 } from "lucide-react";
import type { BotWithStats } from "@/types/bots";

interface BotProfileTabProps {
  bot: BotWithStats;
  onUpdated: () => void;
}

export function BotProfileTab({ bot, onUpdated }: BotProfileTabProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: bot.perfis?.nome || "",
    avatar_url: bot.perfis?.avatar_url || "",
    ativo: bot.ativo,
    is_result_author: bot.is_result_author,
    is_strategy_author: bot.is_strategy_author ?? false,
    is_sales_author: bot.is_sales_author ?? false,
    is_system_sales_author: bot.is_system_sales_author ?? false,
    can_create_posts: bot.can_create_posts,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (formData.avatar_url && formData.avatar_url.includes("bot-avatars")) {
        const oldPath = formData.avatar_url.split("/bot-avatars/").pop();
        if (oldPath) {
          await supabase.storage.from("bot-avatars").remove([oldPath]);
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${bot.perfil_id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("bot-avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("bot-avatars")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar atualizado");
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!formData.avatar_url) return;

    setUploading(true);
    try {
      // Delete from storage if it's our bucket
      if (formData.avatar_url.includes("bot-avatars")) {
        const path = formData.avatar_url.split("/bot-avatars/").pop();
        if (path) {
          await supabase.storage.from("bot-avatars").remove([path]);
        }
      }
      setFormData((prev) => ({ ...prev, avatar_url: "" }));
      toast.success("Avatar removido");
    } catch (err) {
      console.error("Erro ao remover avatar:", err);
      toast.error("Erro ao remover avatar");
    } finally {
      setUploading(false);
    }
  };

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
          ativo: formData.ativo,
          is_result_author: formData.is_result_author,
          is_strategy_author: formData.is_strategy_author,
          is_sales_author: formData.is_sales_author,
          is_system_sales_author: formData.is_system_sales_author,
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

        {/* Avatar Upload */}
        <div className="space-y-2">
          <Label>Foto do Avatar</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={formData.avatar_url} alt="Avatar" />
              <AvatarFallback>
                <User className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {formData.avatar_url ? "Trocar" : "Upload"}
                </Button>
                {formData.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WebP. Máx 2MB.
              </p>
            </div>
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
            <Label>Autor dos Resultados</Label>
            <p className="text-sm text-muted-foreground">Cria os posts de plantão de resultados oficiais</p>
          </div>
          <Switch
            checked={formData.is_result_author}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, is_result_author: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Autor de Estratégias</Label>
            <p className="text-sm text-muted-foreground">Publica posts ensinando como montar palpites</p>
          </div>
          <Switch
            checked={formData.is_strategy_author}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, is_strategy_author: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Autor de Vendas</Label>
            <p className="text-sm text-muted-foreground">Promove upsell após o resultado (depende do resultado)</p>
          </div>
          <Switch
            checked={formData.is_sales_author}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, is_sales_author: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Autor de Vendas do Sistema</Label>
            <p className="text-sm text-muted-foreground">Promove às 18h (independente do resultado)</p>
          </div>
          <Switch
            checked={formData.is_system_sales_author}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, is_system_sales_author: checked }))
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

      <Button type="submit" className="w-full gap-2" disabled={loading || uploading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Alterações
      </Button>
    </form>
  );
}
