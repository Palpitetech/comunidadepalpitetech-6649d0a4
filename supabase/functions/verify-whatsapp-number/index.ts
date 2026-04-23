// Edge function pública: verifica se um número de WhatsApp é oficial
// Fonte de verdade: tabela `chip_celulares` (apenas chips ativos)
// IMPORTANTE: NUNCA retorna a lista de números — só "match" booleano.
// Anti-abuso: rate limit por IP em memória (8 req / 60s).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Rate limit em memória ─────────────────────────────────────────
const RATE_WINDOW_MS = 60_000; // 1 min
const RATE_MAX = 8; // 8 verificações / IP / min
const ipHits = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = ipHits.get(ip) ?? [];
  const recent = arr.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    ipHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipHits.set(ip, recent);
  // GC esporádico para não inchar a memória
  if (Math.random() < 0.02) {
    for (const [k, v] of ipHits.entries()) {
      const fresh = v.filter((t) => now - t < RATE_WINDOW_MS);
      if (fresh.length === 0) ipHits.delete(k);
      else ipHits.set(k, fresh);
    }
  }
  return false;
}

// ─── Captcha leve (math challenge HMAC-assinado) ──────────────────
const SECRET = Deno.env.get("VERIFY_CAPTCHA_SECRET") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "fallback-secret-do-not-use";
const CAPTCHA_TTL_MS = 5 * 60_000; // 5 min para responder

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const expected = a + b;
  const issuedAt = Date.now();
  const payload = `${a}:${b}:${expected}:${issuedAt}`;
  const sig = await hmac(payload);
  // Token devolvido pro cliente (não revela `expected`)
  const token = btoa(`${a}:${b}:${issuedAt}:${sig}`);
  return { question: `Quanto é ${a} + ${b}?`, token };
}

async function verifyChallenge(token: string, answer: number): Promise<boolean> {
  try {
    const decoded = atob(token);
    const [aStr, bStr, issuedStr, sig] = decoded.split(":");
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    const issuedAt = parseInt(issuedStr, 10);
    if (isNaN(a) || isNaN(b) || isNaN(issuedAt)) return false;
    if (Date.now() - issuedAt > CAPTCHA_TTL_MS) return false;
    const expected = a + b;
    const payload = `${a}:${b}:${expected}:${issuedAt}`;
    const expectedSig = await hmac(payload);
    if (expectedSig !== sig) return false;
    return answer === expected;
  } catch {
    return false;
  }
}

// ─── Normalização BR ──────────────────────────────────────────────
function normalizeBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("55") && (n.length === 12 || n.length === 13)) {
    n = n.substring(2);
  }
  if (n.length !== 10 && n.length !== 11) return null;
  const ddd = parseInt(n.substring(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return null;
  return n;
}

function variants(n: string): string[] {
  const set = new Set<string>();
  set.add(n);
  set.add(`55${n}`);
  if (n.length === 11 && n[2] === "9") {
    const sem9 = n.substring(0, 2) + n.substring(3);
    set.add(sem9);
    set.add(`55${sem9}`);
  } else if (n.length === 10) {
    const com9 = n.substring(0, 2) + "9" + n.substring(2);
    set.add(com9);
    set.add(`55${com9}`);
  }
  return Array.from(set);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // → 1) Cliente pede um desafio antes de verificar
    if (action === "challenge") {
      const ip = getClientIp(req);
      if (isRateLimited(ip)) {
        return json({ ok: false, reason: "rate_limited" }, 429);
      }
      const c = await generateChallenge();
      return json({ ok: true, ...c });
    }

    // → 2) Verificação do número (exige captcha resolvido)
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return json({ ok: false, reason: "rate_limited" }, 429);
    }

    const body = await req.json().catch(() => ({}));
    const numero = typeof body.numero === "string" ? body.numero : "";
    const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : "";
    const captchaAnswer = Number(body.captchaAnswer);

    if (!numero || numero.length > 30) {
      return json({ ok: false, reason: "invalid_input" }, 400);
    }
    if (!captchaToken || isNaN(captchaAnswer)) {
      return json({ ok: false, reason: "captcha_required" }, 400);
    }

    const captchaOk = await verifyChallenge(captchaToken, captchaAnswer);
    if (!captchaOk) {
      return json({ ok: false, reason: "captcha_invalid" }, 400);
    }

    const normalized = normalizeBR(numero);
    if (!normalized) {
      return json({ ok: true, verified: false, reason: "invalid_format" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const tries = variants(normalized);
    const { data, error } = await supabase
      .from("chip_celulares")
      .select("id")
      .eq("ativo", true)
      .in("numero", tries)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[verify-whatsapp-number] db error", error.message);
      return json({ ok: false, reason: "db_error" }, 500);
    }

    return json({ ok: true, verified: !!data });
  } catch (e) {
    console.error("[verify-whatsapp-number] crash", (e as Error).message);
    return json({ ok: false, reason: "server_error" }, 500);
  }
});
