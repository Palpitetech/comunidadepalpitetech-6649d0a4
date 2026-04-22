

## Validação defensiva de proxy antes de chamar a Evolution

### Problema

Hoje, `applyProxyToInstance` envia o payload direto para a Evolution mesmo se algum campo crítico (`host`, `port`, `protocol`) vier nulo/vazio do banco. Isso resulta em erro genérico 400 da Evolution (`instance requires property "host"`) que confunde o usuário e suja o log.

Os dados atuais estão íntegros, mas no futuro um proxy mal cadastrado (ex.: import CSV com coluna vazia) quebraria o fluxo de connect/import com erro técnico opaco.

### Mudanças

**1. `supabase/functions/evolution-proxy/index.ts` — guard no helper `applyProxyToInstance`**

No início do helper, antes do `fetch`, validar que quando `proxy != null`:
- `host` é string não-vazia (após `trim()`)
- `port` é número/string parseável para inteiro entre 1 e 65535
- `protocol` está em `["http", "https", "socks4", "socks5"]`

Se inválido, retornar `{ ok: false, status: 0, body: { message: "proxy_invalid", invalidFields: [...] } }` **sem chamar a Evolution**, e logar `[applyProxyToInstance] PROXY INVÁLIDO id=<id> motivos=<...>`.

**2. Tratamento nas 3 actions que aplicam proxy (`importInstanceWithProxy`, `assignProxy`, `connect`)**

Quando `applyProxyToInstance` retorna o novo erro `proxy_invalid`:
- Rollback do claim (`releaseProxyForInstance`).
- No `importInstanceWithProxy`: também deletar a instância recém-inserida.
- Devolver para o front: `{ success: false, code: "proxy_invalid", error: "Proxy <label> está com dados incompletos (host/port/protocol). Edite o proxy em WhatsApp → Proxies.", proxyId, invalidFields }` com HTTP 200 (erro tratado, não 502).

**3. `src/components/admin/whatsapp/InstanciasTab.tsx` — mensagens claras**

- `handleConnect` / `handleAssignProxy` / `handleSyncFromEvolution`: tratar `code === "proxy_invalid"` exibindo `toast.error` específico ("Proxy X com dados inválidos. Corrija em WhatsApp → Proxies antes de tentar novamente.") em vez do erro genérico 502.
- No resumo do `handleSyncFromEvolution`, somar contador `invalidProxy` separado de `failed`.

**4. `src/components/admin/whatsapp/ProxiesTab.tsx` — validação na origem (defesa em profundidade)**

Reforçar `handleSave` e `handleBulkSave` para rejeitar entradas onde `host`, `port` ou `protocol` venham vazios após `trim()` — já existe parsing, mas o save direto via formulário precisa dessa checagem extra antes do `supabase.insert`.

### Resultado esperado

- Nenhuma chamada à Evolution sai com payload incompleto.
- Quando um proxy estiver corrompido no banco, o admin vê: *"Proxy IPRoyal BR #2 está com dados incompletos (faltam: host). Corrija em WhatsApp → Proxies."* — não mais o 400 técnico da Evolution.
- Rollback atômico continua funcionando: instância importada não fica órfã.
- Cadastro novo de proxy via UI não permite salvar incompleto.

### Detalhes técnicos

- Sem mudanças em schema, RLS ou RPC.
- Helper `applyProxyToInstance` ganha ~15 linhas de validação no topo.
- Cada call site existente do helper (`importInstanceWithProxy`, `assignProxy`, bloco `connect`, `swapProxy` para reset) ganha um `if (apply.body?.message === "proxy_invalid")` para tratar o caso específico antes do branch genérico de falha.
- Arquivos tocados:
  - `supabase/functions/evolution-proxy/index.ts`
  - `src/components/admin/whatsapp/InstanciasTab.tsx`
  - `src/components/admin/whatsapp/ProxiesTab.tsx`

