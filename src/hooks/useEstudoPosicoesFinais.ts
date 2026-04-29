import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Estudo "Posições Finais" da Mega-Sena, parseado a partir de `postagens.fatos_snapshot`
 * + texto markdown do `resumo`. Mesma fonte de dados que alimenta o "gerador a partir de
 * estudo" — o slide de gravação reflete EXATAMENTE o estudo publicado/rascunho.
 */

export interface DezenaTop {
  dezena: number;
  quantidade: number;
}

export interface PosicaoTop {
  posicao: 4 | 5 | 6;
  top: DezenaTop[];
}

export interface EstudoPosicoesFinais {
  id: string;
  titulo: string | null;
  status: "publicado" | "rascunho" | string;
  publicar_em: string | null;
  proximo_concurso: number | null;
  ultimo_concurso: number | null;
  janela: number; // ex: 20 sorteios
  trio: number[]; // base_geracao.fixar
  apoio: number[]; // base_geracao.apoio
  recomendacao: string | null;
  posicoes: PosicaoTop[]; // P4, P5, P6
  proximo_data_label: string | null;
  premio_estimado: string | null;
}

// Parseia "**31** (3×), **32** (3×)" -> [{dezena:31, quantidade:3}, ...]
function parseTopLine(line: string | undefined): DezenaTop[] {
  if (!line) return [];
  const re = /\*\*(\d{1,2})\*\*\s*\((\d+)\s*[x×]\)/gi;
  const out: DezenaTop[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    out.push({ dezena: parseInt(m[1], 10), quantidade: parseInt(m[2], 10) });
  }
  return out;
}

function parseJanela(resumo: string | undefined): number {
  if (!resumo) return 20;
  const m = /Janela:\s*(\d+)\s*sorteios/i.exec(resumo);
  return m ? parseInt(m[1], 10) : 20;
}

function parsePosicoes(resumo: string | undefined): PosicaoTop[] {
  if (!resumo) return [];
  const result: PosicaoTop[] = [];
  for (const pos of [4, 5, 6] as const) {
    const re = new RegExp(
      `P${pos}\\s*[—-]\\s*top frequentes[^\\n]*\\n([^\\n]+)`,
      "i",
    );
    const m = re.exec(resumo);
    const top = parseTopLine(m?.[1]);
    result.push({ posicao: pos, top });
  }
  return result;
}

async function fetchEstudo(postagemId?: string): Promise<EstudoPosicoesFinais | null> {
  let query = (supabase as any)
    .from("postagens")
    .select("id, titulo, status, publicar_em, fatos_snapshot, conteudo, tema_estudo, loteria_tag")
    .eq("loteria_tag", "Mega-Sena")
    .eq("tema_estudo", "analise_posicoes_finais")
    .in("status", ["publicado", "rascunho"])
    .not("fatos_snapshot", "is", null);

  if (postagemId) {
    query = query.eq("id", postagemId).limit(1);
  } else {
    query = query
      .order("publicar_em", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1);
  }

  const { data, error } = await query;
  if (error) throw error;
  const post = (data || [])[0];
  if (!post) return null;

  const snap = post.fatos_snapshot || {};
  const base = snap.base_geracao || {};
  const resumo: string = snap.resumo || post.conteudo || "";

  const proximoConcurso: number | null = snap.proximo_concurso ?? null;

  let proximoDataLabel: string | null = null;
  let premioEstimado: string | null = null;
  if (proximoConcurso) {
    const { data: prox } = await (supabase as any)
      .from("proximos_concursos")
      .select("numero_concurso, data_sorteio, premio_estimado")
      .eq("loteria", "megasena")
      .eq("numero_concurso", String(proximoConcurso))
      .maybeSingle();

    if (prox?.data_sorteio) {
      const d = new Date(prox.data_sorteio + "T00:00:00");
      proximoDataLabel = d.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    if (prox?.premio_estimado) {
      premioEstimado = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(prox.premio_estimado);
    }
  }

  return {
    id: post.id,
    titulo: post.titulo,
    status: post.status,
    publicar_em: post.publicar_em,
    proximo_concurso: proximoConcurso,
    ultimo_concurso: snap.ultimo_concurso ?? null,
    janela: parseJanela(resumo),
    trio: Array.isArray(base.fixar) ? base.fixar.map((n: any) => Number(n)) : [],
    apoio: Array.isArray(base.apoio) ? base.apoio.map((n: any) => Number(n)) : [],
    recomendacao: snap.recomendacao_direta ?? null,
    posicoes: parsePosicoes(resumo),
    proximo_data_label: proximoDataLabel,
    premio_estimado: premioEstimado,
  };
}

export function useEstudoPosicoesFinais(postagemId?: string) {
  return useQuery({
    queryKey: ["estudo-posicoes-finais", postagemId ?? "latest"],
    queryFn: () => fetchEstudo(postagemId),
    staleTime: 60_000,
  });
}

// Lista os últimos N estudos de "Posições Finais" para o seletor
export interface EstudoListItem {
  id: string;
  titulo: string | null;
  status: string;
  publicar_em: string | null;
  created_at: string;
  proximo_concurso: number | null;
}

export function useEstudosPosicoesFinaisLista(limit = 30) {
  return useQuery({
    queryKey: ["estudos-posicoes-finais-lista", limit],
    queryFn: async (): Promise<EstudoListItem[]> => {
      const { data, error } = await (supabase as any)
        .from("postagens")
        .select("id, titulo, status, publicar_em, created_at, fatos_snapshot")
        .eq("loteria_tag", "Mega-Sena")
        .eq("tema_estudo", "analise_posicoes_finais")
        .in("status", ["publicado", "rascunho"])
        .not("fatos_snapshot", "is", null)
        .order("publicar_em", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        titulo: p.titulo,
        status: p.status,
        publicar_em: p.publicar_em,
        created_at: p.created_at,
        proximo_concurso: p.fatos_snapshot?.proximo_concurso ?? null,
      }));
    },
    staleTime: 60_000,
  });
}
