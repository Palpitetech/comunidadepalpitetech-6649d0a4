

## Unificar verificação em OTP de 6 dígitos (sem magic link)

### Problema

Hoje o `receive-lead` gera **magic link** apontando para `/ativar-conta` (rota inexistente → 404). Sistema tem 2 fluxos de verificação confusos: OTP no `RegisterWizard` e magic link no webhook.

### Solução

**Eliminar magic link.** Webhook só cria perfil pendente. Verificação OTP acontece **na primeira tentativa de login** do usuário, reaproveitando o fluxo OTP que já existe (`enviar-codigo-email` + `verificar-codigo`).

### Novo fluxo

```text
Lead chega no webhook
   ↓
Valida (MX, anti-bot, descartáveis)
   ↓
Cria perfil:
  - email_verificado = false
  - tag = 'email_pendente'
  - SEM trial, SEM premium role
   ↓
Envia WhatsApp (se tiver celular) OU email simples
"Bem-vindo! Acesse comunidadepalpitetech.com/login pra ativar"
   ↓
Usuário vai no /login, digita email
   ↓
LoginWizard detecta email_verificado=false
   ↓
Dispara enviar-codigo-email (OTP 6 dígitos)
   ↓
Usuário digita código
   ↓
verificar-codigo marca email_verificado=true
   ↓
Trigger ativar_trial_pos_confirmacao roda → ativa trial 3 dias + role premium
```

### Mudanças

#### 1. `supabase/functions/receive-lead/index.ts`

- **Remover** geração de magic link e envio do email "Ativar conta"
- **Manter** validações (MX, descartáveis, anti-bot)
- **Manter** criação do perfil pendente (`email_pendente`, sem trial)
- **Adicionar** envio de email simples de boas-vindas (sem link de ativação, só CTA "acesse o site e faça login")
- Resposta JSON: `{ success: true, user_id, message: "Acesse o site e faça login com seu email para ativar sua conta" }`

#### 2. `src/components/auth/LoginWizard.tsx`

Adicionar nova lógica no `handleCheckEmail`:

```ts
// Após verificar que usuário existe, checar email_verificado
const { data: perfil } = await supabase
  .from('perfis')
  .select('email_verificado, tags')
  .eq('email', email)
  .maybeSingle();

if (perfil && perfil.email_verificado === false) {
  // Dispara OTP automaticamente e pula pra etapa de código
  await supabase.functions.invoke('enviar-codigo-email', {
    body: { user_id: perfil.id, email, nome: perfil.nome }
  });
  setEtapa('verificacao-email-pendente');
  toast({ title: 'Conta pendente', description: 'Enviamos um código pro seu email pra ativar sua conta.' });
  return;
}
```

Nova etapa `verificacao-email-pendente`: tela com input OTP 6 dígitos + botão "Reenviar código". Ao verificar com sucesso, o trigger `ativar_trial_pos_confirmacao` ativa trial automaticamente e usuário cai logado em `/home`.

#### 3. Trigger `ativar_trial_pos_confirmacao` (já existe ✅)

Funciona perfeitamente: detecta `email_verificado: false → true`, ativa trial 3 dias, troca tag, loga evento. **Sem mudanças.**

#### 4. Adicionar role `premium` quando trial ativa

O trigger atual só mexe em `perfis` (plan_id, status, validade), mas não cria `user_roles.premium`. Vou ajustar a função `ativar_trial_pos_confirmacao` pra inserir o role:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES (NEW.id, 'premium')
ON CONFLICT (user_id, role) DO NOTHING;
```

#### 5. NÃO criar página `/ativar-conta`

Rota fica como 404 mesmo (ninguém vai cair lá já que removemos o link).

### Email de boas-vindas (novo template no `receive-lead`)

```text
Subject: Bem-vindo ao Palpite Tech!

Olá [nome],

Seu cadastro foi recebido. Pra ativar sua conta e ganhar
3 dias grátis de acesso premium:

1. Acesse: https://comunidadepalpitetech.com.br/login
2. Digite seu email
3. Você receberá um código de 6 dígitos
4. Pronto! Trial liberado.

Qualquer dúvida: WhatsApp 51 98185-4281
```

### Logging em `system_events`

- `lead_recebido_pendente` — perfil criado aguardando primeiro login
- `lead_email_confirmado` — usuário ativou via OTP no login (já existe no trigger)

### Arquivos editados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/receive-lead/index.ts` | Remove magic link, troca email pra texto simples |
| `src/components/auth/LoginWizard.tsx` | Detecta `email_verificado=false`, dispara OTP, nova etapa de verificação |
| Migration | Ajusta `ativar_trial_pos_confirmacao` pra inserir role `premium` |

### Fora de escopo

- Não mexo em Kirvano (compra continua confirmando email automaticamente)
- Não mexo no `RegisterWizard` (cadastro manual continua igual com OTP)
- Não apago leads pendentes antigos
- Não crio página `/ativar-conta`
- Não mexo em `enviar-codigo-email` nem `verificar-codigo` (já funcionam)

### Resultado esperado

- Lead via webhook → perfil pendente, recebe email/WhatsApp simples
- Usuário tenta logar → sistema detecta pendente → OTP automático
- Digita código → trial 3 dias ativado + role premium → cai em `/home`
- Único fluxo de verificação no sistema: **OTP 6 dígitos**

