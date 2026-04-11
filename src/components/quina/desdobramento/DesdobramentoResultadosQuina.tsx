import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PalpitesToolbar, usePalpitesToolbar } from "@/components/palpites/PalpitesToolbar";
import { SelecionarPastaDialog } from "@/components/palpites/SelecionarPastaDialog";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { formatarDezena } from "@/lib/quina";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";
import type { Pasta } from "@/components/palpites/PastaItem";

interface JogoGerado {
  dezenas: number[];
}

interface FiltrosResumo {
  impares: number[] | null;
  imparesEhPadrao: boolean;
  repetidas: number[] | null;
  repetidasEhPadrao: boolean;
  primos: number[] | null;
  primosEhPadrao: boolean;
  moldura: number[] | null;
  molduraEhPadrao: boolean;
  multiplosDe3: number[] | null;
  m3EhPadrao: boolean;
}

interface DesdobramentoResultadosQuinaProps {
  jogos: JogoGerado[];
  dezenasFixas?: number[];
  ultimoConcursoDezenas?: number[];
  qtdDezenas: number;
  onVoltar: () => void;
  filtrosResumo?: FiltrosResumo;
}

export function DesdobramentoResultadosQuina({
  jogos,
  dezenasFixas = [],
  ultimoConcursoDezenas = [],
  qtdDezenas,
  onVoltar,
  filtrosResumo,
}: DesdobramentoResultadosQuinaProps) {
  const { toast } = useToast();
  const [salvandoPasta, setSalvandoPasta] = useState(false);
  const [dialogPastaAberto, setDialogPastaAberto] = useState(false);
  const [dialogNovaPastaAberto, setDialogNovaPastaAberto] = useState(false);
  const [palpitesParaSalvar, setPalpitesParaSalvar] = useState<JogoGerado[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  
  useEffect(() => {
    const fetchPastas = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data } = await supabase
        .from("palpites_pastas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .eq("loteria", "quina")
        .order("nome");
      
      if (data) {
        setPastas(data.map(p => ({
          id: p.id,
          nome: p.nome,
          cor: p.cor || "#6366F1",
        })));
      }
    };
    fetchPastas();
  }, []);
  
  const palpitesFormatados = useMemo(() => 
    jogos.map((jogo, index) => ({
      id: `desdobramento-qn-${index}`,
      dezenas: jogo.dezenas,
      estrategia: "Desdobramento Quina",
      estrategia_data: null,
      qtd_dezenas: qtdDezenas,
      periodo_analise: null,
      loteria: "quina",
    })),
    [jogos, qtdDezenas]
  );

  const toolbar = usePalpitesToolbar(palpitesFormatados);

  const copiarDezenas = (palpites: JogoGerado[]) => {
    const texto = palpites
      .map((p, i) => `Jogo ${i + 1}: ${p.dezenas.map(d => formatarDezena(d)).join(" - ")}`)
      .join("\n");
    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado! 📋",
      description: `${palpites.length} jogo(s) copiado(s) para a área de transferência`,
    });
  };

  const handleAbrirSalvar = (palpitesASalvar: JogoGerado[]) => {
    setPalpitesParaSalvar(palpitesASalvar);
    setDialogPastaAberto(true);
  };

  const handleSalvarNaPasta = async (pastaId: string | null) => {
    if (palpitesParaSalvar.length === 0) return;
    
    setSalvandoPasta(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({ title: "Erro", description: "Você precisa estar logado para salvar palpites", variant: "destructive" });
        return;
      }

      const palpitesInsert = palpitesParaSalvar.map((palpite) => ({
        user_id: sessionData.session!.user.id,
        dezenas: palpite.dezenas,
        qtd_dezenas: qtdDezenas,
        estrategia: "Desdobramento Quina",
        pasta_id: pastaId,
        loteria: "quina",
      }));

      const { error } = await supabase
        .from("palpites_salvos")
        .insert(palpitesInsert);

      if (error) throw error;

      toast({ title: "Salvo com sucesso! 🎉", description: `${palpitesParaSalvar.length} palpite(s) salvo(s) em Meus Palpites` });
      setDialogPastaAberto(false);
      setPalpitesParaSalvar([]);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar os palpites", variant: "destructive" });
    } finally {
      setSalvandoPasta(false);
    }
  };

  const handleCriarPasta = async (nome: string, cor: string, loteria: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data, error } = await supabase
        .from("palpites_pastas")
        .insert({ user_id: sessionData.session.user.id, nome, cor, loteria })
        .select()
        .single();

      if (error) throw error;

      setPastas(prev => [...prev, { id: data.id, nome: data.nome, cor: data.cor || "#6366F1" }]);
      setDialogNovaPastaAberto(false);
      toast({ title: "Pasta criada! 📁", description: `Pasta "${nome}" criada com sucesso` });

      if (palpitesParaSalvar.length > 0) {
        await handleSalvarNaPasta(data.id);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao criar pasta", description: "Não foi possível criar a pasta", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onVoltar} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg truncate">Palpites Quina</h1>
              <p className="text-xs text-muted-foreground">{jogos.length} jogos • {qtdDezenas} dezenas</p>
            </div>
            <Button size="sm" onClick={() => handleAbrirSalvar(jogos)} className="gap-1.5">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Resumo de Filtros */}
      {filtrosResumo && (
        <div className="container max-w-lg mx-auto px-4 pt-3">
          <button
            type="button"
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className="w-full flex items-center justify-between py-2.5 px-3 text-sm bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <span className="font-medium text-muted-foreground">Filtros utilizados</span>
            {filtrosAbertos ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          
          {filtrosAbertos && (
            <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {filtrosResumo.impares && (
                  <Badge variant="outline" className="text-xs gap-1">
                    Ímp: {filtrosResumo.impares.join(", ")}
                    {filtrosResumo.imparesEhPadrao && <span className="text-primary font-semibold">Padrão</span>}
                  </Badge>
                )}
                {filtrosResumo.repetidas && (
                  <Badge variant="outline" className="text-xs gap-1">
                    Rep: {filtrosResumo.repetidas.join(", ")}
                    {filtrosResumo.repetidasEhPadrao && <span className="text-primary font-semibold">Padrão</span>}
                  </Badge>
                )}
                {filtrosResumo.primos && (
                  <Badge variant="outline" className="text-xs gap-1">
                    Pri: {filtrosResumo.primos.join(", ")}
                    {filtrosResumo.primosEhPadrao && <span className="text-primary font-semibold">Padrão</span>}
                  </Badge>
                )}
                {filtrosResumo.moldura && (
                  <Badge variant="outline" className="text-xs gap-1">
                    Mol: {filtrosResumo.moldura.join(", ")}
                    {filtrosResumo.molduraEhPadrao && <span className="text-primary font-semibold">Padrão</span>}
                  </Badge>
                )}
                {filtrosResumo.multiplosDe3 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    M3: {filtrosResumo.multiplosDe3.join(", ")}
                    {filtrosResumo.m3EhPadrao && <span className="text-primary font-semibold">Padrão</span>}
                  </Badge>
                )}
              </div>
              
              {dezenasFixas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                  <Badge variant="secondary" className="text-xs bg-palpite-fixa text-palpite-fixa-foreground">
                    Fixas: {dezenasFixas.map(d => formatarDezena(d)).join(", ")}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="container max-w-lg mx-auto px-4 pt-3">
        <PalpitesToolbar
          palpites={palpitesFormatados}
          selected={toolbar.selected}
          onSelectAll={toolbar.handleSelectAll}
          onCopiarTodos={() => copiarDezenas(jogos)}
          onCopiarSelecionados={() => {
            const selecionados = jogos.filter((_, i) => toolbar.selected.has(`desdobramento-qn-${i}`));
            copiarDezenas(selecionados);
          }}
          onVerificarTodos={toolbar.handleVerificarTodos}
          onSalvarTodos={() => handleAbrirSalvar(jogos)}
          onSalvarSelecionados={() => {
            const selecionados = jogos.filter((_, i) => toolbar.selected.has(`desdobramento-qn-${i}`));
            handleAbrirSalvar(selecionados);
          }}
          hideExcluir
          hideEstrategias
        />
      </div>

      {/* Lista de palpites */}
      <div className="container max-w-lg mx-auto px-4 pb-6 pt-3 space-y-3">
        {jogos.map((jogo, index) => {
          const id = `desdobramento-qn-${index}`;
          return (
            <PalpiteCard
              key={id}
              index={index}
              dezenas={jogo.dezenas}
              dezenasFixas={dezenasFixas}
              ultimoConcursoDezenas={ultimoConcursoDezenas}
              isSelected={toolbar.selected.has(id)}
              onSelectChange={(checked) => toolbar.handleSelectChange(id, checked)}
              acertos={toolbar.acertosPorPalpite[id] ?? null}
              hideVerificar
              loteria="quina"
            />
          );
        })}
      </div>

      <SelecionarPastaDialog
        open={dialogPastaAberto}
        onOpenChange={setDialogPastaAberto}
        pastas={pastas}
        onSelect={handleSalvarNaPasta}
        onNovaPasta={() => {
          setDialogPastaAberto(false);
          setDialogNovaPastaAberto(true);
        }}
        loteria="quina"
        isLoading={salvandoPasta}
      />

      <NovaPastaDialog
        open={dialogNovaPastaAberto}
        onOpenChange={setDialogNovaPastaAberto}
        onConfirm={handleCriarPasta}
        loteria="quina"
      />
    </div>
  );
}
