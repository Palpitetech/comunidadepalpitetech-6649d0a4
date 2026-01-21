import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, Eye, Users } from "lucide-react";
import type { BotWithStats } from "@/types/bots";

interface BotPostTriggerProps {
  bots: BotWithStats[];
  onSuccess: () => void;
}

type PostType = "pre_sorteio" | "pos_sorteio" | "geral" | "roundtable";

export function BotPostTrigger({ bots, onSuccess }: BotPostTriggerProps) {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ titulo: string; conteudo: string } | null>(null);
  
  const [selectedBot, setSelectedBot] = useState<string>("roundtable");
  const [postType, setPostType] = useState<PostType>("geral");
  const [contextoExtra, setContextoExtra] = useState("");

  const activeBots = bots.filter((b) => b.ativo && b.can_create_posts);

  const handlePreview = async () => {
    setPreviewing(true);
    setPreview(null);

    try {
      // Simular preview (em produção, chamaria edge function com dry_run=true)
      await new Promise((r) => setTimeout(r, 1500));

      const botName = selectedBot === "roundtable" 
        ? "Mesa Redonda (Augusto)" 
        : activeBots.find((b) => b.id === selectedBot)?.perfis?.nome || "Bot";

      setPreview({
        titulo: `[Preview] Análise do dia - ${postType}`,
        conteudo: `Este é um preview de como o post de ${botName} ficaria. ${contextoExtra ? `Contexto adicional: ${contextoExtra}` : ""}`,
      });
    } catch (err) {
      toast.error("Erro ao gerar preview");
    } finally {
      setPreviewing(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);

    try {
      if (selectedBot === "roundtable") {
        // Chamar edge function do roundtable
        const { data, error } = await supabase.functions.invoke("generate-roundtable-post", {
          body: { tipo_post: postType, contexto_extra: contextoExtra },
        });

        if (error) throw error;

        toast.success(`Post da mesa redonda criado! ID: ${data?.post_id}`);
      } else {
        // Chamar edge function de post individual
        const { data, error } = await supabase.functions.invoke("generate-bot-post", {
          body: {
            guide_id: selectedBot,
            tipo_post: postType,
            contexto_extra: contextoExtra,
          },
        });

        if (error) throw error;

        toast.success(`Post do bot criado! ID: ${data?.post_id}`);
      }

      setPreview(null);
      setContextoExtra("");
      onSuccess();
    } catch (err) {
      console.error("Erro ao publicar:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao publicar post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Seleção de Bot */}
      <div className="space-y-2">
        <Label>Autor do Post</Label>
        <Select value={selectedBot} onValueChange={setSelectedBot}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roundtable">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Mesa Redonda (Augusto + Comentários)
              </div>
            </SelectItem>
            {activeBots.map((bot) => (
              <SelectItem key={bot.id} value={bot.id}>
                <div className="flex items-center gap-2">
                  {bot.badge_emoji} {bot.perfis?.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {selectedBot === "roundtable"
            ? "Augusto cria o post, outros bots comentam automaticamente"
            : "Post individual do bot selecionado"}
        </p>
      </div>

      {/* Tipo de Post */}
      <div className="space-y-2">
        <Label>Tipo de Post</Label>
        <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pre_sorteio">Pré-Sorteio (antes do jogo)</SelectItem>
            <SelectItem value="pos_sorteio">Pós-Sorteio (análise do resultado)</SelectItem>
            <SelectItem value="geral">Análise Geral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contexto Extra */}
      <div className="space-y-2">
        <Label htmlFor="contexto">Contexto Adicional (opcional)</Label>
        <Textarea
          id="contexto"
          value={contextoExtra}
          onChange={(e) => setContextoExtra(e.target.value)}
          placeholder="Informações extras para a IA considerar ao gerar o post..."
          rows={3}
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">{preview.titulo}</p>
          <p className="text-sm text-muted-foreground">{preview.conteudo}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          disabled={previewing || loading}
          className="gap-2"
        >
          {previewing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Preview
        </Button>

        <Button
          type="button"
          onClick={handlePublish}
          disabled={loading}
          className="flex-1 gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Publicar Agora
        </Button>
      </div>
    </div>
  );
}
