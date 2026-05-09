import type { Agrupamento } from "@/lib/megaEspecialEngine";
import {
  Hash, Rows3, Columns3, Grid2x2, Grid3x3,
  ListOrdered, BarChart3, ScanLine, Sigma, Repeat, ChevronsRight, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface EstudoCatalogItem {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  agrupamentoBase: Agrupamento;
  icon: LucideIcon;
  /** se true, página de tabela está implementada */
  disponivel: boolean;
}

export const ESTUDOS_MEGA_30: EstudoCatalogItem[] = [
  {
    id: "01",
    numero: 1,
    titulo: "Top 15 dezenas nos 30 anos",
    subtitulo: "Frequência geral",
    descricao: "Dezenas mais sorteadas em toda a história da Mega-Sena, com filtros por mês, ano e semestre.",
    agrupamentoBase: "dezena",
    icon: Hash,
    disponivel: true,
  },
  {
    id: "02",
    numero: 2,
    titulo: "Linhas mais sorteadas",
    subtitulo: "Distribuição por linha (1-6)",
    descricao: "Quais linhas do volante mais entregaram dezenas ao longo dos 30 anos.",
    agrupamentoBase: "linha",
    icon: Rows3,
    disponivel: true,
  },
  {
    id: "03",
    numero: 3,
    titulo: "Colunas mais sorteadas",
    subtitulo: "Distribuição por coluna (1-10)",
    descricao: "Frequência de saída por coluna do volante 6×10.",
    agrupamentoBase: "coluna",
    icon: Columns3,
    disponivel: true,
  },
  {
    id: "04",
    numero: 4,
    titulo: "Quadrantes mais sorteados",
    subtitulo: "Os 4 grandes blocos",
    descricao: "Distribuição entre Q1 (sup-esq), Q2 (sup-dir), Q3 (inf-esq) e Q4 (inf-dir).",
    agrupamentoBase: "quadrante",
    icon: Grid2x2,
    disponivel: true,
  },
  {
    id: "05",
    numero: 5,
    titulo: "Mini-quadrantes mais sorteados",
    subtitulo: "16 sub-blocos",
    descricao: "Cada quadrante dividido em 4 mini-blocos. Mostra os pontos quentes do volante.",
    agrupamentoBase: "mini",
    icon: Grid3x3,
    disponivel: true,
  },
  {
    id: "06",
    numero: 6,
    titulo: "Top dezenas por linha",
    subtitulo: "Em breve",
    descricao: "Para cada linha 1-6, as dezenas mais sorteadas dentro dela.",
    agrupamentoBase: "dezena",
    icon: ListOrdered,
    disponivel: false,
  },
  {
    id: "07",
    numero: 7,
    titulo: "Top dezenas por coluna",
    subtitulo: "Em breve",
    descricao: "Para cada coluna 1-10, as dezenas mais sorteadas dentro dela.",
    agrupamentoBase: "dezena",
    icon: ListOrdered,
    disponivel: false,
  },
  {
    id: "08",
    numero: 8,
    titulo: "Top dezenas por quadrante",
    subtitulo: "Em breve",
    descricao: "Ranking interno de cada um dos 4 quadrantes.",
    agrupamentoBase: "dezena",
    icon: ListOrdered,
    disponivel: false,
  },
  {
    id: "09",
    numero: 9,
    titulo: "Top dezenas por mini-quadrante",
    subtitulo: "Em breve",
    descricao: "Ranking interno de cada um dos 16 mini-quadrantes.",
    agrupamentoBase: "dezena",
    icon: ListOrdered,
    disponivel: false,
  },
  {
    id: "10",
    numero: 10,
    titulo: "Pares × Ímpares",
    subtitulo: "Em breve",
    descricao: "Evolução da paridade ao longo dos 30 anos.",
    agrupamentoBase: "dezena",
    icon: BarChart3,
    disponivel: false,
  },
  {
    id: "11",
    numero: 11,
    titulo: "Moldura × Centro",
    subtitulo: "Em breve",
    descricao: "Quanto as bordas do volante prevalecem sobre o miolo.",
    agrupamentoBase: "dezena",
    icon: ScanLine,
    disponivel: false,
  },
  {
    id: "12",
    numero: 12,
    titulo: "Soma das dezenas",
    subtitulo: "Em breve",
    descricao: "Faixas de soma mais frequentes nos 30 anos.",
    agrupamentoBase: "dezena",
    icon: Sigma,
    disponivel: false,
  },
  {
    id: "13",
    numero: 13,
    titulo: "Repetições do concurso anterior",
    subtitulo: "Em breve",
    descricao: "Quantas dezenas costumam repetir do concurso imediatamente anterior.",
    agrupamentoBase: "dezena",
    icon: Repeat,
    disponivel: false,
  },
  {
    id: "14",
    numero: 14,
    titulo: "Sequências consecutivas",
    subtitulo: "Em breve",
    descricao: "Frequência de pares consecutivos como (12,13) dentro de um sorteio.",
    agrupamentoBase: "dezena",
    icon: ChevronsRight,
    disponivel: false,
  },
  {
    id: "15",
    numero: 15,
    titulo: "Mega da Virada — top dezenas",
    subtitulo: "Em breve",
    descricao: "Dezenas mais sorteadas exclusivamente nos concursos da Mega da Virada.",
    agrupamentoBase: "dezena",
    icon: Sparkles,
    disponivel: false,
  },
];

export function getEstudo(id: string): EstudoCatalogItem | undefined {
  return ESTUDOS_MEGA_30.find((e) => e.id === id);
}
