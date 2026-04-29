// Validação e formatação de celular brasileiro.
// IMPORTANTE: a regra aqui é IDÊNTICA a `normalizePhoneBR` em
// supabase/functions/_shared/br-phone.ts. Mantenha as duas em sincronia.
//
// Comportamento:
//   - Aceita máscara, +55, 0055, com/sem o 9 inicial.
//   - Insere o 9 automaticamente em celulares de 10 dígitos (3º dígito 6-9).
//   - Retorna `normalized` no formato "55" + canonical (E.164 sem o "+").

export interface CelularValidation {
  ok: boolean;
  /** Número normalizado pronto pra salvar no banco (com prefixo `55`). */
  normalized?: string;
  /** Mensagem amigável quando inválido. */
  reason?: string;
}

export function validateCelularBR(value: string): CelularValidation {
  if (!value) {
    return { ok: false, reason: "Celular obrigatório" };
  }

  let n = value.replace(/\D/g, "");
  if (!n) return { ok: false, reason: "Celular obrigatório" };

  // "00" prefixo internacional
  if (n.startsWith("00")) n = n.slice(2);

  // Remove DDI 55 se vier com ele
  if (n.startsWith("55") && (n.length === 12 || n.length === 13)) {
    n = n.slice(2);
  }

  if (n.length > 11) {
    return { ok: false, reason: "Celular inválido" };
  }
  if (n.length < 10) {
    return { ok: false, reason: "Celular precisa ter 10 ou 11 dígitos com DDD" };
  }

  // Sequências óbvias
  if (/^(\d)\1+$/.test(n)) {
    return { ok: false, reason: "Celular inválido" };
  }
  if (n === "12345678901" || n === "1234567890") {
    return { ok: false, reason: "Celular inválido" };
  }

  const ddd = parseInt(n.slice(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { ok: false, reason: "DDD inválido" };
  }

  const third = n.charAt(2);

  if (n.length === 10) {
    // Celular antigo sem o 9 → insere automaticamente.
    if (third >= "6" && third <= "9") {
      n = n.slice(0, 2) + "9" + n.slice(2);
    } else if (third < "2" || third > "5") {
      // Não é fixo válido nem celular reconhecível.
      return { ok: false, reason: "Celular inválido" };
    }
    // Fixo (3º dígito 2-5) é aceito como está.
  } else if (n.length === 11 && third !== "9") {
    return { ok: false, reason: "Celular deve começar com 9 após o DDD" };
  }

  return { ok: true, normalized: `55${n}` };
}

/** Aplica máscara `(00) 00000-0000` enquanto o usuário digita. */
export function formatCelularMask(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
}
