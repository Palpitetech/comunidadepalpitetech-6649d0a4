import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeBR, variants } from "../_shared/br-phone.ts";

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
  // edge case: 11 dígitos mas o 3º não é 9 (não é celular válido,
  // mas variants não valida — só gera o que faz sentido)
  const v = variants("11887654321");
  assert(v.includes("11887654321"));
  assert(v.includes("5511887654321"));
  assertEquals(v.length, 2);
});

Deno.test("paridade: normalizeBR + variants cobre formatos comuns de chip_celulares", () => {
  // Simula busca: usuário digita em qualquer formato → normaliza → casa com qualquer
  // formato salvo no banco.
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
    // Independente do formato salvo, alguma variante vai casar.
    assert(v.includes("11987654321"));
    assert(v.includes("5511987654321"));
  }
});
