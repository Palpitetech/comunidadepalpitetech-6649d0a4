import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PalpiteCard } from "@/components/shared/PalpiteCard";
import { PalpitesToolbar, usePalpitesToolbar } from "@/components/palpites/PalpitesToolbar";
import { formatarDezena } from "@/lib/lotofacil";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SelecionarPastaDialog } from "@/components/palpites/SelecionarPastaDialog";
import { NovaPastaDialog } from "@/components/palpites/NovaPastaDialog";
import { useAuth } from "@/hooks/useAuth";
import type { Pasta } from "@/components/palpites/PastaItem";

interface ResultadosFechamentoProps {
  jogos: number[][];
  fixas?: number[];
  estrategiaId?: string;
  onNovoFechamento: () => void;
}

// Interface para compatibilidade com a toolbar
interface PalpiteFechamento {
  id: string;
  dezenas: number[];
  estrategia?: string | null;
  estrategia_data?: null;
  qtd_dezenas?: number;
  periodo_analise?: number | null;
}

export function ResultadosFechamento({ 
  jogos, 
  fixas = [], 
  estrategiaId,
  onNovoFechamento 
}: ResultadosFechamentoProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [ultimoConcurso, setUltimoConcurso] = useState<number[]>([]);
  const [showSalvarDialog, setShowSalvarDialog] = useState(false);
  const [showNovaPastaDialog, setShowNovaPastaDialog] = useState(false);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [loadingPastas, setLoadingPastas] = useState(false);
  const [palpitesParaSalvar, setPalpitesParaSalvar] = useState<number[][]>([]);
  const [acertosPorPalpite, setAcertosPorPalpite] = useState<Record<string, number>>({});

  // Converter jogos para formato compatível com a toolbar
  const palpites: PalpiteFechamento[] = useMemo(() => 
    jogos.map((jogo, index) => ({
      id: `jogo-${index}`,
      dezenas: [...jogo].sort((a, b) => a - b),
      estrategia: estrategiaId ? `Fechamento ${estrategiaId}` : null,
      estrategia_data: null,
      qtd_dezenas: jogo.length,
      periodo_analise: null,
    })),
    [jogos, estrategiaId]
  );

  const {
    selected,
    handleSelectAll,
    handleSelectChange,
  } = usePalpitesToolbar(palpites);

  // Carregar último concurso para estatísticas de repetidas
  useEffect(() => {
    const carregarUltimoConcurso = async () => {
      const { data } = await supabase
        .from("resultados")
        .select("dezenas")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .single();
      
      if (data?.dezenas) {
        setUltimoConcurso(data.dezenas);
      }
    };
    carregarUltimoConcurso();
  }, []);

  // Carregar pastas do usuário
  const carregarPastas = async () => {
    if (!user) return;
    setLoadingPastas(true);
    try {
      const { data } = await supabase
        .from("palpites_pastas")
        .select("*")
        .eq("user_id", user.id)
        .order("nome");
      
      if (data) {
        setPastas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar pastas:", error);
    } finally {
      setLoadingPastas(false);
    }
  };

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
    carregarPastas();
    setShowSalvarDialog(true);
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
    carregarPastas();
    setShowSalvarDialog(true);
  };

  const handleSelecionarPasta = async (pastaId: string | null) => {
    if (!user) return;

    try {
      const palpitesParaInserir = palpitesParaSalvar.map(dezenas => ({
        user_id: user.id,
        dezenas: [...dezenas].sort((a, b) => a - b),
        qtd_dezenas: dezenas.length,
        estrategia: estrategiaId ? `Fechamento ${estrategiaId}` : null,
        pasta_id: pastaId,
      }));

      const { error } = await supabase
        .from("palpites_salvos")
        .insert(palpitesParaInserir);

      if (error) throw error;

      toast({
        title: "Palpites salvos!",
        description: `${palpitesParaSalvar.length} palpites salvos com sucesso.`,
      });
      setShowSalvarDialog(false);
    } catch (error) {
      console.error("Erro ao salvar palpites:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os palpites.",
        variant: "destructive",
      });
    }
  };

  const handleNovaPasta = () => {
    setShowNovaPastaDialog(true);
  };

  const handleCriarPasta = async (nome: string, cor: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("palpites_pastas")
        .insert({ user_id: user.id, nome, cor })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPastas(prev => [...prev, data]);
        toast({
          title: "Pasta criada!",
          description: `Pasta "${nome}" criada com sucesso.`,
        });
      }
      setShowNovaPastaDialog(false);
    } catch (error) {
      console.error("Erro ao criar pasta:", error);
      toast({
        title: "Erro ao criar pasta",
        description: "Não foi possível criar a pasta.",
        variant: "destructive",
      });
    }
  };

  const handleVerificarTodos = (concurso: { dezenas: number[] }, acertos: Record<string, number>) => {
    setAcertosPorPalpite(acertos);
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
        {palpites.map((palpite, index) => (
          <PalpiteCard
            key={palpite.id}
            index={index}
            dezenas={palpite.dezenas}
            dezenasFixes={fixas}
            ultimoConcursoDezenas={ultimoConcurso}
            isSelected={selected.has(palpite.id)}
            onSelectChange={(checked) => handleSelectChange(palpite.id, checked)}
            onCopy={() => handleCopiarJogo(jogos[index], index)}
            acertos={acertosPorPalpite[palpite.id] ?? null}
            hideVerificar
          />
        ))}
      </div>

      {/* Botão de novo fechamento */}
      <Button
        variant="outline"
        onClick={onNovoFechamento}
        className="w-full gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Novo Fechamento
      </Button>

      {/* Dialog para selecionar pasta */}
      <SelecionarPastaDialog
        open={showSalvarDialog}
        onOpenChange={setShowSalvarDialog}
        pastas={pastas}
        onSelect={handleSelecionarPasta}
        onNovaPasta={handleNovaPasta}
        isLoading={loadingPastas}
      />

      {/* Dialog para criar nova pasta */}
      <NovaPastaDialog
        open={showNovaPastaDialog}
        onOpenChange={setShowNovaPastaDialog}
        onConfirm={handleCriarPasta}
      />
    </div>
  );
}
