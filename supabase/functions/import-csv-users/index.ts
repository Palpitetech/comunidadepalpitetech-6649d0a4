import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { toCanonicalBR } from "../_shared/br-phone.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_MAP: Record<string, string> = {
  monthly: "96f56437-8582-4f53-aaee-e31103e5bcc8",
  semestral: "54711fb1-5fe5-4094-8c8e-3f97e4921ea7",
  yearly: "a1fc6ca2-cce2-41ef-aca4-4a2e8e60226f",
  manual_30d: "96f56437-8582-4f53-aaee-e31103e5bcc8",
  manual_365d: "a1fc6ca2-cce2-41ef-aca4-4a2e8e60226f",
  manual_7d: "65f08789-debf-4e31-b182-7c73c2823b1b",
  trial: "65f08789-debf-4e31-b182-7c73c2823b1b",
};

const GRATIS_ID = "65f08789-debf-4e31-b182-7c73c2823b1b";

const SKIP_EMAILS = new Set([
  "tutorial@gmail.com", "videoteste@gmail.com", "teste@gmail.com",
  "josezinho@gmail.com", "verificacao@kirvano.com.br", "exemplo@email.com",
  "jeje@gmail.com", "joao@gmail.com.br.us", "contato.palpitetech@gmail.com",
  "testejoao202@gmail.com", "gahdgdg@hotmail.com",
]);

function parseDate(str: string): string | null {
  if (!str || str === "-") return null;
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T23:59:59Z`;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function normalizePhone(raw: string): string | null {
  if (!raw || raw === "-") return null;
  // Helper compartilhado: aceita máscara, +55, 0055, insere o 9 quando faltar.
  return toCanonicalBR(raw);
}

function normalizeCpf(raw: string): string | null {
  if (!raw || raw === "-") return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return digits;
  return null;
}

function generatePassword(): string {
  // Senha padrão para usuários importados (devem trocar no primeiro login)
  return "12345678";
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.split("\n").map(l => l.replace(/\r/g, "").trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  // Remove BOM
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.slice(1);

  const headers = parseCsvLine(headerLine);
  const users: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] || "";
    }
    users.push(obj);
  }
  return users;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Validate caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;
    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", callerId).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas admins" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    
    // Support both formats: { users: [...] } or { csv: "raw csv text" }
    let users: Record<string, string>[];
    if (body.csv) {
      users = parseCsv(body.csv);
    } else if (Array.isArray(body.users)) {
      users = body.users;
    } else {
      throw new Error("Envie { csv: '...' } ou { users: [...] }");
    }

    if (users.length === 0) throw new Error("Lista de usuários vazia");

    console.log(`Processando ${users.length} usuários...`);

    const results: { email: string; status: string; error?: string; plan?: string }[] = [];

    for (const u of users) {
      // Support both field naming conventions
      const email = (u.Email || u.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        results.push({ email: email || "vazio", status: "skipped", error: "Email inválido" });
        continue;
      }

      if (SKIP_EMAILS.has(email)) {
        results.push({ email, status: "skipped", error: "Email de teste" });
        continue;
      }

      const nome = (u.Nome || u.nome || "").trim();
      if (nome === "-" || nome.toLowerCase().includes("vídeo tutorial") || nome.toLowerCase().includes("vídeo de teste")) {
        results.push({ email, status: "skipped", error: "Usuário de teste" });
        continue;
      }

      try {
        // Pre-normaliza o celular para usar tanto no check quanto no update
        const celularPre = normalizePhone(u.Telefone || u.telefone || "");

        // Check centralizado (email → celular) — evita duplicar quando email é novo mas celular já existe
        const { data: foundContact } = await supabase.rpc("find_user_by_contact", {
          p_email: email,
          p_celular: celularPre,
        });
        const found = foundContact as { user_id?: string | null; found_by?: string | null } | null;
        if (found?.user_id) {
          results.push({ email, status: "skipped", error: `Já existe (match por ${found.found_by})` });
          continue;
        }

        // Create auth user
        const password = generatePassword();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome: nome || email.split("@")[0] },
        });

        if (authError) {
          if (authError.message?.includes("already been registered")) {
            results.push({ email, status: "skipped", error: "Auth já existe" });
            continue;
          }
          throw authError;
        }

        const userId = authData.user.id;

        // Determine access
        const ativo = (u.Ativo || u.ativo || "").trim();
        const isAtivo = ativo === "Sim";
        const planoSlug = (u.Plano || u.plano || "-").toLowerCase();
        const planId = isAtivo ? (PLAN_MAP[planoSlug] || GRATIS_ID) : GRATIS_ID;

        const celular = normalizePhone(u.Telefone || u.telefone || "");
        const cpf = normalizeCpf(u.CPF || u.cpf || "");
        const diasExtras = parseInt(u.DiasExtras || u.diasExtras || "0", 10) || 0;

        // Calculate validity
        let validade: string | null = null;
        if (isAtivo) {
          const proximaCobranca = parseDate(u.ProximaCobranca || u.proximaCobranca || "");
          if (proximaCobranca) {
            validade = diasExtras > 0 ? addDays(proximaCobranca, diasExtras) : proximaCobranca;
          } else {
            validade = addDays(new Date().toISOString(), 30);
          }
        }

        // Update perfil
        const updateData: Record<string, unknown> = {
          nome: nome || null,
          celular,
          email,
          plan_id: planId,
          status_assinatura: isAtivo ? "ativa" : "inativa",
          validade_assinatura: validade,
          email_verificado: true,
        };
        if (cpf) updateData.cpf = cpf;

        const { error: perfilError } = await supabase
          .from("perfis")
          .update(updateData)
          .eq("id", userId);

        if (perfilError) {
          console.error(`Erro perfil ${email}:`, perfilError);
        }

        // If active with paid plan, add premium role
        if (isAtivo && planId !== GRATIS_ID) {
          await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "premium" })
            .then(() => {});
        }

        const planName = isAtivo
          ? (planoSlug === "yearly" ? "Anual" : planoSlug === "semestral" ? "Semestral" : planoSlug === "monthly" ? "Mensal" : "Grátis")
          : "Grátis";

        results.push({ email, status: "created", plan: planName });
      } catch (err: any) {
        results.push({ email, status: "error", error: err.message || String(err) });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    console.log(`Resultado: ${created} criados, ${skipped} pulados, ${errors} erros`);

    return new Response(JSON.stringify({
      summary: { total: users.length, created, skipped, errors },
      details: results,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Erro geral:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
