import { useGravacaoMega30Anos } from "@/hooks/useGravacaoMega30Anos";
import Mega30Shell from "@/components/gravacao/mega30anos/Mega30Shell";
import Mega30Capa from "@/components/gravacao/mega30anos/Mega30Capa";
import Slide01TopPorMes from "@/components/gravacao/mega30anos/estudo01/Slide01TopPorMes";
import Slide02TopPorAno from "@/components/gravacao/mega30anos/estudo01/Slide02TopPorAno";
import Slide03TopPorSemestre from "@/components/gravacao/mega30anos/estudo01/Slide03TopPorSemestre";
import Slide04Top15Geral from "@/components/gravacao/mega30anos/estudo01/Slide04Top15Geral";
import capa01 from "@/assets/gravacao/megasena-30anos/capas/capa-01.jpg";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const ANOS_POR_PAGINA = 8;

export default function GravacaoMega30Anos() {
  const { data, isLoading, isError } = useGravacaoMega30Anos();

  // Carregar Cinzel
  useEffect(() => {
    const id = "cinzel-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap";
    document.head.appendChild(link);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0A2818" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#D4AF37" }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0A2818" }}>
        <p style={{ color: "#D4AF37" }}>Erro ao carregar dados da Mega-Sena</p>
      </div>
    );
  }

  // Páginas do "Top por Ano"
  const anos = data.anosOrdenados;
  const paginasAno: number[][] = [];
  for (let i = 0; i < anos.length; i += ANOS_POR_PAGINA) {
    paginasAno.push(anos.slice(i, i + ANOS_POR_PAGINA));
  }

  return (
    <Mega30Shell capaIndices={[0]}>
      <Mega30Capa src={capa01} alt="Estudo 01 — Top 15 dezenas nos 30 anos" />
      <Slide01TopPorMes data={data} />
      {paginasAno.map((anosPagina, idx) => (
        <Slide02TopPorAno
          key={`ano-${idx}`}
          data={data}
          pagina={idx}
          totalPaginas={paginasAno.length}
          anosNaPagina={anosPagina}
        />
      ))}
      <Slide03TopPorSemestre data={data} />
      <Slide04Top15Geral data={data} />
    </Mega30Shell>
  );
}
