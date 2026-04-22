

# Expansão do payload de leads — slug + UTMs completos + Click IDs

## Decisões confirmadas
1. **`source` removido já** — payload novo usa `slug`. Sem fallback.
2. **Todos os UTMs capturados** (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) + `gclid`, `fbclid`, `referrer`. Tabela admin com **dropdown de colunas visíveis** (default mostra só Origem + Campanha; resto sob demanda).
3. **Hook `useUTM` primeiro**, depois frontend admin.

## Novo payload aceito pelo `receive-lead`

```json
{
  "nome": "João",
  "email": "joao@email.com",
  "celular": "11999999999",
  "tags": ["promo-julho"],
  "slug": "lp-mega-julho",
  "pagina_origem": "https://meusite.com/promo?utm_source=...",
  "utm_source": "instagram",
  "utm_medium": "cpc",
  "utm_campaign": "mega-julho",
  "utm_content": "story-3",
  "utm_term": "bolao mega",
  "referrer": "https://google.com/",
  "gclid": "Cj0KCQ...",
  "fbclid": "IwAR..."
}
```

Todos os campos opcionais (anti-bot e dedupe atuais permanecem).

## Mudanças

### 1. Migration (schema)
- `ALTER TABLE leads_inbox`:
  - `RENAME COLUMN source TO slug`
  - `ADD COLUMN utm_medium text`, `utm_campaign text`, `utm_content text`, `utm_term text`, `referrer text`, `gclid text`, `fbclid text`
- Index parcial em `slug` e `utm_campaign` para filtros futuros

### 2. `src/hooks/useUTM.ts` (refatorar primeiro)
Trocar o storage de uma chave única `utm_source` por um **objeto único `lead_attribution`** em localStorage:

```ts
type LeadAttribution = {
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_content?: string; utm_term?: string;
  gclid?: string; fbclid?: string;
  referrer?: string; landing_page?: string;
  captured_at: string;
};
```

- `useUTM()` lê todos os params da URL no mount, salva o objeto se tiver pelo menos 1 valor relevante. **Não sobrescreve** se já existe (first-touch attribution).
- Aceita também o param legacy `?utm=...` (mapeia para `utm_source`) por compatibilidade
- Captura `document.referrer` e `window.location.href` como `landing_page` na primeira visita
- Exports: `getStoredAttribution(): LeadAttribution | null`, `clearAttribution()`, e mantém `getStoredUTM()` (retorna só `utm_source`) como **shim** pra não quebrar chamadas antigas

### 3. `supabase/functions/receive-lead/index.ts`
- Aceitar `slug` (substituindo `source`); se vier `source` no payload, **ignorar** (não popular slug — usuário já decidiu remover já)
- Extrair e gravar: `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `referrer`, `gclid`, `fbclid` no insert do `leads_inbox`
- Quando promove a usuário (lead completo): propagar `utm_source` para `perfis.utm_source` (já é o que faz). Demais UTMs ficam só em `leads_inbox` por ora — não inflar `perfis`
- Ajustar log de auditoria pra incluir os novos campos mascarados

### 4. `src/components/admin/LeadDetailSheet.tsx`
Bloco "Origem" expandido pra mostrar:
- Slug (com ícone Tag)
- UTM Source / Medium / Campaign / Content / Term (cada um com label e valor mono)
- Página de origem (link)
- Referrer (link, se existir)
- Click IDs (`gclid`, `fbclid`) com badge identificando a plataforma (Google Ads / Meta Ads)
- IP (mantém)

Layout em grid 2-col no desktop, stacked no mobile, com seção colapsável "Atribuição completa" pra esconder os campos vazios.

### 5. `src/pages/admin/AdminUsuarios.tsx`
Tabela de leads (desktop): adicionar **dropdown "Colunas"** no header da aba Leads, controlando visibilidade:

- **Default visível**: Status, Nome, Email, Celular, **Origem** (slug ou utm_source), **Campanha** (utm_campaign), Data
- **Toggle opcional**: Medium, Content, Term, Referrer, Click IDs, Página

Estado salvo em localStorage `admin_leads_columns` pra persistir entre sessões.

Atualizar interface `LeadInbox` (no `LeadDetailSheet.tsx`) com os novos campos opcionais.

### 6. Atualizar guia em `src/pages/admin/Integracoes.tsx`
Trocar exemplo de payload pra mostrar `slug` + todos os UTMs + click IDs. Marcar todos como opcionais. Remover qualquer menção a `source`.

## Detalhes técnicos
- Hook `useUTM` mantém função exportada `getStoredUTM` (retorna `string | null`) pra compatibilidade — código que importa essa função continua funcionando
- Migração `RENAME COLUMN source TO slug` quebra qualquer leitura/escrita de `source` — todos os pontos serão atualizados na mesma iteração (`receive-lead`, `LeadDetailSheet`, `AdminUsuarios`)
- Edge function aceita payload sem campos novos (compat com integrações antigas) — só ignora `source` se vier
- Dropdown de colunas usa `DropdownMenuCheckboxItem` (já em uso no projeto)

## Arquivos

| Arquivo | Ação |
|---|---|
| **Migration nova** | Renomear `source→slug`, adicionar 7 colunas em `leads_inbox` |
| `src/hooks/useUTM.ts` | Refatorar pra capturar todos UTMs + click IDs + referrer |
| `supabase/functions/receive-lead/index.ts` | Aceitar `slug` + novos UTMs + click IDs; remover `source` |
| `src/components/admin/LeadDetailSheet.tsx` | Expandir bloco Origem; atualizar interface `LeadInbox` |
| `src/pages/admin/AdminUsuarios.tsx` | Dropdown de colunas visíveis na tabela de leads |
| `src/pages/admin/Integracoes.tsx` | Atualizar exemplo do payload no guia |

## Fora de escopo
- Migrar dados antigos de `utm_source` em `perfis` (já funciona)
- Filtros server-side por UTM/campanha (próxima iteração se virar relevante)
- Dashboard de atribuição multi-touch
- Capturar UTMs no cadastro manual (`LoginWizard`) — hoje já passa pra `perfis.utm_source`, fica como nota

## Resultado esperado
- Webhooks externos podem mandar atribuição **completa de marketing** (UTMs + click IDs + referrer)
- Frontend captura tudo na **primeira visita** e persiste até virar lead/usuário
- Admin vê tabela limpa por padrão e ativa colunas extras conforme precisa
- Detalhe do lead mostra atribuição completa pra rastreabilidade
- `source` some do sistema — único campo de identificação de página é `slug`

