

# Force-update imediato para todos os usuários (PWA + Web)

## Como vai funcionar

```text
[Você faz deploy] 
       ↓
[Admin abre /admin → clica "Forçar atualização global"]
       ↓
[Backend grava nova versão em app_config.current_version = timestamp]
       ↓
[Todo cliente conectado consulta app_config a cada 30s]
       ↓
[Detecta versão > versão local → window.location.reload(true)]
       ↓
[Service Worker novo assume + cache antigo limpo + página recarrega]
       ↓
[Usuário vê nova versão em <60s, sem precisar fechar a aba]
```

## Mudanças

### 1. Banco — tabela `app_config` (singleton)

Tabela com 1 linha só, guardando a versão "obrigatória mínima":

```sql
create table public.app_config (
  id int primary key default 1 check (id = 1),
  current_version bigint not null default extract(epoch from now())::bigint,
  force_reload_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
```

- RLS: `SELECT` público (todos precisam ler para checar), `UPDATE` só admin (`has_role(auth.uid(), 'admin')`).
- Realtime habilitado (`ALTER PUBLICATION supabase_realtime ADD TABLE app_config`) para push instantâneo.
- 1 linha inicial via `INSERT ... ON CONFLICT DO NOTHING`.

### 2. Hook `useForceUpdate` (novo, em `src/hooks/useForceUpdate.ts`)

- Lê `app_config.current_version` no mount, guarda em `localStorage("app_version")`.
- Subscribe via Supabase Realtime no canal `app_config` — quando mudar, compara com versão local.
- Fallback: polling a cada 30s (caso realtime caia).
- Quando `serverVersion > localVersion`:
  1. Atualiza `localStorage("app_version") = serverVersion` (evita loop).
  2. Desregistra todos os service workers + limpa todos os caches (`caches.keys()` → `caches.delete()`).
  3. `window.location.reload()` (hard reload).
- Montado uma vez no `App.tsx`, abaixo dos providers.

### 3. Botão admin — `ForceUpdateButton` em `/admin/whatsapp` ou `/admin` (a definir)

Componente em `src/components/admin/ForceUpdateButton.tsx`:
- Botão "Forçar atualização global" com confirmação (`AlertDialog`).
- Onclick: `UPDATE app_config SET current_version = extract(epoch from now())::bigint, force_reload_at = now(), updated_by = auth.uid() WHERE id = 1`.
- Toast: "Atualização disparada. Todos os usuários ativos serão recarregados em até 60 segundos."
- Mostra também `force_reload_at` mais recente ("Último force-update: há 5 min").

Sugestão: colocar dentro de `/admin` em uma seção "Sistema" ou no topo de `/admin/whatsapp` (você decide — me avisa onde prefere).

### 4. Service Worker — garantir cache busting agressivo

`vite.config.ts` já tem `skipWaiting: true` e `clientsClaim: true` (ok). Adicionar:
- No hook, antes do reload: `await navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.update())))` para forçar checagem do SW novo antes de recarregar.

### 5. Coexistência com banner de update existente

- `PWAUpdateHandler` e `PWAUpdateBanner` continuam para o caso "usuário só abriu agora e tem build novo no SW" (fluxo passivo).
- `useForceUpdate` é o caminho ativo (admin aperta botão → todo mundo recarrega).
- Não conflitam: o force-update sempre vence porque faz reload direto, sem perguntar.

## Resultado esperado

- Você faz deploy → entra no admin → clica "Forçar atualização global" → confirma.
- Em até 30s (realtime) ou 60s (fallback polling), **todo navegador aberto** (PWA instalado, aba aberta no Chrome, qualquer coisa) detecta e recarrega sozinho.
- Usuário vê um flash de reload e já está na versão nova, com SW novo, cache limpo.
- Se o usuário estava digitando: perde o que digitava (trade-off aceito conforme escolha "Forçar reload sem perguntar").

## Detalhes técnicos

- `current_version` é `bigint` (epoch em segundos) — compara numericamente, sem parse de string.
- Primeiro acesso de um cliente novo: salva versão atual em `localStorage` sem recarregar (evita reload infinito).
- Realtime preferencial; polling 30s só como rede de segurança.
- Reload usa `window.location.reload()` — moderno e suficiente; `reload(true)` foi descontinuado mas o limpa-caches manual cobre o gap.
- Sem mudanças em RLS de outras tabelas.
- Arquivos novos: `src/hooks/useForceUpdate.ts`, `src/components/admin/ForceUpdateButton.tsx`.
- Arquivos editados: `src/App.tsx` (montar hook), 1 página admin (montar botão).
- Migração SQL: criar tabela + RLS + realtime + seed de 1 linha.

