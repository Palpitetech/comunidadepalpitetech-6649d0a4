import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const userId = String(body?.user_id ?? "").trim();
    const codigoInformado = String(body?.codigo ?? "").trim();
    const tipo = typeof body?.tipo === "string" ? body.tipo.trim() : "";

    if (!userId || !codigoInformado) {
      return jsonResponse({ sucesso: false, erro: "user_id e codigo são obrigatórios" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERRO VERIFICAÇÃO] Configuração ausente");
      return jsonResponse({ sucesso: false, erro: "Configuração do backend não encontrada" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("codigos_verificacao")
      .select("id, codigo, tipo, tentativas, expira_em")
      .eq("user_id", userId)
      .eq("usado", false)
      .gt("expira_em", new Date().toISOString());

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data: codigoData, error: fetchError } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("[ERRO VERIFICAÇÃO] Falha ao buscar código:", fetchError);
      return jsonResponse({ sucesso: false, erro: "Erro ao verificar código" }, 500);
    }

    if (!codigoData) {
      return jsonResponse({ sucesso: false, erro: "Código expirado ou inválido. Solicite um novo." }, 400);
    }

    const tentativasAtuais = Number(codigoData.tentativas ?? 0);
    if (tentativasAtuais >= 5) {
      await supabase
        .from("codigos_verificacao")
        .update({ usado: true })
        .eq("id", codigoData.id);

      return jsonResponse({ sucesso: false, erro: "Muitas tentativas incorretas. Solicite um novo código." }, 400);
    }

    const codigoEsperado = String(codigoData.codigo ?? "").trim();
    if (!codigoEsperado) {
      console.error("[ERRO VERIFICAÇÃO] Código armazenado ausente para", codigoData.id);
      return jsonResponse({ sucesso: false, erro: "Código inválido. Solicite um novo." }, 400);
    }

    if (codigoEsperado !== codigoInformado) {
      const proximasTentativas = tentativasAtuais + 1;
      const restantes = Math.max(0, 5 - proximasTentativas);

      await supabase
        .from("codigos_verificacao")
        .update({
          tentativas: proximasTentativas,
          ...(proximasTentativas >= 5 ? { usado: true } : {}),
        })
        .eq("id", codigoData.id);

      return jsonResponse(
        {
          sucesso: false,
          erro:
            proximasTentativas >= 5
              ? "Muitas tentativas incorretas. Solicite um novo código."
              : `Código incorreto. ${restantes} tentativa${restantes !== 1 ? "s" : ""} restante${restantes !== 1 ? "s" : ""}.`,
        },
        400,
      );
    }

    const { error: markUsedError } = await supabase
      .from("codigos_verificacao")
      .update({ usado: true })
      .eq("id", codigoData.id);

    if (markUsedError) {
      console.error("[ERRO VERIFICAÇÃO] Falha ao marcar código como usado:", markUsedError);
      return jsonResponse({ sucesso: false, erro: "Erro ao finalizar verificação" }, 500);
    }

    if (codigoData.tipo === "email") {
      const { error: profileError } = await supabase
        .from("perfis")
        .update({ email_verificado: true })
        .eq("id", userId);

      if (profileError) {
        console.error("[ERRO VERIFICAÇÃO] Falha ao atualizar perfil:", profileError);
        return jsonResponse({ sucesso: false, erro: "Erro ao atualizar verificação do e-mail" }, 500);
      }

      // Sincronizar com auth.users para evitar inconsistências
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: { email_verified: true }
      });

      if (authError) {
        console.error("[ERRO VERIFICAÇÃO] Falha ao sincronizar auth.users:", authError);
        // Não barramos o sucesso se o perfil já foi atualizado, mas logamos o erro
      }
    } else if (codigoData.tipo === "sms") {
      const { error: profileError } = await supabase
        .from("perfis")
        .update({ celular_verificado: true })
        .eq("id", userId);

      if (profileError) {
        console.error("[ERRO VERIFICAÇÃO] Falha ao atualizar perfil:", profileError);
        return jsonResponse({ sucesso: false, erro: "Erro ao atualizar verificação do celular" }, 500);
      }

      // Sincronizar com auth.users para celular se necessário
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        phone_confirm: true,
        user_metadata: { phone_verified: true }
      });

      if (authError) {
        console.error("[ERRO VERIFICAÇÃO] Falha ao sincronizar auth.users (celular):", authError);
      }
    }

    console.log(`[VERIFICAÇÃO] Usuário ${userId} verificado via ${codigoData.tipo} com sucesso`);
    return jsonResponse({ sucesso: true, mensagem: "Código verificado com sucesso!" });
  } catch (error) {
    console.error("[ERRO VERIFICAÇÃO] Erro inesperado:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ sucesso: false, erro: errorMessage }, 500);
  }
});
