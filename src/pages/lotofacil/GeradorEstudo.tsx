import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { DezenasSelector } from "@/components/gerador/DezenasSelector";
import { ResultadosSheet } from "@/components/gerador/ResultadosSheet";
import { ResultadosSheetMegaSena } from "@/components/megasena/ResultadosSheetMegaSena";
import { EstudoSelector } from "@/components/gerador-estudo/EstudoSelector";
import { EstudoInfoCard } from "@/components/gerador-estudo/EstudoInfoCard";
import { GeradorTheme } from "@/components/gerador-estudo/GeradorTheme";
import { useEstudosDisponiveis } from "@/hooks/useEstudosDisponiveis";
import { useGeradorEstudo } from "@/hooks/useGeradorEstudo";
import { supabase } from "@/integrations/supabase/client";
import { useUpsell } from "@/contexts/UpsellContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Dices, Loader2, AlertCircle } from "lucide-react";

const DEZENAS_OPTIONS_BY_LOTERIA: Record<"lotofacil" | "megasena", number[]> = {
  lotofacil: [15, 16, 17, 18, 19, 20],
  megasena: [6, 7, 8, 9, 10, 11, 12],
};

const DEFAULT_QTD_BY_LOTERIA: Record<"lotofacil" | "megasena", number> = {
  lotofacil: 15,
  megasena: 6,
};

interface Props {
  loteria?: "lotofacil" | "megasena";
}

export default function GeradorEstudo({ loteria = "lotofacil" }: Props) {
  const [searchParams] = useSearchParams();
  const postIdFromUrl = searchParams.get("postId");

  const { data, isLoading: loadingEstudos } = useEstudosDisponiveis(loteria);
  const estudos = useMemo(() => data?.estudos ?? [], [data]);

  const [selectedEstudoId, setSelectedEstudoId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(3);
  const [qtdDezenas, setQtdDezenas] = useState(DEFAULT_QTD_BY_LOTERIA[loteria]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);

  const { openUpgradeModal } = useUpsell();
  const { isPremium, isAdmin } = useUserRole();
  const { isLoading, result, error, generate, reset } = useGeradorEstudo();

  // Default: estudo da URL se houver, senão o mais recente
  useEffect(() => {
    if (selectedEstudoId) return;
    if (postIdFromUrl && estudos.some((e) => e.id === postIdFromUrl)) {
      setSelectedEstudoId(postIdFromUrl);
      return;
    }
    if (estudos.length > 0) {
      setSelectedEstudoId(estudos[0].id);
    }
  }, [estudos, postIdFromUrl, selectedEstudoId]);

  // Buscar último concurso para conferência
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", loteria)
        .order("concurso", { ascending: false })
        .limit(1)
        .single();
      if (data?.dezenas) setUltimoConcursoDezenas(data.dezenas);
    })();
  }, [loteria]);

  const estudoSelecionado = estudos.find((e) => e.id === selectedEstudoId) || null;
  const lockedFromPost = !!postIdFromUrl;

  const handleGenerate = () => {
    if (!isPremium && !isAdmin) {
      openUpgradeModal("Gerador de Estudo");
      return;
    }
    if (!selectedEstudoId) return;
    generate(selectedEstudoId, quantidade, qtdDezenas);
  };

  // Abrir sheet quando resultado chegar
  useEffect(() => {
    if (result) setSheetOpen(true);
  }, [result]);

  const handleClearAll = () => {
    reset();
    setQuantidade(3);
    setQtdDezenas(DEFAULT_QTD_BY_LOTERIA[loteria]);
  };

  const usageBadgeText = isAdmin
    ? "∞"
    : result
      ? `${result.remaining_today}/${result.max_per_day}`
      : "30/dia";

  const tituloPagina = loteria === "megasena" ? "Gerador de Estudo · Mega-Sena" : "Gerador de Estudo · Lotofácil";

  return (
    <MainLayout pageTitle={tituloPagina}>
      <GeradorTheme loteria={loteria}>
      <div className="container-senior py-6 space-y-4 max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6 space-y-5">
            {!lockedFromPost && (
              <EstudoSelector
                estudos={estudos}
                loading={loadingEstudos}
                value={selectedEstudoId}
                onChange={setSelectedEstudoId}
                disabled={isLoading}
              />
            )}

            {estudoSelecionado && <EstudoInfoCard estudo={estudoSelecionado} />}

            <QuantidadeSelector
              value={quantidade}
              onChange={setQuantidade}
              max={12}
              disabled={isLoading}
            />

            <DezenasSelector
              value={qtdDezenas}
              onChange={setQtdDezenas}
              disabled={isLoading}
              options={DEZENAS_OPTIONS_BY_LOTERIA[loteria]}
            />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="relative">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !selectedEstudoId}
                className="w-full h-14 text-lg gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Gerando palpites...
                  </>
                ) : (
                  <>
                    <Dices className="h-5 w-5" />
                    Gerar {quantidade} Palpite{quantidade > 1 ? "s" : ""}
                  </>
                )}
              </Button>
              {!isLoading && (
                <span className="absolute -top-2 -right-2 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-sm bg-background text-foreground border-border">
                  {usageBadgeText} estudos/dia
                </span>
              )}
            </div>

            {isLoading && (
              <div className="space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  Aplicando o estudo aos seus palpites...
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            )}
          </CardContent>
        </Card>

        {result && (loteria === "megasena" ? (
          <ResultadosSheetMegaSena
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            jogos={result.jogos}
            ultimoConcursoDezenas={ultimoConcursoDezenas}
            onClearAll={handleClearAll}
            estrategia={result.estrategia}
            dezenasFixes={result.estrategia?.dezenas_fixas?.[0]?.dezenas ?? []}
          />
        ) : (
          <ResultadosSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            jogos={result.jogos}
            ultimoConcursoDezenas={ultimoConcursoDezenas}
            onClearAll={handleClearAll}
            estrategia={result.estrategia}
            dezenasFixes={result.estrategia?.dezenas_fixas?.[0]?.dezenas ?? []}
          />
        ))}
      </div>
      </GeradorTheme>
    </MainLayout>
  );
}
