## Objetivo

Criar templates automáticos para a campanha **Maratona Mega Especial 30 Anos** + **Aula Ao Vivo Mega Especial**, usando os dois webhooks de lead já existentes e segmentando por tags de compra.

## Contexto identificado

**Webhooks ativos** (geram tag automática no perfil/lead via `source_tag`):
- `Aula-Ao-Vivo-Mega-Especial` → tag `aula_ao_vivo_mega_especial`
- `Lead - Maratona Mega Especial 30 Anos` → tag `maratona_mega_especial`

**Smart Links já criados:**
- `ms-sala-secreta` → grupo gratuito (para leads que NÃO compraram)
- `ms-sala-vip` → grupo pago (para quem comprou a Sala Vip)

**Plano pago identificado:** `aula-ao-vivo-mega-especial` (R$ 27). Hoje, ao comprar, o trigger `sync_perfil_tags` NÃO cria uma tag específica de "comprou Mega VIP" — esse plano cai no `else` e marca apenas `gratis`. Precisamos diferenciar quem comprou.

## Plano

### 1. Adicionar tag `pago_aula_mega_especial` ao trigger `sync_perfil_tags`

Migração para incluir o slug `aula-ao-vivo-mega-especial` no bloco de planos pagos, gerando a tag `pago_aula_mega_especial` quando `status_assinatura = 'ativa'` e validade futura. Adicionar essa tag ao array `v_managed`.

### 2. Criar Template 1 — Lead Maratona/Aula (sem compra)

- **Nome:** `Lead Maratona Mega 30 Anos — Sala Secreta`
- **Evento:** `lead_pre_checkout_abandono` (mesmo motor já rodando para Lotofácil)
- **include_tags:** `maratona_mega_especial`, `aula_ao_vivo_mega_especial` (match `any`)
- **exclude_tags:** `pago_aula_mega_especial`, `pago_grupovip_lotofacil`, `pago_mensal`, `pago_anual`, `pago_anualvip` (não envia para quem já comprou)
- **delay:** 60 min após captura
- **Conteúdo:** convite para a **Sala Secreta Mega** (`https://www.palpitetech.com.br/g/ms-sala-secreta` com UTMs `whatsapp / lead_retarget / maratona_mega_30anos`)

### 3. Criar Template 2 — Comprou Sala VIP

- **Nome:** `Compra aprovada — Aula Mega Especial VIP`
- **Evento:** `sale_confirmed`
- **include_tags:** `pago_aula_mega_especial`
- **exclude_tags:** vazio
- **Conteúdo:** boas-vindas + link da **Sala Vip Mega** (`https://www.palpitetech.com.br/g/ms-sala-vip`) + instruções da maratona

### 4. Backfill (opcional, recomendado)

Tocar perfis já existentes com plano `aula-ao-vivo-mega-especial` ativo (`UPDATE perfis SET updated_at = now() WHERE plan_id = ...`) para o trigger reaplicar as tags.

## Detalhes técnicos

- O motor `process-lead-retargeting` já busca templates com event_trigger `lead_pre_checkout_abandono` e usa `overlaps(tags, include_tags)` em `leads_inbox` — o Template 1 entra automaticamente no scheduler.
- O Template 2 é disparado pela função existente que processa eventos `sale_confirmed` no webhook Kirvano (mesmo padrão do template "Compra aprovada (Grupo VIP Lotofácil)").
- Variáveis usadas: `{{nome}}`, `{{link_sala_secreta_mega}}`, `{{link_sala_vip_mega}}` — adicionarei resolvers nas funções `process-lead-retargeting` e `process-sale-event` para injetar os links com UTMs.
- Conteúdos seguirão o tom já existente (sem emoji excessivo, sem mencionar "IA"), e cada template terá variantes A/B para rotação (mín. 2 variantes em `message_template_variants`).

## Pergunta antes de implementar

Confirma que:
1. O link da **Sala Secreta Mega** vai para os leads de **AMBOS** webhooks (Aula + Maratona)?
2. O link da **Sala Vip Mega** entra apenas para quem comprou o plano `aula-ao-vivo-mega-especial` (R$ 27)? Há outro produto pago dessa campanha que devo mapear?
