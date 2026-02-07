import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Send, Eye, Users, Megaphone, AlertCircle } from "lucide-react";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";
import type { BotWithStats } from "@/types/bots";

interface BotPostTriggerProps {
  bots: BotWithStats[];
  onSuccess: () => void;
}

type PostType = "pre_sorteio" | "pos_sorteio" | "geral" | "resultado_oficial";

interface UltimoResultado {
  concurso_id: number;
  dezenas: number[];
  data_sorteio: string;
  qtd_pares: number;
  qtd_impares: number;
  qtd_moldura: number;
  qtd_primos: number;
  qtd_repetidas: number;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  acumulou: boolean;
}

export function BotPostTrigger({ bots, onSuccess }: BotPostTriggerProps) {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ titulo: string; conteudo: string } | null>(null);
  
  const [selectedBot, setSelectedBot] = useState<string>("result_author");
  const [postType, setPostType] = useState<PostType>("geral");
  const [contextoExtra, setContextoExtra] = useState("");
  
  // Estado para preview do resultado oficial
  const [ultimoResultado, setUltimoResultado] = useState<UltimoResultado | null>(null);
  const [loadingResultado, setLoadingResultado] = useState(false);

  const activeBots = bots.filter((b) => b.ativo && b.can_create_posts);

  // Buscar último resultado quando selecionar resultado_oficial
  useEffect(() => {
    if (postType === "resultado_oficial") {
      fetchUltimoResultado();
    }
  }, [postType]);

  const fetchUltimoResultado = async () => {
    setLoadingResultado(true);
    try {
      const { data, error } = await supabase
        .from("resultados")
        .select("concurso_id, dezenas, data_sorteio, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo, acumulou")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setUltimoResultado(data as UltimoResultado);
    } catch (err) {
      console.error("Erro ao buscar último resultado:", err);
      toast.error("Erro ao buscar último resultado");
    } finally {
      setLoadingResultado(false);
    }
  };

  const formatarData = (dataStr: string) => {
    return new Date(dataStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setPreview(null);

    try {
      // Simular preview (em produção, chamaria edge function com dry_run=true)
      await new Promise((r) => setTimeout(r, 1500));

      const botName = selectedBot === "result_author" 
        ? "Autor dos Resultados (Augusto)" 
        : activeBots.find((b) => b.id === selectedBot)?.perfis?.nome || "Bot";

      if (postType === "resultado_oficial" && ultimoResultado) {
        setPreview({
          titulo: `🚨 SAIU! Resultado Concurso ${ultimoResultado.concurso_id}`,
          conteudo: `Preview do plantão com as dezenas: ${ultimoResultado.dezenas.map(d => d.toString().padStart(2, "0")).join(" - ")}. ${contextoExtra ? `Contexto: ${contextoExtra}` : ""}`,
        });
      } else {
        setPreview({
          titulo: `[Preview] Análise do dia - ${postType}`,
          conteudo: `Este é um preview de como o post de ${botName} ficaria. ${contextoExtra ? `Contexto adicional: ${contextoExtra}` : ""}`,
        });
      }
    } catch (err) {
      toast.error("Erro ao gerar preview");
    } finally {
      setPreviewing(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);

    try {
      if (selectedBot === "result_author") {
        // Chamar edge function de resultado (generate-roundtable-post)
        const { data, error } = await supabase.functions.invoke("generate-roundtable-post", {
          body: { tipo_post: postType, contexto_extra: contextoExtra },
        });

        if (error) throw error;

        if (postType === "resultado_oficial") {
          toast.success(`Plantão publicado! Concurso ${data?.concurso_referencia || ultimoResultado?.concurso_id}`);
        } else {
          toast.success(`Post de resultados criado! ID: ${data?.post_id}`);
        }
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
            <SelectItem value="result_author">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Autor dos Resultados (Augusto + Comentários)
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
          {selectedBot === "result_author"
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
            <SelectItem value="resultado_oficial">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-destructive" />
                📢 Resultado Oficial (Plantão)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {postType === "resultado_oficial" && (
          <p className="text-xs text-destructive">
            ⚡ Modo Plantão: Anúncio especial do resultado com formato jornalístico
          </p>
        )}
      </div>

      {/* Preview do Resultado Oficial */}
      {postType === "resultado_oficial" && (
        <div className="space-y-2">
          {loadingResultado ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ultimoResultado ? (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <Megaphone className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">
                Concurso {ultimoResultado.concurso_id}
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                  Você vai anunciar o resultado de {formatarData(ultimoResultado.data_sorteio)}
                  {ultimoResultado.acumulou && <span className="ml-2 font-semibold">💰 ACUMULOU!</span>}
                </p>
                
                {/* Dezenas */}
                <div className="flex flex-wrap gap-1">
                  {ultimoResultado.dezenas.map((d) => (
                    <DezenaCirculoMini key={d} dezena={d} />
                  ))}
                </div>
                
                {/* Indicadores */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Pares: {ultimoResultado.qtd_pares}</span>
                  <span>•</span>
                  <span>Ímpares: {ultimoResultado.qtd_impares}</span>
                  <span>•</span>
                  <span>Moldura: {ultimoResultado.qtd_moldura}</span>
                  <span>•</span>
                  <span>Primos: {ultimoResultado.qtd_primos}</span>
                  <span>•</span>
                  <span>Repetidas: {ultimoResultado.qtd_repetidas}</span>
                </div>

                {/* Status do Ciclo */}
                {ultimoResultado.ciclo_numero && (
                  <div className="text-xs">
                    <span className="font-medium">Ciclo {ultimoResultado.ciclo_numero}: </span>
                    {ultimoResultado.dezenas_faltantes_ciclo && ultimoResultado.dezenas_faltantes_ciclo.length > 0 ? (
                      <span>Faltam {ultimoResultado.dezenas_faltantes_ciclo.length} dezenas</span>
                    ) : (
                      <span className="text-green-600">✅ Completo</span>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sem resultados</AlertTitle>
              <AlertDescription>
                Nenhum resultado encontrado no banco de dados.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Contexto Extra */}
      <div className="space-y-2">
        <Label htmlFor="contexto">Contexto Adicional (opcional)</Label>
        <Textarea
          id="contexto"
          value={contextoExtra}
          onChange={(e) => setContextoExtra(e.target.value)}
          placeholder={
            postType === "resultado_oficial"
              ? "Informações extras para o plantão (ex: 'Houve ganhador em SP!')"
              : "Informações extras para a IA considerar ao gerar o post..."
          }
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
          disabled={loading || (postType === "resultado_oficial" && !ultimoResultado)}
          className={`flex-1 gap-2 ${postType === "resultado_oficial" ? "bg-destructive hover:bg-destructive/90" : ""}`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : postType === "resultado_oficial" ? (
            <Megaphone className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {postType === "resultado_oficial" ? "Publicar Plantão" : "Publicar Agora"}
        </Button>
      </div>
    </div>
  );
}
