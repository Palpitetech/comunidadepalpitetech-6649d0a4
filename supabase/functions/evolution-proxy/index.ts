import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/** Valida campos críticos de um proxy antes de enviar à Evolution */
function validateProxyFields(
  proxy: { id?: string; host: string; port: number | string; protocol: string }
): { valid: true } | { valid: false; invalidFields: string[] } {
  const invalidFields: string[] = [];
  const allowedProtocols = ["http", "https", "socks4", "socks5"];

  const host = typeof proxy.host === "string" ? proxy.host.trim() : "";
  if (!host) invalidFields.push("host");

  const portNum = typeof proxy.port === "number" ? proxy.port : parseInt(String(proxy.port ?? "").trim(), 10);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) invalidFields.push("port");

  const protocol = typeof proxy.protocol === "string" ? proxy.protocol.trim().toLowerCase() : "";
  if (!protocol || !allowedProtocols.includes(protocol)) invalidFields.push("protocol");

  if (invalidFields.length > 0) return { valid: false, invalidFields };
  return { valid: true };
}

/** Aplica um proxy à instância na Evolution API */
async function applyProxyToInstance(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  proxy: { id?: string; label?: string; host: string; port: number; protocol: string; username?: string | null; password?: string | null } | null
): Promise<{ ok: boolean; status: number; body: any }> {
  // Guard: valida proxy antes de chamar Evolution
  if (proxy) {
    const check = validateProxyFields(proxy);
    if (!check.valid) {
      console.error(
        `[applyProxyToInstance] PROXY INVÁLIDO id=${proxy.id ?? "?"} label=${proxy.label ?? "?"} motivos=${check.invalidFields.join(",")}`
      );
      return {
        ok: false,
        status: 0,
        body: {
          message: "proxy_invalid",
          invalidFields: check.invalidFields,
          proxyId: proxy.id ?? null,
          proxyLabel: proxy.label ?? null,
        },
      };
    }
  }

  const url = `${evolutionUrl}/proxy/set/${instanceName}`;
  const body = proxy
    ? {
        enabled: true,
        host: String(proxy.host).trim(),
        port: String(proxy.port).trim(),
        protocol: String(proxy.protocol).trim().toLowerCase(),
        username: proxy.username ? String(proxy.username) : "",
        password: proxy.password ? String(proxy.password) : "",
      }
    : {
        enabled: false,
        host: "",
        port: "80",
        protocol: "http",
        username: "",
        password: "",
      };

  console.log(`[applyProxyToInstance] POST ${url}`, JSON.stringify({ ...body, password: body.password ? "***" : "" }));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: evolutionKey },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: data };
}

/** Lookup instance UUID by evolution_instance_id */
async function getInstanceUuid(evolutionInstanceId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("whatsapp_instances")
    .select("id")
    .eq("evolution_instance_id", evolutionInstanceId)
    .maybeSingle();
  return data?.id ?? null;
}

/** Reserva proxy para a instância (atomic claim) */
async function claimProxyForInstance(instanceUuid: string): Promise<
  | { success: true; proxy: { id: string; label: string; protocol: string; host: string; port: number; username: string | null; password: string | null }; reused: boolean }
  | { success: false; error: string }
> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("claim_proxy_for_instance", { p_instance_id: instanceUuid });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error || "claim_failed" };
  return { success: true, proxy: data.proxy, reused: !!data.reused };
}

async function releaseProxyForInstance(instanceUuid: string) {
  const supabase = getSupabase();
  await supabase.rpc("release_proxy_for_instance", { p_instance_id: instanceUuid });
}

/** Auto-configure the group-member-webhook on an instance if not yet done */
async function ensureWebhookConfigured(
  instanceName: string,
  evolutionUrl: string,
  evolutionKey: string
) {
  const supabase = getSupabase();

  // Check if already configured
  const { data: inst } = await supabase
    .from("whatsapp_instances")
    .select("id, webhook_configured")
    .eq("evolution_instance_id", instanceName)
    .limit(1)
    .single();

  if (!inst || inst.webhook_configured) return;

  const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/handle-chat-webhook`;

  try {
    const res = await fetch(
      `${evolutionUrl}/webhook/set/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionKey,
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: true,
            events: ["GROUP_PARTICIPANTS_UPDATE", "MESSAGES_UPSERT"],
          },
        }),
      }
    );

    if (res.ok) {
      await supabase
        .from("whatsapp_instances")
        .update({ webhook_configured: true })
        .eq("id", inst.id);
      console.log(`[evolution-proxy] Webhook configured for ${instanceName}`);
    } else {
      console.error(`[evolution-proxy] Failed to set webhook for ${instanceName}: HTTP ${res.status}`);
    }
  } catch (err: any) {
    console.error(`[evolution-proxy] Error setting webhook for ${instanceName}:`, err.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Evolution API não configurada" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const reqBody = await req.json();
    const { action, instanceName, number, text } = reqBody;

    // === Health check: valida formato da URL e conectividade com a Evolution ===
    if (action === "healthCheck") {
      const rawUrl = EVOLUTION_API_URL;
      const issues: { type: "error" | "warning"; message: string }[] = [];

      const hasTrailingSlash = rawUrl.endsWith("/");
      const normalizedUrl = hasTrailingSlash ? rawUrl.replace(/\/+$/, "") : rawUrl;

      if (hasTrailingSlash) {
        issues.push({
          type: "warning",
          message: "EVOLUTION_API_URL contém barra '/' no final. Remova para evitar URLs com barra dupla nas chamadas.",
        });
      }
      if (!/^https?:\/\//i.test(rawUrl)) {
        issues.push({
          type: "error",
          message: "EVOLUTION_API_URL não começa com http:// ou https://.",
        });
      }

      let reachable = false;
      let authValid = false;
      let httpStatus = 0;
      let evolutionVersion: string | null = null;

      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(`${normalizedUrl}/`, {
          method: "GET",
          headers: { apikey: EVOLUTION_API_KEY },
          signal: ctrl.signal,
        });
        clearTimeout(t);
        httpStatus = res.status;
        reachable = true;
        const data = await res.json().catch(() => ({}));
        evolutionVersion = data?.version || data?.message || null;
        // Se conseguiu chamar e não retornou 401/403, a key é válida
        authValid = res.status !== 401 && res.status !== 403;
        if (!authValid) {
          issues.push({
            type: "error",
            message: `EVOLUTION_API_KEY inválida (HTTP ${res.status}).`,
          });
        }
      } catch (err: any) {
        issues.push({
          type: "error",
          message: `Servidor Evolution inacessível: ${err?.message || "timeout"}`,
        });
      }

      return new Response(
        JSON.stringify({
          ok: issues.filter((i) => i.type === "error").length === 0 && !hasTrailingSlash,
          url: rawUrl,
          normalizedUrl,
          hasTrailingSlash,
          reachable,
          authValid,
          httpStatus,
          evolutionVersion,
          issues,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Proxy management actions (não chamam Evolution direto, ou chamam de forma especial) ===
    if (action === "testProxy") {
      // Testa um proxy fazendo GET https://api.ipify.org via Deno.createHttpClient
      const { host, port, protocol, username, password } = reqBody;
      if (!host || !port) {
        return new Response(
          JSON.stringify({ success: false, error: "host e port obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        const auth = username && password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : "";
        const proxyUrl = `${protocol || "socks5"}://${auth}${host}:${port}`;
        // @ts-ignore Deno.createHttpClient is unstable
        const client = (Deno as any).createHttpClient ? (Deno as any).createHttpClient({ proxy: { url: proxyUrl } }) : undefined;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 12000);
        const res = await fetch("https://api.ipify.org?format=json", {
          // @ts-ignore client option
          client,
          signal: ctrl.signal,
        });
        clearTimeout(t);
        const data = await res.json();
        return new Response(
          JSON.stringify({ success: true, ip: data?.ip, status: res.status }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Falha ao testar proxy" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // === Cria nova instância na Evolution + reserva e aplica proxy + retorna QR ===
    if (action === "createAndConnect") {
      const apelido = String(reqBody.apelido || "").trim();
      if (!apelido) {
        return new Response(
          JSON.stringify({ success: false, code: "missing_apelido", error: "Apelido obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Slugify
      const baseSlug = apelido
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      const randSuffix = Math.random().toString(36).slice(2, 6);
      const slug = `${baseSlug || "instance"}-${randSuffix}`;

      const supabase = getSupabase();

      // 2. Pré-checagem: existe proxy disponível?
      const { count: availableProxies } = await supabase
        .from("whatsapp_proxies")
        .select("id", { count: "exact", head: true })
        .eq("status", "available")
        .is("instance_id", null);

      if (!availableProxies || availableProxies < 1) {
        return new Response(
          JSON.stringify({
            success: false,
            code: "no_proxy_available",
            error: "Sem proxy disponível. Adicione proxies em WhatsApp → Proxies antes de criar instâncias.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. INSERIR no banco
      const { data: inserted, error: insertErr } = await supabase
        .from("whatsapp_instances")
        .insert({
          name: apelido,
          friendly_name: apelido,
          phone_number: "",
          evolution_instance_id: slug,
          status: "offline",
          daily_limit: 100,
          cooldown_queue: [3],
        })
        .select("id")
        .single();

      if (insertErr || !inserted) {
        return new Response(
          JSON.stringify({ success: false, code: "insert_failed", error: insertErr?.message || "Falha ao inserir instância no banco" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const newUuid = inserted.id;

      // 4. CRIAR na Evolution
      let qrBase64: string | null = null;
      try {
        const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({
            instanceName: slug,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
          }),
        });
        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          await supabase.from("whatsapp_instances").delete().eq("id", newUuid);
          return new Response(
            JSON.stringify({
              success: false,
              code: "evolution_create_failed",
              error: `Falha ao criar na Evolution: ${createData?.message || createRes.status}`,
              details: createData,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        qrBase64 = createData?.qrcode?.base64 || createData?.base64 || null;
      } catch (err: any) {
        await supabase.from("whatsapp_instances").delete().eq("id", newUuid);
        return new Response(
          JSON.stringify({ success: false, code: "evolution_create_failed", error: err?.message || "Erro de rede ao criar na Evolution" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 5. RESERVAR proxy
      const claim = await claimProxyForInstance(newUuid);
      if (!claim.success) {
        await fetch(`${EVOLUTION_API_URL}/instance/delete/${slug}`, { method: "DELETE", headers: { apikey: EVOLUTION_API_KEY } }).catch(() => null);
        await supabase.from("whatsapp_instances").delete().eq("id", newUuid);
        return new Response(
          JSON.stringify({
            success: false,
            code: claim.error === "no_proxy_available" ? "no_proxy_available" : "claim_failed",
            error: claim.error,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 6. APLICAR proxy
      const apply = await applyProxyToInstance(EVOLUTION_API_URL, EVOLUTION_API_KEY, slug, claim.proxy);
      if (!apply.ok) {
        await releaseProxyForInstance(newUuid).catch(() => null);
        await fetch(`${EVOLUTION_API_URL}/instance/delete/${slug}`, { method: "DELETE", headers: { apikey: EVOLUTION_API_KEY } }).catch(() => null);
        await supabase.from("whatsapp_instances").delete().eq("id", newUuid);

        if (apply.body?.message === "proxy_invalid") {
          const fields = (apply.body.invalidFields || []).join(", ");
          return new Response(
            JSON.stringify({
              success: false,
              code: "proxy_invalid",
              error: `Proxy ${apply.body.proxyLabel || ""} está com dados incompletos (faltam: ${fields}). Edite em WhatsApp → Proxies.`,
              proxyId: apply.body.proxyId,
              proxyLabel: apply.body.proxyLabel,
              invalidFields: apply.body.invalidFields,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            success: false,
            code: "apply_failed",
            error: `Falha ao aplicar proxy: ${apply.body?.message || apply.status}`,
            details: apply.body,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 7. Restart para o IP entrar em vigor (não bloqueia QR)
      fetch(`${EVOLUTION_API_URL}/instance/restart/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      }).catch(() => null);

      // 8. Se não veio QR no create, tenta /connect
      if (!qrBase64) {
        try {
          const connRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${slug}`, {
            method: "GET",
            headers: { apikey: EVOLUTION_API_KEY },
          });
          const connData = await connRes.json().catch(() => ({}));
          qrBase64 = connData?.base64 || connData?.qrcode?.base64 || connData?.qr || null;
        } catch { /* ignore */ }
      }

      return new Response(
        JSON.stringify({
          success: true,
          instanceId: newUuid,
          evolutionInstanceId: slug,
          qrCode: qrBase64,
          proxy: { id: claim.proxy.id, label: claim.proxy.label },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Sincroniza status + telefone da instância com a Evolution ===
    if (action === "syncInstancePhone") {
      const { instanceId } = reqBody;
      if (!instanceId) {
        return new Response(
          JSON.stringify({ error: "instanceId obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supabase = getSupabase();
      const { data: inst } = await supabase
        .from("whatsapp_instances")
        .select("id, evolution_instance_id, phone_number, status")
        .eq("id", instanceId)
        .maybeSingle();
      if (!inst) {
        return new Response(
          JSON.stringify({ error: "Instância não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const evoName = inst.evolution_instance_id;
      let state = "close";
      try {
        const stateRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${evoName}`, {
          headers: { apikey: EVOLUTION_API_KEY },
        });
        const stateData = await stateRes.json().catch(() => ({}));
        state = stateData?.instance?.state || stateData?.state || stateData?.connectionStatus || "close";
      } catch { /* ignore */ }

      if (state !== "open") {
        return new Response(
          JSON.stringify({ status: "waiting", state }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Conectada → busca o owner via fetchInstances
      let phone = inst.phone_number || "";
      try {
        const fetchRes = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${encodeURIComponent(evoName)}`, {
          headers: { apikey: EVOLUTION_API_KEY },
        });
        const fetchData = await fetchRes.json().catch(() => null);
        const arr = Array.isArray(fetchData) ? fetchData : (fetchData ? [fetchData] : []);
        for (const evo of arr) {
          const name = evo.name || evo.instance?.instanceName || evo.instanceName;
          if (name === evoName) {
            const owner = evo.ownerJid || evo.instance?.owner || evo.owner || "";
            if (owner) phone = String(owner).replace(/@s\.whatsapp\.net$/, "");
            break;
          }
        }
      } catch { /* ignore */ }

      await supabase
        .from("whatsapp_instances")
        .update({ status: "online", phone_number: phone })
        .eq("id", instanceId);

      ensureWebhookConfigured(evoName, EVOLUTION_API_URL, EVOLUTION_API_KEY).catch(console.error);

      return new Response(
        JSON.stringify({ status: "online", phone }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "swapProxy") {
      // Libera proxy atual da instância (próximo connect reserva um novo)
      if (!instanceName) {
        return new Response(
          JSON.stringify({ error: "instanceName obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const uuid = await getInstanceUuid(instanceName);
      if (!uuid) {
        return new Response(
          JSON.stringify({ error: "Instância não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await applyProxyToInstance(EVOLUTION_API_URL, EVOLUTION_API_KEY, instanceName, null).catch(() => null);
      await releaseProxyForInstance(uuid);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Importação atômica de instância da Evolution + reserva e aplicação de proxy ===
    if (action === "importInstanceWithProxy") {
      const { instanceName: impName, phone: impPhone, status: impStatus } = reqBody;
      if (!impName) {
        return new Response(
          JSON.stringify({ success: false, error: "instanceName obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = getSupabase();

      // 1. INSERIR no banco
      const { data: inserted, error: insertErr } = await supabase
        .from("whatsapp_instances")
        .insert({
          name: impName,
          friendly_name: impName,
          phone_number: (impPhone || "").replace("@s.whatsapp.net", ""),
          evolution_instance_id: impName,
          status: impStatus === "open" ? "online" : "offline",
          daily_limit: 100,
        })
        .select("id")
        .single();

      if (insertErr || !inserted) {
        return new Response(
          JSON.stringify({ success: false, code: "insert_failed", error: insertErr?.message || "Falha ao inserir instância" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newUuid = inserted.id;

      // 2. RESERVAR proxy
      const claim = await claimProxyForInstance(newUuid);
      if (!claim.success) {
        // ROLLBACK
        await supabase.from("whatsapp_instances").delete().eq("id", newUuid);
        return new Response(
          JSON.stringify({
            success: false,
            code: claim.error === "no_proxy_available" ? "no_proxy_available" : "claim_failed",
            error: claim.error,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. APLICAR proxy na Evolution
      const apply = await applyProxyToInstance(EVOLUTION_API_URL, EVOLUTION_API_KEY, impName, claim.proxy);
      if (!apply.ok) {
        // ROLLBACK: libera proxy + deleta instância
        await releaseProxyForInstance(newUuid).catch(() => null);
        await supabase.from("whatsapp_instances").delete().eq("id", newUuid);

        if (apply.body?.message === "proxy_invalid") {
          const fields = (apply.body.invalidFields || []).join(", ");
          return new Response(
            JSON.stringify({
              success: false,
              code: "proxy_invalid",
              error: `Proxy ${apply.body.proxyLabel || ""} está com dados incompletos (faltam: ${fields}). Edite o proxy em WhatsApp → Proxies.`,
              proxyId: apply.body.proxyId,
              proxyLabel: apply.body.proxyLabel,
              invalidFields: apply.body.invalidFields,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            code: "apply_failed",
            error: `Falha ao aplicar proxy na Evolution: ${apply.body?.message || apply.status}`,
            details: apply.body,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Restart para o IP entrar em vigor
      await fetch(`${EVOLUTION_API_URL}/instance/restart/${impName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      }).catch(() => null);

      return new Response(
        JSON.stringify({
          success: true,
          instanceId: newUuid,
          proxy: { id: claim.proxy.id, label: claim.proxy.label, host: claim.proxy.host },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Reserva e aplica um proxy a uma instância JÁ conectada (sem precisar de QR novo) ===
    if (action === "assignProxy") {
      if (!instanceName) {
        return new Response(
          JSON.stringify({ error: "instanceName obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const uuid = await getInstanceUuid(instanceName);
      if (!uuid) {
        return new Response(
          JSON.stringify({ error: "Instância não cadastrada no banco" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const claim = await claimProxyForInstance(uuid);
      if (!claim.success) {
        const status = claim.error === "no_proxy_available" ? 409 : 500;
        return new Response(
          JSON.stringify({ error: claim.error === "no_proxy_available" ? "Sem proxy disponível." : `Falha ao reservar proxy: ${claim.error}`, code: claim.error }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const apply = await applyProxyToInstance(EVOLUTION_API_URL, EVOLUTION_API_KEY, instanceName, claim.proxy);
      if (!apply.ok) {
        // rollback do claim
        await releaseProxyForInstance(uuid).catch(() => null);

        if (apply.body?.message === "proxy_invalid") {
          const fields = (apply.body.invalidFields || []).join(", ");
          return new Response(
            JSON.stringify({
              success: false,
              code: "proxy_invalid",
              error: `Proxy ${apply.body.proxyLabel || ""} está com dados incompletos (faltam: ${fields}). Edite o proxy em WhatsApp → Proxies.`,
              proxyId: apply.body.proxyId,
              proxyLabel: apply.body.proxyLabel,
              invalidFields: apply.body.invalidFields,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: `Falha ao aplicar proxy na Evolution: ${apply.body?.message || apply.status}`, details: apply.body }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Reinicia a instância para o proxy passar a vigorar
      await fetch(`${EVOLUTION_API_URL}/instance/restart/${instanceName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      }).catch(() => null);
      return new Response(
        JSON.stringify({ success: true, proxy: { id: claim.proxy.id, label: claim.proxy.label, host: claim.proxy.host }, reused: claim.reused }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    };

    let url: string;
    let method = "GET";
    let body: string | undefined;

    switch (action) {
      case "fetchInstances":
        url = `${EVOLUTION_API_URL}/instance/fetchInstances`;
        break;
      case "connect":
        url = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`;
        break;
      case "connectionState":
        url = `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`;
        break;
      case "restart":
        url = `${EVOLUTION_API_URL}/instance/restart/${instanceName}`;
        method = "PUT";
        break;
      case "logout": {
        url = `${EVOLUTION_API_URL}/instance/logout/${instanceName}`;
        method = "DELETE";
        // Reset webhook_configured on logout + libera proxy
        const supabase = getSupabase();
        const uuid = await getInstanceUuid(instanceName);
        await supabase
          .from("whatsapp_instances")
          .update({ webhook_configured: false })
          .eq("evolution_instance_id", instanceName);
        if (uuid) {
          await applyProxyToInstance(EVOLUTION_API_URL, EVOLUTION_API_KEY, instanceName, null).catch(() => null);
          await releaseProxyForInstance(uuid);
        }
        break;
      }
      case "delete": {
        url = `${EVOLUTION_API_URL}/instance/delete/${instanceName}`;
        method = "DELETE";
        const supabaseDel = getSupabase();
        const uuidDel = await getInstanceUuid(instanceName);
        await supabaseDel
          .from("whatsapp_instances")
          .update({ webhook_configured: false })
          .eq("evolution_instance_id", instanceName);
        if (uuidDel) {
          await releaseProxyForInstance(uuidDel);
        }
        break;
      }
      case "sendText":
        url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
        method = "POST";
        body = JSON.stringify({ number, text });
        break;
      case "fetchGroups":
        url = `${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`;
        break;
      case "fetchGroupParticipants": {
        const groupJid = reqBody.groupJid || '';
        url = `${EVOLUTION_API_URL}/group/participants/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`;
        break;
      }
      case "setWebhook": {
        url = `${EVOLUTION_API_URL}/webhook/set/${instanceName}`;
        method = "POST";
        body = JSON.stringify({
          webhook: {
            enabled: reqBody.enabled ?? true,
            url: reqBody.webhookUrl,
            webhookByEvents: true,
            events: reqBody.events || ["GROUP_PARTICIPANTS_UPDATE", "MESSAGES_UPSERT"],
          },
        });
        break;
      }
      case "groupInviteCode": {
        const gjid = reqBody.groupJid || '';
        url = `${EVOLUTION_API_URL}/group/inviteCode/${instanceName}?groupJid=${encodeURIComponent(gjid)}`;
        break;
      }
      case "updateProfilePicture": {
        const picture = reqBody.picture;
        if (!picture || typeof picture !== "string") {
          return new Response(
            JSON.stringify({ error: "Campo 'picture' (URL pública) é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        url = `${EVOLUTION_API_URL}/chat/updateProfilePicture/${instanceName}`;
        method = "POST";
        body = JSON.stringify({ picture });
        break;
      }
      case "removeProfilePicture": {
        url = `${EVOLUTION_API_URL}/chat/removeProfilePicture/${instanceName}`;
        method = "DELETE";
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // === Antes de connect: reserva proxy e aplica na Evolution ===
    if (action === "connect" && instanceName) {
      const uuid = await getInstanceUuid(instanceName);
      if (!uuid) {
        return new Response(
          JSON.stringify({ error: "Instância não cadastrada no banco" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const claim = await claimProxyForInstance(uuid);
      if (!claim.success) {
        if (claim.error === "no_proxy_available") {
          return new Response(
            JSON.stringify({
              error: "Sem proxy disponível. Compre novos proxies na IPRoyal e adicione em WhatsApp → Proxies.",
              code: "no_proxy_available",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: `Falha ao reservar proxy: ${claim.error}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Aplica o proxy na instância (mesmo se reused, garante que está aplicado)
      const apply = await applyProxyToInstance(EVOLUTION_API_URL, EVOLUTION_API_KEY, instanceName, claim.proxy);
      if (!apply.ok) {
        console.error(`[evolution-proxy] Falha ao aplicar proxy ${claim.proxy.id} em ${instanceName}:`, apply.body);
        // Se proxy é inválido, libera claim e bloqueia connect com erro claro
        if (apply.body?.message === "proxy_invalid") {
          await releaseProxyForInstance(uuid).catch(() => null);
          const fields = (apply.body.invalidFields || []).join(", ");
          return new Response(
            JSON.stringify({
              error: `Proxy ${apply.body.proxyLabel || ""} está com dados incompletos (faltam: ${fields}). Edite o proxy em WhatsApp → Proxies antes de conectar.`,
              code: "proxy_invalid",
              proxyId: apply.body.proxyId,
              proxyLabel: apply.body.proxyLabel,
              invalidFields: apply.body.invalidFields,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Outras falhas não bloqueiam o connect, mas reporta no log
      }
    }

    const res = await fetch(url, { method, headers, body });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // For 400 errors from Evolution (e.g. number not on WhatsApp), return 200 with error details
      // to prevent frontend crashes / blank screens
      const errorMessage = data?.message || data?.error || `HTTP ${res.status}`;
      const isNumberNotFound = res.status === 400 && JSON.stringify(data).includes('"exists":false');
      
      if (isNumberNotFound) {
        return new Response(
          JSON.stringify({ 
            error: "Número não encontrado no WhatsApp", 
            code: "number_not_found",
            fallback: true,
            details: data 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: errorMessage, details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-configure webhook when instance connects successfully
    if (action === "connect" && instanceName) {
      const base64 = data?.base64 || data?.qrcode?.base64 || data?.qr || null;
      if (!base64) {
        ensureWebhookConfigured(instanceName, EVOLUTION_API_URL, EVOLUTION_API_KEY).catch(console.error);
      }
    }

    if (action === "connectionState" && instanceName) {
      const state = data?.instance?.state || data?.state || data?.connectionStatus;
      if (state === "open") {
        ensureWebhookConfigured(instanceName, EVOLUTION_API_URL, EVOLUTION_API_KEY).catch(console.error);
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
