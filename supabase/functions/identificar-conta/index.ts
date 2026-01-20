import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits.slice(2);
  return digits;
}

function isValidEmail(email: string) {
  // validação simples; o objetivo é bloquear inputs obviamente inválidos
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhoneDigits(digits: string) {
  return digits.length === 10 || digits.length === 11;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identificador } = await req.json();

    if (typeof identificador !== "string" || !identificador.trim()) {
      return new Response(JSON.stringify({ error: "Informe seu telefone ou e-mail." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Configuração do servidor indisponível." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const raw = String(identificador).trim();
    const isEmail = raw.includes("@");

    if (isEmail) {
      const email = normalizeEmail(raw);
      if (!isValidEmail(email)) {
        return new Response(JSON.stringify({ error: "E-mail inválido." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data, error } = await supabase
        .from("perfis")
        .select("id, email")
        .ilike("email", email)
        .maybeSingle();

      if (error) throw error;
      if (!data?.id) {
        return new Response(JSON.stringify({ exists: false }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(
        JSON.stringify({ exists: true, user_id: data.id, email: data.email ?? email }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const celular = normalizePhone(raw);
    if (!isValidPhoneDigits(celular)) {
      return new Response(JSON.stringify({ error: "Telefone inválido. Digite com DDD." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data, error } = await supabase
      .from("perfis")
      .select("id, email")
      .eq("celular", celular)
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) {
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ exists: true, user_id: data.id, email: data.email ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
