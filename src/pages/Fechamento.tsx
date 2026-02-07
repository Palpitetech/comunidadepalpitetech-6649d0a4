import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Sparkles } from "lucide-react";
import { TipoFechamentoSelector, TIPOS_FECHAMENTO } from "@/components/fechamento/TipoFechamentoSelector";
import { ModoChaveSelector } from "@/components/fechamento/ModoChaveSelector";
import { GridDezenasVolante } from "@/components/fechamento/GridDezenasVolante";

export default function Fechamento() {
  const isMobile = useIsMobile();
  
  const [tipoFechamento, setTipoFechamento] = useState("18-14");
  const [modo, setModo] = useState<"selecionar" | "fixar">("selecionar");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [fixas, setFixas] = useState<number[]>([]);

  // Obtém os dados do tipo de fechamento selecionado
  const tipoAtual = useMemo(() => 
    TIPOS_FECHAMENTO.find(t => t.id === tipoFechamento) || TIPOS_FECHAMENTO[0],
    [tipoFechamento]
  );

  // Calcula limites
  const maxFixas = tipoAtual.dezenas - 15; // Máximo de fixas permitido
  const totalSelecionadas = selecionadas.length + fixas.length;
  const podeGerar = totalSelecionadas >= tipoAtual.dezenas;

  const handleToggle = (numero: number) => {
    if (modo === "selecionar") {
      // Se já está fixa, não pode selecionar
      if (fixas.includes(numero)) return;
      
      setSelecionadas(prev => 
        prev.includes(numero) 
          ? prev.filter(n => n !== numero)
          : [...prev, numero]
      );
    } else {
      // Se já está selecionada, remove de selecionadas e adiciona em fixas
      if (selecionadas.includes(numero)) {
        setSelecionadas(prev => prev.filter(n => n !== numero));
        setFixas(prev => [...prev, numero]);
        return;
      }
      
      setFixas(prev => 
        prev.includes(numero) 
          ? prev.filter(n => n !== numero)
          : [...prev, numero]
      );
    }
  };

  const handleLimpar = () => {
    setSelecionadas([]);
    setFixas([]);
  };

  const handleGerarFechamento = () => {
    // TODO: Implementar geração de fechamento
    console.log("Gerar fechamento com:", {
      tipo: tipoAtual,
      selecionadas,
      fixas,
      total: [...selecionadas, ...fixas]
    });
  };

  return (
    <MainLayout pageTitle="Gerador de Fechamento">
      <div className="container-senior py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Header Desktop */}
        {!isMobile && (
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <Grid3X3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gerador de Fechamento
              </h1>
              <p className="text-muted-foreground">
                Selecione suas dezenas e gere combinações otimizadas
              </p>
            </div>
          </div>
        )}

        {/* Card de Configuração */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Configuração</CardTitle>
            <CardDescription>
              Escolha o tipo de fechamento e selecione suas dezenas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de Tipo */}
            <TipoFechamentoSelector
              value={tipoFechamento}
              onChange={setTipoFechamento}
            />

            {/* Seletor de Modo */}
            <ModoChaveSelector
              value={modo}
              onChange={setModo}
            />

            {/* Status da Seleção */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-sm">
                Selecionadas: {selecionadas.length}
              </Badge>
              <Badge variant="secondary" className="text-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Fixas: {fixas.length}/{maxFixas}
              </Badge>
              <Badge 
                variant={podeGerar ? "default" : "destructive"} 
                className="text-sm"
              >
                Total: {totalSelecionadas}/{tipoAtual.dezenas}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Dezenas */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Volante</CardTitle>
            <CardDescription>
              Clique nas dezenas para {modo === "selecionar" ? "selecioná-las" : "fixá-las"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GridDezenasVolante
              selecionadas={selecionadas}
              fixas={fixas}
              modo={modo}
              onToggle={handleToggle}
              maxSelecionadas={tipoAtual.dezenas}
              maxFixas={maxFixas}
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleLimpar}
            className="flex-1 sm:flex-none"
          >
            Limpar Seleção
          </Button>
          <Button
            onClick={handleGerarFechamento}
            disabled={!podeGerar}
            className="flex-1 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Gerar Fechamento
          </Button>
        </div>

        {/* Dica */}
        {!podeGerar && totalSelecionadas > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Selecione mais {tipoAtual.dezenas - totalSelecionadas} dezena(s) para habilitar a geração.
          </p>
        )}
      </div>
    </MainLayout>
  );
}
