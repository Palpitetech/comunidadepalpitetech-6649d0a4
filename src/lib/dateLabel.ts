// Retorna "Hoje", "Ontem", "Amanhã" ou data formatada (dd/mm) para uma data ISO/YYYY-MM-DD
// Comparação feita em horário de Brasília (BRT, UTC-3).
export function labelDataRelativa(dataIso: string | null | undefined): string | null {
  if (!dataIso) return null;

  // Aceita "YYYY-MM-DD" ou ISO completo. Normaliza para YYYY-MM-DD em BRT.
  const ymdAlvo = (() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return dataIso;
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return null;
    // Converte para BRT (UTC-3)
    const brt = new Date(d.getTime() - 3 * 60 * 60 * 1000);
    return brt.toISOString().slice(0, 10);
  })();
  if (!ymdAlvo) return null;

  const agora = new Date();
  const brtAgora = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const hojeYmd = brtAgora.toISOString().slice(0, 10);

  const ontem = new Date(brtAgora);
  ontem.setUTCDate(ontem.getUTCDate() - 1);
  const ontemYmd = ontem.toISOString().slice(0, 10);

  const amanha = new Date(brtAgora);
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  const amanhaYmd = amanha.toISOString().slice(0, 10);

  if (ymdAlvo === hojeYmd) return "Hoje";
  if (ymdAlvo === ontemYmd) return "Ontem";
  if (ymdAlvo === amanhaYmd) return "Amanhã";

  const [y, m, d] = ymdAlvo.split("-");
  return `${d}/${m}`;
}
