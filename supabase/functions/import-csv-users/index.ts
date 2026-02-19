import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_MAP: Record<string, string> = {
  monthly: "96f56437-8582-4f53-aaee-e31103e5bcc8",   // Mensal
  semestral: "54711fb1-5fe5-4094-8c8e-3f97e4921ea7",  // Semestral
  yearly: "a1fc6ca2-cce2-41ef-aca4-4a2e8e60226f",     // Anual
  manual_30d: "96f56437-8582-4f53-aaee-e31103e5bcc8",  // Mensal
  manual_365d: "a1fc6ca2-cce2-41ef-aca4-4a2e8e60226f", // Anual
  manual_7d: "65f08789-debf-4e31-b182-7c73c2823b1b",   // Grátis
  trial: "65f08789-debf-4e31-b182-7c73c2823b1b",       // Grátis
};

const GRATIS_ID = "65f08789-debf-4e31-b182-7c73c2823b1b";

function parseDate(str: string): string | null {
  if (!str || str === "-") return null;
  // DD/MM/YYYY -> ISO
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T23:59:59Z`;
}

function normalizePhone(raw: string): string | null {
  if (!raw || raw === "-") return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits.slice(2);
  if (digits.length === 10 || digits.length === 11) return digits;
  return digits || null;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let pw = "";
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { users } = await req.json();
    if (!Array.isArray(users) || users.length === 0) throw new Error("Lista de usuários vazia");

    const results: { email: string; status: string; error?: string }[] = [];

    for (const u of users) {
      const email = (u.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        results.push({ email: email || "vazio", status: "skipped", error: "Email inválido" });
        continue;
      }

      // Skip test/fake emails
      if (["tutorial@gmail.com", "videoteste@gmail.com", "teste@gmail.com", "josezinho@gmail.com",
           "verificacao@kirvano.com.br", "exemplo@email.com", "jeje@gmail.com", "joao@gmail.com.br.us",
           "contato.palpitetech@gmail.com"].includes(email)) {
        results.push({ email, status: "skipped", error: "Email de teste" });
        continue;
      }

      // Skip "Não informado" with suspicious emails
      if (u.nome === "Não informado" && (email.includes("gahdgdg") || email.includes("angelba"))) {
        results.push({ email, status: "skipped", error: "Usuário teste" });
        continue;
      }

      try {
        // Check if user already exists by email in perfis
        const { data: existing } = await supabase
          .from("perfis")
          .select("id")
          .ilike("email", email)
          .maybeSingle();

        if (existing) {
          results.push({ email, status: "skipped", error: "Já existe" });
          continue;
        }

        // Create auth user
        const password = generatePassword();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nome: u.nome || email.split("@")[0],
          },
        });

        if (authError) {
          // User might already exist in auth
          if (authError.message?.includes("already been registered")) {
            results.push({ email, status: "skipped", error: "Auth já existe" });
            continue;
          }
          throw authError;
        }

        const userId = authData.user.id;
        const isAtivo = u.status === "Ativo";
        const planoSlug = u.plano || "-";
        const planId = isAtivo ? (PLAN_MAP[planoSlug] || GRATIS_ID) : GRATIS_ID;
        const celular = normalizePhone(u.telefone);
        const validade = isAtivo ? parseDate(u.proximaCobranca) : null;

        // Update perfil (created by trigger handle_new_user)
        const { error: perfilError } = await supabase
          .from("perfis")
          .update({
            nome: u.nome || null,
            celular,
            email,
            plan_id: planId,
            status_assinatura: isAtivo ? "ativa" : "inativa",
            validade_assinatura: validade,
            email_verificado: true,
          })
          .eq("id", userId);

        if (perfilError) {
          console.error(`Erro perfil ${email}:`, perfilError);
        }

        results.push({ email, status: "created" });
      } catch (err: any) {
        results.push({ email, status: "error", error: err.message || String(err) });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    return new Response(JSON.stringify({
      summary: { total: users.length, created, skipped, errors },
      details: results,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
