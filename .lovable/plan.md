

## Plano: Adicionar link do post na mensagem diária

### Alterações na Edge Function `community-daily-message/index.ts`

Apenas na função `generateMessage()`:

1. **Adicionar parâmetro `baseUrl`** — lido de `COMMUNITY_BASE_URL` (já configurado como secret)
2. **Atualizar prompt da IA** — trocar a instrução de "chamar para interagir na comunidade" por "encerrar com chamada para comentar no post, sem incluir o link"
3. **Concatenar link ao final** — `mensagem + "\n\n" + baseUrl + "/post/" + post.id`

Todas as chamadas de `generateMessage()` passarão o `baseUrl` e o `post.id` para montar o link.

### Arquivos alterados
- `supabase/functions/community-daily-message/index.ts` (apenas a função `generateMessage` e suas chamadas)

