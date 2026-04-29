
# Padronização universal de telefone BR

## Problema

Hoje cada edge function tem sua própria função `normalizePhone` (Kirvano, receive-lead, sync-group-members, group-member-webhook, group-promote-admin, import-csv-users, process-queue, cadastro-iniciar-whatsapp, check-overdue-subscriptions). Resultado:

- Algumas só "removem o 55" e aceitam qualquer coisa com ≥10 dígitos (ex.: Kirvano salva número quebrado sem validar DDD nem 9º dígito).
- Outras validam DDD mas não acrescentam o 9 quando falta.
- O `process-queue` precisou de patch ad-hoc para reanexar o `55` no envio.
- Já existe `supabase/functions/_shared/br-phone.ts` com `normalizeBR` + `variants`, **mas só `verify-whatsapp-number` usa**.

Isso causou os 4 templates falhados: número entrou no banco como veio (sem 9, ou só com DDI cortado), e na hora de enviar a Evolution rejeitou.

## Objetivo

Toda entrada de telefone (webhook, formulário, CSV, sync de grupo) passa por **uma única função** que:

1. Limpa máscara e espaços.
2. Detecta e remove DDI (`55`, `+55`, `0055`).
3. Valida DDD brasileiro (11–99).
4. Aplica regra do 9º dígito por região:
   - DDD ≤ 28 (Sudeste/SP/RJ/ES/MG): celular sempre com 9 → 11 dígitos obrigatório.
   - DDD ≥ 31: celular pode ter ou não 9 historicamente; padrão atual da Anatel é **com 9**, então normalizamos para 11 dígitos sempre que o número parecer celular (não-fixo).
   - Fixos (segundo dígito 2–5) ficam com 10 dígitos.
5. Retorna número canônico **sem DDI, com 9 quando aplicável** (formato salvo no banco hoje).
6. Para envio à Evolution, expõe `toEvolutionFormat()` que devolve `55` + canônico.

Se a entrada for inválida (DDD inexistente, tamanho fora do padrão, sequência óbvia, número internacional não-BR), retorna `null` e o caller decide: webhook salva como `phone_invalid=true` e dispara log; envio marca a fila como `failed` com `error_message: "phone_invalid"` antes de chamar a Evolution (poupa rate limit).

## Etapas

### 1. Expandir `supabase/functions/_shared/br-phone.ts`

Adicionar e exportar:

```ts
// Já existem: normalizeBR(raw) -> string|null  e  variants(n)

// NOVO
export type PhoneNormalizeResult =
  | { ok: true; canonical: string; e164: string; ddd: number; isMobile: boolean }
  | { ok: false; reason: 'empty'|'too_short'|'too_long'|'invalid_ddd'|'invalid_mobile'|'sequence'|'non_br' };

export function normalizePhoneBR(raw: string | null | undefined): PhoneNormalizeResult;

// Atalhos
export function toCanonicalBR(raw: string): string | null;   // 10/11 dígitos sem DDI, ou null
export function toEvolutionBR(raw: string): string | null;   // "55" + canonical, ou null
```

Regras de `normalizePhoneBR`:

- Strip não-dígitos. Se começa com `00`, remove. Se começa com `55` e total = 12 ou 13, remove o `55`.
- Rejeita se restar < 10 ou > 11 dígitos.
- DDD = primeiros 2; rejeita se < 11 ou > 99 (lista oficial pode vir depois).
- Se 10 dígitos e 3º dígito ∈ {6,7,8,9} → era celular sem 9 → **insere 9** automaticamente, vira 11. (`isMobile=true`)
- Se 10 dígitos e 3º dígito ∈ {2,3,4,5} → fixo. (`isMobile=false`)
- Se 11 dígitos e 3º dígito ≠ 9 → `invalid_mobile`.
- Sequências triviais (todos iguais, `1234…`) → `sequence`.
- Retorna `canonical` (10 ou 11 dígitos) e `e164 = "55" + canonical`.

### 2. Substituir as duplicatas

Trocar a `normalizePhone` local pelo helper em:

- `handle-kirvano-webhook/index.ts` → `pickPhone` agora usa `normalizePhoneBR` e devolve `{ canonical, e164, valid }`. Se inválido, segue o fluxo mas grava `phone_invalid=true` no log do webhook e **não** enfileira mensagem de boas-vindas (evita o erro que vimos hoje).
- `receive-lead/index.ts` → `validateCelular` vira wrapper de `normalizePhoneBR`.
- `sync-group-members`, `group-member-webhook`, `group-promote-admin` → usam `toCanonicalBR`.
- `import-csv-users` → usa `toCanonicalBR`; linhas inválidas ficam no relatório de erro do CSV.
- `cadastro-iniciar-whatsapp`, `verificar-codigo` → usam `toCanonicalBR`.
- `check-overdue-subscriptions` → usa `toEvolutionBR`.
- `process-queue/index.ts` → substitui o patch atual por `toEvolutionBR(item.recipient_phone)`. Se retornar `null`, marca `failed` com `error_message: "phone_invalid"` antes de chamar a Evolution.

### 3. Espelhar regra no frontend

`src/lib/celular.ts` ganha o mesmo algoritmo (insere 9 automaticamente em 10 dígitos quando for celular). Assim formulários de cadastro também salvam o número já no formato canônico. Mantém compatibilidade com o que já está validando.

### 4. Migration de saneamento (opcional, sob aprovação)

Script `SELECT` que mostra quantos registros em `profiles.celular`, `leads.phone`, `message_queue.recipient_phone`, `kirvano_sales.phone` estão fora do padrão (10 ou 11 dígitos com DDD válido). Se você aprovar, gero um `UPDATE` que aplica `normalizePhoneBR` a todos eles e marca como `phone_invalid=true` os irrecuperáveis.

### 5. Testes

Estender `verify-whatsapp-number/br-phone_test.ts` (já existe) cobrindo:

- 10 dígitos celular SP → vira 11 (insere 9).
- 10 dígitos fixo SP → fica 10.
- 11 dígitos celular interior MG → fica 11.
- DDI `+55`, `0055`, `55` redundante.
- Lixo: `(11) 99999-999`, `551199`, `999999999999`.

## O que NÃO faz parte

- Não toco em telefones internacionais (fora de escopo BR — se chegar não-BR, retorna `non_br` e o caller decide).
- Não muda o schema de tabelas; só conteúdo via UPDATE opcional.
- Não altera UI do Monitor Grupos.

## Resultado esperado

- Qualquer webhook (Kirvano, lead externo, grupo) entrega no banco sempre o mesmo formato.
- `process-queue` nunca mais precisa de "if startsWith 55" — chama `toEvolutionBR` e pronto.
- Falhas tipo "exists: false" da Evolution caem para zero por causa de DDI faltando ou 9º dígito faltando.
- Código reduzido: ~9 cópias de `normalizePhone` viram 1.
