## Refatoração 100% — Disparo em Grupo (backend)

Foco aprovado: **simplificar a arquitetura backend**. UI (`DisparoGrupoTab`) e tabelas continuam como estão. As duas opções de palpite (com jogos / só CTA VIP) são preservadas por loteria.

### Diagnóstico do que está confuso hoje

```text
prepare.ts ─┐
send.ts    ─┼─► resolveMessageContent (IA / palpite / manual + fallbacks legados)
send-now.ts┤        └─ janela de 15min "aguardando retry" se IA volta null
retry.ts   ─┘        └─ dedup, cooldown, expirado>10min, stuck>30min, palpite_settings
                            + campos legados include_palpites/vip_group_link
```

Problemas:
1. A mensagem só é resolvida **na hora do envio** — se a IA/pipeline falha, o slot palpite vira "vazio" e fica em loop pending→failed.
2. Lógica de fallback Lotofácil legada (`include_palpites`/`vip_group_link` soltos no config) duplica `palpite_settings`.
3. 4 arquivos diferentes (`prepare`, `send`, `send-now`, `retry`) repetem regras de instância, dedup, retry e log.
4. Não há rastreabilidade do "porquê" de uma mensagem ter falhado (origem, tentativas, conteúdo gerado).

### Objetivo da refatoração

Garantir que **toda configuração ativa entrega palpites/IA dentro do horário programado**, com código menor, fluxo único e mensagens já prontas no momento do envio.

### Nova arquitetura

```text
group-blast-send (router)
  ├── action=prepare    → schedule.ts  (cria logs + pré-resolve mensagem)
  ├── action=send       → dispatch.ts  (loop cron, só envia o que está pronto)
  ├── action=send_now   → schedule.ts (mesmo fluxo, scheduled_for = now+5s)
  └── action=retry      → dispatch.ts.retryOne(logId)

_shared/group-blast/
  ├── schedule.ts       ← antigo prepare + send-now unificados
  ├── dispatch.ts       ← antigo send + retry unificados
  ├── resolver.ts       ← resolveMessage(slot, config) → string|null  (única função)
  ├── ai-message.ts     (mantido)
  ├── palpite-message.ts(mantido — só limpeza de assinatura legacy)
  ├── lottery-config.ts (mantido)
  └── types.ts
```

Camadas removidas:
- `send-now.ts`, `retry.ts`, `prepare.ts` (substituídos)
- Compat legado de `include_palpites`/`vip_group_link` no resolver (lê **só** `palpite_settings`)
- Janela de "aguardando retry" + lógica de stuck (deixa de existir porque a mensagem é resolvida no prepare)

### Mudanças principais

1. **Pré-resolução no `prepare`**
   - Para cada slot agendado, resolver a mensagem **antes** de inserir o log:
     - `manual` → `slot.message_content`
     - `palpite` → `generatePalpiteMessage(loteria, palpite_settings[loteria])`
     - `ai` → último post da loteria + `generateAIMessage`
   - Se a resolução falhar → log já entra como `failed` com `error_message` claro e `message_content=''`. **Sem fila pending sem conteúdo.**
   - Resultado: na hora do disparo o `dispatch` só pega `pending` que **já têm `message_content` válido**.

2. **`dispatch` enxuto**
   - Lê `pending` com `message_content != ''` e `scheduled_for <= now()`.
   - Resolve instância via `select_best_instances`.
   - Loop de fallback ao vivo (mantido).
   - Se >10min sem instância → marca `failed`. Sem mais "stuck" e sem regenerar mensagem.

3. **`retry` simplificado**
   - Vira método `dispatch.retryOne(logId)`: reusa `message_content` do log; se vier vazio (caso raro de log antigo), regenera 1x.

4. **Coluna nova em `group_blast_logs`** (migração):
   - `message_source text` — `'manual' | 'palpite:lotofacil' | 'palpite:megasena' | 'ai:lotofacil' | 'ai:megasena' | 'palpite:fallback_ai'` — para auditoria.

5. **Audit (`group_blast_prepare_runs`)**
   - Adicionar contagens: `slots_resolved`, `slots_failed_resolution`, além das já existentes.

6. **Limpeza no `group_blast_configs`**
   - `palpite_settings` passa a ser fonte única. `include_palpites`/`vip_group_link` permanecem na tabela (compat) mas o backend **só lê `palpite_settings`**. UI já preenche os dois — sem mudança visível.

### Detalhes técnicos

- **Cron permanece** `*/30 * * * *` (já está bom desde a última iteração).
- **Dedup das últimas 20h** continua, mas agora considera apenas logs `pending` ou `sent` com `message_source` igual.
- **Cooldown de instância** continua via `register_instance_usage` + `last_message_at`.
- Cada arquivo novo terá ≤ 200 linhas; orquestração testável em unidades isoladas.
- `resolveMessageContent` antiga será deletada (era exportada para o `retry`; novo `dispatch.retryOne` chama `resolver.ts` direto).

### Plano de execução

1. **Migração SQL**: adicionar `message_source text` em `group_blast_logs` (nullable), atualizar `group_blast_prepare_runs` com 2 colunas de contagem.
2. Criar `_shared/group-blast/resolver.ts` (única função `resolveMessage(slot, config, supabase)` com lookup de loteria + IA/palpite/manual).
3. Criar `_shared/group-blast/schedule.ts` (substitui `prepare.ts` + `send-now.ts`, chama `resolveMessage` antes do insert).
4. Criar `_shared/group-blast/dispatch.ts` (substitui `send.ts` + `retry.ts`).
5. Atualizar `supabase/functions/group-blast-send/index.ts` para o novo router.
6. Apagar `prepare.ts`, `send.ts`, `send-now.ts`, `retry.ts`.
7. Smoke test: invocar `prepare` (force=true) numa config Mega-Sena com slot palpite → confirmar que log entra com `message_content` real e `message_source='palpite:megasena'`.
8. Confirmar que `GroupBlastScheduleCard` continua funcionando (não muda contrato dos jobs cron).

### Não muda

- UI `DisparoGrupoTab` — mesma experiência (criar config, slots, com/sem jogos).
- Tabelas `group_blast_configs`, `group_blast_logs`, `group_blast_prepare_runs` (só ganham colunas).
- Cron `group-blast-prepare` (`*/30 * * * *`) e `group-blast-send` (`* * * * *`).
- Lottery config, prompt da IA, formato da mensagem de palpite.

### Critério de sucesso

Após aprovar e implantar:
- Próximo ciclo do `prepare` insere logs com `message_content` preenchido para slots palpite/IA da Mega-Sena e Lotofácil.
- Logs `failed` por "Mensagem vazia" desaparecem do histórico recente.
- Ler 1 log no admin permite ver de onde veio a mensagem (`message_source`).
