import { useGravacaoDataQuina } from "@/hooks/useGravacaoDataQuina";
import GravacaoShell from "@/components/gravacao/GravacaoShell";
import SlideIntroQuina from "@/components/gravacao/SlideIntroQuina";
import SlideResultadoQuina from "@/components/gravacao/SlideResultadoQuina";
import SlideHistoricoQuina from "@/components/gravacao/SlideHistoricoQuina";
import SlideEstatisticasQuina from "@/components/gravacao/SlideEstatisticasQuina";
import SlideFrequenciaQuina from "@/components/gravacao/SlideFrequenciaQuina";
import SlideTendenciasQuina from "@/components/gravacao/SlideTendenciasQuina";
import SlideProducaoQuina from "@/components/gravacao/SlideProducaoQuina";
import { Loader2 } from "lucide-react";

export default function GravacaoQuina() {
  const { data, isLoading, isError } = useGravacaoDataQuina();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0D0B1F" }}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0D0B1F" }}>
        <p className="text-red-400">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <GravacaoShell concurso={data.concurso} data={data.data} loteria="quina">
      <SlideIntroQuina concurso={data.concurso} data={data.data} premiacao={data.premiacao} faixasPremiacao={data.faixasPremiacao} proximoConcurso={data.proximoConcurso} />
      <SlideResultadoQuina dezenas={data.dezenas} />
      <SlideHistoricoQuina concursos={data.historicoConcursos} />
      <SlideEstatisticasQuina dezenas={data.dezenas} estatisticas={data.estatisticas} tendencias={data.tendencias} />
      <SlideFrequenciaQuina frequenciaDezenas={data.frequenciaDezenas} topDuplas={data.topDuplas} />
      <SlideTendenciasQuina jogos={data.jogos} estrategiaIA={data.estrategiaIA} />
      <SlideProducaoQuina concurso={data.concurso} data={data.data} premiacao={data.premiacao} />
    </GravacaoShell>
  );
}
