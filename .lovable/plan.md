## Visão geral

Reorganizar todo o sistema de cadastro/login em torno de **um único campo**: `celular` (que é o WhatsApp). Eliminar duplicidade de fluxos, eliminar caminhos que criam conta sem dados, e padronizar o cadastro num funil único, linear, com verificação dupla (Email + WhatsApp).

Será entregue em 3 planos sequenciais. Cada plano só começa após o anterior estar aprovado/publicado.

---

## PLANO 1 — Unificar "Celular = WhatsApp" no sistema inteiro

**Objetivo:** existir apenas um campo. Sem `whatsapp` separado, sem confusão.

### Etapa 1.1 — Backend
- Criar migração que:
  - Garante que `perfis.celular` esteja preenchido onde só `whatsapp` existir (caso surja no futuro — hoje está limpo).
  - **Remove a coluna `perfis.whatsapp`** (já é redundante: 0 divergências em 45 perfis).
  - Mantém `celular_verificado` (renomeado conceitualmente para "WhatsApp verificado" na UI).
- Atualizar funções/triggers que referenciam `whatsapp`: `handle_new_user`, `sync_perfil_tags`, RPCs de leads, webhooks de Kirvano.
- Edge Functions tocadas: `receive-lead`, `promote-lead-to-user`, `handle-kirvano-webhook`, `import-csv-users`, `admin-update-user`, `process-lead-retargeting` — todas deixam de gravar `whatsapp`.

### Etapa 1.2 — Frontend
- Remover toda referência a `profile.whatsapp` em: `useAuth`, `LoginWizard`, `RequireCelularModal`, `AlterarCelularDialog`, `MeusDadosTab`, `UserDataTab` (admin), `LeadDetailSheet`, `BolaoDetailSheet`, `types/profile`, `types/plans`.
- Padronizar terminologia visível:
  - **Label sempre:** "WhatsApp"
  - **Ícone sempre:** `MessageCircle` (verde WhatsApp)
  - **Placeholder:** `(11) 9XXXX-XXXX`
  - **Helper text:** "Usado para enviar códigos e resultados"
- Manter o nome técnico do campo (`celular`) no código/banco — só muda o que o usuário lê.

### Etapa 1.3 — Limpeza
- Remover `RequireCelularModal` se ficar obsoleto após o novo fluxo (Plano 3 garante celular no cadastro).
- Atualizar página `/verificar-whatsapp` (função admin) para usar a nova terminologia consistente.

---

## PLANO 2 — Centralizar a entrada (1 único caminho)

**Objetivo:** existir **uma forma de cadastro** e **uma forma de entrada de lead**. Hoje há fallbacks que criam conta silenciosamente.

### Etapa 2.1 — Eliminar caminhos paralelos
- **Remover** o fallback `signIn(email)` → `signInWithOtp` em `useAuth.ts`. Sem senha = erro claro pedindo senha.
- **Remover** o fallback `signUp(email)` → `signInWithOtp` em `useAuth.ts`.
- O método `signInWithOtp` continua existindo, mas só é chamado pelo fluxo oficial de cadastro (Plano 3).
- Auditar e remover qualquer botão/link "Entrar com Magic Link" se houver fora do wizard.

### Etapa 2.2 — Unificar leads externos
- `receive-lead` (webhook externo) continua sendo o **único** ponto de entrada de leads.
- Lead capturado por webhook **não cria conta no `auth.users`** — entra em `leads_inbox` como hoje.
- Quando o lead voltar e tentar logar, cai no fluxo de cadastro do Plano 3 (que detecta o lead pendente pelo email e pré-preenche).
- Remover qualquer rota/edge que crie conta automaticamente fora do wizard de cadastro.

### Etapa 2.3 — Login = só com senha
- A tela inicial "Acessar Conta" pede email → se existir conta, pede **senha**. Sem opção OTP no login.
- Se o usuário esqueceu a senha → botão "Esqueci minha senha" (já existe, mantém).
- Se o usuário não tem conta → segue pro fluxo de cadastro do Plano 3.

---

## PLANO 3 — Novo fluxo único de cadastro (linear, 5 etapas)

**Objetivo:** funil único, claro, com validação dupla (Email + WhatsApp via Evolution).

### Sequência de etapas (do ponto de vista do usuário)

```text
[1] Email
     ↓ envia código por email (Resend)
[2] Código de 6 dígitos do Email
     ↓ valida via 'verificar-codigo'
[3] WhatsApp (Celular)
     ↓ envia código via Evolution (instância rotacionada, prioridade máxima)
[4] Código de 6 dígitos do WhatsApp
     ↓ valida via 'verificar-codigo'
[5] Nome + Senha
     ↓ cria auth.users + perfil + role
   Login automático → /home
```

### Etapa 3.1 — Backend: nova edge function `enviar-codigo-whatsapp`
- Recebe `{ celular, contexto: 'cadastro' | 'alterar_celular', user_id?, email? }`.
- Valida formato BR (10-11 dígitos + DDD válido + começa com 9).
- Verifica se o WhatsApp **não está em uso** por outra conta (bloqueia duplicata).
- Gera código 6 dígitos, salva em `codigos_verificacao` (tipo `whatsapp`, expira em 10min).
- **Reutiliza o sistema existente:**
  - Insere na `message_queue` com `priority = 100` (prioridade máxima — acima dos broadcasts).
  - O `process-queue` (que já roda) consome usando o **Round Robin de instâncias Evolution** já existente.
  - Isso garante consistência total com o módulo de WhatsApp atual.
- Mensagem do template: `🔐 Seu código Palpite Tech: *{codigo}*\n\nVálido por 10 minutos. Não compartilhe.`

### Etapa 3.2 — Backend: refator `enviar-codigo-email`
- Já existe — só ajustar para receber `contexto: 'cadastro'` e funcionar **sem `user_id` pré-criado** (envia só pelo email, salva código numa tabela temporária `codigos_verificacao_pre_signup` ou usa `codigos_verificacao` com user_id NULL e email como chave).

### Etapa 3.3 — Backend: nova RPC `criar_conta_completa`
- Recebe `{ email, celular, nome, senha }`.
- Valida que **ambos códigos** (email e WhatsApp) foram verificados nas últimas 30min.
- Cria usuário em `auth.users` via `supabase.auth.admin.createUser()` (com email e senha já confirmados).
- `handle_new_user` cria o perfil com `email_verificado=true`, `celular_verificado=true`, `nome`, `celular`.
- Status inicial: `pendente` (usuário ainda não pediu trial — alinhado com a decisão da rodada anterior).
- Retorna `{ user_id, sucesso: true }`. Cliente faz `signInWithPassword` na sequência.

### Etapa 3.4 — Frontend: novo `RegisterWizard` (substitui as 5 etapas de cadastro do `LoginWizard`)
- Componente novo, dedicado, isolado do login.
- Estado: `etapa: 'email' | 'codigo-email' | 'whatsapp' | 'codigo-whatsapp' | 'nome-senha'`.
- Cada tela com:
  - Mensagens claras de status (enviando, enviado, expirado, inválido, bloqueado).
  - Cooldown de reenvio (30s) com contador visível.
  - Botão voltar em todas as etapas.
  - Indicador de progresso (1/5, 2/5, ...).
- O `LoginWizard` fica só com: tela de email → tela de senha. Se o email não existir, redireciona para `/cadastro` (novo `RegisterWizard`).

### Etapa 3.5 — Mensagens de erro semânticas
A function `verificar-codigo` já existe — ajustar para retornar `erro_codigo`:
- `invalido` → "Código incorreto. Confira os 6 dígitos."
- `expirado` → "Código expirado. Clique em 'Reenviar'."
- `bloqueado` → "Muitas tentativas. Solicite um novo código."
- `nao_encontrado` → "Nenhum código pendente. Solicite um novo."
- `sucesso` → avança no wizard.

---

## Arquivos previstos (referência técnica)

**Migrações:**
- `drop_perfis_whatsapp_column.sql`
- `add_codigos_verificacao_pre_signup.sql` (ou ampliar a tabela atual)
- `criar_conta_completa_rpc.sql`

**Edge functions:**
- Nova: `enviar-codigo-whatsapp`
- Refatorada: `enviar-codigo-email` (suporte a pré-signup)
- Refatorada: `verificar-codigo` (códigos de erro semânticos)
- Removidos campos `whatsapp` em: `receive-lead`, `promote-lead-to-user`, `handle-kirvano-webhook`, `import-csv-users`, `admin-update-user`

**Frontend:**
- Novo: `src/components/auth/RegisterWizard.tsx` + rota `/cadastro`
- Refatorado: `src/components/auth/LoginWizard.tsx` (só email + senha)
- Refatorado: `src/hooks/useAuth.ts` (sem fallbacks OTP)
- Atualizados: `RequireCelularModal`, `AlterarCelularDialog`, `MeusDadosTab`, `UserDataTab`, types

---

## O que NÃO muda

- Estrutura `auth.users` do Supabase.
- Sistema de roles (`user_roles`).
- Lógica de planos/trial (continua manual via `UpgradeModal`).
- Round Robin de instâncias Evolution (apenas reutilizado).
- Os 6 usuários já revertidos passam pelo novo fluxo no próximo login.

---

## Posso começar pelo Plano 1?

Confirme se a sequência (1 → 2 → 3) está correta, ou se prefere outra ordem. Cada plano será aplicado e validado antes do próximo começar.
