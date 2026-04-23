// =============================================================================
// Glossário oficial — definições padronizadas em TODAS as loterias.
// Editar aqui propaga para Lotofácil, Mega-Sena e novas loterias.
// =============================================================================

export const DEFINICAO_QUENTE_FRIA =
  `🎯 O que é "Quente" e "Fria"\n` +
  `🔥 **Dezenas Quentes** são as dezenas com **maior presença** nos últimos sorteios — ` +
  `saíram mais e tendem a continuar aparecendo com frequência.\n` +
  `❄️ **Dezenas Frias** são as que estão **saindo pouco** nos últimos sorteios — ` +
  `têm presença abaixo do esperado na janela atual.\n` +
  `⚠️ Lembre: matematicamente cada dezena tem a mesma chance a cada sorteio. ` +
  `Use Quentes/Frias como filtro de tendência, não como certeza.`;

// =============================================================================
// Rodapé universal: dados do próximo concurso
// Anexado ao final de TODO post de qualquer loteria.
// =============================================================================
export function montarRodapeProximoConcurso(
  loteria_tag: string,
  numero_concurso: string | null,
  data_sorteio: string | null,
  premio_estimado: number | null,
): string {
  if (!numero_concurso || !data_sorteio) return "";

  // Força BRT para evitar shift de dia
  const data = new Date(`${data_sorteio}T12:00:00-03:00`);
  const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  const diaSemana = diasSemana[data.getDay()];
  const dataFmt = data.toLocaleDateString("pt-BR");

  const premioFmt =
    premio_estimado != null && premio_estimado > 0
      ? premio_estimado.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
        })
      : null;

  let bloco = `\n\n📅 Próximo Concurso\n${loteria_tag} ${numero_concurso} • ${diaSemana}, ${dataFmt}`;
  if (premioFmt) bloco += `\n💰 Prêmio estimado: ${premioFmt}`;
  return bloco;
}
