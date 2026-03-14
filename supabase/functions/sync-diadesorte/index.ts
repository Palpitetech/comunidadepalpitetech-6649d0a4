import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function converterDataBR(dataBR: string): string {
  const partes = dataBR.split("/");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return dataBR;
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
    try {
      const body = await req.json();
      fromLatest = body.from_latest === true;
      limit = body.limit || 50;
      concursoEspecifico = body.concurso || null;
    } catch {
      // sem body
    }

    const TABLE = "resultados_diadesorte";
    const LOTERIA_PARAM = "diadesorte";
    const LOTERIA_LABEL = "Dia de Sorte";

    const latestUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=${LOTERIA_PARAM}&token=${API_TOKEN}&concurso=ultimos1`;
    console.log(`[${LOTERIA_LABEL}] Buscando último concurso da API...`);

    const apiResponse = await fetch(latestUrl);
    if (!apiResponse.ok) throw new Error(`Erro ao buscar API: ${apiResponse.status}`);

    const ultimoResultado = await apiResponse.json();
    const ultimoConcursoAPI = ultimoResultado.numero_concurso;
    console.log(`[${LOTERIA_LABEL}] Último concurso API: ${ultimoConcursoAPI}`);

    if (concursoEspecifico) {
      const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=${LOTERIA_PARAM}&token=${API_TOKEN}&concurso=${concursoEspecifico}`;
      const res = await fetch(concursoUrl);
      if (!res.ok) throw new Error(`Erro ao buscar concurso ${concursoEspecifico}: ${res.status}`);

      const resultado = await res.json();
      const dezenas = resultado.dezenas.map((d: string) => d.padStart(2, "0")).sort();
      const dataSorteio = converterDataBR(resultado.data_concurso);

      const registro = {
        concurso: resultado.numero_concurso,
        data_sorteio: dataSorteio,
        dezenas,
        mes_sorte: resultado.mes_sorte || null,
        acumulou: resultado.acumulou ?? false,
        valor_acumulado: resultado.valor_acumulado || 0,
        valor_premio_principal: resultado.premiacao?.[0]?.valor || 0,
        data_proximo_concurso: resultado.data_proximo_concurso ? converterDataBR(resultado.data_proximo_concurso) : null,
        valor_estimado_proximo: resultado.valor_estimado_proximo || 0,
      };

      const { error } = await supabase.from(TABLE).upsert(registro, { onConflict: "concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);

      return new Response(
        JSON.stringify({ message: "Concurso sincronizado", concurso: concursoEspecifico }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let concursosParaBuscar: number[] = [];

    if (fromLatest) {
      for (let i = ultimoConcursoAPI; i > ultimoConcursoAPI - limit && i > 0; i--) {
        const { data: existe } = await supabase.from(TABLE).select("concurso").eq("concurso", i).maybeSingle();
        if (!existe) concursosParaBuscar.push(i);
      }
      concursosParaBuscar = concursosParaBuscar.sort((a, b) => a - b);
    } else {
      const { data: ultimoLocal } = await supabase
        .from(TABLE)
        .select("concurso")
        .order("concurso", { ascending: false })
        .limit(1)
        .maybeSingle();

      const ultimoConcursoLocal = ultimoLocal?.concurso || 0;
      console.log(`[${LOTERIA_LABEL}] Último concurso local: ${ultimoConcursoLocal}`);

      if (ultimoConcursoAPI <= ultimoConcursoLocal) {
        return new Response(
          JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoLocal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (let i = ultimoConcursoLocal + 1; i <= ultimoConcursoAPI; i++) {
        concursosParaBuscar.push(i);
        if (concursosParaBuscar.length >= limit) break;
      }
    }

    if (concursosParaBuscar.length === 0) {
      return new Response(
        JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoAPI }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
          resultado = await res.json();
        }

        const dezenas = resultado.dezenas.map((d: string) => d.padStart(2, "0")).sort();
        const dataSorteio = converterDataBR(resultado.data_concurso);

        resultadosParaInserir.push({
          concurso: resultado.numero_concurso,
          data_sorteio: dataSorteio,
          dezenas,
          mes_sorte: resultado.mes_sorte || null,
          acumulou: resultado.acumulou ?? false,
          valor_acumulado: resultado.valor_acumulado || 0,
          valor_premio_principal: resultado.premiacao?.[0]?.valor || 0,
          data_proximo_concurso: resultado.data_proximo_concurso ? converterDataBR(resultado.data_proximo_concurso) : null,
          valor_estimado_proximo: resultado.valor_estimado_proximo || 0,
        });

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`[${LOTERIA_LABEL}] Erro concurso ${concursoId}:`, err);
      }
    }

    if (resultadosParaInserir.length > 0) {
      const { error } = await supabase.from(TABLE).upsert(resultadosParaInserir, { onConflict: "concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);
    }

    const ultimoConcursoInserido = resultadosParaInserir.length > 0
      ? resultadosParaInserir[resultadosParaInserir.length - 1]?.concurso
      : ultimoConcursoAPI;

    if (resultadosParaInserir.length === 1) {
      const webhookSecret = Deno.env.get("NOTIFICATIONS_WEBHOOK_SECRET");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (webhookSecret && supabaseAnonKey) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseAnonKey}`,
              "x-webhook-secret": webhookSecret,
            },
            body: JSON.stringify({
              tipo: "resultado_novo",
              titulo: `🍀 ${LOTERIA_LABEL} — Concurso ${ultimoConcursoInserido}`,
              mensagem: `Concurso ${ultimoConcursoInserido} disponível! Confira agora.`,
              loteria: LOTERIA_PARAM,
              concurso_id: ultimoConcursoInserido,
            }),
          });
          if (res.ok) console.log(`[PUSH] ✅ ${LOTERIA_LABEL} concurso ${ultimoConcursoInserido}`);
          else console.error(`[PUSH] Falha: ${res.status}`);
        } catch (e) {
          console.error("[PUSH] Erro:", e);
        }
      }
    }

    // Fire and forget: atualizar próximos concursos
    const syncProximosSecret = Deno.env.get("NOTIFICATIONS_WEBHOOK_SECRET");
    if (syncProximosSecret) {
      fetch(
        `${supabaseUrl}/functions/v1/sync-proximos-concursos?secret=${syncProximosSecret}`,
        { method: "POST" }
      ).catch(err => console.error(`[${LOTERIA_LABEL}] Erro ao atualizar proximos:`, err));
    }

    return new Response(
      JSON.stringify({
        message: "Sincronização concluída",
        loteria: LOTERIA_LABEL,
        inseridos: resultadosParaInserir.length,
        ultimo_concurso: ultimoConcursoInserido,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Dia de Sorte] Erro na sincronização:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
