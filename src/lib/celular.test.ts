import { describe, it, expect } from "vitest";
import { validateCelularBR, formatCelularMask } from "./celular";

describe("validateCelularBR", () => {
  describe("formatos válidos", () => {
    it("aceita 11 dígitos puros (DDD + 9 + 8 dígitos)", () => {
      const r = validateCelularBR("11987654321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });

    it("aceita 10 dígitos puros (fixo) — sem 9", () => {
      const r = validateCelularBR("1133334444");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("551133334444");
    });

    it("aceita número com prefixo 55 já incluso (13 dígitos)", () => {
      const r = validateCelularBR("5511987654321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });

    it("aceita número com prefixo 55 + fixo (12 dígitos)", () => {
      const r = validateCelularBR("551133334444");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("551133334444");
    });

    it("aceita máscara completa (XX) 9XXXX-XXXX", () => {
      const r = validateCelularBR("(11) 98765-4321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });

    it("aceita máscara internacional +55 (11) 98765-4321", () => {
      const r = validateCelularBR("+55 (11) 98765-4321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });

    it("aceita pontos e traços misturados", () => {
      const r = validateCelularBR("11.98765.4321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });

    it("aceita espaços extras no meio", () => {
      const r = validateCelularBR("  11 9 8765 4321  ");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });

    it("aceita DDD limite inferior (11)", () => {
      const r = validateCelularBR("11999990000");
      expect(r.ok).toBe(true);
    });

    it("aceita DDD limite superior (99)", () => {
      const r = validateCelularBR("99987654321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5599987654321");
    });

    it("celular antigo de 10 dígitos sem o 9 → insere automaticamente", () => {
      const r = validateCelularBR("1187654321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });

    it("aceita prefixo 0055 internacional", () => {
      const r = validateCelularBR("005511987654321");
      expect(r.ok).toBe(true);
      expect(r.normalized).toBe("5511987654321");
    });
  });

  describe("formatos inválidos", () => {
    it("rejeita string vazia", () => {
      expect(validateCelularBR("").ok).toBe(false);
    });

    it("rejeita menos de 10 dígitos", () => {
      const r = validateCelularBR("119876543");
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/10 ou 11 dígitos/);
    });

    it("rejeita mais de 11 dígitos sem prefixo 55", () => {
      const r = validateCelularBR("119876543210");
      expect(r.ok).toBe(false);
    });

    it("rejeita DDD < 11", () => {
      const r = validateCelularBR("10987654321");
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/DDD/);
    });

    it("rejeita DDD = 00", () => {
      const r = validateCelularBR("00987654321");
      expect(r.ok).toBe(false);
    });

    it("rejeita celular de 11 dígitos sem o 9 na 3ª posição", () => {
      const r = validateCelularBR("11887654321");
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/9 após o DDD/);
    });

    it("rejeita números com todos dígitos iguais", () => {
      expect(validateCelularBR("11111111111").ok).toBe(false);
      expect(validateCelularBR("99999999999").ok).toBe(false);
    });

    it("rejeita sequências óbvias 12345678901 e 1234567890", () => {
      expect(validateCelularBR("12345678901").ok).toBe(false);
      expect(validateCelularBR("1234567890").ok).toBe(false);
    });

    it("rejeita só letras/símbolos", () => {
      expect(validateCelularBR("abcdefg").ok).toBe(false);
      expect(validateCelularBR("()-.").ok).toBe(false);
    });
  });

  describe("paridade com edge function (chip_celulares)", () => {
    // Garante que o número normalizado bate com o que a edge tenta no banco.
    // Edge function gera variantes (com/sem 9, com/sem 55).
    it("normaliza sempre para 55 + DDD + número", () => {
      const inputs = [
        "11987654321",
        "5511987654321",
        "(11) 98765-4321",
        "+55 11 98765-4321",
        "+5511987654321",
      ];
      for (const i of inputs) {
        const r = validateCelularBR(i);
        expect(r.ok).toBe(true);
        expect(r.normalized).toBe("5511987654321");
      }
    });

    it("preserva fixo de 10 dígitos sem inventar o 9", () => {
      const r = validateCelularBR("1133334444");
      expect(r.normalized).toBe("551133334444");
      // edge gera variante com 9 — mas validateCelularBR não invade essa lógica
      expect(r.normalized).not.toContain("5511933334444");
    });
  });
});

describe("formatCelularMask", () => {
  it("não mascara até 2 dígitos", () => {
    expect(formatCelularMask("1")).toBe("1");
    expect(formatCelularMask("11")).toBe("11");
  });

  it("aplica parênteses depois de 2 dígitos", () => {
    expect(formatCelularMask("119")).toBe("(11) 9");
    expect(formatCelularMask("1198")).toBe("(11) 98");
  });

  it("aplica traço depois de 7 dígitos", () => {
    expect(formatCelularMask("11987654")).toBe("(11) 98765-4");
    expect(formatCelularMask("11987654321")).toBe("(11) 98765-4321");
  });

  it("ignora caracteres não numéricos no input", () => {
    expect(formatCelularMask("(11) 98765-4321")).toBe("(11) 98765-4321");
    expect(formatCelularMask("+55 11 98765 4321")).toBe("(55) 11987-6543");
    // Note: a máscara não remove o "55" — isso é responsabilidade do validate.
  });

  it("trunca em 11 dígitos", () => {
    expect(formatCelularMask("119876543219999")).toBe("(11) 98765-4321");
  });

  it("aceita string vazia", () => {
    expect(formatCelularMask("")).toBe("");
  });
});
