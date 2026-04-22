

# Pool de Proxies SOCKS5 (IPRoyal) → 1 proxy por instância WhatsApp

## Contexto

Você comprou proxies ISP residenciais SOCKS5 brasileiros na IPRoyal. O objetivo é vinculá-los às instâncias da Evolution API para que cada chip WhatsApp use um IP residencial dedicado e estável (reduz risco de ban e melhora entregabilidade). A Evolution API suporta proxy nativo via endpoint `/instance/setProxy/{instance}` por instância.

## Como vai funcionar (visão geral)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Tabela whatsapp_proxies (pool)                                 │
│  ┌──────────┬──────────┬────────┬──────────┬─────────────────┐  │
│  │ host     │ port     │ user   │ status   │ instance_id     │  │
│  │ br.ipr   │ 12321    │ usr_x  │ available│ NULL            │  │
│  │ br.ipr   │ 12322    │ usr_x  │ in_use   │ <uuid_inst_A>   │  │
│  │ br.ipr   │ 12323    │ usr_x  │ disabled │ NULL            │  │
│  └──────────┴──────────┴────────┴──────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │                                     ▲
        │ "Conectar instância"                │ Liberado no
        │ → reserva 1 proxy livre             │ Logout/Delete
        ▼                                     │
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function evolution-proxy                                  │
│  • action "connect": atomic claim do proxy → setProxy →         │
│    connect → retorna QR                                         │
│  • action "logout"/"delete": setProxy(null) + libera no pool    │
│  • Sem proxy disponível → erro claro: "Sem proxy disponível"    │
└─────────────────────────────────────────────────────────────────┘
```

**Regras chave:**
- 1 instância = 1 proxy. Vínculo é exclusivo (`UNIQUE` em `instance_id`).
- Reserva é **atômica** (via função SQL com `FOR UPDATE SKIP LOCKED`) — sem corrida.
- Proxy só é liberado em **logout** ou **delete** da instância (reconectar mantém o mesmo IP — importante para reputação).
- Se acabarem proxies disponíveis na hora de conectar → erro com instrução "compre mais e adicione na aba Proxies".

## O que será construído

### 1. Banco de dados — tabela `whatsapp_proxies`

Colunas:
- `id` (uuid PK)
- `label` (texto, ex: "IPRoyal BR #1") — pra você reconhecer
- `protocol` (`socks5` default, com opção `http` no futuro)
- `host`, `port`, `username`, `password` — credenciais do IPRoyal
- `status` (`available` | `in_use` | `disabled`) — `disabled` = você desativou manualmente
- `instance_id` (uuid FK → `whatsapp_instances`, **UNIQUE**, nullable) — quem está usando
- `assigned_at`, `last_health_check_at`, `last_error`
- `created_at`, `updated_at`

RLS: só admins acessam. Senhas ficam no banco (já protegido por RLS estrito).

### 2. Função SQL atômica `claim_proxy_for_instance(p_instance_id uuid)`

- Se a instância já tem proxy → devolve o mesmo (idempotente).
- Senão pega o primeiro `available` com `FOR UPDATE SKIP LOCKED`, marca `in_use`, vincula `instance_id`, retorna credenciais.
- Se não houver disponível → retorna NULL (a edge function devolve erro amigável).

E `release_proxy_for_instance(p_instance_id uuid)` — usada no logout/delete.

### 3. Edge function `evolution-proxy` — alterações

- **`connect`**: antes de chamar `/instance/connect`, chama `claim_proxy_for_instance` e aplica em `POST /proxy/set/{instance}` da Evolution com `{enabled, host, port, protocol, username, password}`. Se claim falhar → resposta `409` com mensagem "Sem proxy disponível. Compre novos proxies na IPRoyal e adicione em WhatsApp → Proxies."
- **`logout`** e **`delete`**: depois da chamada na Evolution, chama `release_proxy_for_instance` (zera `instance_id`, volta status para `available`, e faz `POST /proxy/set/{instance}` com `enabled:false` no caso de logout).
- Novas actions internas: `testProxy` (faz uma chamada de teste de IP via proxy pra validar que está funcionando antes de salvar).

### 4. Nova aba `Proxies` no admin (`/admin/whatsapp`)

Posicionada **logo após "Instâncias"** na sub-sidebar. Funcionalidades:

- **Lista de proxies** com colunas: Label · Host:Port · Status (badge colorido) · Instância vinculada · Última verificação
- **Botão "Adicionar Proxy"** — modal com campos: label, protocolo (default socks5), host, porta, usuário, senha, e botão "Testar conexão" antes de salvar
- **Botão "Adicionar em lote"** — textarea aceitando o formato que o IPRoyal exporta (ex: `host:port:user:pass` uma por linha) → faz parse e insere todos como `available`
- **Ações por linha**: Testar · Desativar/Ativar · Excluir (só permite excluir se não estiver `in_use`)
- **Card de resumo no topo**: "X disponíveis · Y em uso · Z desativados"
- **Aviso visível** quando `disponíveis = 0`: "Atenção: não há proxies livres. Novas instâncias não conseguirão conectar."

### 5. Aba "Instâncias" — pequenos ajustes

- Cada card de instância mostra um chip com o proxy vinculado (label + IP mascarado, ex: `IPRoyal BR #1 · 45.xxx.xxx.42`) ou "Sem proxy" (quando offline e nunca conectou).
- Botão "Trocar Proxy" (ícone) — libera o atual e força nova reserva no próximo connect. Útil se o IP estiver queimado.
- Mensagem de erro do "Conectar" agora pode ser "Sem proxy disponível" — toast com link "Adicionar proxies".

## Passo a passo do uso (depois de implementado)

1. Ligue seu servidor Evolution de volta.
2. Vá em **WhatsApp → Proxies → Adicionar em lote** e cole as linhas do IPRoyal (`host:port:user:pass`). Salvar.
3. Clique em **Testar** em cada um (ou todos) pra confirmar que respondem. Os que falharem vão pra `disabled` automaticamente.
4. Vá em **Instâncias**, clique **Conectar** numa instância. O sistema reserva 1 proxy livre, aplica na Evolution, e mostra o QR.
5. Escaneie. Pronto — aquela instância ficará permanentemente colada naquele IP residencial até você dar logout/delete.
6. Quando comprar mais proxies: volta na aba Proxies → adiciona em lote → já ficam disponíveis pro próximo connect.

## Detalhes técnicos

- **Formato IPRoyal**: SOCKS5 normalmente vem como `proxy.ipr.com:12321:usuario:senha`. O parser do "adicionar em lote" aceita esse formato e também `host:port` (sem auth).
- **Endpoint Evolution**: `POST {EVOLUTION_API_URL}/proxy/set/{instanceName}` com body `{enabled: true, proxy: {host, port, protocol, username, password}}`. Documentação oficial Evolution API v2.
- **Atomicidade**: `SELECT ... FROM whatsapp_proxies WHERE status='available' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED` — garante que dois connects simultâneos nunca pegam o mesmo proxy.
- **Health-check**: o "Testar" faz uma chamada `GET https://api.ipify.org` através do proxy via fetch no edge (Deno suporta proxy via `Deno.createHttpClient`). Salva o IP retornado em `last_health_check_at` + um campo `external_ip` pra você ver qual IP cada proxy entrega.
- **Segurança**: senhas ficam apenas no banco (RLS admin-only) e nunca aparecem na UI depois de salvas (mostradas como `••••••••` com botão "revelar"). Edge function lê via service role.
- **Recuperação**: se uma instância sumir do banco mas o proxy ficar marcado `in_use`, há um botão "Liberar manualmente" no card do proxy.

## Fora de escopo (próxima iteração se quiser)

- Rotação automática de proxy se o atual ficar offline (por enquanto só manual via "Trocar Proxy")
- Health-check automático periódico (cron) — agora é só sob demanda
- Suporte a proxies HTTP/HTTPS (estrutura aceita, mas UI focada em SOCKS5)
- Métricas de uso por proxy (mensagens enviadas, etc) — pode vir depois cruzando com `send_logs`

