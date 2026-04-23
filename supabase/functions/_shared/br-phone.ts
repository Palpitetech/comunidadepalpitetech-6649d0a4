// Normalização e geração de variantes para números BR.
// Compartilhado entre edge functions e usado pelo verify-whatsapp-number.
// IMPORTANTE: paridade com `validateCelularBR` em `src/lib/celular.ts`.

export function normalizeBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("55") && (n.length === 12 || n.length === 13)) {
    n = n.substring(2);
  }
  if (n.length !== 10 && n.length !== 11) return null;
  const ddd = parseInt(n.substring(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return null;
  return n;
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
