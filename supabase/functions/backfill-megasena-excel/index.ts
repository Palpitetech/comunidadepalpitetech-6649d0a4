import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Constantes idênticas a sync-megasena/index.ts
const PRIMOS_MEGASENA = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59,
];
const MOLDURA_MEGASENA = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 21, 31, 41,
  20, 30, 40, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
];
const FIBONACCI_MEGASENA = [1, 2, 3, 5, 8, 13, 21, 34, 55];

const LOTERIA = "megasena";
const TABLE = "resultados_loterias";
const BATCH_SIZE = 500;

function isPar(n: number) { return n % 2 === 0; }
function calcularIndicadores(dezenas: number[], anteriores?: number[]) {
  const pares = dezenas.filter(isPar).length;
  const sorted = [...dezenas].sort((a, b) => a - b);
  let seq = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) seq++;
  }
  return {
    qtd_pares: pares,
    qtd_impares: 6 - pares,
    qtd_primos: dezenas.filter((d) => PRIMOS_MEGASENA.includes(d)).length,
    qtd_moldura: dezenas.filter((d) => MOLDURA_MEGASENA.includes(d)).length,
    qtd_fibonacci: dezenas.filter((d) => FIBONACCI_MEGASENA.includes(d)).length,
    qtd_repetidas: anteriores
      ? dezenas.filter((d) => anteriores.includes(d)).length
      : 0,
    soma: dezenas.reduce((a, b) => a + b, 0),
    sequencias: seq,
  };
}

// "11/03/1996" -> "1996-03-11"
function dataBRtoISO(raw: unknown): string | null {
  if (!raw) return null;
  if (raw instanceof Date) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, "0");
    const d = String(raw.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // tenta yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

// "R$1.234.567,89" -> 1234567.89  ; "R$0,00" -> 0
function parseMoeda(raw: unknown): number {
  if (raw == null || raw === "") return 0;
  if (typeof raw === "number") return raw;
  let s = String(raw).trim();
  if (!s) return 0;
  s = s.replace(/R\$/gi, "").replace(/\s/g, "");
  s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseInteger(raw: unknown): number {
  if (raw == null || raw === "") return 0;
  if (typeof raw === "number") return Math.trunc(raw);
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

interface RowOut {
  loteria: string;
  concurso: number;
  data_sorteio: string;
  dezenas: number[];
  acumulou: boolean;
  valor_acumulado: number | null;
  valor_estimado_proximo: number | null;
  local_sorteio: string | null;
  premiacao_json: unknown[];
  locais_ganhadores: unknown[];
  qtd_pares: number;
  qtd_impares: number;
  qtd_primos: number;
  qtd_moldura: number;
  qtd_fibonacci: number;
  qtd_repetidas: number;
  soma: number;
  sequencias: number;
}

function pickCol(row: Record<string, unknown>, ...names: string[]): unknown {
  for (const n of names) {
    if (row[n] !== undefined) return row[n];
    // tenta case-insensitive
    const k = Object.keys(row).find(
      (key) => key.toLowerCase().trim() === n.toLowerCase().trim(),
    );
    if (k) return row[k];
  }
  return undefined;
}

function buildPremiacao(row: Record<string, unknown>) {
  const faixas: any[] = [];
  const ganh6 = parseInteger(pickCol(row, "Ganhadores 6 acertos"));
  const rateio6 = parseMoeda(pickCol(row, "Rateio 6 acertos"));
  const ganh5 = parseInteger(pickCol(row, "Ganhadores 5 acertos"));
  const rateio5 = parseMoeda(pickCol(row, "Rateio 5 acertos"));
  const ganh4 = parseInteger(pickCol(row, "Ganhadores 4 acertos"));
  const rateio4 = parseMoeda(pickCol(row, "Rateio 4 acertos"));

  faixas.push({ faixa: "6 acertos", ganhadores: ganh6, valor_premio: rateio6 });
  faixas.push({ faixa: "5 acertos", ganhadores: ganh5, valor_premio: rateio5 });
  faixas.push({ faixa: "4 acertos", ganhadores: ganh4, valor_premio: rateio4 });
  return faixas;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1) Auth: requer admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Carregar XLSX
    let workbook: XLSX.WorkBook;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) throw new Error("Arquivo 'file' não enviado");
      const buf = new Uint8Array(await file.arrayBuffer());
      workbook = XLSX.read(buf, { type: "array", cellDates: true });
    } else {
      const body = await req.json();
      const b64: string = body?.file_base64 ?? "";
      if (!b64) throw new Error("file_base64 obrigatório");
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      workbook = XLSX.read(bin, { type: "array", cellDates: true });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // FIX: O XLSX da Caixa vem com !ref incorreto (só A1:T1). Recalcular o range
    // a partir das chaves de células reais para que sheet_to_json leia tudo.
    const cellKeys = Object.keys(sheet).filter((k) => /^[A-Z]+\d+$/.test(k));
    if (cellKeys.length > 0) {
      let maxRow = 0;
      let maxCol = 0;
      for (const k of cellKeys) {
        const m = k.match(/^([A-Z]+)(\d+)$/);
        if (!m) continue;
        const col = m[1]
          .split("")
          .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
        const row = parseInt(m[2], 10) - 1;
        if (row > maxRow) maxRow = row;
        if (col > maxCol) maxCol = col;
      }
      sheet["!ref"] = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: maxCol, r: maxRow },
      });
      console.log(`[backfill-megasena] !ref recalculado: ${sheet["!ref"]}`);
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      defval: "",
    });
    console.log(`[backfill-megasena] Lidas ${rows.length} linhas`);

    // 3) Normalizar
    const normalizadas: RowOut[] = [];
    const erros: { linha: number; concurso?: number; motivo: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const concurso = parseInteger(pickCol(r, "Concurso"));
        if (!concurso) {
          erros.push({ linha: i + 2, motivo: "Concurso vazio/inválido" });
          continue;
        }
        const dataIso = dataBRtoISO(pickCol(r, "Data do Sorteio", "Data Sorteio"));
        if (!dataIso) {
          erros.push({ linha: i + 2, concurso, motivo: "Data inválida" });
          continue;
        }
        const dezenas = [
          parseInteger(pickCol(r, "Bola1")),
          parseInteger(pickCol(r, "Bola2")),
          parseInteger(pickCol(r, "Bola3")),
          parseInteger(pickCol(r, "Bola4")),
          parseInteger(pickCol(r, "Bola5")),
          parseInteger(pickCol(r, "Bola6")),
        ].filter((d) => d >= 1 && d <= 60);
        if (dezenas.length !== 6) {
          erros.push({ linha: i + 2, concurso, motivo: "Dezenas inválidas" });
          continue;
        }
        dezenas.sort((a, b) => a - b);

        const ganh6 = parseInteger(pickCol(r, "Ganhadores 6 acertos"));
        const acumuladoSeis = parseMoeda(pickCol(r, "Acumulado 6 acertos"));
        const estimativa = parseMoeda(pickCol(r, "Estimativa prêmio", "Estimativa premio"));
        const cidadeUf = String(pickCol(r, "Cidade / UF", "Cidade/UF") ?? "").trim();

        normalizadas.push({
          loteria: LOTERIA,
          concurso,
          data_sorteio: dataIso,
          dezenas,
          acumulou: ganh6 === 0,
          valor_acumulado: acumuladoSeis || null,
          valor_estimado_proximo: estimativa || null,
          local_sorteio: cidadeUf || null,
          premiacao_json: buildPremiacao(r),
          locais_ganhadores: [],
          ...calcularIndicadores(dezenas),
        });
      } catch (e) {
        erros.push({ linha: i + 2, motivo: String((e as Error).message) });
      }
    }

    // 4) Ordena por concurso e calcula qtd_repetidas (compara com concurso N-1 do próprio arquivo)
    normalizadas.sort((a, b) => a.concurso - b.concurso);
    for (let i = 1; i < normalizadas.length; i++) {
      if (normalizadas[i].concurso === normalizadas[i - 1].concurso + 1) {
        const prev = normalizadas[i - 1].dezenas;
        const cur = normalizadas[i].dezenas;
        normalizadas[i].qtd_repetidas = cur.filter((d) => prev.includes(d)).length;
      }
    }

    // 5) Upsert em batches usando service role
    const admin = createClient(supabaseUrl, serviceKey);
    let inseridos = 0;
    const erroBatches: string[] = [];

    for (let i = 0; i < normalizadas.length; i += BATCH_SIZE) {
      const batch = normalizadas.slice(i, i + BATCH_SIZE);
      const { error } = await admin
        .from(TABLE)
        .upsert(batch, { onConflict: "loteria,concurso" });
      if (error) {
        console.error(`[backfill] Erro batch ${i}:`, error.message);
        erroBatches.push(`batch ${i}-${i + batch.length}: ${error.message}`);
      } else {
        inseridos += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Backfill concluído",
        total_lidos: rows.length,
        normalizados: normalizadas.length,
        upserted: inseridos,
        erros_linhas: erros.length,
        amostra_erros: erros.slice(0, 10),
        erros_batches: erroBatches,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[backfill-megasena-excel]", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
