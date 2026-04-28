import { useGravacaoDataMegasena } from "@/hooks/useGravacaoDataMegasena";
import GravacaoShell from "@/components/gravacao/GravacaoShell";
import SlideIntroMegasena from "@/components/gravacao/SlideIntroMegasena";
import SlideResultadoMegasena from "@/components/gravacao/SlideResultadoMegasena";
import SlideHistoricoMegasena from "@/components/gravacao/SlideHistoricoMegasena";
import SlideEstatisticasMegasena from "@/components/gravacao/SlideEstatisticasMegasena";
import SlideFrequenciaMegasena from "@/components/gravacao/SlideFrequenciaMegasena";
import SlideTendenciasMegasena from "@/components/gravacao/SlideTendenciasMegasena";
import SlideProducaoMegasena from "@/components/gravacao/SlideProducaoMegasena";
import { Loader2 } from "lucide-react";

export default function GravacaoMegasena() {
  const { data, isLoading, isError } = useGravacaoDataMegasena();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0D0B1F" }}>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
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
    <GravacaoShell concurso={data.concurso} data={data.data} loteria="megasena">
      <SlideIntroMegasena concurso={data.concurso} data={data.data} premiacao={data.premiacao} faixasPremiacao={data.faixasPremiacao} />
      <SlideResultadoMegasena dezenas={data.dezenas} />
      <SlideHistoricoMegasena concursos={data.historicoConcursos} />
      <SlideEstatisticasMegasena dezenas={data.dezenas} estatisticas={data.estatisticas} tendencias={data.tendencias} />
      <SlideFrequenciaMegasena frequenciaDezenas={data.frequenciaDezenas} topDuplas={data.topDuplas} />
      <SlideTendenciasMegasena jogos={data.jogos} estrategiaIA={data.estrategiaIA} />
      <SlideProducaoMegasena concurso={data.concurso} data={data.data} premiacao={data.premiacao} />
    </GravacaoShell>
  );
}
