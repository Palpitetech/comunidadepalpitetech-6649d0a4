import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  normalizeBR,
  normalizePhoneBR,
  toCanonicalBR,
  toEvolutionBR,
  variants,
} from "../_shared/br-phone.ts";

// ============================================================================
// Compatibilidade: normalizeBR (deprecated, agora wrapper de toCanonicalBR)
// ============================================================================

Deno.test("normalizeBR — aceita 11 dígitos puros", () => {
  assertEquals(normalizeBR("11987654321"), "11987654321");
});

Deno.test("normalizeBR — aceita 10 dígitos (fixo)", () => {
  assertEquals(normalizeBR("1133334444"), "1133334444");
});

Deno.test("normalizeBR — remove prefixo 55 (13 dígitos)", () => {
  assertEquals(normalizeBR("5511987654321"), "11987654321");
});

Deno.test("normalizeBR — remove prefixo 55 (12 dígitos, fixo)", () => {
  assertEquals(normalizeBR("551133334444"), "1133334444");
});

Deno.test("normalizeBR — limpa máscara completa", () => {
  assertEquals(normalizeBR("(11) 98765-4321"), "11987654321");
});

Deno.test("normalizeBR — limpa formato internacional", () => {
  assertEquals(normalizeBR("+55 11 98765-4321"), "11987654321");
});

Deno.test("normalizeBR — rejeita comprimento inválido", () => {
  assertEquals(normalizeBR("119876543"), null);
  assertEquals(normalizeBR("119876543210"), null);
  assertEquals(normalizeBR(""), null);
});

Deno.test("normalizeBR — rejeita DDD < 11", () => {
  assertEquals(normalizeBR("10987654321"), null);
  assertEquals(normalizeBR("00987654321"), null);
});

// ============================================================================
// normalizePhoneBR — comportamento expandido
// ============================================================================

Deno.test("normalizePhoneBR — celular 11 dígitos válido", () => {
  const r = normalizePhoneBR("11987654321");
  assert(r.ok);
  if (r.ok) {
    assertEquals(r.canonical, "11987654321");
    assertEquals(r.e164, "5511987654321");
    assertEquals(r.ddd, 11);
    assertEquals(r.isMobile, true);
  }
});

Deno.test("normalizePhoneBR — celular 10 dígitos sem o 9 → insere automaticamente", () => {
  const r = normalizePhoneBR("1187654321");
  assert(r.ok);
  if (r.ok) {
    assertEquals(r.canonical, "11987654321");
    assertEquals(r.e164, "5511987654321");
    assertEquals(r.isMobile, true);
  }
});

Deno.test("normalizePhoneBR — fixo 10 dígitos permanece sem o 9", () => {
  const r = normalizePhoneBR("1133334444");
  assert(r.ok);
  if (r.ok) {
    assertEquals(r.canonical, "1133334444");
    assertEquals(r.e164, "551133334444");
    assertEquals(r.isMobile, false);
  }
});

Deno.test("normalizePhoneBR — aceita +55 e máscara", () => {
  const r = normalizePhoneBR("+55 (51) 98185-4281");
  assert(r.ok);
  if (r.ok) assertEquals(r.canonical, "51981854281");
});

Deno.test("normalizePhoneBR — aceita prefixo 0055 internacional", () => {
  const r = normalizePhoneBR("005511987654321");
  assert(r.ok);
  if (r.ok) assertEquals(r.canonical, "11987654321");
});

Deno.test("normalizePhoneBR — celular DDD 51 (RS) sem o 9 vira 11 dígitos", () => {
  const r = normalizePhoneBR("5181854281");
  assert(r.ok);
  if (r.ok) {
    assertEquals(r.canonical, "51981854281");
    assertEquals(r.isMobile, true);
  }
});

Deno.test("normalizePhoneBR — vazio retorna empty", () => {
  const r = normalizePhoneBR("");
  assert(!r.ok);
  if (!r.ok) assertEquals(r.reason, "empty");
});

Deno.test("normalizePhoneBR — DDD inválido", () => {
  const r = normalizePhoneBR("0987654321");
  assert(!r.ok);
  if (!r.ok) assertEquals(r.reason, "invalid_ddd");
});

Deno.test("normalizePhoneBR — 11 dígitos sem 9 no 3º → invalid_mobile", () => {
  const r = normalizePhoneBR("11887654321");
  assert(!r.ok);
  if (!r.ok) assertEquals(r.reason, "invalid_mobile");
});

Deno.test("normalizePhoneBR — sequência trivial rejeitada", () => {
  const r = normalizePhoneBR("99999999999");
  assert(!r.ok);
  if (!r.ok) assertEquals(r.reason, "sequence");
});

Deno.test("normalizePhoneBR — número internacional não-BR", () => {
  const r = normalizePhoneBR("3315551234567"); // 13 dígitos não-55
  assert(!r.ok);
  if (!r.ok) assertEquals(r.reason, "non_br");
});

// ============================================================================
// Atalhos toCanonicalBR / toEvolutionBR
// ============================================================================

Deno.test("toCanonicalBR — formato salvo no banco", () => {
  assertEquals(toCanonicalBR("+55 (11) 98765-4321"), "11987654321");
  assertEquals(toCanonicalBR("1187654321"), "11987654321"); // insere 9
  assertEquals(toCanonicalBR("invalid"), null);
});

Deno.test("toEvolutionBR — formato enviado pra Evolution API", () => {
  assertEquals(toEvolutionBR("11987654321"), "5511987654321");
  assertEquals(toEvolutionBR("5511987654321"), "5511987654321");
  assertEquals(toEvolutionBR("(11) 98765-4321"), "5511987654321");
  assertEquals(toEvolutionBR("1187654321"), "5511987654321"); // insere 9
  assertEquals(toEvolutionBR(""), null);
});

// ============================================================================
// variants — inalterado
// ============================================================================

Deno.test("variants — celular 11 dígitos: gera 4 variantes (com/sem 9, com/sem 55)", () => {
  const v = variants("11987654321");
  assert(v.includes("11987654321"));
  assert(v.includes("5511987654321"));
  assert(v.includes("1187654321")); // sem o 9
  assert(v.includes("551187654321"));
  assertEquals(v.length, 4);
});

Deno.test("variants — fixo 10 dígitos: gera 4 variantes (com/sem 9 inserido, com/sem 55)", () => {
  const v = variants("1133334444");
  assert(v.includes("1133334444"));
  assert(v.includes("551133334444"));
  assert(v.includes("11933334444")); // com o 9 inserido
  assert(v.includes("5511933334444"));
  assertEquals(v.length, 4);
});

Deno.test("variants — celular sem o 9 na 3ª posição: gera só 2 variantes", () => {
  const v = variants("11887654321");
  assert(v.includes("11887654321"));
  assert(v.includes("5511887654321"));
  assertEquals(v.length, 2);
});

Deno.test("paridade: normalizeBR + variants cobre formatos comuns de chip_celulares", () => {
  const inputs = [
    "11987654321",
    "5511987654321",
    "(11) 98765-4321",
    "+55 (11) 98765-4321",
  ];
  for (const i of inputs) {
    const norm = normalizeBR(i);
    assertEquals(norm, "11987654321");
    const v = variants(norm!);
    assert(v.includes("11987654321"));
    assert(v.includes("5511987654321"));
  }
});
