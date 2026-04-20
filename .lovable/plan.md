

## Revisão dos templates de WhatsApp

### Problemas detectados nos templates atuais

| # | Template | Problema |
|---|---|---|
| 1 | Cadastro Comunidade | ✅ Único ativo. Tem link/email, mas falta variável `{{senha}}` (envia "123456" hardcoded sem deixar claro que é só fallback). |
| 2 | Boas-vindas Cadastro | Inativo. Genérico demais — não passa email/login/senha. Redundante com #1. |
| 3 | Trial expirando hoje | Inativo. Delay 0 + evento `trial_finalizado` = dispara DEPOIS que já expirou. Texto diz "termina hoje", mas só dispara quando já terminou. |
| 4 | Compra aprovada | Inativo. **Faltam credenciais de acesso** (link, email, senha). |
| 5 | Assinatura vencida | Inativo. Delay 0 está OK (avisar imediatamente). Texto OK. |
| 6 | Lembrete verificar email | Inativo. Delay 1440min (24h) é muito tarde — verificação de email costuma ser nos primeiros 30-60min. |
| 7 | Reativação 7 dias | Inativo. Delay 10080min (7d) está correto. Texto OK. |

### Mudanças propostas (migração SQL)

**Template 1 — Cadastro Comunidade** (manter ativo)
- Trocar bloco hardcoded "Senha criada / 123456" por variável real `{{senha}}` quando disponível, com fallback claro.
- Delay: **0** (imediato) ✅

**Template 2 — Boas-vindas Cadastro** (manter inativo + arquivar)
- Marcar `is_active=false` definitivamente. Já temos #1 cumprindo a função. Não dispara duplicidade.

**Template 3 — Trial expirando hoje**
- Renomear para "Trial expirando em 1 dia"
- Mudar evento para `trial_iniciado` + delay **2880min (2 dias)** → dispara no penúltimo dia do trial de 3 dias
- Texto ajustado: "Seu período de teste termina amanhã"

**Template 4 — Compra aprovada** ⭐ principal pedido
- Adicionar bloco de credenciais:
  ```
  🎉 Pagamento confirmado, {{nome}}!

  Seu plano "{{produto}}" já está ativo.

  🔑 Seus dados de acesso:
  📧 Email: {{email}}
  🔒 Senha: a mesma do cadastro (caso tenha esquecido, use "Resetar Senha")
  🔗 Login: https://www.palpitetech.com.br/login

  Aproveite todas as ferramentas premium!
  Qualquer dúvida, é só chamar.
  ```
- Delay: **0** (imediato) ✅

**Template 5 — Assinatura vencida**
- Manter texto. Delay **0** (imediato após evento `assinatura_expirada`).

**Template 6 — Lembrete verificar email**
- Reduzir delay de 1440 → **60min** (1h após cadastro). Janela ideal para lembrete.
- Manter `exclude_tags: [verificado]` para não enviar a quem já confirmou.

**Template 7 — Reativação 7 dias**
- Manter como está. Delay 10080min (7d) ✅.

### Tabela final de delays revisados

| Template | Evento | Delay |
|---|---|---|
| Cadastro Comunidade | novo_cadastro | 0 (imediato) |
| Lembrete verificar email | novo_cadastro | 60 min |
| Trial expirando em 1 dia | trial_iniciado | 2880 min (2d) |
| Compra aprovada (com credenciais) | sale_confirmed | 0 (imediato) |
| Assinatura vencida | assinatura_expirada | 0 (imediato) |
| Reativação 7 dias | acesso_cortado | 10080 min (7d) |

### Sobre a variável `{{senha}}`

**Não vou adicioná-la em produção** — armazenar senha em texto puro viola LGPD e quebra o hash bcrypt do Supabase Auth. Em vez disso:
- No template **Cadastro Comunidade** (cadastro manual via wizard): texto fica "Use a senha que você criou no cadastro" + fallback de reset.
- No template **Compra aprovada** (cadastro automático via Kirvano webhook): texto fica "Use a senha provisória **123456** no primeiro acesso e altere em seguida" — é o padrão do `kirvano-auto-account-creation`.

### Arquivos editados

| Arquivo | Mudança |
|---|---|
| Nova migração SQL | `UPDATE message_templates` para os 7 registros (texto, delay, evento, ativo/inativo) |

### Fora de escopo
- Sem mudanças em `useDisparoManual` / UI (templates editáveis pela tela de Templates)
- Sem alteração no trigger `queue_templates_for_event`
- Sem novo evento — uso os já existentes do vocabulário oficial

### Resultado esperado
- Compra aprovada entrega login completo (email + link + instrução de senha)
- Lembrete de verificação chega em janela útil (1h, não 24h)
- Trial avisa antes de expirar, não depois
- Comunicações alinhadas ao vocabulário canônico de eventos/tags

