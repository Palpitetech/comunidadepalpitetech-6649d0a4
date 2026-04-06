
# Plano de Correção de Segurança

## Fase 1 — P0 (Crítico)
### 1.1 — Corrigir policy do bucket `post-media`
- Restringir INSERT para que usuários só façam upload no path `auth.uid()/`
- Atualizar policy existente com `(storage.foldername(name))[1] = auth.uid()::text`

### 1.2 — Ativar Leaked Password Protection (HIBP)
- Configurar via auth settings para bloquear senhas vazadas

## Fase 2 — P1 (Alto)
### 2.1 — Auditar Edge Functions com `verify_jwt=false`
- Verificar que todas as funções públicas validam auth internamente via `getClaims()`
- Funções que precisam de auth mas não validam: corrigir

### 2.2 — Revisar Realtime/RLS em tabelas sensíveis
- Garantir que tabelas com dados sensíveis não estejam expostas via Realtime sem RLS adequado

## Fase 3 — P2 (Médio)
### 3.1 — Restringir `saldo_transacoes` INSERT a service_role
- Adicionar policy que permite INSERT apenas para admins/service_role

### 3.2 — Avaliar rate limiting no auth
- Verificar configurações existentes de rate limiting

## Fase 4 — P3 (Baixo)
### 4.1 — Restringir SELECT em `post_likes` e `post_comments`
- Avaliar se acesso público é necessário ou se deve ser restrito a `authenticated`
