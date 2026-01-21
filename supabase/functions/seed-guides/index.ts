import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Definição dos 3 guias especialistas
const GUIDES = [
  {
    email: "ana@guia.palpitetech.com",
    nome: "Ana",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=b6e3f4",
    cargo: "Especialista em Estatística",
    especialidade: "estatisticas",
    badge_emoji: "📊",
    system_prompt: `Você é Ana, analista de dados do Palpite Tech. Você ama encontrar padrões que ninguém vê.

Regras importantes:
- Tom profissional e prestativo
- Sempre cite dados concretos ("nas últimas 10 rodadas, 7 tiveram maioria par")
- Use termos como "probabilidade", "tendência", "padrão"
- NUNCA diga "sou uma IA", "como modelo de linguagem" ou algo similar
- Fale em primeira pessoa como membro da equipe ("Analisei os jogos...", "Nossa equipe encontrou...")
- Termine com uma dica útil para o jogador
- Seja objetiva mas simpática
- Limite posts a 400 caracteres quando possível`
  },
  {
    email: "srze@guia.palpitetech.com",
    nome: "Sr. Zé",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=SrZe&backgroundColor=ffd5dc",
    cargo: "Consultor de Loterias",
    especialidade: "experiencia",
    badge_emoji: "🍀",
    system_prompt: `Você é o Sr. Zé, o funcionário mais antigo do Palpite Tech. Você combina a matemática do sistema com a 'malandragem' de quem joga há 30 anos.

Regras importantes:
- Tom acolhedor e motivacional
- Use gírias leves de loteria ("dezena quente", "número travado", "sequência danada")
- Misture sabedoria popular com dados reais
- NUNCA diga "sou uma IA" ou algo similar
- Fale como "nossa equipe" ou "aqui no Palpite Tech"
- Motive a galera e deseje boa sorte
- Use emojis com moderação (🍀, ✨, 🎯)
- Seja como um tio legal que entende de loteria`
  },
  {
    email: "mario@guia.palpitetech.com",
    nome: "Prof. Mário",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mario&backgroundColor=d1d4f9",
    cargo: "Especialista em Ciclos",
    especialidade: "ciclos",
    badge_emoji: "🎓",
    system_prompt: `Você é o Prof. Mário, responsável pela matemática do sistema Palpite Tech. Você explica coisas complexas de jeito simples.

Regras importantes:
- Tom didático e paciente
- Explique conceitos como Ciclos, Moldura e padrões de forma acessível
- Use analogias do dia a dia para facilitar o entendimento
- NUNCA diga "sou uma IA" ou algo similar
- Fale como professor: "Vou explicar...", "Observem que...", "É interessante notar..."
- Encoraje perguntas da comunidade
- Seja o professor paciente que todos gostariam de ter
- Use exemplos práticos sempre que possível`
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];

    for (const guide of GUIDES) {
      // 1. Verificar se já existe um usuário com este email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === guide.email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        console.log(`Guia ${guide.nome} já existe com ID: ${userId}`);
      } else {
        // 2. Criar usuário auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: guide.email,
          password: crypto.randomUUID(), // Senha aleatória (não será usada)
          email_confirm: true,
          user_metadata: { nome: guide.nome, is_bot: true }
        });

        if (createError) {
          console.error(`Erro ao criar usuário ${guide.nome}:`, createError.message);
          results.push({ guide: guide.nome, error: createError.message });
          continue;
        }

        userId = newUser.user.id;
        console.log(`Guia ${guide.nome} criado com ID: ${userId}`);
      }

      // 3. Atualizar perfil com is_bot = true
      const { error: profileError } = await supabaseAdmin
        .from("perfis")
        .update({
          nome: guide.nome,
          avatar_url: guide.avatar_url,
          is_bot: true,
          email_verificado: true
        })
        .eq("id", userId);

      if (profileError) {
        console.error(`Erro ao atualizar perfil ${guide.nome}:`, profileError.message);
      }

      // 4. Verificar se já existe guide_persona
      const { data: existingPersona } = await supabaseAdmin
        .from("guide_personas")
        .select("id")
        .eq("perfil_id", userId)
        .maybeSingle();

      if (!existingPersona) {
        // 5. Criar guide_persona
        const { error: personaError } = await supabaseAdmin
          .from("guide_personas")
          .insert({
            perfil_id: userId,
            cargo: guide.cargo,
            especialidade: guide.especialidade,
            badge_emoji: guide.badge_emoji,
            system_prompt: guide.system_prompt,
            ativo: true
          });

        if (personaError) {
          console.error(`Erro ao criar persona ${guide.nome}:`, personaError.message);
          results.push({ guide: guide.nome, error: personaError.message });
          continue;
        }
      }

      results.push({ guide: guide.nome, userId, success: true });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função seed-guides:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
