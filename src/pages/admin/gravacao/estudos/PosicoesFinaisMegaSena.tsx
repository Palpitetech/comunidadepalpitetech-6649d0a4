import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDezenasporPosicaoMegaSena } from "@/hooks/useDezenasporPosicaoMegaSena";
import EstudoShell from "@/components/gravacao/estudos/EstudoShell";
import Slide1Intro from "@/components/gravacao/estudos/posicoes-finais/Slide1Intro";
import Slide2Explicacao from "@/components/gravacao/estudos/posicoes-finais/Slide2Explicacao";
import SlidePosicao from "@/components/gravacao/estudos/posicoes-finais/SlidePosicao";
import Slide6Conclusao from "@/components/gravacao/estudos/posicoes-finais/Slide6Conclusao";

export default function PosicoesFinaisMegaSena() {
  const { data: posicoes, isLoading: loadPos } = useDezenasporPosicaoMegaSena(100);

  const { data: contestInfo, isLoading: loadContest } = useQuery({
    queryKey: ["estudo-posicoes-mega-contest"],
    queryFn: async () => {
      const { data: ultimo } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, data_sorteio")
        .eq("loteria", "megasena")
        .order("concurso", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: proximo } = await (supabase as any)
        .from("proximos_concursos")
        .select("numero_concurso, premio_estimado")
        .eq("loteria", "megasena")
        .maybeSingle();

      const fmt = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      });

      let dataLabel: string | undefined;
      if (ultimo?.data_sorteio) {
        const d = new Date(ultimo.data_sorteio + "T00:00:00");
        dataLabel = d.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      return {
        concurso: ultimo?.concurso as number | undefined,
        data: dataLabel,
        proximoConcurso: proximo?.numero_concurso as number | undefined,
        premioEstimado: proximo?.premio_estimado
          ? fmt.format(proximo.premio_estimado)
          : undefined,
      };
    },
  });

  const isLoading = loadPos || loadContest;

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#070B16" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-white/60 text-lg">Carregando estudo…</p>
        </div>
      </div>
    );
  }

  if (!posicoes || posicoes.length < 6) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#070B16" }}
      >
        <p className="text-white/60 text-lg text-center max-w-md px-6">
          Estudo indisponível — sem resultados suficientes para análise.
        </p>
      </div>
    );
  }

  const p4 = posicoes.find((p) => p.posicao === 4)!;
  const p5 = posicoes.find((p) => p.posicao === 5)!;
  const p6 = posicoes.find((p) => p.posicao === 6)!;

  const trio = [p4.top5[0].dezena, p5.top5[0].dezena, p6.top5[0].dezena];

  return (
    <EstudoShell>
      <Slide1Intro concurso={contestInfo?.concurso} data={contestInfo?.data} />
      <Slide2Explicacao />
      <SlidePosicao
        posicao={4}
        top={p4.top5}
        descricao="A primeira das três decisivas — costuma cair entre 28 e 52."
      />
      <SlidePosicao
        posicao={5}
        top={p5.top5}
        descricao="Quase sempre acima de 38 — define a metade superior do jogo."
      />
      <SlidePosicao
        posicao={6}
        top={p6.top5}
        destaque
        badge="A mais decisiva"
        descricao="A maior dezena do sorteio. Em 90% dos concursos é ≥ 45."
      />
      <Slide6Conclusao
        trio={trio}
        premioEstimado={contestInfo?.premioEstimado}
        proximoConcurso={contestInfo?.proximoConcurso}
      />
    </EstudoShell>
  );
}
