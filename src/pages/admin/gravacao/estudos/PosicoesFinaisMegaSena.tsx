import { useSearchParams } from "react-router-dom";
import {
  useEstudoPosicoesFinais,
  useEstudosPosicoesFinaisLista,
} from "@/hooks/useEstudoPosicoesFinais";
import EstudoShell from "@/components/gravacao/estudos/EstudoShell";
import SeletorEstudo from "@/components/gravacao/estudos/SeletorEstudo";
import Slide1Intro from "@/components/gravacao/estudos/posicoes-finais/Slide1Intro";
import Slide2Explicacao from "@/components/gravacao/estudos/posicoes-finais/Slide2Explicacao";
import SlidePosicao from "@/components/gravacao/estudos/posicoes-finais/SlidePosicao";
import Slide6Conclusao from "@/components/gravacao/estudos/posicoes-finais/Slide6Conclusao";

export default function PosicoesFinaisMegaSena() {
  const [params, setParams] = useSearchParams();
  const postagemId = params.get("postagem") || undefined;

  const { data: lista } = useEstudosPosicoesFinaisLista(30);
  const { data: estudo, isLoading } = useEstudoPosicoesFinais(postagemId);

  const handleChange = (id: string) => {
    setParams({ postagem: id });
  };

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#050805" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#7DFF3A]/30 border-t-[#7DFF3A] animate-spin" />
          <p className="text-white/60 text-lg">Carregando estudo…</p>
        </div>
      </div>
    );
  }

  if (!estudo) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#050805" }}
      >
        <p className="text-white/60 text-lg text-center max-w-md px-6">
          Nenhum estudo de Posições Finais encontrado. Aguarde a próxima
          geração automática ou crie um rascunho na comunidade.
        </p>
      </div>
    );
  }

  const p4 = estudo.posicoes.find((p) => p.posicao === 4);
  const p5 = estudo.posicoes.find((p) => p.posicao === 5);
  const p6 = estudo.posicoes.find((p) => p.posicao === 6);

  return (
    <>
      <SeletorEstudo
        estudos={lista || []}
        selecionadoId={estudo.id}
        onChange={handleChange}
      />
      <EstudoShell>
        <Slide1Intro
          concurso={estudo.proximo_concurso ?? undefined}
          data={estudo.proximo_data_label ?? undefined}
          status={estudo.status}
        />
        <Slide2Explicacao janela={estudo.janela} />
        <SlidePosicao
          posicao={4}
          top={p4?.top ?? []}
          descricao="A primeira das três decisivas — costuma cair entre 28 e 52."
        />
        <SlidePosicao
          posicao={5}
          top={p5?.top ?? []}
          descricao="Quase sempre acima de 38 — define a metade superior do jogo."
        />
        <SlidePosicao
          posicao={6}
          top={p6?.top ?? []}
          destaque
          badge="A mais decisiva"
          descricao="A maior dezena do sorteio. Em 90% dos concursos é ≥ 45."
        />
        <Slide6Conclusao
          trio={estudo.trio}
          apoio={estudo.apoio}
          recomendacao={estudo.recomendacao ?? undefined}
          premioEstimado={estudo.premio_estimado ?? undefined}
          proximoConcurso={estudo.proximo_concurso ?? undefined}
        />
      </EstudoShell>
    </>
  );
}
