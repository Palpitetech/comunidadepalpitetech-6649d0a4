import { FlaskConical, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PalpitesToolbar, usePalpitesToolbar } from "@/components/palpites/PalpitesToolbar";
import { EstrategiaCardDuplaSena } from "@/components/duplasena/EstrategiaCardDuplaSena";
import { JogoCardDuplaSena } from "@/components/duplasena/JogoCardDuplaSena";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SelecionarPastaDialog } from "@/components/palpites/SelecionarPastaDialog";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { useAuth } from "@/hooks/useAuth";
import type { Pasta } from "@/components/palpites/PastaItem";
import type { EstrategiaDuplaSena } from "@/hooks/useAutoFillDuplaSena";
import { 
  buscarMatrizDuplaSena, 
  simularGarantiaDuplaSena,
  formatarDezenaDuplaSena 
} from "@/lib/fechamentoDuplaSena";

const ITEMS_PER_PAGE = 12;

interface ResultadosFechamentoDuplaSenaProps {
  jogos: number[][];
  fixas?: number[];
  estrategiaId?: string;
  dezenasSelecionadas: number[];
  onNovoFechamento: () => void;
  estrategiaIA?: EstrategiaDuplaSena | null;
}

interface PalpiteFechamento {
  id: string;
  dezenas: number[];
  estrategia?: string | null;
  estrategia_data?: EstrategiaDuplaSena | null;
  qtd_dezenas?: number;
  periodo_analise?: number | null;
}

export function ResultadosFechamentoDuplaSena({ 
  jogos, fixas = [], estrategiaId, dezenasSelecionadas, onNovoFechamento, estrategiaIA,
}: ResultadosFechamentoDuplaSenaProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [ultimoConcurso, setUltimoConcurso] = useState<number[]>([]);
  const [showSalvarDialog, setShowSalvarDialog] = useState(false);
  const [showNovaPastaDialog, setShowNovaPastaDialog] = useState(false);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [loadingPastas, setLoadingPastas] = useState(false);
  const [palpitesParaSalvar, setPalpitesParaSalvar] = useState<number[][]>([]);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});
  const [simulacao, setSimulacao] = useState<ReturnType<typeof simularGarantiaDuplaSena> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const matriz = estrategiaId ? buscarMatrizDuplaSena(estrategiaId) : null;

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

  const totalPages = Math.ceil(palpites.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const palpitesPaginados = palpites.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const { selected, handleSelectAll, handleSelectChange } = usePalpitesToolbar(palpites);

  useEffect(() => {
    const carregarUltimoConcurso = async () => {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      if (data?.dezenas) setUltimoConcurso(data.dezenas);
    };
    carregarUltimoConcurso();
  }, []);

  const carregarPastas = async () => {
    if (!user) return;
    setLoadingPastas(true);
    try {
      const { data } = await supabase
        .from("palpites_pastas")
        .select("*")
        .eq("user_id", user.id)
        .eq("loteria", "duplasena")
        .order("nome");
      if (data) setPastas(data);
    } finally { setLoadingPastas(false); }
  };

  const handleCopiarTodos = async () => {
    const texto = jogos
      .map((jogo, i) => `Jogo ${i + 1}: ${[...jogo].sort((a, b) => a - b).map(formatarDezenaDuplaSena).join(" - ")}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      toast({ title: "Jogos copiados!", description: `${jogos.length} jogos copiados.` });
    } catch { toast({ title: "Erro ao copiar", variant: "destructive" }); }
  };

  const handleCopiarSelecionados = async () => {
    const selecionados = palpites.filter(p => selected.has(p.id));
    const texto = selecionados.map((p, i) => `Jogo ${i + 1}: ${p.dezenas.map(formatarDezenaDuplaSena).join(" - ")}`).join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      toast({ title: "Jogos copiados!", description: `${selecionados.length} jogos copiados.` });
    } catch { toast({ title: "Erro ao copiar", variant: "destructive" }); }
  };

  const handleSalvarTodos = () => {
    if (!user) { toast({ title: "Faça login", variant: "destructive" }); return; }
    setPalpitesParaSalvar(jogos);
    carregarPastas();
    setShowSalvarDialog(true);
  };

  const handleSalvarSelecionados = () => {
    if (!user) { toast({ title: "Faça login", variant: "destructive" }); return; }
    const selecionados = palpites.filter(p => selected.has(p.id)).map(p => p.dezenas);
    setPalpitesParaSalvar(selecionados);
    carregarPastas();
    setShowSalvarDialog(true);
  };

  const filtrarEstrategiaParaJogo = (dezenas: number[], estrategia: EstrategiaDuplaSena): EstrategiaDuplaSena => {
    const dezenasSet = new Set(dezenas);
    return {
      ...estrategia,
      dezenas_justificadas: estrategia.dezenas_justificadas?.filter(item => dezenasSet.has(item.dezena)) || [],
    };
  };

  const handleSelecionarPasta = async (pastaId: string | null) => {
    if (!user) return;
    try {
      const palpitesParaInserir = palpitesParaSalvar.map(dezenas => {
        const dezenasOrdenadas = [...dezenas].sort((a, b) => a - b);
        const estrategiaFiltrada = estrategiaIA ? filtrarEstrategiaParaJogo(dezenasOrdenadas, estrategiaIA) : null;
        return {
          user_id: user.id,
          dezenas: dezenasOrdenadas,
          qtd_dezenas: dezenas.length,
          loteria: "duplasena",
          estrategia: estrategiaIA
            ? `IA: ${estrategiaIA.ferramentas.slice(0, 2).join(" + ")}`
            : matriz ? `Fechamento ${matriz.nome}` : null,
          estrategia_data: estrategiaFiltrada ? JSON.parse(JSON.stringify(estrategiaFiltrada)) : null,
          pasta_id: pastaId,
        };
      });
      const { error } = await supabase.from("palpites_salvos").insert(palpitesParaInserir);
      if (error) throw error;
      toast({ title: "Palpites salvos!", description: `${palpitesParaSalvar.length} palpites salvos.` });
      setShowSalvarDialog(false);
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleNovaPasta = () => setShowNovaPastaDialog(true);

  const handleCriarPasta = async (nome: string, cor: string, loteria: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("palpites_pastas")
        .insert({ user_id: user.id, nome, cor, loteria })
        .select().single();
      if (error) throw error;
      if (data) {
        setPastas(prev => [...prev, data]);
        toast({ title: "Pasta criada!" });
        await handleSelecionarPasta(data.id);
      }
      setShowNovaPastaDialog(false);
    } catch {
      toast({ title: "Erro ao criar pasta", variant: "destructive" });
    }
  };

  const handleVerificarTodos = (_concurso: { dezenas: number[] }, acertos: Record<string, number>) => {
    setAcertosPorPalpite(acertos);
  };

  const handleTestarGarantia = () => {
    if (!matriz) return;
    setSimulacao(simularGarantiaDuplaSena(dezenasSelecionadas, jogos, matriz.garantia));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Jogos Gerados</h3>
        <p className="text-sm text-muted-foreground">
          {jogos.length} jogos prontos para apostar
        </p>
      </div>

      {estrategiaIA && <EstrategiaCardDuplaSena estrategia={estrategiaIA} />}

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

      <div className="grid gap-2">
        {palpitesPaginados.map((palpite) => {
          const realIndex = parseInt(palpite.id.replace("jogo-", ""));
          return (
            <JogoCardDuplaSena
              key={palpite.id}
              index={realIndex}
              dezenas={palpite.dezenas}
              dezenasFixas={fixas}
              isSelected={selected.has(palpite.id)}
              onSelectChange={(checked) => handleSelectChange(palpite.id, checked)}
              acertos={acertosPorPalpite[palpite.id] ?? null}
              ultimoConcursoDezenas={ultimoConcurso}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-3 px-1">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          <span className="text-xs text-muted-foreground">
            {palpitesPaginados.length} de {palpites.length} · Página {currentPage}/{totalPages}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30">
            Próxima <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <Button variant="outline" onClick={handleTestarGarantia} className="w-full gap-2">
        <FlaskConical className="h-4 w-4" /> Testar Garantia
      </Button>

      {simulacao && (
        <div className="rounded-lg border bg-card space-y-4 overflow-hidden">
          <div className="border-b p-4 bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground mb-3">Resultado Simulado</h4>
            <div className="flex justify-start gap-2">
              {simulacao.resultadoSimulado.map((dezena) => (
                <div key={dezena} className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  {formatarDezenaDuplaSena(dezena)}
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="divide-y divide-border/30">
              {[6, 5, 4].map((pontos) => {
                const count = simulacao.contagem[pontos as 4 | 5 | 6] || 0;
                const isGarantia = pontos === simulacao.garantiaAlvo;
                const hasWinner = count > 0;
                const nomes: Record<number, string> = { 6: "Sena", 5: "Quina", 4: "Quadra" };
                const medalhas: Record<number, string> = { 6: "🥇", 5: "🥈", 4: "🥉" };
                return (
                  <div key={pontos} className={`flex items-center justify-between py-2 px-2 -mx-2 rounded ${hasWinner && pontos >= 5 ? "bg-emerald-950/30" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-sm">{medalhas[pontos] && hasWinner ? medalhas[pontos] : ""}</span>
                      <span className={`text-xs ${hasWinner ? "text-foreground" : "text-muted-foreground"}`}>{nomes[pontos]}</span>
                      {isGarantia && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${count > 0 ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                          garantia
                        </span>
                      )}
                    </div>
                    <span className={`text-xs tabular-nums ${hasWinner ? "text-foreground font-medium" : "text-muted-foreground"}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`mx-4 mb-4 p-4 rounded-xl text-sm text-center shadow-lg border ${simulacao.garantiaCumprida ? "bg-card border-border text-foreground" : "bg-card border-border text-muted-foreground"}`}>
            <span className={simulacao.garantiaCumprida ? "text-emerald-500" : "text-muted-foreground"}>
              {simulacao.garantiaCumprida ? "✓" : "✗"}
            </span>
            <span className="ml-2">
              {simulacao.garantiaCumprida
                ? `Garantia cumprida! Pelo menos 1 jogo com ${simulacao.garantiaAlvo}+ pontos`
                : `Garantia não cumprida nesta simulação`}
            </span>
          </div>
        </div>
      )}

      <Button variant="outline" onClick={onNovoFechamento} className="w-full">
        Novo Fechamento
      </Button>

      <SelecionarPastaDialog
        open={showSalvarDialog}
        onOpenChange={setShowSalvarDialog}
        pastas={pastas}
        isLoading={loadingPastas}
        onSelect={handleSelecionarPasta}
        onNovaPasta={handleNovaPasta}
        loteria="duplasena"
      />

      <NovaPastaDialog
        open={showNovaPastaDialog}
        onOpenChange={setShowNovaPastaDialog}
        onConfirm={handleCriarPasta}
        loteria="duplasena"
      />
    </div>
  );
}
