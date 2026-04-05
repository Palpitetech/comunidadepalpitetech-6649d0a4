import { useGravacaoData } from "@/hooks/useGravacaoData";
import GravacaoShell from "@/components/gravacao/GravacaoShell";
import SlideIntro from "@/components/gravacao/SlideIntro";
import SlideResultado from "@/components/gravacao/SlideResultado";
import SlideEstatisticas from "@/components/gravacao/SlideEstatisticas";
import SlideFrequencia from "@/components/gravacao/SlideFrequencia";
import SlideTendencias from "@/components/gravacao/SlideTendencias";
import { Loader2 } from "lucide-react";

export default function GravacaoLotofacil() {
  const { data, isLoading, isError } = useGravacaoData();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0B0F1A" }}>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0B0F1A" }}>
        <p className="text-red-400">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <GravacaoShell>
      <SlideIntro concurso={data.concurso} data={data.data} premiacao={data.premiacao} />
      <SlideResultado dezenas={data.dezenas} />
      <SlideEstatisticas dezenas={data.dezenas} estatisticas={data.estatisticas} tendencias={data.tendencias} />
      <SlideFrequencia frequenciaDezenas={data.frequenciaDezenas} />
      <SlideTendencias jogos={data.jogos} estrategiaIA={data.estrategiaIA} />
    </GravacaoShell>
  );
}
