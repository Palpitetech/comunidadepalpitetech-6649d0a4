import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function converterDataBR(dataBR: string): string {
  const partes = dataBR.split("/");
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return dataBR;
}

function parseApiResponse(raw: any): any {
  return Array.isArray(raw) ? raw[0] : raw;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_TOKEN = Deno.env.get("LOTOFACIL_API_TOKEN");
    if (!API_TOKEN) throw new Error("LOTOFACIL_API_TOKEN não configurado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let limit = 50;
    let fromLatest = false;
    let concursoEspecifico: number | null = null;
    let action: string | null = null;
    try {
      const body = await req.json();
      fromLatest = body.from_latest === true;
      limit = body.limit || 50;
      concursoEspecifico = body.concurso || null;
      action = body.action || null;
    } catch { /* sem body */ }

    // ── REPROCESS HISTORY ──────────────────────────────────────
    if (action === 'reprocess_history') {
      const LOTERIA = 'lotomania';
      console.log(`[REPROCESS] Iniciando reprocessamento ${LOTERIA}...`);
      const { data: existentes } = await supabase.from('resultados_loterias').select('concurso').eq('loteria', LOTERIA).order('concurso', { ascending: true });
      if (!existentes?.length) return new Response(JSON.stringify({ success: true, reprocessados: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      let reprocessados = 0, erros = 0;
      for (const item of existentes) {
        try {
          const res = await fetch(`https://apiloterias.com.br/app/v2/resultado?loteria=${LOTERIA}&token=${API_TOKEN}&concurso=${item.concurso}`);
          if (!res.ok) { erros++; continue; }
          const resultado = parseApiResponse(await res.json());
          const reg = buildRegistro(resultado);
          const dezenas = reg.dezenas.map((d: any) => typeof d === 'string' ? parseInt(d, 10) : d);
          const unified = { loteria: LOTERIA, concurso: reg.concurso, data_sorteio: reg.data_sorteio, dezenas, acumulou: reg.acumulou, valor_acumulado: reg.valor_acumulado || null, valor_estimado_proximo: reg.valor_estimado_proximo || null, valor_premio_principal: reg.valor_premio_principal || null, data_proximo_concurso: reg.data_proximo_concurso || null, premiacao_json: reg.premiacao_json || [] };
          const { error } = await supabase.from('resultados_loterias').upsert(unified, { onConflict: 'loteria,concurso' });
          if (error) { erros++; } else { reprocessados++; }
          await new Promise(r => setTimeout(r, 300));
        } catch { erros++; }
      }
      return new Response(JSON.stringify({ success: true, reprocessados, erros }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // ── END REPROCESS ──────────────────────────────────────────

    const TABLE = "resultados_lotomania";
    const LOTERIA_PARAM = "lotomania";
    const LOTERIA_LABEL = "Lotomania";

    const latestUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=${LOTERIA_PARAM}&token=${API_TOKEN}&concurso=ultimos1`;
    console.log(`[${LOTERIA_LABEL}] Buscando último concurso da API...`);

    const apiResponse = await fetch(latestUrl);
    if (!apiResponse.ok) throw new Error(`Erro ao buscar API: ${apiResponse.status}`);

    const ultimoResultado = parseApiResponse(await apiResponse.json());
    const ultimoConcursoAPI = parseInt(ultimoResultado.numero_concurso, 10);
    console.log(`[${LOTERIA_LABEL}] Último concurso API: ${ultimoConcursoAPI}`);

    function buildRegistro(resultado: any) {
      const dezenas = resultado.dezenas.map((d: string) => d.padStart(2, "0")).sort();
      const dataSorteio = converterDataBR(resultado.data_concurso);
      const premiacao_json = (resultado.premiacao || []).map((p: any) => ({
        faixa: p.faixa,
        descricao: p.quantidade_acertos ?? p.descricao ?? `${p.faixa}ª faixa`,
        ganhadores: p.numero_ganhadores ?? p.ganhadores ?? 0,
        valorPremio: p.valor_premio ?? p.valorPremio ?? 0,
      }));
      return {
        concurso: parseInt(resultado.numero_concurso, 10),
        data_sorteio: dataSorteio,
        dezenas,
        acumulou: resultado.acumulou ?? false,
        valor_acumulado: resultado.valor_acumulado || 0,
        valor_premio_principal: resultado.premiacao?.[0]?.valor_premio || resultado.premiacao?.[0]?.valor || 0,
        data_proximo_concurso: resultado.data_proximo_concurso ? converterDataBR(resultado.data_proximo_concurso) : null,
        valor_estimado_proximo: resultado.valor_estimado_proximo || 0,
        premiacao_json,
      };
    }

    if (concursoEspecifico) {
      const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=${LOTERIA_PARAM}&token=${API_TOKEN}&concurso=${concursoEspecifico}`;
      const res = await fetch(concursoUrl);
      if (!res.ok) throw new Error(`Erro ao buscar concurso ${concursoEspecifico}: ${res.status}`);
      const resultado = parseApiResponse(await res.json());
      const registro = buildRegistro(resultado);
      const { error } = await supabase.from(TABLE).upsert(registro, { onConflict: "concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);
      return new Response(JSON.stringify({ message: "Concurso sincronizado", concurso: concursoEspecifico }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let concursosParaBuscar: number[] = [];

    if (fromLatest) {
      for (let i = ultimoConcursoAPI; i > ultimoConcursoAPI - limit && i > 0; i--) {
        const { data: existe } = await supabase.from(TABLE).select("concurso").eq("concurso", i).maybeSingle();
        if (!existe) concursosParaBuscar.push(i);
      }
      concursosParaBuscar = concursosParaBuscar.sort((a, b) => a - b);
    } else {
      const { data: ultimoLocal } = await supabase.from(TABLE).select("concurso").order("concurso", { ascending: false }).limit(1).maybeSingle();
      const ultimoConcursoLocal = ultimoLocal?.concurso || 0;
      console.log(`[${LOTERIA_LABEL}] Último concurso local: ${ultimoConcursoLocal}`);
      if (ultimoConcursoAPI <= ultimoConcursoLocal) {
        return new Response(JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoLocal }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      for (let i = ultimoConcursoLocal + 1; i <= ultimoConcursoAPI; i++) {
        concursosParaBuscar.push(i);
        if (concursosParaBuscar.length >= limit) break;
      }
    }

    if (concursosParaBuscar.length === 0) {
      return new Response(JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoAPI }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[${LOTERIA_LABEL}] Buscando ${concursosParaBuscar.length} concursos...`);
    const resultadosParaInserir: any[] = [];

    for (const concursoId of concursosParaBuscar) {
      try {
        let resultado;
        if (concursoId === ultimoConcursoAPI) {
          resultado = ultimoResultado;
        } else {
          const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=${LOTERIA_PARAM}&token=${API_TOKEN}&concurso=${concursoId}`;
          const res = await fetch(concursoUrl);
          if (!res.ok) { console.error(`Erro ao buscar concurso ${concursoId}: ${res.status}`); continue; }
          resultado = parseApiResponse(await res.json());
        }
        resultadosParaInserir.push(buildRegistro(resultado));
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`[${LOTERIA_LABEL}] Erro concurso ${concursoId}:`, err);
      }
    }

    if (resultadosParaInserir.length > 0) {
      const { error } = await supabase.from(TABLE).upsert(resultadosParaInserir, { onConflict: "concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);
    }

    const ultimoConcursoInserido = resultadosParaInserir.length > 0 ? resultadosParaInserir[resultadosParaInserir.length - 1]?.concurso : ultimoConcursoAPI;

    if (resultadosParaInserir.length === 1) {
      const webhookSecret = Deno.env.get("NOTIFICATIONS_WEBHOOK_SECRET");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (webhookSecret && supabaseAnonKey) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseAnonKey}`, "x-webhook-secret": webhookSecret },
            body: JSON.stringify({ tipo: "resultado_novo", titulo: `🎲 ${LOTERIA_LABEL} — Concurso ${ultimoConcursoInserido}`, mensagem: `Concurso ${ultimoConcursoInserido} disponível!`, loteria: LOTERIA_PARAM, concurso_id: ultimoConcursoInserido }),
          });
          console.log(`[PUSH] ✅ ${LOTERIA_LABEL} concurso ${ultimoConcursoInserido}`);
        } catch (e) { console.error("[PUSH] Erro:", e); }
      }
    }

    const syncProximosSecret = Deno.env.get("NOTIFICATIONS_WEBHOOK_SECRET");
    if (syncProximosSecret) {
      fetch(`${supabaseUrl}/functions/v1/sync-proximos-concursos?secret=${syncProximosSecret}`, { method: "POST" }).catch(err => console.error(`[${LOTERIA_LABEL}] Erro proximos:`, err));
    }

    return new Response(JSON.stringify({ message: "Sincronização concluída", loteria: LOTERIA_LABEL, inseridos: resultadosParaInserir.length, ultimo_concurso: ultimoConcursoInserido }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[Lotomania] Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
