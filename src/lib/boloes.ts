/**
 * Shared constants and utilities for the Bolões module.
 */

export const WHATSAPP_NUMERO = "5551981854281";

export const LOTERIA_LABELS: Record<string, string> = {
  megasena: "Mega-Sena",
  lotofacil: "Lotofácil",
  duplasena: "Dupla Sena",
  quina: "Quina",
  lotomania: "Lotomania",
  diadesorte: "Dia de Sorte",
};

export const LOTERIA_BADGE_COLORS: Record<string, string> = {
  lotofacil: "bg-green-600/20 text-green-400 border-green-600/30",
  megasena: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  duplasena: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  quina: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  lotomania: "bg-pink-600/20 text-pink-400 border-pink-600/30",
  diadesorte: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
};

export interface BolaoPublico {
  id: string;
  codigo: string;
  loteria: string;
  sigla: string;
  concurso_numero: string;
  data_concurso: string;
  total_cotas: number;
  cotas_vendidas: number | null;
  valor_cota: number;
  valor_premiacao: number | null;
  descricao_estrategia: string | null;
  palpites: number[][] | null;
  pdf_url: string | null;
  status: string | null;
  resultado_verificado: boolean | null;
  palpites_premiados: PalpitePremiado[] | null;
}

export interface PalpitePremiado {
  palpite_index: number;
  dezenas_acertadas: number[];
  acertos: number;
  premiado: boolean;
  is_ouro: boolean;
  faixa: string;
}

export function getProgressColor(pct: number): string {
  if (pct >= 95) return "bg-destructive/80";
  if (pct >= 80) return "bg-orange-400";
  return "bg-emerald-500";
}

export function getStatusBadgeProps(status: string) {
  switch (status) {
    case "ativo":
      return { label: "Aberto", className: "bg-green-500/20 text-green-400 border-green-500/30 text-[10px]" };
    case "encerrado":
      return { label: "Encerrado", className: "bg-muted text-muted-foreground text-[10px]" };
    case "premiado":
      return { label: "Premiado 🏆", className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px]" };
    default:
      return null;
  }
}

export function formatBolaoDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatBolaoDateLong(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const weekdayShort = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const formatted = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const shortFormatted = weekdayShort.charAt(0).toUpperCase() + weekdayShort.slice(1);
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), weekdayShort: shortFormatted, formatted };
}

export function formatBolaoCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBolaoPremio(valor: number): string {
  if (valor >= 1_000_000_000) return `R$ ${(valor / 1_000_000_000).toFixed(1)} Bi`;
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)} Mi`;
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
