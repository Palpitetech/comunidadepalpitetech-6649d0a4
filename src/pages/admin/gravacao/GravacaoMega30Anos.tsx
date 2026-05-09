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
import Mega30CapaProvisoria from "@/components/gravacao/mega30anos/Mega30CapaProvisoria";
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
  if (aulaId !== "01" && aulaId !== "02") {
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
        <Mega30CapaProvisoria
          aula={2}
          titulo="Top dezenas PARES"
          subtitulo="Aula 02 · Maratona Mega Especial 30 anos"
        />
        <SlideTopParesPorLinhas concursos={concursos} />
        <SlideTopParesPorColunas concursos={concursos} />
        <SlideTopParesPorQuadrantes concursos={concursos} />
        <SlideTopParesPorMinis concursos={concursos} pagina={1} />
        <SlideTopParesPorMinis concursos={concursos} pagina={2} />
        <SlideTop15ParesFinal concursos={concursos} />
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
