## Diagnóstico

Confirmei via API que a Edge Function recebe os participantes com sucesso (`probe_used: "Tablet"`, `probe_error: null`), mas **todas as instâncias caem em `not_in_group`**. Causa: incompatibilidade de formato de telefone.

- **Banco** (`whatsapp_instances.phone_number`): 12 dígitos no formato antigo `5551 81807300` — DDI 55 + DDD 51 + 8 dígitos (**sem o "9"** móvel).
- **WhatsApp/Evolution API** retorna o JID dos participantes em formato moderno: `5551 9 81807300` — 13 dígitos (**com o "9"**).

A comparação atual (`participant.phone === myPhone || participant.phone.endsWith(myPhone)`) falha porque:
- `"5551981807300".endsWith("555181807300")` → `false` (o "9" está no meio).

## Correção

Substituir a comparação por uma função `phonesMatch(a, b)` que gera todas as variantes equivalentes de cada número e checa se há interseção:

- Original (com/sem DDI 55)
- Local (sem DDI)
- Local **com** prefixo "9" móvel (quando tem 10 dígitos locais)
- Local **sem** prefixo "9" móvel (quando tem 11 dígitos locais)
- Cada uma também na versão com `55` na frente

Aplicar essa função em dois lugares dentro de `supabase/functions/group-promote-admin/index.ts`:

1. **`listForGroup`** — substituir o `find()` que cruza `instance.phone_number` × `participants[].phone` para usar `phonesMatch`.
2. **`promote`** — mesma substituição na detecção da instância admin que vai emitir o comando `promote`.

Adicionar também um `console.log` único com `[group-promote-admin] sample participant phone:` exibindo o primeiro participante recebido, para auditoria futura caso outro provedor mude o formato.

## Arquivos afetados

- `supabase/functions/group-promote-admin/index.ts` (única alteração)

Sem mudanças de schema, frontend ou outras edge functions.
