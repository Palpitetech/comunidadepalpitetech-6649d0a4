import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { PalpitesToolbar, usePalpitesToolbar } from "@/components/palpites/PalpitesToolbar";
import { SelecionarPastaDialog } from "@/components/palpites/SelecionarPastaDialog";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { formatarDezena } from "@/lib/lotofacil";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import type { Pasta } from "@/components/palpites/PastaItem";

interface JogoGerado {
  dezenas: number[];
}

interface DesdobramentoResultadosProps {
  jogos: JogoGerado[];
  dezenasFixes?: number[];
  ultimoConcursoDezenas?: number[];
  qtdDezenas: number;
  onVoltar: () => void;
}

export function DesdobramentoResultados({
  jogos,
  dezenasFixes = [],
  ultimoConcursoDezenas = [],
  qtdDezenas,
  onVoltar,
}: DesdobramentoResultadosProps) {
  const { toast } = useToast();
  const [salvandoPasta, setSalvandoPasta] = useState(false);
  const [dialogPastaAberto, setDialogPastaAberto] = useState(false);
  const [dialogNovaPastaAberto, setDialogNovaPastaAberto] = useState(false);
  const [palpitesParaSalvar, setPalpitesParaSalvar] = useState<JogoGerado[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  
  // Buscar pastas do usuário
  useEffect(() => {
    const fetchPastas = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data } = await supabase
        .from("palpites_pastas")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("nome");
      
      if (data) {
        setPastas(data.map(p => ({
          id: p.id,
          nome: p.nome,
          cor: p.cor || "#8B5CF6",
        })));
      }
    };
    fetchPastas();
  }, []);
  
  // Converter jogos para formato esperado pela toolbar
  const palpitesFormatados = useMemo(() => 
    jogos.map((jogo, index) => ({
      id: `desdobramento-${index}`,
      dezenas: jogo.dezenas,
      estrategia: "Desdobramento Estatístico",
      estrategia_data: null,
      qtd_dezenas: qtdDezenas,
      periodo_analise: null,
    })),
    [jogos, qtdDezenas]
  );

  const toolbar = usePalpitesToolbar(palpitesFormatados);

  // Copiar dezenas para clipboard
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

  // Abrir dialog para salvar palpites
  const handleAbrirSalvar = (palpitesASalvar: JogoGerado[]) => {
    setPalpitesParaSalvar(palpitesASalvar);
    setDialogPastaAberto(true);
  };

  // Salvar palpites na pasta selecionada
  const handleSalvarNaPasta = async (pastaId: string | null) => {
    if (palpitesParaSalvar.length === 0) return;
    
    setSalvandoPasta(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para salvar palpites",
          variant: "destructive",
        });
        return;
      }

      const palpitesInsert = palpitesParaSalvar.map((palpite) => ({
        user_id: sessionData.session!.user.id,
        dezenas: palpite.dezenas,
        qtd_dezenas: qtdDezenas,
        estrategia: "Desdobramento Estatístico",
        pasta_id: pastaId,
      }));

      const { error } = await supabase
        .from("palpites_salvos")
        .insert(palpitesInsert);

      if (error) throw error;

      toast({
        title: "Salvo com sucesso! 🎉",
        description: `${palpitesParaSalvar.length} palpite(s) salvo(s) em Meus Palpites`,
      });

      setDialogPastaAberto(false);
      setPalpitesParaSalvar([]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os palpites",
        variant: "destructive",
      });
    } finally {
      setSalvandoPasta(false);
    }
  };

  // Criar nova pasta
  const handleCriarPasta = async (nome: string, cor: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data, error } = await supabase
        .from("palpites_pastas")
        .insert({
          user_id: sessionData.session.user.id,
          nome,
          cor,
        })
        .select()
        .single();

      if (error) throw error;

      setPastas(prev => [...prev, { id: data.id, nome: data.nome, cor: data.cor || "#8B5CF6" }]);
      setDialogNovaPastaAberto(false);
      
      toast({
        title: "Pasta criada! 📁",
        description: `Pasta "${nome}" criada com sucesso`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao criar pasta",
        description: "Não foi possível criar a pasta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoltar}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg truncate">
                Palpites Gerados
              </h1>
              <p className="text-xs text-muted-foreground">
                {jogos.length} jogos • {qtdDezenas} dezenas
              </p>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAbrirSalvar(jogos)}
              className="gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="container max-w-lg mx-auto px-4 pt-3">
        <PalpitesToolbar
          palpites={palpitesFormatados}
          selected={toolbar.selected}
          onSelectAll={toolbar.handleSelectAll}
          onCopiarTodos={() => copiarDezenas(jogos)}
          onCopiarSelecionados={() => {
            const selecionados = jogos.filter((_, i) => 
              toolbar.selected.has(`desdobramento-${i}`)
            );
            copiarDezenas(selecionados);
          }}
          onVerificarTodos={toolbar.handleVerificarTodos}
          onSalvarTodos={() => handleAbrirSalvar(jogos)}
          onSalvarSelecionados={() => {
            const selecionados = jogos.filter((_, i) => 
              toolbar.selected.has(`desdobramento-${i}`)
            );
            handleAbrirSalvar(selecionados);
          }}
          hideExcluir
          hideEstrategias
        />
      </div>

      {/* Lista de palpites */}
      <div className="container max-w-lg mx-auto px-4 pb-6 pt-3 space-y-3">
        {jogos.map((jogo, index) => {
          const id = `desdobramento-${index}`;
          return (
            <PalpiteCard
              key={id}
              index={index}
              dezenas={jogo.dezenas}
              dezenasFixes={dezenasFixes}
              ultimoConcursoDezenas={ultimoConcursoDezenas}
              isSelected={toolbar.selected.has(id)}
              onSelectChange={(checked) => toolbar.handleSelectChange(id, checked)}
              acertos={toolbar.acertosPorPalpite[id] ?? null}
              hideVerificar
            />
          );
        })}
      </div>

      {/* Dialog para selecionar pasta */}
      <SelecionarPastaDialog
        open={dialogPastaAberto}
        onOpenChange={setDialogPastaAberto}
        pastas={pastas}
        onSelect={handleSalvarNaPasta}
        onNovaPasta={() => {
          setDialogPastaAberto(false);
          setDialogNovaPastaAberto(true);
        }}
        isLoading={salvandoPasta}
      />

      {/* Dialog para criar nova pasta */}
      <NovaPastaDialog
        open={dialogNovaPastaAberto}
        onOpenChange={setDialogNovaPastaAberto}
        onConfirm={handleCriarPasta}
      />
    </div>
  );
}
