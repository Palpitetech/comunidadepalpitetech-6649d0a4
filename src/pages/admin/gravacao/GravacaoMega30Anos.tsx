import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Mega30Shell from "@/components/gravacao/mega30anos/Mega30Shell";
import Mega30Capa from "@/components/gravacao/mega30anos/Mega30Capa";
import SlideTopPorLinhas from "@/components/gravacao/mega30anos/aula01/SlideTopPorLinhas";
import SlideTopPorColunas from "@/components/gravacao/mega30anos/aula01/SlideTopPorColunas";
import SlideTopPorQuadrantes from "@/components/gravacao/mega30anos/aula01/SlideTopPorQuadrantes";
import SlideTopPorMinis from "@/components/gravacao/mega30anos/aula01/SlideTopPorMinis";
import SlideTop15Final from "@/components/gravacao/mega30anos/aula01/SlideTop15Final";
import SlideTopParesPorLinhas from "@/components/gravacao/mega30anos/aula02/SlideTopParesPorLinhas";
import SlideTopParesPorColunas from "@/components/gravacao/mega30anos/aula02/SlideTopParesPorColunas";
import SlideTopParesPorQuadrantes from "@/components/gravacao/mega30anos/aula02/SlideTopParesPorQuadrantes";
import SlideTopParesPorMinis from "@/components/gravacao/mega30anos/aula02/SlideTopParesPorMinis";
import SlideTop15ParesFinal from "@/components/gravacao/mega30anos/aula02/SlideTop15ParesFinal";
import SlideTopImparesPorLinhas from "@/components/gravacao/mega30anos/aula03/SlideTopImparesPorLinhas";
import SlideTopImparesPorColunas from "@/components/gravacao/mega30anos/aula03/SlideTopImparesPorColunas";
import SlideTopImparesPorQuadrantes from "@/components/gravacao/mega30anos/aula03/SlideTopImparesPorQuadrantes";
import SlideTopImparesPorMinis from "@/components/gravacao/mega30anos/aula03/SlideTopImparesPorMinis";
import SlideTop15ImparesFinal from "@/components/gravacao/mega30anos/aula03/SlideTop15ImparesFinal";
import SlideTopPrimosPorLinhas from "@/components/gravacao/mega30anos/aula04/SlideTopPrimosPorLinhas";
import SlideTopPrimosPorColunas from "@/components/gravacao/mega30anos/aula04/SlideTopPrimosPorColunas";
import SlideTopPrimosPorQuadrantes from "@/components/gravacao/mega30anos/aula04/SlideTopPrimosPorQuadrantes";
import SlideTopPrimosPorMinis from "@/components/gravacao/mega30anos/aula04/SlideTopPrimosPorMinis";
import SlideTop15PrimosFinal from "@/components/gravacao/mega30anos/aula04/SlideTop15PrimosFinal";
import SlideFreqInicioPorLinha from "@/components/gravacao/mega30anos/aula05/SlideFreqInicioPorLinha";
import SlideTopInicialPorLinha from "@/components/gravacao/mega30anos/aula05/SlideTopInicialPorLinha";
import SlideFreqFimPorLinha from "@/components/gravacao/mega30anos/aula05/SlideFreqFimPorLinha";
import SlideTopFinalPorLinha from "@/components/gravacao/mega30anos/aula05/SlideTopFinalPorLinha";
import SlideFreqGeralPorLinha from "@/components/gravacao/mega30anos/aula05/SlideFreqGeralPorLinha";
import SlideSinteseLinhas from "@/components/gravacao/mega30anos/aula05/SlideSinteseLinhas";
import SlideFreqInicioPorColuna from "@/components/gravacao/mega30anos/aula06/SlideFreqInicioPorColuna";
import SlideTopInicialPorColuna from "@/components/gravacao/mega30anos/aula06/SlideTopInicialPorColuna";
import SlideFreqFimPorColuna from "@/components/gravacao/mega30anos/aula06/SlideFreqFimPorColuna";
import SlideTopFinalPorColuna from "@/components/gravacao/mega30anos/aula06/SlideTopFinalPorColuna";
import SlideFreqGeralPorColuna from "@/components/gravacao/mega30anos/aula06/SlideFreqGeralPorColuna";
import SlideSinteseColunas from "@/components/gravacao/mega30anos/aula06/SlideSinteseColunas";
import SlideTopInicialGeral from "@/components/gravacao/mega30anos/aula07/SlideTopInicialGeral";
import SlideTopInicialPares from "@/components/gravacao/mega30anos/aula07/SlideTopInicialPares";
import SlideTopInicialImpares from "@/components/gravacao/mega30anos/aula07/SlideTopInicialImpares";
import SlideSinteseInicial from "@/components/gravacao/mega30anos/aula07/SlideSinteseInicial";
import Mega30CapaProvisoria from "@/components/gravacao/mega30anos/Mega30CapaProvisoria";
import capa02 from "@/assets/gravacao/megasena-30anos/capas/capa-02.jpg";
import capa03 from "@/assets/gravacao/megasena-30anos/capas/capa-03.jpg";
import capa04 from "@/assets/gravacao/megasena-30anos/capas/capa-04.jpg";
import capa05 from "@/assets/gravacao/megasena-30anos/capas/capa-05.jpg";
import capa06 from "@/assets/gravacao/megasena-30anos/capas/capa-06.jpg";
import SlideDescricaoYoutube from "@/components/gravacao/mega30anos/SlideDescricaoYoutube";
import { useMegaEspecialBase } from "@/hooks/useMegaEspecialBase";
import { topDezenasGeral } from "@/lib/megaEspecialEngine";
import { getEstudo } from "@/lib/mega30/estudosCatalog";
import type { SlideMeta } from "@/hooks/useMega30AulaDescricao";
import capa01 from "@/assets/gravacao/megasena-30anos/capas/capa-01.jpg";

export default function GravacaoMega30Anos() {
  const { id } = useParams<{ id?: string }>();
  const aulaId = id ?? "01";
  const estudo = getEstudo(aulaId);
  const { data: concursos, isLoading, isError } = useMegaEspecialBase();

  // Carrega Cinzel
  useEffect(() => {
    const linkId = "cinzel-font";
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap";
    document.head.appendChild(link);
  }, []);

  // Resumos para a IA gerar a descrição (baseado em dados reais)
  const slidesMeta = useMemo<SlideMeta[]>(() => {
    if (!concursos || concursos.length === 0) return [];
    const top15 = topDezenasGeral(concursos, 15).ranking
      .slice(0, 5)
      .map((d) => `${String(d.chave).padStart(2, "0")} (${d.freq}x)`)
      .join(", ");
    return [
      {
        titulo: "Top dezenas por LINHA",
        resumoDados: `Para cada uma das 6 linhas do volante (10 dezenas cada), o ranking das 5 mais sorteadas em ${concursos.length} concursos.`,
      },
      {
        titulo: "Top dezenas por COLUNA",
        resumoDados: `Para cada uma das 10 colunas do volante (6 dezenas cada), o ranking das 4 mais sorteadas em ${concursos.length} concursos.`,
      },
      {
        titulo: "Top dezenas por QUADRANTE",
        resumoDados: `Os 4 quadrantes do volante (15 dezenas cada): Q1 superior-esquerdo, Q2 superior-direito, Q3 inferior-esquerdo e Q4 inferior-direito. Top 8 de cada.`,
      },
      {
        titulo: "Top dezenas por MINI-QUADRANTE",
        resumoDados: `O volante dividido em 16 mini-quadrantes (sub-blocos dos 4 quadrantes). Top 3 dezenas de cada mini.`,
      },
      {
        titulo: "Top 15 dezenas para Mega Especial 30 anos / R$ 150 milhões",
        resumoDados: `As 15 dezenas mais sorteadas em toda a história da Mega-Sena. Top 5: ${top15}.`,
      },
    ];
  }, [concursos]);

  // Aulas ainda não produzidas: placeholder
  if (aulaId !== "01" && aulaId !== "02" && aulaId !== "03" && aulaId !== "04" && aulaId !== "05" && aulaId !== "06") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center text-center px-8"
        style={{ background: "#0A2818" }}
      >
        <div>
          <p
            className="text-2xl font-bold mb-2"
            style={{ color: "#D4AF37", fontFamily: "Cinzel, serif" }}
          >
            Aula {aulaId} — {estudo?.titulo ?? "Estudo"}
          </p>
          <p style={{ color: "#D4AF37", opacity: 0.7 }}>Slides em produção.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#0A2818" }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#D4AF37" }} />
      </div>
    );
  }

  if (isError || !concursos) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "#0A2818" }}
      >
        <p style={{ color: "#D4AF37" }}>Erro ao carregar dados da Mega-Sena</p>
      </div>
    );
  }

  if (aulaId === "02") {
    return (
      <Mega30Shell capaIndices={[0]}>
        <Mega30Capa src={capa02} alt="Aula 02 — Top dezenas pares" />
        <SlideTopParesPorLinhas concursos={concursos} />
        <SlideTopParesPorColunas concursos={concursos} />
        <SlideTopParesPorQuadrantes concursos={concursos} />
        <SlideTopParesPorMinis concursos={concursos} pagina={1} />
        <SlideTopParesPorMinis concursos={concursos} pagina={2} />
        <SlideTop15ParesFinal concursos={concursos} />
      </Mega30Shell>
    );
  }

  if (aulaId === "03") {
    return (
      <Mega30Shell capaIndices={[0]}>
        <Mega30Capa src={capa03} alt="Aula 03 — Top dezenas ímpares" />
        <SlideTopImparesPorLinhas concursos={concursos} />
        <SlideTopImparesPorColunas concursos={concursos} />
        <SlideTopImparesPorQuadrantes concursos={concursos} />
        <SlideTopImparesPorMinis concursos={concursos} pagina={1} />
        <SlideTopImparesPorMinis concursos={concursos} pagina={2} />
        <SlideTop15ImparesFinal concursos={concursos} />
      </Mega30Shell>
    );
  }

  if (aulaId === "04") {
    return (
      <Mega30Shell capaIndices={[0]}>
        <Mega30Capa src={capa04} alt="Aula 04 — Top dezenas primas" />
        <SlideTopPrimosPorLinhas concursos={concursos} />
        <SlideTopPrimosPorColunas concursos={concursos} />
        <SlideTopPrimosPorQuadrantes concursos={concursos} />
        <SlideTopPrimosPorMinis concursos={concursos} pagina={1} />
        <SlideTopPrimosPorMinis concursos={concursos} pagina={2} />
        <SlideTop15PrimosFinal concursos={concursos} />
      </Mega30Shell>
    );
  }

  if (aulaId === "05") {
    return (
      <Mega30Shell capaIndices={[0]}>
        <Mega30Capa src={capa05} alt="Aula 05 — Linhas Quentes" />
        <SlideFreqInicioPorLinha concursos={concursos} />
        <SlideTopInicialPorLinha concursos={concursos} />
        <SlideFreqFimPorLinha concursos={concursos} />
        <SlideTopFinalPorLinha concursos={concursos} />
        <SlideFreqGeralPorLinha concursos={concursos} />
        <SlideSinteseLinhas concursos={concursos} />
      </Mega30Shell>
    );
  }

  if (aulaId === "06") {
    return (
      <Mega30Shell capaIndices={[0]}>
        <Mega30Capa src={capa06} alt="Aula 06 — Colunas Quentes" />
        <SlideFreqInicioPorColuna concursos={concursos} />
        <SlideTopInicialPorColuna concursos={concursos} />
        <SlideFreqFimPorColuna concursos={concursos} />
        <SlideTopFinalPorColuna concursos={concursos} />
        <SlideFreqGeralPorColuna concursos={concursos} />
        <SlideSinteseColunas concursos={concursos} />
      </Mega30Shell>
    );
  }

  return (
    <Mega30Shell capaIndices={[0]}>
      <Mega30Capa src={capa01} alt="Aula 01 — Top dezenas nos 30 anos" />
      <SlideTopPorLinhas concursos={concursos} />
      <SlideTopPorColunas concursos={concursos} />
      <SlideTopPorQuadrantes concursos={concursos} />
      <SlideTopPorMinis concursos={concursos} pagina={1} />
      <SlideTopPorMinis concursos={concursos} pagina={2} />
      <SlideTop15Final concursos={concursos} />
      <SlideDescricaoYoutube
        aulaId="mega30-aula-01-v2"
        aulaTitulo="Mega Especial 30 Anos — Aula 01: Top dezenas nos 30 anos"
        slides={slidesMeta}
      />
    </Mega30Shell>
  );
}
