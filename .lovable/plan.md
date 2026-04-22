

# Separar "Leads" de "Usuários" — webhooks parciais sem criar conta

## Problema atual
Hoje a edge function `receive-lead` exige **nome + email + celular** e, se algum falta, rejeita o lead com 400. Isso significa que integrações que enviam só celular (ou só email, ou sem email) **perdem o contato** — não fica registrado em lugar nenhum.

Você quer:
1. Aceitar leads **mesmo faltando algum dos 3 dados principais** (sem criar conta de auth)
2. Guardar UTM, página de origem, source, tags
3. Exibir esses contatos em `/admin/usuarios` numa **4ª aba "Leads"** ao lado de Todos / Pagos / Trial
4. **Não quebrar** o fluxo atual (webhooks que mandam os 3 dados continuam criando conta como hoje)

## Visão geral da solução

```text
WEBHOOK recebe payload
        │
        ▼
   ┌─────────────────────────────────┐
   │ Tem nome + email + celular?     │
   └─────────────────────────────────┘
       SIM │              │ NÃO (falta algum)
           ▼              ▼
   FLUXO ATUAL:    NOVO FLUXO:
   - cria perfil   - grava em `leads_inbox`
   - manda email   - apenas registro
   - ativa trial   - sem auth, sem email
                   - aparece em /admin/usuarios → aba "Leads"
```

A aba "Leads" mostra contatos **soltos** (não viraram conta). Quando o lead se cadastra de fato (manualmente ou completa os dados), vira usuário normal.

---

## Mudanças concretas

### 1. Nova tabela `leads_inbox` (migration)

Tabela independente de `perfis`/`auth.users` para guardar contatos parciais.

```sql
CREATE TABLE public.leads_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text,
  celular text,                   -- normalizado (10-11 dígitos sem 55)
  source text,                    -- "landing-mega", "elementor", etc
  utm_source text,
  pagina_origem text,             -- nova: URL de onde veio
  tags text[] DEFAULT '{}',       -- inclui source_tag do webhook
  webhook_id uuid REFERENCES public.lead_webhooks(id) ON DELETE SET NULL,
  webhook_name text,              -- snapshot do nome (resiste a delete)
  ip text,
  raw_payload jsonb,              -- payload original p/ auditoria
  status text DEFAULT 'novo',     -- 'novo' | 'contatado' | 'convertido' | 'descartado'
  perfil_id uuid REFERENCES public.perfis(id) ON DELETE SET NULL, -- preenche quando vira conta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_leads_inbox_created ON public.leads_inbox(created_at DESC);
CREATE INDEX idx_leads_inbox_email ON public.leads_inbox(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_inbox_celular ON public.leads_inbox(celular) WHERE celular IS NOT NULL;
CREATE INDEX idx_leads_inbox_status ON public.leads_inbox(status);

ALTER TABLE public.leads_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam leads_inbox"
  ON public.leads_inbox FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

> Não toco em `perfis` — sua estrutura, RLS, triggers e fluxo de trial continuam **idênticos**.

### 2. Refatorar `supabase/functions/receive-lead/index.ts`

Lógica nova no início, **antes** das validações estritas atuais:

```ts
const hasNome = !!nome?.trim();
const hasEmail = !!email?.trim();
const hasCelular = !!celular?.trim();

const camposCompletos = hasNome && hasEmail && hasCelular;

if (!camposCompletos) {
  // ── NOVO FLUXO: grava em leads_inbox e termina
  
  // Validação leve do que veio (sem MX, sem typo check, sem disposable):
  // - email: se veio, precisa ter formato @
  // - celular: se veio, normaliza
  // Pelo menos 1 dado precisa existir (senão é spam puro)
  if (!hasEmail && !hasCelular && !hasNome) {
    return json({ error: "Informe ao menos um dado de contato" }, 400);
  }
  
  let normalizedCelular: string | null = null;
  if (hasCelular) {
    const v = validateCelular(celular!);
    if (v.ok) normalizedCelular = v.normalized!;
    // se inválido, salva como veio mesmo (pra não perder)
  }
  
  await supabaseAdmin.from("leads_inbox").insert({
    nome: nome?.trim() || null,
    email: hasEmail ? email!.trim().toLowerCase() : null,
    celular: normalizedCelular || celular || null,
    source: source || null,
    utm_source: utm_source || null,
    pagina_origem: body.pagina_origem || body.page_url || null,
    tags: ["lead_inbox", webhook.source_tag, ...(payloadTags || [])],
    webhook_id: webhook.id,
    webhook_name: webhook.name,
    ip,
    raw_payload: body,
    status: "novo",
  });
  
  // Conta no contador do webhook (mesma RPC já existente)
  await supabaseAdmin.rpc("increment_lead_webhook_count", { webhook_id: webhook.id });
  
  await supabaseAdmin.from("system_events").insert({
    event_type: "lead_inbox_capturado",
    description: `Lead parcial capturado (campos incompletos)`,
    source: "receive-lead",
    status: "success",
    metadata: { 
      webhook_name: webhook.name, 
      tem_nome: hasNome, tem_email: hasEmail, tem_celular: hasCelular,
      ip,
    },
  });
  
  return json({ 
    success: true, 
    lead_inbox: true,
    message: "Lead capturado (sem conta — dados incompletos)" 
  });
}

// ── FLUXO ATUAL (intacto): segue para validações estritas + cria perfil
// ... resto do código atual sem mudança
```

**Importante:** as validações pesadas (disposable domain, MX lookup, padrão bot, typo) **continuam só para o fluxo de criação de conta**. Lead inbox aceita mais largamente porque é só "guardar contato".

Adicionar também `body.pagina_origem` ao tipo do body e ao payload de exemplo na UI.

### 3. UI `/admin/integracoes` — atualizar exemplo de payload

No `examplePayload` (`Integracoes.tsx` linha ~242), adicionar campo `pagina_origem`:

```text
{
  "nome": "João Silva",      // opcional
  "email": "joao@email.com", // opcional
  "celular": "11999999999",  // opcional
  "tags": ["tag_extra"],
  "source": "nome-da-pagina",
  "utm_source": "instagram",
  "pagina_origem": "https://meusite.com/promo"
}
```

E uma nota explicativa (Card/alert sutil):

> **Campos opcionais:** se vierem **nome + email + celular**, criamos a conta automaticamente. Se faltar algum, o contato vai para a aba **Leads** em `/admin/usuarios` para você acompanhar.

### 4. UI `/admin/usuarios` — nova aba "Leads"

Em `AdminUsuarios.tsx`:

**a)** Estender `FilterPrincipal`:
```ts
type FilterPrincipal = "todos" | "pagos" | "trial" | "leads";
```

**b)** Adicionar ao array `FILTROS_PRINCIPAIS`:
```ts
{ key: "leads", label: "Leads", icon: Inbox },  // ou Mail
```

**c)** Buscar leads em paralelo no `fetchData`:
```ts
const [{ data: plansData }, { data: usersData }, { data: leadsData }] = 
  await Promise.all([
    supabase.from("plans").select("*").order("display_order"),
    supabase.from("perfis").select("*").eq("is_bot", false).order("created_at", { ascending: false }),
    supabase.from("leads_inbox").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
setLeads(leadsData || []);
```

**d)** Quando `activeFilter === "leads"`, **trocar a fonte da lista renderizada** para `leads` (com uma forma adaptada minimamente para reusar a tabela: nome, email/celular, origem, tags, data). Para evitar refatorar toda a tabela existente:

- Quando `activeFilter === "leads"` → renderizar uma **tabela específica simples** (nova função `renderLeadsTable()`) com colunas: **Nome · Email · Celular · Origem (UTM/source) · Página · Tags · Data**
- Linha clicável abre um drawer simples (`LeadDetailSheet` novo, leve) com:
  - dados completos do lead
  - botão **"Marcar como contatado / convertido / descartado"** (atualiza `status`)
  - botão **"Promover a usuário"** (pré-preenche um modal com nome/email/celular, ao confirmar dispara o fluxo padrão de criação de conta — efetivamente posta no webhook do receive-lead com os campos completos OU usa um RPC dedicado; **nesse plano vou usar caminho mais simples: fazer admin invocar manualmente `auth.admin.createUser` via edge function nova `promote-lead-to-user` que reaproveita lógica do receive-lead**)
  - botão **"Excluir lead"**

**e)** Total da aba "Todos" (stats):
- O usuário pediu: *"deve ser computado como Todos"*. Decisão: **manter `stats.total = users.length`** (usuários reais) e **adicionar contador separado `stats.leads = leads.length`** exibido no chip da aba "Leads". Mostrar no card "Todos" um sub-texto opcional: *"+ N leads"* discreto.

> Justificativa: misturar leads no `total` quebraria todas as outras stats que dependem de `users` (pagos, trial, etc). Manter contadores separados é mais correto e transparente.

### 5. Edge function nova: `promote-lead-to-user` (opcional na primeira versão)

Função simples que recebe `{ lead_id }`, autoriza admin via JWT, lê o lead, valida que tem os 3 campos preenchidos (admin pode editar antes), e **reaproveita 100% a lógica de criação** do `receive-lead` (cria perfil, manda email de boas-vindas, marca `lead.status='convertido'` e `lead.perfil_id=novo_id`).

> Se preferir, posso entregar a aba "Leads" sem o botão "Promover" na primeira iteração (admin manualmente cadastra o lead pelo fluxo público) e adicionar o botão depois. Vou incluir como **escopo principal** porque é o que fecha o ciclo.

---

## Detalhes técnicos sensíveis

- **Nada muda no fluxo atual** quando o webhook recebe os 3 campos completos: validação anti-bot, MX lookup, criação de auth user, email de boas-vindas, trial pendente, tudo idêntico.
- **`leads_inbox` é tabela separada de `perfis`** — não tem trigger, não tem RLS além de admin, não interfere em `sync_perfil_tags` nem em `ativar_trial_pos_confirmacao`.
- **Rate limiting do receive-lead continua** (5/min/IP) — protege ambos os fluxos.
- **Stats da aba "Todos" ficam intactas** (continua contando só `perfis`). A aba "Leads" tem contagem própria.
- **Deduplicação**: ao salvar um lead em `leads_inbox`, se já existe outro lead com mesmo email/celular **nas últimas 24h**, posso atualizar o existente (merge de tags + raw_payload mais recente) em vez de criar duplicata. Vou implementar isso para evitar inflar a aba.
- **Quando o lead se cadastrar depois** (pelo site normal): o trigger `handle_new_user` já cria o perfil — vou adicionar uma lógica leve no `receive-lead` (e idealmente no fluxo de cadastro manual) para procurar `leads_inbox` por email/celular e marcar `status='convertido'` + `perfil_id`. Mas isso é um nice-to-have; na primeira versão, basta o admin marcar manualmente.

---

## Arquivos

| Arquivo | Ação |
|---|---|
| **Migration nova** | Criar tabela `leads_inbox` + índices + RLS (somente admin) |
| `supabase/functions/receive-lead/index.ts` | **Editar** — branch novo no início para gravar em `leads_inbox` quando faltar campo, sem tocar no fluxo completo |
| `src/pages/admin/Integracoes.tsx` | **Editar levemente** — atualizar `examplePayload` (adicionar `pagina_origem`, marcar campos opcionais) + nota explicativa sobre aba Leads |
| `src/pages/admin/AdminUsuarios.tsx` | **Editar** — nova aba "Leads", buscar `leads_inbox`, renderização condicional da tabela de leads, contador separado |
| `src/components/admin/LeadDetailSheet.tsx` | **Novo** — drawer/sheet com detalhes do lead + ações (status, excluir, promover) |
| `supabase/functions/promote-lead-to-user/index.ts` | **Novo** — promove lead em conta reaproveitando lógica de criação |
| `supabase/config.toml` | **Editar** — registrar nova função (se necessário; geralmente automático) |

## Fora de escopo
- Importação CSV de leads (pode vir depois)
- Métricas/conversão de leads (taxa de conversão lead→usuário) — pode ser próxima iteração na página `/admin/metricas`
- Atribuição automática retroativa de `leads_inbox` → `perfis` quando o lead cadastra depois (vou implementar busca por email/celular durante criação de perfil, mas sem garantir todas as bordas)
- Mudar nome/identidade de tags geradas pelo `sync_perfil_tags` (separado)

## Resultado esperado
- Webhooks externos podem mandar **qualquer combinação de campos** sem perder o contato
- Contatos parciais aparecem em **`/admin/usuarios` → aba Leads** com origem, UTM, página, tags
- Admin pode triar leads (contatado/descartado), excluir, ou **promover a usuário** quando completar os dados
- Fluxo atual de webhooks com 3 campos completos **funciona exatamente como hoje** (zero regressão)
- Aba "Todos" continua refletindo só usuários reais; "Leads" tem seu próprio contador

