

# Importação de Proxies via CSV (4 formatos do IPRoyal)

## O que muda

A aba **WhatsApp → Proxies → Adicionar em lote** ganha um seletor de **formato** (igual ao print do IPRoyal) e suporte a **upload de arquivo .csv/.txt** além de colar o texto. O parser entende os 4 formatos abaixo e transforma cada linha em um proxy `available` no pool.

## Formatos suportados

| Formato                          | Exemplo                                |
| -------------------------------- | -------------------------------------- |
| `HOST:PORTA:USUÁRIO:SENHA`       | `proxy.iproyal.com:12321:user1:pass1`  |
| `HOST:PORTA@USUÁRIO:SENHA`       | `proxy.iproyal.com:12321@user1:pass1`  |
| `USUÁRIO:SENHA:HOST:PORTA`       | `user1:pass1:proxy.iproyal.com:12321`  |
| `USUÁRIO:SENHA@HOST:PORTA`       | `user1:pass1@proxy.iproyal.com:12321`  |

Também continua aceitando `HOST:PORTA` (sem auth) — só no formato 1.

## UI no modal "Adicionar em lote"

```text
┌─ Adicionar proxies em lote ──────────────────────────┐
│                                                       │
│  Prefixo do label:  [ IPRoyal BR              ]      │
│                                                       │
│  Formato do arquivo:                                  │
│  [ HOST:PORTA:USUÁRIO:SENHA              ▼ ]        │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  📎 Importar CSV / TXT       ou cole abaixo   │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ proxy.iproyal.com:12321:user1:pass1            │  │
│  │ proxy.iproyal.com:12322:user1:pass1            │  │
│  │ ...                                             │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  Pré-visualização: 47 válidas · 1 inválida           │
│  Primeiras 3:                                         │
│   • proxy.iproyal.com:12321  user1                   │
│   • proxy.iproyal.com:12322  user1                   │
│   • proxy.iproyal.com:12323  user1                   │
│                                                       │
│  [ Importar 47 proxies ]                             │
└───────────────────────────────────────────────────────┘
```

- Botão **"Importar CSV / TXT"** abre file picker (`.csv,.txt`), lê com `FileReader.readAsText`, e preenche o textarea automaticamente.
- **Seletor de formato** define como cada linha é interpretada — escolha do usuário (não autodetecta, evita ambiguidade).
- **Pré-visualização** ao vivo: mostra contagem de linhas válidas/inválidas e as 3 primeiras parseadas (host + user) — sem expor senhas.
- O CSV pode ter cabeçalho (`host,port,user,pass`) — primeira linha é detectada e ignorada se contém palavras-chave (`host`, `user`, `proxy`).
- Linhas em branco e iniciadas com `#` são ignoradas.

## Implementação técnica

- **Parser único** `parseProxyLine(line, format)` em `src/components/admin/whatsapp/ProxiesTab.tsx`:
  - `format1`: `split(':')` → `[host, port, user, pass]`
  - `format2`: `split('@')` → `[host:port, user:pass]` → split cada parte por `:`
  - `format3`: `split(':')` → `[user, pass, host, port]`
  - `format4`: `split('@')` → `[user:pass, host:port]` → split cada parte por `:`
  - Validações: `port` numérico (1-65535), `host` não vazio, `user/pass` opcionais só no formato 1.
- **Upload de arquivo**: `<input type="file" accept=".csv,.txt,text/plain,text/csv" hidden>` com `ref`, lê via `FileReader` e popula `bulkText`.
- **Pré-visualização** memoizada com `useMemo` rodando o parser sobre `bulkText` em cada keystroke (debounced via state).
- **Insert no banco**: continua usando o mesmo path atual — `supabase.from("whatsapp_proxies").insert(rows)`. Nada muda no banco nem na edge function `evolution-proxy`.
- **Label**: continua sendo `${prefixo} #${n}` incrementando a partir do total atual.

## Não muda

- Tabela `whatsapp_proxies`, RPCs `claim_proxy_for_instance` / `release_proxy_for_instance`, edge function `evolution-proxy`, lógica de reserva 1:1 com instância.
- Modal "Adicionar Proxy" (single) — fica igual.
- Ações por linha (testar, desativar, excluir, liberar).

## Fora de escopo

- Auto-detecção de formato (preferi seletor explícito — mais previsível).
- Importação de arquivos `.xlsx` (só `.csv` e `.txt`).
- Teste automático de cada proxy logo após importar (continua manual via botão "Testar" em cada linha — pra evitar bombardear a API e o saldo do IPRoyal).

