import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { labelDataRelativa } from "./dateLabel";

// Helper: fixa "agora" do sistema (em UTC) e roda fn.
// Lembrete: BRT = UTC-3. Então "hoje BRT" = data do (UTC - 3h).
function comAgora(utcIso: string) {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(utcIso));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}

describe("labelDataRelativa - fuso de Brasília (BRT, UTC-3)", () => {
  describe("meio-dia BRT em 23/04 (15:00 UTC)", () => {
    comAgora("2026-04-23T15:00:00Z");

    it("retorna 'Hoje' para a data atual em BRT", () => {
      expect(labelDataRelativa("2026-04-23")).toBe("Hoje");
    });

    it("retorna 'Ontem' para o dia anterior em BRT", () => {
      expect(labelDataRelativa("2026-04-22")).toBe("Ontem");
    });

    it("retorna 'Amanhã' para o próximo dia em BRT", () => {
      expect(labelDataRelativa("2026-04-24")).toBe("Amanhã");
    });

    it("retorna dd/mm para datas mais distantes", () => {
      expect(labelDataRelativa("2026-04-30")).toBe("30/04");
      expect(labelDataRelativa("2026-04-15")).toBe("15/04");
    });

    it("retorna null para entrada vazia", () => {
      expect(labelDataRelativa(null)).toBe(null);
      expect(labelDataRelativa(undefined)).toBe(null);
      expect(labelDataRelativa("")).toBe(null);
    });
  });

  describe("virada de madrugada — 00h30 UTC (21h30 BRT do dia anterior)", () => {
    // 23/04 00:30 UTC = 22/04 21:30 BRT. Ainda é "22/04" no Brasil.
    comAgora("2026-04-23T00:30:00Z");

    it("'Hoje' = 22/04 (BRT), não 23/04 (UTC)", () => {
      expect(labelDataRelativa("2026-04-22")).toBe("Hoje");
    });

    it("'Amanhã' = 23/04 BRT", () => {
      expect(labelDataRelativa("2026-04-23")).toBe("Amanhã");
    });

    it("'Ontem' = 21/04 BRT", () => {
      expect(labelDataRelativa("2026-04-21")).toBe("Ontem");
    });
  });

  describe("virada de madrugada — 02h59 UTC (23h59 BRT do dia anterior)", () => {
    // 23/04 02:59 UTC = 22/04 23:59 BRT. Último minuto antes de virar.
    comAgora("2026-04-23T02:59:00Z");

    it("'Hoje' ainda é 22/04 BRT", () => {
      expect(labelDataRelativa("2026-04-22")).toBe("Hoje");
    });

    it("23/04 é 'Amanhã' (faltam 1 min para virar)", () => {
      expect(labelDataRelativa("2026-04-23")).toBe("Amanhã");
    });
  });

  describe("virada de madrugada — 03h00 UTC (00h00 BRT)", () => {
    // 23/04 03:00 UTC = 23/04 00:00 BRT. Acabou de virar.
    comAgora("2026-04-23T03:00:00Z");

    it("'Hoje' agora é 23/04 BRT", () => {
      expect(labelDataRelativa("2026-04-23")).toBe("Hoje");
    });

    it("22/04 virou 'Ontem'", () => {
      expect(labelDataRelativa("2026-04-22")).toBe("Ontem");
    });
  });

  describe("aceita ISO completo (timestamptz)", () => {
    comAgora("2026-04-23T15:00:00Z");

    it("ISO meio-dia UTC do dia 23/04 → 'Hoje' BRT", () => {
      // 23/04 12:00 UTC = 23/04 09:00 BRT
      expect(labelDataRelativa("2026-04-23T12:00:00Z")).toBe("Hoje");
    });

    it("ISO 02:00 UTC do dia 24/04 → 'Hoje' (ainda 23/04 BRT)", () => {
      // 24/04 02:00 UTC = 23/04 23:00 BRT
      expect(labelDataRelativa("2026-04-24T02:00:00Z")).toBe("Hoje");
    });

    it("ISO 03:00 UTC do dia 24/04 → 'Amanhã' (24/04 BRT 00h)", () => {
      expect(labelDataRelativa("2026-04-24T03:00:00Z")).toBe("Amanhã");
    });
  });

  describe("virada de mês", () => {
    // 01/05 01:00 UTC = 30/04 22:00 BRT
    comAgora("2026-05-01T01:00:00Z");

    it("'Hoje' = 30/04 BRT", () => {
      expect(labelDataRelativa("2026-04-30")).toBe("Hoje");
    });

    it("'Amanhã' = 01/05 BRT", () => {
      expect(labelDataRelativa("2026-05-01")).toBe("Amanhã");
    });

    it("'Ontem' = 29/04 BRT", () => {
      expect(labelDataRelativa("2026-04-29")).toBe("Ontem");
    });
  });

  describe("entradas inválidas", () => {
    comAgora("2026-04-23T15:00:00Z");

    it("retorna null para string totalmente inválida", () => {
      expect(labelDataRelativa("não é data")).toBe(null);
    });
  });
});
