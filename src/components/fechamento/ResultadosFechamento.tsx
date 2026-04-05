import { FlaskConical, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { PalpitesToolbar, usePalpitesToolbar } from "@/components/palpites/PalpitesToolbar";
import { EstrategiaCard, type EstrategiaData } from "@/components/gerador/EstrategiaCard";
import { SelecionarSubpastaDialog } from "@/components/palpites/SelecionarSubpastaDialog";
import { formatarDezena } from "@/lib/lotofacil";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { simularGarantia, buscarMatriz, type ResultadoSimulacao } from "@/lib/fechamento";
import { DezenaCirculoMini } from "@/components/lotofacil/DezenaCirculoMini";

const ITEMS_PER_PAGE = 12;
interface ResultadosFechamentoProps {
  jogos: number[][];
  fixas?: number[];
  estrategiaId?: string;
  dezenasSelecionadas: number[];
  onNovoFechamento: () => void;
  estrategiaIA?: EstrategiaData | null;
}

// Interface para compatibilidade com a toolbar
interface PalpiteFechamento {
  id: string;
  dezenas: number[];
  estrategia?: string | null;
  estrategia_data?: EstrategiaData | null;
  qtd_dezenas?: number;
  periodo_analise?: number | null;
}

export function ResultadosFechamento({ 
  jogos, 
  fixas = [], 
  estrategiaId,
  dezenasSelecionadas,
  onNovoFechamento,
  estrategiaIA,
}: ResultadosFechamentoProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [ultimoConcurso, setUltimoConcurso] = useState<number[]>([]);
  const [showSubpastaDialog, setShowSubpastaDialog] = useState(false);
  const [palpitesParaSalvar, setPalpitesParaSalvar] = useState<number[][]>([]);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});
  const [simulacao, setSimulacao] = useState<ResultadoSimulacao | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [salvando, setSalvando] = useState(false);

  // Obtém a matriz para saber a garantia alvo
  const matriz = estrategiaId ? buscarMatriz(estrategiaId) : null;

  // Converter jogos para formato compatível com a toolbar
  const palpites: PalpiteFechamento[] = useMemo(() => 
    jogos.map((jogo, index) => ({
      id: `jogo-${index}`,
      dezenas: [...jogo].sort((a, b) => a - b),
      estrategia: matriz ? `Fechamento ${matriz.nome}` : estrategiaId ? `Fechamento ${estrategiaId}` : null,
      estrategia_data: null,
      qtd_dezenas: jogo.length,
      periodo_analise: null,
    })),
    [jogos, estrategiaId, matriz]
  );

  // Paginação
  const totalPages = Math.ceil(palpites.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const palpitesPaginados = palpites.slice(startIndex, endIndex);

  const {
    selected,
    handleSelectAll,
    handleSelectChange,
  } = usePalpitesToolbar(palpites);

  // Carregar último concurso para estatísticas de repetidas
  useEffect(() => {
    const carregarUltimoConcurso = async () => {
      const { data } = await supabase
        .from("resultados_loterias")
        .select("dezenas")
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoConcurso(data.dezenas);
      }
    };
    carregarUltimoConcurso();
  }, []);

  const handleCopiarTodos = async () => {
    const texto = jogos
      .map((jogo, i) => {
        const dezenasOrdenadas = [...jogo].sort((a, b) => a - b);
        return `Jogo ${i + 1}: ${dezenasOrdenadas.map(formatarDezena).join(" - ")}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      toast({
        title: "Jogos copiados!",
        description: `${jogos.length} jogos copiados para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar os jogos.",
        variant: "destructive",
      });
    }
  };

  const handleCopiarSelecionados = async () => {
    const selecionados = palpites.filter(p => selected.has(p.id));
    const texto = selecionados
      .map((palpite, i) => {
        return `Jogo ${i + 1}: ${palpite.dezenas.map(formatarDezena).join(" - ")}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      toast({
        title: "Jogos copiados!",
        description: `${selecionados.length} jogos copiados para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar os jogos.",
        variant: "destructive",
      });
    }
  };

  const handleCopiarJogo = async (jogo: number[], index: number) => {
    const dezenasOrdenadas = [...jogo].sort((a, b) => a - b);
    const texto = dezenasOrdenadas.map(formatarDezena).join(" - ");

    try {
      await navigator.clipboard.writeText(texto);
      toast({
        title: `Jogo ${index + 1} copiado!`,
        description: texto,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o jogo.",
        variant: "destructive",
      });
    }
  };

  const handleSalvarTodos = () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para salvar palpites.",
        variant: "destructive",
      });
      return;
    }
    setPalpitesParaSalvar(jogos);
    setShowSubpastaDialog(true);
  };

  const handleSalvarSelecionados = () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para salvar palpites.",
        variant: "destructive",
      });
      return;
    }
    const selecionados = palpites
      .filter(p => selected.has(p.id))
      .map(p => p.dezenas);
    setPalpitesParaSalvar(selecionados);
    setShowSubpastaDialog(true);
  };

  // Filtra estratégia para conter apenas as dezenas do jogo específico
  const filtrarEstrategiaParaJogo = (
    dezenas: number[], 
    estrategia: EstrategiaData
  ): EstrategiaData => {
    const dezenasSet = new Set(dezenas);
    
    // Filtra apenas as dezenas_fixas que estão no jogo
    const dezenas_fixas = estrategia.dezenas_fixas
      ?.map(item => ({
        ...item,
        dezenas: item.dezenas.filter(d => dezenasSet.has(d))
      }))
      .filter(item => item.dezenas.length > 0) || [];
    
    // Filtra dezenas_evitadas que não estão no jogo (o que é esperado)
    const dezenas_evitadas = estrategia.dezenas_evitadas
      ?.map(item => ({
        ...item,
        dezenas: item.dezenas.filter(d => !dezenasSet.has(d))
      }))
      .filter(item => item.dezenas.length > 0);
    
    return {
      ...estrategia,
      dezenas_fixas,
      dezenas_evitadas,
    };
  };

  const handleSelecionarSubpasta = async (pastaId: string) => {
    if (!user) return;
    setSalvando(true);

    try {
      const palpitesParaInserir = palpitesParaSalvar.map(dezenas => {
        const dezenasOrdenadas = [...dezenas].sort((a, b) => a - b);
        
        // Filtra a estratégia para refletir apenas as dezenas deste jogo específico
        const estrategiaFiltrada = estrategiaIA 
          ? filtrarEstrategiaParaJogo(dezenasOrdenadas, estrategiaIA) 
          : null;
        
        return {
          user_id: user.id,
          dezenas: dezenasOrdenadas,
          qtd_dezenas: dezenas.length,
          estrategia: estrategiaIA 
            ? `IA: ${estrategiaIA.ferramentas.slice(0, 2).join(" + ")}`
            : matriz 
              ? `Fechamento ${matriz.nome}` 
              : estrategiaId 
                ? `Fechamento ${estrategiaId}` 
                : null,
          estrategia_data: estrategiaFiltrada ? JSON.parse(JSON.stringify(estrategiaFiltrada)) : null,
          pasta_id: pastaId,
          loteria: "lotofacil",
        };
      });

      const { error } = await supabase
        .from("palpites_salvos")
        .insert(palpitesParaInserir);

      if (error) throw error;

      toast({
        title: "Palpites salvos!",
        description: `${palpitesParaSalvar.length} palpites salvos com sucesso.`,
      });
      setShowSubpastaDialog(false);
    } catch (error) {
      console.error("Erro ao salvar palpites:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os palpites.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleVerificarTodos = (concurso: { dezenas: number[] }, acertos: Record<string, number>) => {
    setAcertosPorPalpite(acertos);
  };

  const handleTestarGarantia = () => {
    if (!matriz) return;
    const resultado = simularGarantia(
      dezenasSelecionadas, 
      jogos, 
      matriz.garantia,
      matriz.fixasObrigatorias
    );
    setSimulacao(resultado);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Jogos Gerados</h3>
        <p className="text-sm text-muted-foreground">
          {jogos.length} jogos prontos para apostar
        </p>
      </div>

      {/* Card de Estratégia IA (se preenchido automaticamente) */}
      {estrategiaIA && (
        <EstrategiaCard estrategia={estrategiaIA} />
      )}

      {/* Toolbar universal */}
      <PalpitesToolbar
        palpites={palpites}
        selected={selected}
        onSelectAll={handleSelectAll}
        onCopiarTodos={handleCopiarTodos}
        onCopiarSelecionados={handleCopiarSelecionados}
        onSalvarTodos={handleSalvarTodos}
        onSalvarSelecionados={handleSalvarSelecionados}
        onVerificarTodos={handleVerificarTodos}
        hideExcluir
        hideEstrategias
      />

      {/* Lista de jogos usando PalpiteCard universal */}
      <div className="grid gap-3">
        {palpitesPaginados.map((palpite) => {
          // Calcula o índice real baseado no ID do palpite
          const realIndex = parseInt(palpite.id.replace("jogo-", ""));
          return (
            <PalpiteCard
              key={palpite.id}
              index={realIndex}
              dezenas={palpite.dezenas}
              dezenasFixes={fixas}
              ultimoConcursoDezenas={ultimoConcurso}
              isSelected={selected.has(palpite.id)}
              onSelectChange={(checked) => handleSelectChange(palpite.id, checked)}
              onCopy={() => handleCopiarJogo(jogos[realIndex], realIndex)}
              acertos={acertosPorPalpite[palpite.id] ?? null}
              hideVerificar
            />
          );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-3 px-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          
          <span className="text-xs text-muted-foreground">
            {palpitesPaginados.length} de {palpites.length} · Página {currentPage}/{totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Botão Testar Garantia */}
      <Button
        variant="outline"
        onClick={handleTestarGarantia}
        className="w-full gap-2"
      >
        <FlaskConical className="h-4 w-4" />
        Testar Garantia
      </Button>

      {/* Tabela de Resultados da Simulação */}
      {simulacao && (
        <div className="rounded-lg border bg-card space-y-4 overflow-hidden">
          {/* Seção: Resultado Simulado */}
          <div className="border-b p-4 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground mb-3">Resultado Simulado</h4>
            <div className="flex flex-col items-start gap-2">
              {/* Primeira linha: 8 dezenas */}
              <div className="flex justify-start gap-1.5">
                {simulacao.resultadoSimulado.slice(0, 8).map((dezena) => (
                  <DezenaCirculoMini key={dezena} dezena={dezena} />
                ))}
              </div>
              {/* Segunda linha: 7 dezenas */}
              <div className="flex justify-start gap-1.5">
                {simulacao.resultadoSimulado.slice(8, 15).map((dezena) => (
                  <DezenaCirculoMini key={dezena} dezena={dezena} />
                ))}
              </div>
            </div>
          </div>

          {/* Seção: Premiações - Layout minimalista em linha */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Premiações</span>
              <span>Jogos</span>
            </div>
            <div className="divide-y divide-border/30">
              {[15, 14, 13, 12, 11].map((pontos) => {
                const count = simulacao.contagem[pontos] || 0;
                const isGarantia = pontos === simulacao.garantiaAlvo;
                const cumpriuGarantia = isGarantia && count > 0;
                const hasWinner = count > 0;

                const medalhas: Record<number, string> = { 15: "🥇", 14: "🥈", 13: "🥉" };
                const medalha = medalhas[pontos];
                const hasBordaVerde = hasWinner && (pontos === 15 || pontos === 14);

                return (
                  <div
                    key={pontos}
                    className={`flex items-center justify-between py-2 px-2 -mx-2 rounded ${
                      hasBordaVerde ? "bg-emerald-950/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-sm">{medalha && hasWinner ? medalha : ""}</span>
                      <span className={`text-xs ${hasWinner ? "text-foreground" : "text-muted-foreground"}`}>
                        {pontos}pts
                      </span>
                      {isGarantia && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          cumpriuGarantia 
                            ? "bg-emerald-600 text-white" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          garantia
                        </span>
                      )}
                    </div>
                    <span className={`text-xs tabular-nums ${
                      hasWinner ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicador de Garantia - Flutuante */}
          <div
            className={`mx-4 p-4 rounded-xl text-sm text-center shadow-lg border ${
              simulacao.garantiaCumprida
                ? "bg-card border-border text-foreground"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            <span className={simulacao.garantiaCumprida ? "text-emerald-500" : "text-muted-foreground"}>
              {simulacao.garantiaCumprida ? "✓" : "✗"}
            </span>
            <span className="ml-2">
              {simulacao.garantiaCumprida
                ? `Garantia cumprida! Pelo menos 1 jogo com ${simulacao.garantiaAlvo}+ pontos`
                : `Garantia não cumprida nesta simulação`}
            </span>
          </div>

          {/* Botão Nova Simulação */}
          <div className="px-4 pb-4">
            <Button
              variant="secondary"
              onClick={handleTestarGarantia}
              className="w-full gap-2"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              Nova Simulação
            </Button>
          </div>
        </div>
      )}

      {/* Botão Novo Fechamento */}
      <Button
        variant="ghost"
        onClick={onNovoFechamento}
        className="w-full gap-2 text-muted-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        Novo Fechamento
      </Button>

      {/* Dialog para selecionar subpasta */}
      <SelecionarSubpastaDialog
        open={showSubpastaDialog}
        onOpenChange={setShowSubpastaDialog}
        onSelect={handleSelecionarSubpasta}
        loteria="lotofacil"
        isLoading={salvando}
      />
    </div>
  );
}
