

## Diagnóstico — Eventos & Tags para disparos de mensagens

Após a refatoração de hoje (celular obrigatório, limpeza de 216 perfis, novos filtros), o motor de disparos está **funcional mas subutilizado**. Abaixo o estado real e o que recomendo ajustar.

---

### 1. Eventos — como está hoje

**Pipeline atual (já funcionando):**
```text
events INSERT → trigger on_event_queue_templates
  → trigger_queue_event_templates() lê perfis
  → queue_templates_for_event() filtra templates ativos
  → respeita include_tags/exclude_tags/plan_ids/match_mode
  → respeita delay_enabled + delay_minutes
  → insere em message_queue com priority
```

**Eventos registrados no banco (últimos):**
| event_type | total |
|---|---|
| `assinatura_expirada` | 7 |
| `carrinho_abandonado` | 6 |
| `novo_cadastro` | 1 |
| `subscription_expired` | 1 |

**Problemas identificados:**

1. **Duplicidade de eventos** — temos `assinatura_expirada` (português, do `handle-subscription-expiration`) E `subscription_expired` (Kirvano). Ambos significam a mesma coisa mas só um vai disparar template.
2. **Eventos novos não registrados** — depois da refatoração de filtros (Trial OK, Pago Mensal/Anual/AnualVIP, etc.) **não existem eventos correspondentes**. Ex: quando alguém vira "trial_ok" (usou trial e virou free), nada é registrado em `events`.
3. **Apenas 1 template configurado** (`Cadastro Comunidade`, evento `novo_cadastro`) — 100% dos outros eventos passam batido sem disparar nada.
4. **Telefones quebrados na fila antiga** — 3 das últimas 4 mensagens falharam com `11999887755` (números fake). Após a limpeza de hoje, isso não acontece mais (todos têm celular válido).

---

### 2. Tags — como está hoje

**Tags ativas no sistema (top 12):**
| tag | total | origem |
|---|---|---|
| `comunidade` | 46 | cadastro padrão |
| `ativo` | 29 | assinatura ativa |
| `gratis` | 17 | plano free |
| `mensal` | 17 | plano mensal |
| `anual` | 10 | plano anual |
| `expirado` | 7 | passou da validade |
| `trial` | 7 | em período de teste |
| `semestral` | 2 | plano semestral |
| `bot` / `lead` / `carrinho_abandonado` / `grupo_salasecreta` | 1 cada | edge cases |

**Problemas identificados:**

1. **Falta a tag `anualvip`** — temos plano `pago_anualvip` no filtro mas nenhum perfil tem essa tag.
2. **Tag `trial_ok` não existe** — no filtro de usuários adicionamos esse conceito (já usou trial), mas nenhuma tag marca isso.
3. **Sem tag para `verificado` ou `nao_verificado`** — disparos não conseguem segmentar por verificação de email.
4. **Sem tag para os novos status de plano** — `plano_vencido`, `cancelado_ativo`, `cancelado_inativo` não existem como tags, embora apareçam como filtros.

---

### 3. UI — Templates vs Disparo Manual

| Recurso | Templates (automático) | Disparo Manual |
|---|---|---|
| Filtra por tag include/exclude | ✅ | ✅ |
| Filtra por plano | ✅ | ✅ |
| Filtra por evento | ✅ (gatilho único) | ✅ (filtro de público) |
| Filtra por status assinatura | ❌ | ✅ |
| Filtra por verificação email | ❌ | ❌ |
| Modo "any/all" tags | ✅ | ✅ (exact match) |
| Delay configurável | ✅ | ❌ |

**Ambos compartilham a mesma fonte de tags** (RPC `get_distinct_tags` + fallback em `perfis.tags`), o que é bom — qualquer tag que existir aparece nos dois lugares.

---

### Recomendações (a serem implementadas em próximo loop)

#### A. Padronizar eventos (consolidar duplicatas)

Criar migração que:
- Renomeia `subscription_expired` → `assinatura_expirada` em `events` históricos
- Documenta o "vocabulário oficial" de eventos em comentário SQL
- Adiciona eventos faltantes no fluxo: `email_verificado`, `trial_iniciado`, `trial_finalizado`, `assinatura_renovada`

#### B. Sincronizar tags com os filtros novos

Criar trigger/função que mantenha tags em dia automaticamente:
- `verificado` / sem tag = não verificou
- `trial_ativo` quando dentro do período de teste
- `trial_ok` quando trial expirou (substitui `trial`+`expirado`)
- `pago_mensal` / `pago_anual` / `pago_anualvip` (substitui as tags soltas `mensal`/`anual`)
- `plano_vencido` / `cancelado_ativo` / `cancelado_inativo`

Migração com backfill: aplica tags em todos os perfis existentes baseado no estado atual.

#### C. Adicionar filtro "Verificação" no Disparo Manual e Templates

Novo seletor: `Todos / Apenas verificados / Apenas não verificados` — útil para reativação de leads que não confirmaram email.

#### D. Templates essenciais a criar

Sugestão de 6 templates que cobrem o ciclo completo:

| # | Nome | Evento | Filtro |
|---|---|---|---|
| 1 | Boas-vindas Cadastro | `novo_cadastro` | nenhum |
| 2 | Lembrete verificar email | `novo_cadastro` (delay 30min) | tag exclude `verificado` |
| 3 | Trial expirando em 1 dia | `trial_finalizado` (delay -24h via cron) | tag `trial_ativo` |
| 4 | Compra aprovada | `sale_confirmed` | nenhum |
| 5 | Assinatura vencida | `assinatura_expirada` | tag `expirado` |
| 6 | Reativação 7 dias após corte | `acesso_cortado` (delay 7 dias) | tag `acesso_cortado` |

#### E. Dashboard de diagnóstico (opcional, futuro)

Página `/admin/whatsapp/diagnostico`:
- Eventos disparados nos últimos 7 dias por tipo
- Templates que dispararam (taxa de match)
- Templates ativos sem nenhum evento correspondente nos últimos 30 dias (warning)

---

### O que NÃO vou mexer agora

- Estrutura de `message_queue` / `message_templates` (está sólida)
- `process-queue` edge function (funciona bem com Round Robin)
- `queue_templates_for_event` (lógica genérica está correta)
- Sistema de prioridades (já hierarquizado: transacional > automático > manual)

---

**Ação solicitada:** confirme quais dos blocos A–D você quer implementar primeiro. Eu sugiro a ordem **A → B (com backfill) → C → D**, porque cada bloco habilita o próximo. Posso fazer tudo em um único loop ou separar em etapas — você decide.

