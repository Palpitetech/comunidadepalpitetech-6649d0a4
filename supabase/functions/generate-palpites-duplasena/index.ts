// =============================================================================
// /gerador-duplasena — wrapper sobre o pipeline determinístico shared.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  checkAuthAndQuota,
  incrementarQuotaGerador,
} from "../_shared/gerador/auth-and-quota.ts";
import { gerarPalpitesDeterministicos } from "../_shared/gerador/pipeline.ts";
import { clampQtdDezenas } from "../_shared/gerador/lottery-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await checkAuthAndQuota({
      authHeader: req.headers.get("Authorization"),
      loteria: "duplasena",
      requireGeradorFeature: true,
      skipQuotaRead: true,
    });
    if (!auth.ok) return json(auth.status, auth.body);

    const body = await req.json().catch(() => ({}));
    const quantidade = Math.min(Math.max(Number(body.quantidade) || 1, 1), 250);
    const qtdDezenas = clampQtdDezenas("duplasena", Number(body.qtdDezenas));
    const periodoAnalise = Math.min(Math.max(Number(body.periodoAnalise) || 50, 1), 500);

    let remainingToday = 999;
    if (!auth.isAdmin) {
      const q = await incrementarQuotaGerador(auth.supabaseAdmin, auth.userId, auth.maxPerDay);
      if (q.error) return json(500, { error: "Erro ao validar quota" });
      if (q.limitReached) {
        return json(429, {
          error: "Limite diário atingido",
          remaining_today: 0,
          max_per_day: auth.maxPerDay,
        });
      }
      remainingToday = q.remaining;
    }

    const result = await gerarPalpitesDeterministicos({
      loteria: "duplasena",
      quantidade,
      qtdDezenas,
      periodoAnalise,
      filtros: {
        dezenasFixas: body.dezenasFiexas,
        dezenasExcluidas: body.dezenasExcluidas,
        pedidoEspecial: body.pedidoEspecial,
      },
      userId: auth.userId,
      supabaseAdmin: auth.supabaseAdmin,
      edgeFunction: "generate-palpites-duplasena",
    });

    return json(200, {
      success: true,
      jogos: result.jogos.map((dezenas) => ({ dezenas })),
      estrategia: result.estrategia,
      remaining_today: remainingToday,
      max_per_day: auth.maxPerDay,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    if (msg === "SEM_RESULTADOS") return json(500, { error: "Sem resultados históricos suficientes" });
    if (msg === "GERACAO_FALHOU") return json(500, { error: "Não foi possível gerar palpites com esses filtros" });
    console.error("[generate-palpites-duplasena] erro:", error);
    return json(500, { error: msg });
  }
});
