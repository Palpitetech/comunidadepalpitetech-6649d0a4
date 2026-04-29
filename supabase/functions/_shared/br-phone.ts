// Normalização canônica de telefones brasileiros.
// Usado por TODA edge function que recebe ou envia número (webhooks Kirvano,
// receive-lead, sync-group-members, group-member-webhook, group-promote-admin,
// import-csv-users, cadastro-iniciar-whatsapp, verificar-codigo,
// check-overdue-subscriptions, process-queue, verify-whatsapp-number).
//
// Regras de saída:
//   - canonical: 10 ou 11 dígitos, SEM DDI. É o formato salvo no banco.
//   - e164:      "55" + canonical. É o formato enviado para a Evolution API.
//
// Regras de validação (BR):
//   - Limpa máscara, espaço, "+", "00".
//   - Se vier com DDI 55 e total 12/13, remove o 55.
//   - Aceita 10 ou 11 dígitos finais.
//   - DDD entre 11 e 99.
//   - Celular: 11 dígitos com 3º dígito = 9.
//     Se vier 10 dígitos e o 3º for 6/7/8/9, INSERE o 9 automaticamente
//     (números antigos de celular sem o 9). Vira 11.
//   - Fixo: 10 dígitos com 3º dígito 2/3/4/5.
//   - Rejeita sequências triviais (todos iguais, "1234567890...").
//
// IMPORTANTE: paridade com `validateCelularBR` em `src/lib/celular.ts`.

export type PhoneNormalizeReason =
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid_ddd"
  | "invalid_mobile"
  | "sequence"
  | "non_br";

export type PhoneNormalizeResult =
  | {
      ok: true;
      canonical: string; // 10 ou 11 dígitos sem DDI
      e164: string; // "55" + canonical
      ddd: number;
      isMobile: boolean;
    }
  | { ok: false; reason: PhoneNormalizeReason };

const TRIVIAL_SEQUENCES = new Set([
  "1234567890",
  "12345678901",
  "0987654321",
  "09876543210",
]);

/**
 * Normaliza qualquer telefone BR para o formato canônico.
 * Retorna `{ ok: false, reason }` se o número não for válido como telefone BR.
 */
export function normalizePhoneBR(
  raw: string | null | undefined,
): PhoneNormalizeResult {
  if (!raw) return { ok: false, reason: "empty" };

  // Strip tudo que não é dígito (cobre +, espaço, parênteses, traço, "+55", "00 55").
  let n = String(raw).replace(/\D/g, "");
  if (!n) return { ok: false, reason: "empty" };

  // "00" no início é prefixo internacional (00 + 55 + ...).
  if (n.startsWith("00")) n = n.slice(2);

  // DDI 55: aceita 12 (fixo) ou 13 (celular) dígitos com 55 na frente.
  if (n.startsWith("55") && (n.length === 12 || n.length === 13)) {
    n = n.slice(2);
  }

  // Se ainda for muito longo, pode ser número internacional não-BR.
  if (n.length > 11) return { ok: false, reason: "non_br" };
  if (n.length < 10) return { ok: false, reason: "too_short" };

  // Sequências óbvias.
  if (/^(\d)\1+$/.test(n)) return { ok: false, reason: "sequence" };
  if (TRIVIAL_SEQUENCES.has(n)) return { ok: false, reason: "sequence" };

  const ddd = parseInt(n.slice(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { ok: false, reason: "invalid_ddd" };
  }

  const third = n.charAt(2);

  if (n.length === 10) {
    // 10 dígitos: pode ser fixo (3º = 2-5) OU celular antigo sem o 9 (3º = 6-9).
    if (third >= "6" && third <= "9") {
      // Insere o 9 e vira celular de 11 dígitos.
      n = n.slice(0, 2) + "9" + n.slice(2);
      return {
        ok: true,
        canonical: n,
        e164: `55${n}`,
        ddd,
        isMobile: true,
      };
    }
    if (third >= "2" && third <= "5") {
      // Fixo válido.
      return {
        ok: true,
        canonical: n,
        e164: `55${n}`,
        ddd,
        isMobile: false,
      };
    }
    return { ok: false, reason: "invalid_mobile" };
  }

  // n.length === 11: celular obrigatoriamente com 9 no 3º dígito.
  if (third !== "9") return { ok: false, reason: "invalid_mobile" };

  return {
    ok: true,
    canonical: n,
    e164: `55${n}`,
    ddd,
    isMobile: true,
  };
}

/**
 * Atalho: retorna o canonical (10 ou 11 dígitos sem DDI) ou null se inválido.
 * Use ao salvar no banco (profiles.celular, leads.phone, etc).
 */
export function toCanonicalBR(raw: string | null | undefined): string | null {
  const r = normalizePhoneBR(raw);
  return r.ok ? r.canonical : null;
}

/**
 * Atalho: retorna "55" + canonical, pronto para enviar à Evolution API,
 * ou null se inválido. Use no process-queue / send.
 */
export function toEvolutionBR(raw: string | null | undefined): string | null {
  const r = normalizePhoneBR(raw);
  return r.ok ? r.e164 : null;
}

// ============================================================================
// Compatibilidade com o helper antigo (verify-whatsapp-number e tests).
// ============================================================================

/** @deprecated use `toCanonicalBR` */
export function normalizeBR(raw: string): string | null {
  return toCanonicalBR(raw);
}

/**
 * Gera todas as variantes plausíveis para casar com o número salvo no banco
 * (com/sem 9, com/sem prefixo 55).
 */
export function variants(n: string): string[] {
  const set = new Set<string>();
  set.add(n);
  set.add(`55${n}`);
  if (n.length === 11 && n[2] === "9") {
    const sem9 = n.substring(0, 2) + n.substring(3);
    set.add(sem9);
    set.add(`55${sem9}`);
  } else if (n.length === 10) {
    const com9 = n.substring(0, 2) + "9" + n.substring(2);
    set.add(com9);
    set.add(`55${com9}`);
  }
  return Array.from(set);
}
