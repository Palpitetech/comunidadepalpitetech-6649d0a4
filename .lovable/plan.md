

## Finalizar entrega: deploy das 6 funções + popular rascunhos de hoje

### Diagnóstico

Verifiquei o estado atual:

- **Banco:** colunas `tipo`, `tema_estudo`, `status`, `publicar_em`, `fatos_snapshot` existem em `postagens`. ✅
- **`src/hooks/usePostDetails.ts`:** o campo `tipo: string | null` já está no tipo `PostDetails` (linha 45) e nos dois SELECTs (linhas 72 e 85). ✅ Não há mudança de código a fazer aqui — o erro de typecheck reportado já foi corrigido na rodada anterior.

Resta apenas a parte operacional: deploy das edge functions e disparo da pré-geração para validar o fluxo end-to-end.

### Plano de execução (sem novas mudanças de código)

**1. Deploy das 6 edge functions** (uma única chamada `deploy_edge_functions`):
- `generate-guide-post`
- `precompute-daily-posts`
- `process-scheduled-posts`
- `generate-palpites-from-estudo`
- `sync-lotofacil`
- `sync-megasena`

**2. Disparar `precompute-daily-posts` para hoje** (Lotofácil + Mega-Sena):
- Chamar a função 1× sem filtro → ela lê `post_schedules` ativos das duas loterias e gera os rascunhos com `status='rascunho'`, `publicar_em=<horário do slot hoje>`, `fatos_snapshot=<JSON dos fatos>`.
- Idempotente: se já existir post (rascunho ou publicado) do dia para o par `(loteria, tipo)`, pula sem duplicar.

**3. Validação end-to-end** (read-only após o disparo):

| Verificação | Como |
|---|---|
| Rascunhos criados | `SELECT loteria_tag, tipo, status, publicar_em FROM postagens WHERE created_at::date = current_date AND status='rascunho' ORDER BY publicar_em` |
| `fatos_snapshot` populado | `SELECT id, tipo, jsonb_typeof(fatos_snapshot) FROM postagens WHERE status='rascunho' AND created_at::date=current_date` |
| Logs sem erro | `edge_function_logs` para `precompute-daily-posts` e `generate-guide-post` |
| Rodapé "Próximo Concurso" | `SELECT conteudo FROM postagens WHERE status='rascunho' AND created_at::date=current_date LIMIT 1` — conferir presença do bloco "📅 Próximo Concurso" |
| Botão "Gerar palpites" | Aparece em `/comunidade/post/:slug` para qualquer post **publicado** com `tipo != 'resultado_oficial'` e loteria suportada (Lotofácil/Mega) |

**4. Próximo ciclo de publicação**
- O cron `process-scheduled-posts` (rodando de hora em hora) vai detectar os rascunhos do horário e fazer apenas `UPDATE status='publicado'` — sem chamar IA. Latência ~ms.

### O que NÃO muda

- Nenhum arquivo do projeto será editado nesta rodada.
- Nenhuma migration nova.
- Nenhum schedule cron novo (os existentes já cobrem).

### Riscos

| Risco | Mitigação |
|---|---|
| `precompute-daily-posts` pode demorar (gera N posts × IA) | Roda assíncrono. Acompanho via `edge_function_logs`. Se um tipo falhar, os outros continuam. |
| Rascunho criado fora do horário do dia | Idempotência usa janela BRT 00:00 → próxima 00:00, então roda 1× hoje cobre todos os slots de hoje. |
| Slot do horário já passou hoje | O rascunho fica salvo; cron horário publica no próximo tick (ou imediato se `publicar_em <= now()`). |

