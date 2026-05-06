// =============================================================================
// Helper centralizado para determinar o PRÓXIMO CONCURSO REAL de uma loteria.
//
// Problema resolvido: após o sorteio (~20h BRT), a API externa pode demorar
// horas para publicar o resultado. Nesse intervalo, `resultados_loterias`
// ainda não tem o resultado novo e `proximoConcurso = ultimoConcurso + 1`
// aponta para o concurso que JÁ FOI SORTEADO. Este helper cruza com
// `proximos_concursos.data_sorteio` para detectar isso e corrigir.
//
// Regra BRT:
//  - data_sorteio < hoje BRT            → sorteio já aconteceu
//  - data_sorteio == hoje BRT E hora >= 21  → sorteio provavelmente já aconteceu
//  - caso contrário                     → sorteio ainda não aconteceu
// =============================================================================

export interface ProximoConcursoInfo {
  /** Número do concurso realmente "próximo" (ainda não sorteado). */
  proximoConcurso: number;
  /** Último concurso cujo resultado JÁ ESTÁ no banco. */
  ultimoConcursoDB: number;
  /** Data do sorteio do próximo concurso (YYYY-MM-DD), se conhecida. */
  dataSorteio: string | null;
  /** Prêmio estimado, se conhecido. */
  premioEstimado: number | null;
  /** true se detectamos que o concurso que ANTES era "próximo" já foi sorteado. */
  sorteioJaOcorreu: boolean;
}

/**
 * Retorna a data BRT atual como "YYYY-MM-DD" e a hora BRT (0-23).
 */
function agoraBRT(): { dataBRT: string; horaBRT: number } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dataBRT = fmt.format(now); // "YYYY-MM-DD"

  const fmtH = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  });
  const horaBRT = parseInt(fmtH.format(now), 10);

  return { dataBRT, horaBRT };
}

/**
 * Verifica se a data de sorteio já passou em BRT.
 * Retorna true se:
 *   - data_sorteio é de um dia anterior ao dia BRT atual
 *   - data_sorteio é hoje BRT e já são 21h+ BRT (sorteio às ~20h + margem)
 */
function sorteioJaPassou(dataSorteio: string | null): boolean {
  if (!dataSorteio) return false;

  const { dataBRT, horaBRT } = agoraBRT();

  // Normaliza para YYYY-MM-DD
  const ds = dataSorteio.slice(0, 10);

  if (ds < dataBRT) return true; // dia anterior
  if (ds === dataBRT && horaBRT >= 21) return true; // mesmo dia, após 21h BRT
  return false;
}

/**
 * Determina o próximo concurso real de uma loteria, levando em conta
 * se o sorteio "próximo" registrado já aconteceu ou não.
 */
export async function getProximoConcursoReal(
  supabase: any,
  loteria: string,
): Promise<ProximoConcursoInfo> {
  // 1) Último concurso com resultado no banco
  const { data: ultimoArr } = await supabase
    .from("resultados_loterias")
    .select("concurso")
    .eq("loteria", loteria)
    .order("concurso", { ascending: false })
    .limit(1);

  const ultimoConcursoDB = ultimoArr?.[0]?.concurso ?? 0;

  // 2) Dados de proximos_concursos
  const { data: prox } = await supabase
    .from("proximos_concursos")
    .select("numero_concurso, data_sorteio, premio_estimado")
    .eq("loteria", loteria)
    .maybeSingle();

  const proxNumero = prox?.numero_concurso
    ? parseInt(String(prox.numero_concurso), 10)
    : ultimoConcursoDB + 1;
  const proxData = prox?.data_sorteio ?? null;
  const proxPremio = prox?.premio_estimado ?? null;

  // 3) Verificar se o sorteio do "próximo" já aconteceu
  const jaOcorreu = sorteioJaPassou(proxData);

  if (jaOcorreu) {
    // O concurso que era "próximo" já foi sorteado mas o resultado
    // ainda não está no banco. O REAL próximo é +1.
    return {
      proximoConcurso: proxNumero + 1,
      ultimoConcursoDB,
      dataSorteio: null, // não sabemos a data do próximo-próximo
      premioEstimado: null,
      sorteioJaOcorreu: true,
    };
  }

  return {
    proximoConcurso: proxNumero,
    ultimoConcursoDB,
    dataSorteio: proxData,
    premioEstimado: proxPremio,
    sorteioJaOcorreu: false,
  };
}
