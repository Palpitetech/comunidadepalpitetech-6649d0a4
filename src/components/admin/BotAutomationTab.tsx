import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Loader2, Save, Plus, X, FileText, Clock, Calendar, ChevronDown, Bot } from "lucide-react";
import { DIAS_SEMANA } from "@/types/bots";
import type { BotWithStats, BotSchedule } from "@/types/bots";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WeeklyBotCalendar } from "./WeeklyBotCalendar";

interface BotAutomationTabProps {
  bot: BotWithStats;
  onUpdated: () => void;
}

interface RecentPost {
  id: string;
  titulo: string | null;
  created_at: string;
}

export function BotAutomationTab({ bot, onUpdated }: BotAutomationTabProps) {
  const [loading, setLoading] = useState(false);
  const [autoReply, setAutoReply] = useState(bot.auto_reply_enabled);
  const [canRespondToBotPosts, setCanRespondToBotPosts] = useState(bot.can_respond_to_bot_posts ?? false);
  const [maxCommentsPerPost, setMaxCommentsPerPost] = useState(bot.max_comments_per_post ?? 3);
  const [frequencia, setFrequencia] = useState(bot.frequencia_posts);
  const [schedule, setSchedule] = useState<BotSchedule>(bot.post_schedule);
  const [chatEnabled, setChatEnabled] = useState((bot as any).chat_enabled ?? true);
  const [chatTags, setChatTags] = useState<string[]>((bot as any).chat_tags ?? []);
  const [newChatTag, setNewChatTag] = useState("");
  const [newHorario, setNewHorario] = useState("");
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const canConfigureSchedule = bot.can_create_posts;

  useEffect(() => {
    async function fetchRecentPosts() {
      setLoadingPosts(true);
      try {
        const { data, error } = await supabase
          .from("postagens")
          .select("id, titulo, created_at")
          .eq("user_id", bot.perfil_id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentPosts(data || []);
      } catch (err) {
        console.error("Erro ao buscar posts recentes:", err);
      } finally {
        setLoadingPosts(false);
      }
    }

    fetchRecentPosts();
  }, [bot.perfil_id]);

  const toggleDia = (dia: number) => {
    setSchedule((prev) => ({
      ...prev,
      dias: prev.dias.includes(dia)
        ? prev.dias.filter((d) => d !== dia)
        : [...prev.dias, dia].sort((a, b) => a - b),
    }));
  };

  const addHorario = () => {
    if (!newHorario || schedule.horarios.includes(newHorario)) return;

    setSchedule((prev) => ({
      ...prev,
      horarios: [...prev.horarios, newHorario].sort(),
    }));
    setNewHorario("");
  };

  const removeHorario = (horario: string) => {
    setSchedule((prev) => ({
      ...prev,
      horarios: prev.horarios.filter((h) => h !== horario),
    }));
  };

  const addChatTag = () => {
    const next = newChatTag.trim();
    if (!next) return;
    if (chatTags.includes(next)) return;
    setChatTags((prev) => [...prev, next].sort());
    setNewChatTag("");
  };

  const removeChatTag = (tag: string) => {
    setChatTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("guide_personas")
        .update({
          auto_reply_enabled: autoReply,
          can_respond_to_bot_posts: canRespondToBotPosts,
          max_comments_per_post: maxCommentsPerPost,
          frequencia_posts: frequencia,
          post_schedule: JSON.parse(JSON.stringify(schedule)),
          chat_enabled: chatEnabled,
          chat_tags: chatTags,
        })
        .eq("id", bot.id);

      if (error) throw error;

      toast.success("Automação atualizada com sucesso");
      onUpdated();
    } catch (err) {
      console.error("Erro ao atualizar automação:", err);
      toast.error("Erro ao atualizar automação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-resposta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base">Responder Comentários de Clientes</Label>
              <p className="text-sm text-muted-foreground">
                Bot responde automaticamente a comentários de <strong>usuários humanos</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Comentários de outros bots são ignorados (evita loops)
              </p>
            </div>
            <Switch checked={autoReply} onCheckedChange={setAutoReply} />
          </div>
          
          {autoReply && (
            <div className="ml-4 space-y-4">
              {/* Máximo de respostas */}
              <div className="p-3 bg-muted/30 rounded-lg border-l-2 border-primary/30">
                <Label htmlFor="maxComments">Máximo de Respostas por Post</Label>
                <Input
                  id="maxComments"
                  type="number"
                  value={maxCommentsPerPost}
                  onChange={(e) => setMaxCommentsPerPost(parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                  className="w-32 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Limite de comentários automáticos por postagem
                </p>
              </div>
              
              {/* Nova opção: Responder a posts de outros bots */}
              <div className="p-3 bg-muted/30 rounded-lg border-l-2 border-amber-500/30">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="canRespondToBotPosts"
                    checked={canRespondToBotPosts}
                    onCheckedChange={(checked) => setCanRespondToBotPosts(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="canRespondToBotPosts" className="flex items-center gap-2 cursor-pointer">
                      <Bot className="h-4 w-4 text-amber-600" />
                      Também Responder a Posts de Outros Agentes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que este bot comente em publicações feitas por outros bots da equipe (ex: posts de resultado)
                    </p>
                    <p className="text-xs text-amber-600">
                      ⚠️ Limitado a {maxCommentsPerPost} resposta(s) por post
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Seção de Agenda de Posts */}
        <div className={`space-y-4 ${!canConfigureSchedule ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">📅 Agenda de Posts Automáticos</Label>
            {!canConfigureSchedule && (
              <span className="text-xs text-destructive">
                ⚠️ Ative "Pode Criar Posts" no perfil
              </span>
            )}
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label htmlFor="frequencia">Frequência de Posts (por dia)</Label>
            <Input
              id="frequencia"
              type="number"
              value={frequencia}
              onChange={(e) => setFrequencia(parseInt(e.target.value) || 1)}
              min={0}
              max={10}
              className="w-32"
              disabled={!canConfigureSchedule}
            />
            <p className="text-xs text-muted-foreground">
              Máximo de posts automáticos por dia
            </p>
          </div>

          {/* Dias da Semana */}
          <div className="space-y-3">
            <Label>Dias de Postagem</Label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => (
                <Button
                  key={dia.value}
                  type="button"
                  variant={schedule.dias.includes(dia.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDia(dia.value)}
                  disabled={!canConfigureSchedule}
                >
                  {dia.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {schedule.dias.length === 0
                ? "Nenhum dia selecionado"
                : `Selecionados: ${schedule.dias.map((d) => DIAS_SEMANA[d].label).join(", ")}`}
            </p>
          </div>

          {/* Horários */}
          <div className="space-y-3">
            <Label>Horários de Postagem</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={newHorario}
                onChange={(e) => setNewHorario(e.target.value)}
                className="w-32"
                disabled={!canConfigureSchedule}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={addHorario}
                disabled={!canConfigureSchedule}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {schedule.horarios.map((horario) => (
                <Badge key={horario} variant="secondary" className="gap-1 pr-1">
                  {horario}
                  <button
                    type="button"
                    onClick={() => removeHorario(horario)}
                    className="ml-1 hover:text-destructive"
                    disabled={!canConfigureSchedule}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {schedule.horarios.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhum horário configurado</span>
              )}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Resumo da Automação:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Auto-resposta: <strong>{autoReply ? "Ativada" : "Desativada"}</strong>
            </li>
            <li>
              • Máximo de posts: <strong>{frequencia}/dia</strong>
            </li>
            <li>
              • Dias ativos: <strong>{schedule.dias.length || "Nenhum"}</strong>
            </li>
            <li>
              • Horários: <strong>{schedule.horarios.length || "Nenhum"}</strong>
            </li>
            <li>
              • Chat: <strong>{chatEnabled ? "Ativo" : "Inativo"}</strong>
            </li>
            <li>
              • Tags do chat: <strong>{chatTags.length || "Nenhuma"}</strong>
            </li>
          </ul>
        </div>

        {/* Chat */}
        <div className="space-y-3">
          <Label className="text-base">Chat (Roteamento por Tags)</Label>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base">Ativo no Chat</Label>
              <p className="text-sm text-muted-foreground">
                Permite que este bot responda conversas do Chat
              </p>
            </div>
            <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newChatTag}
                onChange={(e) => setNewChatTag(e.target.value)}
                placeholder="Ex.: chat_estatisticas"
              />
              <Button type="button" variant="outline" size="icon" onClick={addChatTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {chatTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeChatTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {chatTags.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhuma tag configurada</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Use tags para direcionar temas (ex.: <code className="bg-muted px-1 py-0.5 rounded">chat_estatisticas</code>, <code className="bg-muted px-1 py-0.5 rounded">chat_boloes</code>, <code className="bg-muted px-1 py-0.5 rounded">chat_upsell</code>).
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Automação
        </Button>
      </form>

      <Separator />

      {/* Calendário Semanal de Todos os Bots */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between gap-2 h-auto py-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-medium">Calendário Semanal (Todos os Bots)</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="border rounded-lg p-4 bg-muted/20">
            <WeeklyBotCalendar />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Log de Posts Recentes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base">Últimos Posts Gerados</Label>
        </div>

        {loadingPosts ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recentPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum post gerado ainda
          </p>
        ) : (
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {post.titulo || "Sem título"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <a
                  href={`/comunidade/post/${post.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline shrink-0 ml-2"
                >
                  Ver post
                </a>
              </div>
            ))}
          </div>
        )}

        {bot.ultimo_post_em && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Último post automático:{" "}
            {formatDistanceToNow(new Date(bot.ultimo_post_em), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
