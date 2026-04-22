

# Importação Segura: Buscar Instâncias da Evolution + Atribuir Proxy

## Problema

Hoje, **"Buscar Instâncias"** (`handleSyncFromEvolution`) só insere a instância no banco, **sem reservar/aplicar proxy**. Resultado: a instância importada fica navegando **sem IP residencial** (insegurança = risco de ban). Além disso, a instância "Tablet" recém-importada veio sem proxy justamente por isso.

A regra de segurança correta é: **nenhuma instância opera sem proxy**. Se não houver proxy disponível, a instância **não deve ser importada**.

## Solução

Reformular o fluxo de **"Buscar Instâncias"** para tratar cada instância da Evolution como uma transação atômica de 3 passos:

```text
Para cada instância nova encontrada na Evolution:
  1. INSERIR no banco (whatsapp_instances)
  2. RESERVAR proxy disponível (claim_proxy_for_instance)
     ├─ se NÃO houver proxy → ROLLBACK (deletar do banco) e pular
     └─ se houver           → continua
  3. APLICAR proxy na Evolution (POST /proxy/set/:name)
     ├─ se falhar → ROLLBACK (release_proxy + deletar do banco)
     └─ se OK     → restart da instância e mantém importada
```

Resumo final ao usuário: `X importadas com proxy, Y puladas por falta de proxy, Z falharam ao aplicar`.

## Mudanças

### 1. Edge Function `evolution-proxy` — nova action `importInstanceWithProxy`

Centraliza a transação no servidor (mais seguro, não depende do navegador). Recebe `{ instanceName, phone, status }` e:

- Insere em `whatsapp_instances` (service role, bypass RLS).
- Chama `claim_proxy_for_instance` com o UUID recém-criado.
- Se claim falhar com `no_proxy_available` → deleta a instância do banco e devolve `{ success: false, code: "no_proxy_available" }`.
- Se claim OK → chama `applyProxyToInstance` na Evolution.
- Se aplicar falhar → `release_proxy_for_instance` + deleta a instância + devolve erro.
- Se tudo OK → `PUT /instance/restart/:name` e devolve `{ success: true, proxy: { label, host } }`.

Reutiliza helpers já existentes: `getSupabase`, `applyProxyToInstance`, `claimProxyForInstance`, `releaseProxyForInstance`, `getInstanceUuid`.

### 2. `InstanciasTab.tsx` — refatorar `handleSyncFromEvolution`

```text
const evoData = await callEvolution("fetchInstances")
filtrar instâncias não existentes no banco
para cada nova:
  invoke("evolution-proxy", { action: "importInstanceWithProxy", instanceName, phone, status })
  contabilizar: imported / skippedNoProxy / failed
```

Toast final consolidado:
- `3 importadas com proxy`
- `2 puladas: sem proxy disponível. Adicione proxies em WhatsApp → Proxies.` (com `toast.warning`)
- `1 falhou ao aplicar proxy` (com `toast.error`)

Se **nenhum proxy disponível** logo no início, pula direto sem nem tentar (uma única consulta antes do loop).

### 3. Pequeno ajuste em `handleAssignProxy` (já existente)

Sem mudanças funcionais — apenas garantir que mensagem de erro de "sem proxy" aponte para `WhatsApp → Proxies` (já faz).

## Resultado esperado

- Buscar Instâncias **nunca mais traz instância sem proxy**.
- Mensagens claras: o admin sabe exatamente quantas vieram, quantas faltaram proxy e quantas falharam.
- Rollback atômico: nenhum estado intermediário inconsistente (instância no banco + proxy não aplicado).
- Botão "Atribuir proxy" continua existindo para casos legados (instâncias antigas que ficaram sem proxy).

## Detalhes técnicos

- Toda a transação roda na edge function com `SUPABASE_SERVICE_ROLE_KEY` — RLS não interfere.
- `claim_proxy_for_instance` já é atômico (`FOR UPDATE SKIP LOCKED`), então mesmo importações concorrentes não duplicam reserva.
- O `restart` da instância após aplicar proxy é necessário para o IP novo passar a vigorar (mesmo padrão já usado em `assignProxy`).
- Não muda schema do banco, não muda RLS, não muda RPC.
- Arquivos tocados: `supabase/functions/evolution-proxy/index.ts` (+ ~50 linhas), `src/components/admin/whatsapp/InstanciasTab.tsx` (refatorar `handleSyncFromEvolution`).

