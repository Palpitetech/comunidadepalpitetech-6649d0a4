---
name: internal-verification-flow
description: Fluxo único de verificação de email via OTP de 6 dígitos (sem magic link)
type: feature
---
O sistema possui DOIS pontos de verificação de email, ambos via OTP de 6 dígitos (Resend):

1. **Cadastro manual (`RegisterWizard`)**: usuário cria conta → recebe OTP → digita código → email confirmado.

2. **Lead via webhook (`receive-lead`)**: webhook cria perfil pendente (`email_verificado=false`, `status_assinatura=pendente`, sem trial, sem role premium) e envia email de boas-vindas SIMPLES (sem magic link) instruindo o usuário a fazer login. Quando o usuário tenta logar pelo `LoginWizard`, este detecta `email_verificado=false` na tabela `perfis` e dispara automaticamente `enviar-codigo-email`, mostrando a etapa `verificacao-email-pendente`. Após digitar o OTP corretamente, `verificar-codigo` marca `email_verificado=true`, o trigger `ativar_trial_pos_confirmacao` ativa trial 3 dias + concede role `premium` + role `user` automaticamente. Como a senha foi gerada aleatória pelo webhook, o sistema dispara `resetPassword` para o usuário criar senha e logar.

**Magic link foi REMOVIDO completamente** — não existe mais rota `/ativar-conta`. Único fluxo de verificação no sistema é OTP 6 dígitos.

**Eventos logados:** `lead_recebido_pendente` (criação) → `lead_email_confirmado` (ativação).
