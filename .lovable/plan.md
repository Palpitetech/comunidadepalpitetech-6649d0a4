## Varredura — Achados nos 3 Planos

Investiguei os arquivos tocados nos planos 1, 2 e 3. Abaixo, o que está duplicado, morto ou risco de manutenção, agrupado por plano. Cada item indica a ação proposta.

---

### Plano 1 — Centralizar campo celular = WhatsApp

**Achado 1.1 — Front escreve em `celular` E `whatsapp` em paralelo (duplicação)**
3 lugares ainda fazem `update({ celular: x, whatsapp: x })`:
- `src/components/perfil/AlterarCelularDialog.tsx:140`
- `src/components/shared/RequireCelularModal.tsx:32`
- `src/components/admin/UserDataTab.tsx` (form admin permite editar `whatsapp` separadamente)

Já o `cadastro-finalizar` (Plano 3, novo) grava só `celular`. Resultado no banco hoje: **9 perfis com `celular ≠ whatsapp`** (todos têm `celular`, alguns sem `whatsapp`).

Ação:
- Eliminar `whatsapp` das gravações no front (apenas `celular`).
- `UserDataTab` (admin) passa a editar só `celular` — campo whatsapp some do form.
- Migração de dados (insert tool): `UPDATE perfis SET whatsapp = celular WHERE whatsapp IS DISTINCT FROM celular` para zerar divergência.
- (Opcional, em segundo passo) Trigger `BEFORE INSERT/UPDATE` em `perfis` que sincroniza `whatsapp := celular`. Mantemos a coluna por compat de leitura, mas com gravação centralizada.

**Achado 1.2 — Leituras de `user.whatsapp` ainda existem**
`UserDataTab.tsx` lê `user.whatsapp || user.celular` em 3 pontos para exibir/copiar/abrir conversa Evolution. Como `whatsapp` ficará sempre = `celular`, podem ler só `celular`.

Ação: trocar todas as leituras `whatsapp || celular` por `celular`.

---

### Plano 2 — Login único (email + senha)

**Achado 2.1 — `signInWithOtp` e `verifyOtp` no `useAuth.ts` são código morto**
O grep de chamadores fora de `useAuth.ts/AuthContext.tsx` retornou **vazio**. Foram removidos como fallback do login, e o RegisterWizard novo usa Edge Functions próprias (`cadastro-iniciar-email` etc.), não `supabase.auth.signInWithOtp`.

Ação: remover `signInWithOtp` e `verifyOtp` de `useAuth.ts`, do tipo `AuthContextType` em `AuthContext.tsx`, e do `return` exposto do hook. Comentário enganoso na linha 105–107 ("vive no RegisterWizard") também sai.

**Achado 2.2 — `LoginWizard` ainda chama Edge Functions OTP antigas**
`LoginWizard.tsx` invoca `enviar-codigo-email` (linhas 75, 183) e `verificar-codigo` (linha 149) num fluxo `verificacao-email-pendente` — usado para leads Kirvano que ainda não confirmaram email. Esse fluxo coexiste com o RegisterWizard novo, mas usa o pipeline antigo (`codigos_verificacao`, exige `user_id`), o que é correto aqui (a conta já existe). Mantido, **mas** precisa ficar claro que esse fluxo só é alcançado para usuários já criados pelo webhook.

Ação: nenhuma remoção. Adicionar comentário explicativo no topo desse branch e renomear `etapa` para `confirmar-email-existente` (mais claro que "pendente"). Consolidar mensagens de erro (hoje há strings inline; passa pra constantes no topo).

---

### Plano 3 — Cadastro 5 etapas

**Achado 3.1 — Edge Functions OTP duplicadas**
Existem dois universos de funções OTP:
- Antigo: `enviar-codigo-email`, `enviar-codigo-sms`, `verificar-codigo` (tabela `codigos_verificacao`, exige `user_id`).
- Novo: `cadastro-iniciar-email/whatsapp`, `cadastro-verificar-email/whatsapp`, `cadastro-finalizar` (tabela `cadastros_pendentes`, sem `user_id` até o fim).

**`enviar-codigo-sms` é órfão** (zero chamadores em todo o repo). `enviar-codigo-email` e `verificar-codigo` ainda são usados pelo `LoginWizard` (confirmar email de lead Kirvano) e `AlterarCelularDialog` (alterar celular de usuário logado) — então ficam.

Ação:
- Apagar `supabase/functions/enviar-codigo-sms/`.
- Documentar no header das duas funções antigas (`enviar-codigo-email`, `verificar-codigo`) que elas servem **apenas** para usuários **já existentes**; cadastro novo usa a família `cadastro-*`.

**Achado 3.2 — `Cadastro.tsx` tem helpers locais e mensagens repetidas**
- 5 funções `enviarCodigoX` / `verificarCodigoX` repetem o mesmo padrão de tratamento de erro (`EXPIRADO`, `BLOQUEADO`, `INCORRETO`). 
- Strings de erro estão inline 4 vezes.

Ação: extrair `mapErroCodigo(erro, mensagem)` em `src/lib/cadastroErros.ts` e usar nos 4 pontos. Reduz risco de divergência futura.

**Achado 3.3 — `cadastros_pendentes` precisa de cleanup**
A tabela tem `expires_at` (24h) mas nenhum job/trigger limpa registros expirados. Vai inflar.

Ação: criar função SQL `cleanup_cadastros_pendentes_expirados()` agendada via cron (pg_cron) — 1×/dia remove `WHERE expires_at < now() AND finalizado = false`.

---

### Resumo executivo das ações

```
Plano 1 (celular)
 - Remover whatsapp das 3 gravações no front
 - UserDataTab: editar só celular
 - UPDATE perfis SET whatsapp = celular (back-fill)
 - (opcional) Trigger sync whatsapp := celular

Plano 2 (login)
 - Remover signInWithOtp + verifyOtp de useAuth + AuthContext
 - Renomear etapa "verificacao-email-pendente" → "confirmar-email-existente"
 - Mover strings de erro do LoginWizard p/ constantes

Plano 3 (cadastro)
 - Deletar Edge Function enviar-codigo-sms (órfã)
 - Header explicativo em enviar-codigo-email + verificar-codigo
 - Extrair mapErroCodigo() em src/lib/cadastroErros.ts
 - Cleanup job para cadastros_pendentes (pg_cron diário)
```

### Detalhes técnicos

- **Migração de dados** (`whatsapp = celular`): via insert tool, não migration (é UPDATE de dados, não schema).
- **Trigger sync** (se aprovado): `BEFORE INSERT OR UPDATE OF celular ON perfis FOR EACH ROW EXECUTE FUNCTION sync_celular_whatsapp()`. Função apenas faz `NEW.whatsapp := NEW.celular; RETURN NEW;`.
- **pg_cron**: a extensão já é usada no projeto (`group_blast`, `lead_retargeting`). Adicionamos um job: `select cron.schedule('cleanup-cadastros-pendentes', '0 4 * * *', $$delete from cadastros_pendentes where expires_at < now() and finalizado = false$$);`.
- **`AuthContext.tsx`**: tipos `signInWithOtp` e `verifyOtp` saem da interface; nenhum consumidor TS quebra (verificado por grep).
- **Não mexer**: `cadastro-finalizar` (correto), `LoginWizard` fluxo Kirvano (em uso real), tabela `codigos_verificacao` (usada por AlterarCelularDialog).

### O que NÃO muda
- Nenhuma lógica de planos / Kirvano / RLS.
- Nenhuma rota nova.
- Coluna `whatsapp` da tabela permanece (compat); só param de escrever divergente.
- Round Robin Evolution / fila WhatsApp.

Aprovando, executo na ordem listada (Plano 1 → 2 → 3) num único bloco de mudanças.