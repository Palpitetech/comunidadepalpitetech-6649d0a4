

# Centralizar identificação de usuário por celular (sem duplicar)

## Diagnóstico

`perfis.celular` já tem UNIQUE no banco (não há duplicatas hoje), mas a lógica de "achar conta existente por celular antes de criar" só está bem feita em **2 dos 5 pontos** que criam usuários. Nos outros 3, o sistema:
- ou cria conta nova com email diferente e quebra ao gravar celular (estoura UNIQUE)
- ou deixa o usuário num estado órfão (auth criado, perfil sem celular)

A consequência prática: **um mesmo cliente pode ter 2 contas** se chegar por caminhos diferentes com emails diferentes mas mesmo celular.

## Pontos de criação hoje

| Origem | Checa email? | Checa celular? | Status |
|---|---|---|---|
| `receive-lead` (webhook integrações) | ✅ | ✅ | OK |
| `promote-lead-to-user` (admin promove lead) | ✅ | ✅ | OK |
| `LoginWizard` (cadastro manual no site) | ✅ (via OTP) | ❌ | **quebra** se celular existir |
| `handle-kirvano-webhook` (compra Kirvano) | ✅ | ❌ | **cria duplicata por email diferente** |
| `import-csv-users` (admin importa CSV) | ✅ | ❌ | **mesmo problema** |

## Estratégia: helper único `find_or_create_user_by_contact`

Criar uma **função SQL central** (`SECURITY DEFINER`) que recebe `(email, celular_normalizado)` e devolve `{ user_id, found_by, is_new_needed }`. **Toda** criação passa por ela primeiro.

```sql
CREATE OR REPLACE FUNCTION public.find_user_by_contact(
  p_email text DEFAULT NULL,
  p_celular text DEFAULT NULL  -- já normalizado: 10-11 dígitos sem 55
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_found_email text;
  v_found_celular text;
  v_match text;  -- 'email' | 'celular' | null
BEGIN
  IF p_email IS NOT NULL AND p_email <> '' THEN
    SELECT id, email, celular INTO v_id, v_found_email, v_found_celular
    FROM public.perfis
    WHERE lower(email) = lower(p_email) AND is_bot = false
    LIMIT 1;
    IF v_id IS NOT NULL THEN
      RETURN jsonb_build_object('user_id', v_id, 'found_by', 'email',
        'email', v_found_email, 'celular', v_found_celular);
    END IF;
  END IF;

  IF p_celular IS NOT NULL AND p_celular <> '' THEN
    SELECT id, email, celular INTO v_id, v_found_email, v_found_celular
    FROM public.perfis
    WHERE celular = p_celular AND is_bot = false
    LIMIT 1;
    IF v_id IS NOT NULL THEN
      RETURN jsonb_build_object('user_id', v_id, 'found_by', 'celular',
        'email', v_found_email, 'celular', v_found_celular);
    END IF;
  END IF;

  RETURN jsonb_build_object('user_id', null, 'found_by', null);
END;
$$;
```

A regra **cardinal**: ordem de prioridade é **email → celular**. Se achou por email, esse é o dono. Se não achou por email mas achou por celular, **reusa** essa conta (não cria nova) — opcionalmente atualiza email se o novo for "melhor" (lógica abaixo).

## Mudanças por arquivo

### 1. Migration nova
- Criar `find_user_by_contact(email, celular)` como acima
- (Opcional, recomendado) Adicionar índice `CREATE INDEX idx_perfis_email_lower ON perfis (lower(email)) WHERE is_bot=false;` — acelera a busca

### 2. `supabase/functions/handle-kirvano-webhook/index.ts` (linhas ~600–700)

Hoje busca perfil **só por email**. Refatorar:
```ts
// Antes de criar auth user, buscar por email + celular normalizado
const phoneNorm = normalizeKirvanoPhone(phone);
const { data: found } = await admin.rpc("find_user_by_contact", {
  p_email: email,
  p_celular: phoneNorm,
});

if (found?.user_id) {
  // Reusa conta existente. Se achou por celular mas email é diferente,
  // mantém o email original (não sobrescreve identidade) — só atualiza
  // dados do plano (já é o que faz na linha 798).
  targetPerfilId = found.user_id;
  isNewAccount = false;
  // Skip createUser
} else {
  // mesmo fluxo atual de createUser
}
```

Isso impede duplicação quando o cliente paga com email diferente do cadastro original mas mesmo WhatsApp.

### 3. `supabase/functions/import-csv-users/index.ts` (linha ~180)

Substituir o check só-por-email pelo RPC:
```ts
const phoneNorm = normalizePhone(...);
const { data: found } = await supabase.rpc("find_user_by_contact", {
  p_email: email, p_celular: phoneNorm,
});
if (found?.user_id) {
  results.push({ email, status: "skipped", error: `Já existe (match por ${found.found_by})` });
  continue;
}
```

### 4. `src/components/auth/LoginWizard.tsx` (handleRegisterWhatsapp, ~linha 188)

Adicionar **check de celular antes de disparar o OTP**, igual já é feito na etapa de email/celular do login:
```ts
// Antes de signInWithOtp:
const { data: check } = await supabase.rpc("verificar_existencia_usuario", {
  p_celular: validation.normalized,
});
if (check?.exists) {
  toast({
    title: "Celular já cadastrado",
    description: `Já existe uma conta com este número (${check.email}). Faça login em vez de cadastrar.`,
    variant: "destructive",
  });
  setEtapa("email");  // volta para login
  setEmailLogin(check.email);
  return;
}
// Só então signInWithOtp(...)
```

Isso evita: usuário verificar OTP, tentar gravar celular no `updateProfile`, e estourar UNIQUE deixando perfil quebrado.

### 5. `supabase/functions/receive-lead/index.ts` (linhas 438–457)

Já checa email e celular separadamente (OK), mas vou substituir os 2 SELECTs pelo RPC único, **mantendo comportamento idêntico** — só centraliza a lógica para evitar drift futuro.

### 6. `supabase/functions/promote-lead-to-user/index.ts` (linhas 93–109)

Mesma refatoração — trocar os 2 SELECTs pelo RPC único.

### 7. (Bonus, opcional) `enviar-codigo-email` / fluxo OTP

Quando o usuário pede OTP de email novo mas o celular já existe em outra conta, idealmente bloquear no servidor também. Mas como já bloqueamos no LoginWizard antes de chamar OTP, **não é crítico** — fica como nota para próxima iteração se quiser hardening extra.

## O que NÃO muda
- UNIQUE constraint do `celular` — fica como **rede de segurança** final no banco
- Trigger `handle_new_user` — não toca
- Trigger `ativar_trial_pos_confirmacao` — não toca
- Fluxo de leads parciais (`leads_inbox`) — não toca, continua aceitando dados incompletos
- Fluxo de OTP / verificação de email — não toca
- RLS de `perfis` — não toca

## Detalhes técnicos sensíveis

- **Normalização do celular** precisa ser **idêntica** em todo lugar (10-11 dígitos sem `55`). Hoje cada função tem sua própria `normalizeCelular`/`normalizePhone`. Vou garantir que **todas chamem o RPC com o mesmo formato** — se diferirem, o match por celular falha. (Opcional: criar helper TS compartilhado em `_shared/`, mas Lovable não permite subpastas em functions, então vou padronizar inline em cada uma.)
- **Race condition**: dois webhooks simultâneos com mesmo celular podem passar do RPC antes de qualquer um inserir. UNIQUE no DB pega isso — vou tratar o erro `23505` (unique_violation) em todas as funções como "já existe, busca de novo e reusa".
- **Kirvano com email novo + celular existente**: política decidida = **reusar conta existente, manter email original do perfil**. Só atualiza `nome`, `plan_id`, `validade_assinatura`, etc. (não sobrescreve `email` nem `celular`). Isso evita perder a identidade da conta original.
- **CSV import com celular existente**: trata como skipped (mesma política do email duplicado hoje).

## Arquivos

| Arquivo | Ação |
|---|---|
| **Migration nova** | Criar `find_user_by_contact(email, celular)` + índice em `lower(email)` |
| `supabase/functions/handle-kirvano-webhook/index.ts` | Editar — usar RPC antes de createUser, tratar duplicata UNIQUE |
| `supabase/functions/import-csv-users/index.ts` | Editar — usar RPC para check, skip se achar por celular |
| `supabase/functions/receive-lead/index.ts` | Editar — substituir 2 SELECTs pelo RPC único |
| `supabase/functions/promote-lead-to-user/index.ts` | Editar — substituir 2 SELECTs pelo RPC único |
| `src/components/auth/LoginWizard.tsx` | Editar — check de celular antes do OTP no cadastro |

## Fora de escopo
- Mesclar contas duplicadas que já existem (não há duplicatas hoje, mas se aparecer no futuro vira tarefa separada)
- Verificação por CPF (sistema não usa CPF como chave)
- Refatorar normalização de celular para um pacote compartilhado
- Mudar UNIQUE constraint (já existe, fica)

## Resultado esperado
- **Zero possibilidade de duplicar conta** por celular, vindo de qualquer um dos 5 caminhos
- Cliente Kirvano que paga com email diferente do cadastro original → **mantém a mesma conta**, plano é atualizado nela
- Cadastro manual com celular já existente → **mensagem clara** "já tem conta com esse número, faça login", redireciona pro login com email pré-preenchido
- Import CSV pula linhas cujo celular já existe (mesmo se email é novo)
- Lógica de identificação **centralizada em uma função SQL** — futuras alterações ficam em um lugar só

