

# Auditoria de Seguranca Completa - Palpite Tech

Analise detalhada do sistema contra o checklist de seguranca internacional.

---

## 1. Protecao de Dados (LGPD / GDPR)

| Item | Status | Detalhe |
|------|--------|---------|
| Politica de Privacidade | PENDENTE | Existe texto "Ao criar uma conta, voce concorda com nossos termos de uso" na tela de login, mas nao ha link para uma pagina real de Politica de Privacidade |
| Termos de Uso | PENDENTE | Mesmo caso - referencia existe mas sem pagina dedicada |
| Consentimento para uso de dados | PENDENTE | Nao ha checkbox de consentimento explicito no cadastro |
| Opcao de excluir conta/dados | PENDENTE | Nao existe funcionalidade de exclusao de conta. Nenhum codigo encontrado para deletar usuario ou seus dados |
| Dados usados so para o fim declarado | OK | Dados coletados (nome, email, celular) sao usados apenas para autenticacao e perfil |

**Acoes necessarias:**
- Criar paginas `/termos` e `/privacidade` com textos juridicos
- Adicionar checkbox de consentimento no RegisterWizard
- Implementar funcao "Excluir minha conta" na pagina de Perfil (cascade delete via edge function com service_role)

---

## 2. Autenticacao e Acesso

| Item | Status | Detalhe |
|------|--------|---------|
| Senhas criptografadas (hash + salt) | OK | Supabase Auth usa bcrypt automaticamente |
| Regras minimas de senha | PARCIAL | O backend de recuperacao exige 6 caracteres (`redefinir-senha`), mas o padrao recomendado e 8+ |
| Login por token (JWT) | OK | Supabase Auth usa JWT com refresh token automatico |
| Expiracao automatica de sessao | OK | `autoRefreshToken: true` configurado no client |
| Logout real (invalidar token) | OK | `supabase.auth.signOut()` implementado |
| Leaked Password Protection | PENDENTE | Desativado - requer ativacao manual no painel de autenticacao do backend |
| 2FA (dupla autenticacao) | NAO IMPLEMENTADO | Opcional, mas recomendado para admins |

**Acoes necessarias:**
- Aumentar minimo de senha para 8 caracteres
- Ativar Leaked Password Protection manualmente no backend
- Considerar 2FA para contas admin

---

## 3. Criptografia

| Item | Status | Detalhe |
|------|--------|---------|
| HTTPS (SSL/TLS) | OK | Lovable Cloud e dominio `lovable.app` usam HTTPS automaticamente |
| Senhas criptografadas no banco | OK | Supabase Auth armazena com bcrypt |
| CPF protegido | OK | Campo `cpf` na tabela `perfis` protegido por RLS (`auth.uid() = id`) |
| Tokens protegidos | OK | JWT gerenciado pelo Supabase, secrets armazenados em variaves de ambiente |

Nenhuma acao critica necessaria.

---

## 4. Controle de Permissoes (RBAC)

| Item | Status | Detalhe |
|------|--------|---------|
| Perfis separados (Admin/User) | OK | Tabela `user_roles` com enum `app_role` (user, premium, moderator, admin) |
| Rotas protegidas | OK | `ProtectedRoute` e `AdminRoute` implementados no frontend |
| API validando permissoes | OK | RLS policies + funcao `has_role()` com SECURITY DEFINER |
| Front e backend alinhados | OK | Frontend verifica roles via `useUserRole`, backend via RLS e triggers |
| Roles em tabela separada | OK | `user_roles` separado de `perfis` - previne escalacao de privilegios |
| Trigger anti-manipulacao perfis | OK | `prevent_subscription_changes` bloqueia alteracao de plan_id, is_blocked, etc. |
| Trigger anti-manipulacao posts | OK | `prevent_post_field_manipulation` bloqueia alteracao de curtidas, bot_interactions, etc. |

Sistema RBAC bem implementado. Nenhuma acao critica.

---

## 5. Protecao Contra Ataques

| Item | Status | Detalhe |
|------|--------|---------|
| SQL Injection | OK | Supabase SDK usa queries parametrizadas. Nenhum SQL raw no frontend |
| XSS | OK | `dangerouslySetInnerHTML` usado apenas em `chart.tsx` (componente UI interno, sem input de usuario). Inputs sanitizados pelo React |
| CSRF | OK | JWT via header Authorization (nao cookie), imune a CSRF |
| Brute Force login | PARCIAL | Supabase Auth tem rate limiting basico. Codigos OTP limitam 5 tentativas. Nao ha captcha |
| URLs sanitizadas | OK | `encodeURIComponent` usado em links WhatsApp. Checkout URL aberto com `noopener,noreferrer` |

**Acoes recomendadas:**
- Considerar adicionar captcha (hCaptcha/reCaptcha) no login apos X tentativas
- Rate limiting adicional nas edge functions publicas

---

## 6. Logs e Monitoramento

| Item | Status | Detalhe |
|------|--------|---------|
| Log de login | PARCIAL | Supabase Auth loga internamente, mas nao ha tabela customizada de auditoria |
| Log de erro | PARCIAL | `console.error` em varios pontos, mas sem servico centralizado (Sentry, etc.) |
| Log de acoes importantes | OK | `bot_publishing_logs`, `kirvano_webhook_logs` registram eventos criticos |
| Alerta de comportamento estranho | NAO IMPLEMENTADO | Nao ha sistema de alertas |

**Acoes recomendadas:**
- Integrar servico de monitoramento (Sentry recomendado para erros frontend)
- Criar tabela de audit_log para acoes sensiveis (login, alteracao de perfil, etc.)

---

## 7. Backup e Recuperacao

| Item | Status | Detalhe |
|------|--------|---------|
| Backup automatico | OK | Lovable Cloud (Supabase) inclui backups automaticos diarios |
| Backup criptografado | OK | Gerenciado pela infraestrutura do Lovable Cloud |
| Teste de restauracao | RECOMENDADO | Recomenda-se testar restauracao periodicamente |

Nenhuma acao critica.

---

## 8. Infraestrutura

| Item | Status | Detalhe |
|------|--------|---------|
| Secrets no ambiente | OK | 15 secrets configurados via variaves de ambiente (TWILIO, RESEND, KIRVANO, etc.) |
| Nunca no codigo | OK | Nenhum secret hardcoded encontrado. Anon key e publishable (seguro no frontend) |
| Edge functions publicas | ATENCAO | 15 edge functions com `verify_jwt = false`. A maioria sao cron jobs ou webhooks que precisam ser publicos, mas `generate-palpites` e `generate-palpites-megasena` deveriam exigir JWT |

**Acoes recomendadas:**
- Revisar se `generate-palpites` e `generate-palpites-megasena` precisam de `verify_jwt = false` ou se podem exigir autenticacao

---

## 9. Compliance

| Item | Status |
|------|--------|
| LGPD | PARCIAL - faltam paginas de Politica de Privacidade e Termos, e funcao de exclusao de dados |
| ISO 27001 | Nao aplicavel agora |
| SOC 2 | Nao aplicavel agora |
| PCI DSS | N/A - pagamentos via Kirvano (terceiro) |

---

## 10. Auditoria e Pentest

| Item | Status |
|------|--------|
| Scanner automatico | OK - varredura de seguranca integrada ao Lovable |
| Pentest externo | RECOMENDADO para fase de producao madura |

---

## Resumo de Prioridades

### Critico (fazer agora)
1. Ativar Leaked Password Protection no backend
2. Criar paginas de Politica de Privacidade e Termos de Uso

### Importante (fazer em breve)
3. Implementar funcao "Excluir minha conta" (LGPD)
4. Adicionar checkbox de consentimento no cadastro
5. Aumentar minimo de senha para 8 caracteres
6. Revisar edge functions com `verify_jwt = false`

### Recomendado (melhoria continua)
7. Integrar Sentry para monitoramento de erros
8. Considerar captcha no login
9. Criar tabela de audit_log
10. Considerar 2FA para admins

---

## Detalhes Tecnicos da Implementacao

### Paginas de Termos e Privacidade
- Criar `/src/pages/Termos.tsx` e `/src/pages/Privacidade.tsx`
- Adicionar rotas publicas no `App.tsx`
- Atualizar link na tela de login para apontar para as paginas

### Exclusao de Conta
- Criar edge function `delete-account` que:
  - Deleta dados do usuario em todas as tabelas (cascade)
  - Chama `supabase.auth.admin.deleteUser(userId)`
- Adicionar botao "Excluir minha conta" na pagina de Perfil com confirmacao

### Checkbox de Consentimento
- Adicionar campo no `StepDadosPessoais.tsx` com link para termos e privacidade
- Bloquear criacao de conta sem aceitar

### Minimo de Senha
- Atualizar validacao no `StepDadosPessoais.tsx` e na edge function `redefinir-senha`

