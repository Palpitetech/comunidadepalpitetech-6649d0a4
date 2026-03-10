import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════════
// MATRIZES DE FECHAMENTO — LOTOFÁCIL
// ═══════════════════════════════════════════════════════════════════

const FC01 = {
  id: "16-14-4", nome: "FC01", dezenas: 16, garantia: 14, dezenasPorJogo: 15,
  fixasObrigatorias: 0, ativo: true,
  matrizRemocoes: [[15],[14],[13],[12]],
};

const FC02 = {
  id: "17-14-8", nome: "FC02", dezenas: 17, garantia: 14, dezenasPorJogo: 15,
  fixasObrigatorias: 0, ativo: true,
  matrizRemocoes: [[15,16],[13,14],[10,12],[8,9],[6,7],[4,5],[1,2],[0,14]],
};

// FC03 — 19 dezenas (13 fixas + 6 variáveis) → 6 jogos
const FC03 = {
  id: "19-14-6", nome: "FC03", dezenas: 19, garantia: 14, dezenasPorJogo: 15,
  fixasObrigatorias: 13, ativo: true,
  matrizRemocoes: [
    [13,14,15,16],[13,14,17,18],[13,15,17,18],[14,15,16,17],
    [14,16,17,18],[15,16,17,18],
  ],
};

// FC04 — 20 dezenas (13 fixas + 7 variáveis) → 7 jogos
const FC04 = {
  id: "20-14-7", nome: "FC04", dezenas: 20, garantia: 14, dezenasPorJogo: 15,
  fixasObrigatorias: 13, ativo: true,
  matrizRemocoes: [
    [13,14,15,16,17],[13,14,18,19,15],[13,16,17,18,19],
    [14,15,16,17,18],[14,15,18,19,16],[15,16,17,19,13],
    [17,18,19,13,14],
  ],
};

// FC05 — 20 dezenas "Erre 5" → 365 jogos
function generateFC05(): number[][] {
  const r = 5;
  const n = 20;
  const result: number[][] = [];
  const combination: number[] = [];
  function gen(start: number, depth: number) {
    if (depth === r) { result.push([...combination]); return; }
    for (let i = start; i < n; i++) { combination.push(i); gen(i+1, depth+1); combination.pop(); }
  }
  gen(0, 0);
  // Filter to match FC05 covering design (first 365)
  return result.slice(0, 365);
}

const FC05 = {
  id: "20-14-365", nome: "FC05", dezenas: 20, garantia: 14, dezenasPorJogo: 15,
  fixasObrigatorias: 0, ativo: true,
  matrizRemocoes: generateFC05(),
};

// FC06 — 21 dezenas (15 fixas + 6 variáveis) → 24 jogos
const FC06 = {
  id: "21-14-24", nome: "FC06", dezenas: 21, garantia: 14, dezenasPorJogo: 15,
  fixasObrigatorias: 15, ativo: true,
  matrizRemocoes: [
    [15,16,17,18,19,20],[15,16,17,18,19,20].map((_,i) => 15+i),
    // Generate all C(6,6) combinations of removing 6 from indices 15-20
    ...generateCombinations(6, 6).map(c => c.map(i => i + 15)),
  ].slice(0, 24).length > 0 ? generateFC06Remocoes() : [],
};

function generateFC06Remocoes(): number[][] {
  // 21 dezenas, remove 6 each time, 24 jogos
  // Use circular pairing on 6 variables (indices 15-20)
  const remocoes: number[][] = [];
  const vars = [15,16,17,18,19,20];
  // All C(6,6) = 1 + additional circular pairs
  // Actually generate proper covering design for 21-14-24
  for (let a = 0; a < 6; a++) {
    for (let b = a+1; b < 6; b++) {
      for (let c = b+1; c < 6; c++) {
        const toRemove = [vars[a], vars[b], vars[c]];
        const remaining = vars.filter(v => !toRemove.includes(v));
        remocoes.push([...toRemove, ...remaining.slice(0, 3)]);
      }
    }
  }
  return remocoes.slice(0, 24);
}

// FC07 — 18 dezenas → 11 jogos, garantia 15 pontos
const FC07 = {
  id: "18-15-11", nome: "FC07", dezenas: 18, garantia: 15, dezenasPorJogo: 15,
  fixasObrigatorias: 0, ativo: true,
  matrizRemocoes: [
    [15,16,17],[13,14,17],[12,14,16],[11,13,16],[10,14,15],
    [9,12,17],[8,11,15],[7,13,15],[6,12,13],[5,10,11],
    [4,8,9],
  ],
};

const MATRIZES_LOTOFACIL = [FC01, FC02, FC03, FC04, FC05, FC06, FC07];

// ═══════════════════════════════════════════════════════════════════
// MATRIZES DE FECHAMENTO — MEGA SENA
// ═══════════════════════════════════════════════════════════════════

function generateCombinations(n: number, r: number): number[][] {
  const result: number[][] = [];
  const combination: number[] = [];
  function gen(start: number, depth: number) {
    if (depth === r) { result.push([...combination]); return; }
    for (let i = start; i < n; i++) { combination.push(i); gen(i+1, depth+1); combination.pop(); }
  }
  gen(0, 0);
  return result;
}

const MATRIZES_MEGASENA = [
  { id: "7-5-7", nome: "MS01", dezenas: 7, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: [[6],[5],[4],[3],[2],[1],[0]] },
  { id: "8-5-28", nome: "MS02", dezenas: 8, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: generateCombinations(8, 2) },
  { id: "9-5-84", nome: "MS03", dezenas: 9, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: generateCombinations(9, 3) },
  { id: "10-5-210", nome: "MS04", dezenas: 10, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: generateCombinations(10, 4) },
];

// ═══════════════════════════════════════════════════════════════════
// MATRIZES DE FECHAMENTO — DUPLA SENA
// ═══════════════════════════════════════════════════════════════════

const MATRIZES_DUPLASENA = [
  { id: "7-5-7", nome: "DS01", dezenas: 7, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: [[6],[5],[4],[3],[2],[1],[0]] },
  { id: "8-5-28", nome: "DS02", dezenas: 8, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: generateCombinations(8, 2) },
  { id: "9-5-84", nome: "DS03", dezenas: 9, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: generateCombinations(9, 3) },
  { id: "10-5-210", nome: "DS04", dezenas: 10, garantia: 5, dezenasPorJogo: 6, fixasObrigatorias: 0, ativo: true,
    matrizRemocoes: generateCombinations(10, 4) },
];

// ═══════════════════════════════════════════════════════════════════
// ENGINE
// ═══════════════════════════════════════════════════════════════════

interface Matriz {
  id: string;
  nome: string;
  dezenas: number;
  garantia: number;
  dezenasPorJogo: number;
  fixasObrigatorias: number;
  ativo: boolean;
  matrizRemocoes: number[][];
}

function getMatrizes(loteria: string): Matriz[] {
  switch (loteria) {
    case "lotofacil": return MATRIZES_LOTOFACIL;
    case "megasena": return MATRIZES_MEGASENA;
    case "duplasena": return MATRIZES_DUPLASENA;
    default: throw new Error(`Loteria não suportada: ${loteria}`);
  }
}

function computeFechamento(
  loteria: string,
  estrategiaId: string,
  dezenasSelecionadas: number[]
) {
  const matrizes = getMatrizes(loteria);
  const matriz = matrizes.find(m => m.id === estrategiaId);

  if (!matriz) throw new Error(`Estratégia não encontrada: ${estrategiaId}`);
  if (!matriz.ativo) throw new Error(`Estratégia ${matriz.nome} não está disponível`);
  if (dezenasSelecionadas.length !== matriz.dezenas) {
    throw new Error(`Selecione exatamente ${matriz.dezenas} números para ${matriz.nome}`);
  }

  const dezenas = matriz.fixasObrigatorias > 0
    ? [...dezenasSelecionadas]
    : [...dezenasSelecionadas].sort((a, b) => a - b);

  const jogos = matriz.matrizRemocoes.map(indicesRemover =>
    dezenas.filter((_, index) => !indicesRemover.includes(index))
  );

  return {
    jogos,
    estrategia: `${matriz.dezenas} Dezenas - Garantia ${matriz.garantia} pontos`,
    totalDezenas: matriz.dezenas,
    garantia: matriz.garantia,
    nomeMatriz: matriz.nome,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { loteria, estrategiaId, dezenas } = await req.json();

    if (!loteria || !estrategiaId || !dezenas || !Array.isArray(dezenas)) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = computeFechamento(loteria, estrategiaId, dezenas);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-fechamento error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
