// Configuração declarativa dos temas de estudo disponíveis para gravação.
// Para adicionar um novo tema (ex: "Frequência" da Mega-Sena), basta acrescentar
// uma entrada no array da loteria correspondente.

export interface TemaGravacao {
  slug: string;
  titulo: string;
  descricao: string;
  /** Valor exato em postagens.tema_estudo */
  tema_estudo: string;
  /** Rota base do player fullscreen (sem query). O id da postagem é anexado como ?postagem= */
  rotaBase: string;
  totalSlides: number;
  cor: string;
  status: "ativo" | "em_breve";
}

export interface LoteriaConfig {
  tag: string;        // valor em postagens.loteria_tag
  cor: string;
  nome: string;
}

export const LOTERIAS: Record<string, LoteriaConfig> = {
  megasena: { tag: "Mega-Sena", cor: "#39D353", nome: "Mega-Sena" },
  lotofacil: { tag: "Lotofácil", cor: "hsl(270 60% 50%)", nome: "Lotofácil" },
  quina: { tag: "Quina", cor: "hsl(220 80% 55%)", nome: "Quina" },
  duplasena: { tag: "Dupla-Sena", cor: "hsl(15 80% 55%)", nome: "Dupla-Sena" },
};

export const TEMAS_POR_LOTERIA: Record<string, TemaGravacao[]> = {
  megasena: [
    {
      slug: "posicoes-finais",
      titulo: "Posições Finais",
      descricao:
        "Análise das dezenas mais frequentes nas posições 4, 5 e 6 — a metade superior decisiva do sorteio.",
      tema_estudo: "analise_posicoes_finais",
      rotaBase: "/admin/gravacao-estudo/megasena/posicoes-finais",
      totalSlides: 6,
      cor: "#39D353",
      status: "ativo",
    },
  ],
  lotofacil: [],
  quina: [],
  duplasena: [],
};
