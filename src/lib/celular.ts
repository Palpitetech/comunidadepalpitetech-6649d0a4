// Validação e formatação de celular brasileiro.
// IMPORTANTE: a regra aqui é IDÊNTICA à `validateCelular` em
// supabase/functions/receive-lead/index.ts. Mantenha as duas em sincronia.

export interface CelularValidation {
  ok: boolean;
  /** Número normalizado pronto pra salvar no banco (com prefixo `55`). */
  normalized?: string;
  /** Mensagem amigável quando inválido. */
  reason?: string;
}

export function validateCelularBR(value: string): CelularValidation {
  const digits = value.replace(/\D/g, "");
  let normalized = digits;

  // Remove prefixo 55 se já vier com ele
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    normalized = digits.substring(2);
  }

  if (normalized.length < 10 || normalized.length > 11) {
    return { ok: false, reason: "Celular precisa ter 10 ou 11 dígitos com DDD" };
  }

  const ddd = parseInt(normalized.substring(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { ok: false, reason: "DDD inválido" };
  }

  // 11 dígitos → terceiro tem que ser 9 (celular)
  if (normalized.length === 11 && normalized[2] !== "9") {
    return { ok: false, reason: "Celular deve começar com 9 após o DDD" };
  }

  // Sequências óbvias (todos iguais ou 1234567890/12345678901)
  if (/^(\d)\1+$/.test(normalized)) {
    return { ok: false, reason: "Celular inválido" };
  }
  if (normalized === "12345678901" || normalized === "1234567890") {
    return { ok: false, reason: "Celular inválido" };
  }

  return { ok: true, normalized: `55${normalized}` };
}

/** Aplica máscara `(00) 00000-0000` enquanto o usuário digita. */
export function formatCelularMask(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
}
