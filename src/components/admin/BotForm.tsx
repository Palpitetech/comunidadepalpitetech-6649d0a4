import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Bot, Sparkles, Upload, User } from "lucide-react";

interface BotFormProps {
  onSaved: (botId: string) => void;
  onCancel: () => void;
}

export function BotForm({ onSaved, onCancel }: BotFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    avatar_url: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateEmail = (nome: string) => {
    const slug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);
    return `${slug}@guia.palpitetech.com`;
  };

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
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("bot-avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("bot-avatars")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Avatar carregado com sucesso");
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
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

      {/* Avatar Upload */}
      <div className="space-y-2">
        <Label>Foto do Avatar (opcional)</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={formData.avatar_url} alt="Avatar preview" />
            <AvatarFallback>
              <User className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Carregando..." : "Escolher Foto"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou WebP. Máx 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gap-2" disabled={loading || uploading}>
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
