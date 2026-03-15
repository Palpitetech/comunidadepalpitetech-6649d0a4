import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, Trophy, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ─── Regras por loteria ───────────────────────────────
const REGRAS_LOTERIA: Record<string, {
  dezenas_sorteadas: number;
  faixas: { pontos: number; nome: string; is_ouro: boolean }[];
  minimo: number;
  tabela_resultado: string;
  campo_dezenas: string;
}> = {
  lotofacil: {
    dezenas_sorteadas: 15,
    faixas: [
      { pontos: 15, nome: "1ª faixa", is_ouro: true },
      { pontos: 14, nome: "2ª faixa", is_ouro: true },
      { pontos: 13, nome: "3ª faixa", is_ouro: false },
      { pontos: 12, nome: "4ª faixa", is_ouro: false },
      { pontos: 11, nome: "5ª faixa", is_ouro: false },
    ],
    minimo: 11,
    tabela_resultado: "resultados",
    campo_dezenas: "dezenas",
  },
  megasena: {
    dezenas_sorteadas: 6,
    faixas: [
      { pontos: 6, nome: "Sena", is_ouro: true },
      { pontos: 5, nome: "Quina", is_ouro: true },
      { pontos: 4, nome: "Quadra", is_ouro: false },
    ],
    minimo: 4,
    tabela_resultado: "resultados_megasena",
    campo_dezenas: "dezenas",
  },
  duplasena: {
    dezenas_sorteadas: 6,
    faixas: [
      { pontos: 6, nome: "1ª faixa", is_ouro: true },
      { pontos: 5, nome: "2ª faixa", is_ouro: true },
      { pontos: 4, nome: "3ª faixa", is_ouro: false },
      { pontos: 3, nome: "4ª faixa", is_ouro: false },
    ],
    minimo: 3,
    tabela_resultado: "resultados_duplasena",
    campo_dezenas: "dezenas_sorteio1",
  },
  quina: {
    dezenas_sorteadas: 5,
    faixas: [
      { pontos: 5, nome: "1ª faixa", is_ouro: true },
      { pontos: 4, nome: "2ª faixa", is_ouro: true },
      { pontos: 3, nome: "3ª faixa", is_ouro: false },
      { pontos: 2, nome: "4ª faixa", is_ouro: false },
    ],
    minimo: 2,
    tabela_resultado: "resultados_quina",
    campo_dezenas: "dezenas",
  },
  lotomania: {
    dezenas_sorteadas: 20,
    faixas: [
      { pontos: 20, nome: "1ª faixa", is_ouro: true },
      { pontos: 18, nome: "2ª faixa", is_ouro: true },
      { pontos: 17, nome: "3ª faixa", is_ouro: false },
      { pontos: 16, nome: "4ª faixa", is_ouro: false },
      { pontos: 15, nome: "5ª faixa", is_ouro: false },
      { pontos: 0, nome: "Terno de 0", is_ouro: false },
    ],
    minimo: 0,
    tabela_resultado: "resultados_lotomania",
    campo_dezenas: "dezenas",
  },
  diadesorte: {
    dezenas_sorteadas: 7,
    faixas: [
      { pontos: 7, nome: "1ª faixa", is_ouro: true },
      { pontos: 6, nome: "2ª faixa", is_ouro: true },
      { pontos: 5, nome: "3ª faixa", is_ouro: false },
      { pontos: 4, nome: "4ª faixa", is_ouro: false },
    ],
    minimo: 4,
    tabela_resultado: "resultados_diadesorte",
    campo_dezenas: "dezenas",
  },
};

// ─── Função auxiliar: buscar valor do prêmio pela faixa ──
function buscarValorFaixa(
  premiacaoJson: any[],
  acertos: number
): number {
  if (!Array.isArray(premiacaoJson) || premiacaoJson.length === 0) return 0;
  const faixa = premiacaoJson.find((p: any) => {
    // Extrair número de acertos da descrição: "15 acertos" → 15
    const desc = p.descricao || p.quantidade_acertos || "";
    const match = desc.match(/(\d+)/);
    const pontosDesc = match ? parseInt(match[1]) : 0;
    return pontosDesc === acertos;
  });
  return faixa?.valorPremio ?? faixa?.valor_premio ?? 0;
}

// ─── Função de verificação ────────────────────────────
type PalpiteVerificado = {
  palpite_index: number;
  acertos: number;
  dezenas_acertadas: number[];
  faixa: string | null;
  premiado: boolean;
  is_ouro: boolean;
  valor_premio: number;
};

function verificarPalpites(
  palpites: number[][],
  dezenasResultado: (string | number)[],
  loteria: string,
  premiacaoJson?: any[]
): PalpiteVerificado[] {
  const regra = REGRAS_LOTERIA[loteria];
  if (!regra) return [];

  const sorteadas = dezenasResultado.map((d) => (typeof d === "string" ? parseInt(d) : d));

  return palpites.map((palpite, i) => {
    const acertadas = palpite.filter((n) => sorteadas.includes(n));
    const pontos = acertadas.length;

    // Lotomania special: 0 acertos is also a prize
    const isLotomania0 = loteria === "lotomania" && pontos === 0;

    if (pontos < regra.minimo && !isLotomania0) {
      return {
        palpite_index: i,
        acertos: pontos,
        dezenas_acertadas: acertadas,
        faixa: null,
        premiado: false,
        is_ouro: false,
        valor_premio: 0,
      };
    }

    const faixa = regra.faixas.find((f) => f.pontos === pontos);
    const valorPremio = premiacaoJson ? buscarValorFaixa(premiacaoJson, pontos) : 0;

    return {
      palpite_index: i,
      acertos: pontos,
      dezenas_acertadas: acertadas,
      faixa: faixa?.nome ?? "Premiado",
      premiado: true,
      is_ouro: faixa?.is_ouro ?? false,
      valor_premio: valorPremio,
    };
  });
}

// ─── Buscar resultado por loteria ─────────────────────
async function buscarResultado(loteria: string, dataConcurso: string) {
  const regra = REGRAS_LOTERIA[loteria];
  if (!regra) return null;

  const tabela = regra.tabela_resultado as any;
  const campoConcurso = tabela === "resultados" ? "data_sorteio" : "data_sorteio";

  const { data, error } = await supabase
    .from(tabela)
    .select("*")
    .eq(campoConcurso, dataConcurso)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

const LOTERIA_LABELS: Record<string, string> = {
  megasena: "Mega-Sena",
  lotofacil: "Lotofácil",
  duplasena: "Dupla Sena",
  quina: "Quina",
  lotomania: "Lotomania",
  diadesorte: "Dia de Sorte",
};

// ─── Página ───────────────────────────────────────────
export default function Premiacao() {
  const queryClient = useQueryClient();
  const [verificando, setVerificando] = useState(false);
  const [resumo, setResumo] = useState<{ verificados: number; premiados: number; semResultado: number } | null>(null);

  const hoje = format(new Date(), "yyyy-MM-dd");
  const hojeDisplay = format(new Date(), "dd/MM/yyyy");

  // Load already verified bolões
  const { data: boloesVerificados = [], isLoading } = useQuery({
    queryKey: ["boloes-premiacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boloes")
        .select("id, codigo, loteria, sigla, concurso_numero, data_concurso, total_palpites, palpites, palpites_premiados, resultado_verificado, verificado_em, status")
        .eq("resultado_verificado", true)
        .order("verificado_em", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleVerificarHoje = async () => {
    setVerificando(true);
    setResumo(null);

    try {
      // 1. Buscar bolões com data_concurso = hoje
      const { data: boloesHoje, error } = await supabase
        .from("boloes")
        .select("id, codigo, loteria, sigla, concurso_numero, data_concurso, palpites, status")
        .eq("data_concurso", hoje)
        .in("status", ["ativo", "encerrado"]);

      if (error) throw error;
      if (!boloesHoje?.length) {
        toast({ title: "Nenhum bolão encontrado", description: "Não há bolões com sorteio para hoje." });
        setVerificando(false);
        return;
      }

      let verificados = 0;
      let premiados = 0;
      let semResultado = 0;

      for (const bolao of boloesHoje) {
        // 2. Buscar resultado
        const resultado = await buscarResultado(bolao.loteria, bolao.data_concurso);

        if (!resultado) {
          semResultado++;
          continue;
        }

        // Get dezenas from resultado
        const regra = REGRAS_LOTERIA[bolao.loteria];
        if (!regra) continue;

        const dezenas = resultado[regra.campo_dezenas];
        if (!dezenas || !Array.isArray(dezenas)) continue;

        // Get premiacao_json from resultado
        const premiacaoJson = (resultado as any).premiacao_json;

        // 3. Parse palpites
        const palpites: number[][] = Array.isArray(bolao.palpites) ? (bolao.palpites as any) : [];
        if (!palpites.length) continue;

        // 4. Verificar
        const resultadoVerificacao = verificarPalpites(palpites, dezenas, bolao.loteria, premiacaoJson);
        const temPremiado = resultadoVerificacao.some((r) => r.premiado);

        // 5. Salvar
        const updateData: any = {
          resultado_verificado: true,
          verificado_em: new Date().toISOString(),
          palpites_premiados: resultadoVerificacao,
        };

        if (temPremiado) {
          updateData.status = "premiado";
        }

        await supabase.from("boloes").update(updateData).eq("id", bolao.id);

        verificados++;
        if (temPremiado) premiados++;
      }

      setResumo({ verificados, premiados, semResultado });
      toast({
        title: "Verificação concluída",
        description: `${verificados} verificados, ${premiados} premiados, ${semResultado} sem resultado.`,
      });
      queryClient.invalidateQueries({ queryKey: ["boloes-premiacao"] });
    } catch (err: any) {
      toast({ title: "Erro na verificação", description: err.message, variant: "destructive" });
    } finally {
      setVerificando(false);
    }
  };

  const premiados = boloesVerificados.filter(
    (b: any) => Array.isArray(b.palpites_premiados) && b.palpites_premiados.some((p: any) => p.premiado)
  );
  const naoPremiados = boloesVerificados.filter(
    (b: any) => !Array.isArray(b.palpites_premiados) || !b.palpites_premiados.some((p: any) => p.premiado)
  );

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">🏆 Premiação</h1>
        <p className="text-sm text-muted-foreground">Verificação automática de bolões premiados</p>
      </div>

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Verificar Premiações
          </CardTitle>
          <CardDescription>
            Verifica bolões com sorteio hoje cruzando com resultados atualizados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Data de hoje: <span className="font-medium text-foreground">{hojeDisplay}</span>
          </p>
          <Button onClick={handleVerificarHoje} disabled={verificando} className="gap-2">
            {verificando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando bolões...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                🔍 Verificar Hoje
              </>
            )}
          </Button>

          {/* Resumo */}
          {resumo && (
            <div className="flex gap-3 flex-wrap mt-3">
              <Badge variant="secondary" className="text-xs gap-1">
                ✅ {resumo.verificados} verificados
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                🏆 {resumo.premiados} premiados
              </Badge>
              {resumo.semResultado > 0 && (
                <Badge variant="secondary" className="text-xs gap-1 bg-orange-500/20 text-orange-600 border-orange-500/30">
                  ⚠️ {resumo.semResultado} sem resultado
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : boloesVerificados.length === 0 ? (
        <div className="text-center py-16 space-y-2 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto opacity-40" />
          <p className="font-medium">Nenhum bolão verificado ainda.</p>
          <p className="text-xs">Use o botão acima para verificar os bolões de hoje.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Premiados */}
          {premiados.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-yellow-600 flex items-center gap-1.5">
                <Trophy className="h-4 w-4" />
                Bolões Premiados
              </h2>
              {premiados.map((b: any) => (
                <BolaoVerificadoCard key={b.id} bolao={b} premiado />
              ))}
            </div>
          )}

          {/* Não premiados */}
          {naoPremiados.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <XCircle className="h-4 w-4" />
                Sem premiação
              </h2>
              {naoPremiados.map((b: any) => (
                <BolaoVerificadoCard key={b.id} bolao={b} premiado={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card de bolão verificado ─────────────────────────
function BolaoVerificadoCard({ bolao, premiado }: { bolao: any; premiado: boolean }) {
  const palpitesPremiados: PalpiteVerificado[] = Array.isArray(bolao.palpites_premiados) ? bolao.palpites_premiados : [];
  const palpitesComPremio = palpitesPremiados.filter((p) => p.premiado);
  const verificadoEm = bolao.verificado_em
    ? format(parseISO(bolao.verificado_em), "dd/MM HH:mm", { locale: ptBR })
    : "";

  const dataFormatted = (() => {
    try {
      return format(parseISO(bolao.data_concurso), "dd/MM/yyyy");
    } catch {
      return bolao.data_concurso;
    }
  })();

  return (
    <Card className={premiado ? "border-yellow-500/30" : "opacity-60"}>
      <CardContent className="py-4 px-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{premiado ? "🏆" : "❌"}</span>
          <span className="font-mono font-semibold text-sm">{bolao.codigo}</span>
          <Badge variant="secondary" className="text-[10px]">
            {LOTERIA_LABELS[bolao.loteria] || bolao.loteria}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Concurso {bolao.concurso_numero} · {dataFormatted}
        </p>

        {/* Palpites premiados */}
        {premiado && palpitesComPremio.length > 0 ? (
          <div className="space-y-1.5">
            {palpitesComPremio.map((p) => (
              <div key={p.palpite_index} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-20">
                  Palpite {String(p.palpite_index + 1).padStart(2, "0")}:
                </span>
                <span className="font-semibold">{p.acertos} acertos</span>
                {p.is_ouro ? (
                  <Badge className="text-[10px] bg-yellow-500/20 text-yellow-600 border-yellow-500/30">🥇 {p.faixa}</Badge>
                ) : (
                  <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 border-emerald-500/30">✅ {p.faixa}</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum palpite premiado</p>
        )}

        {/* Verified timestamp */}
        <p className="text-xs text-muted-foreground">Verificado: {verificadoEm}</p>
      </CardContent>
    </Card>
  );
}
