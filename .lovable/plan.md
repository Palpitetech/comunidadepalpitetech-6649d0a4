

## Travar `receive-lead` — exigir Nome + Email + Celular válidos, bloquear lixo

### Diagnóstico dos cadastros estranhos

Os 21 leads vieram do webhook **`grupo_salasecreta`** (token `Leads - Grupo Free - PalpiteQuente`). Padrão dos suspeitos:

| Email | Nome | Celular |
|---|---|---|
| `jkhjkgyg@gmail.com` (20/abr 00:46 UTC = 21:46 BRT 19/abr) | jkhjkgyg@gmail.com | nulo |
| `gdfh@hotmail.com` (19/abr 19:14 UTC = 16:14 BRT) | gdfh@hotmail.com | nulo |
| `fd@gmail.com`, `tag@gmail.com`, `kjaslkdjodksj@gmail.com` | igual ao email | nulo |

Todos têm 3 sintomas em comum:
1. **Sem celular** (a função aceita "email OU celular")
2. **Sem nome** (vem o email no campo nome, sinal claro de form sem campo de nome)
3. **Email com padrão de bot** (teclado batido, muito curto, só consoantes)

### O que vou implementar

#### 1. Tornar Nome + Email + Celular **obrigatórios** (era "email OU celular")

```ts
if (!nome?.trim() || !email?.trim() || !celular?.trim()) {
  return json({ error: "Nome, email e celular são obrigatórios" }, 400);
}
```

#### 2. Validar **nome real** (mínimo 2 palavras OU 3+ chars sem ser igual ao email)

- Rejeita se `nome === email`
- Rejeita se < 3 caracteres
- Rejeita se for só números/símbolos

#### 3. Validar **email** com regex + heurística anti-bot

- Regex padrão (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Parte local (antes do `@`) com **mínimo 4 chars**
- Bloquear padrões de teclado batido:
  - 3+ consoantes seguidas sem vogal (`jkhjk`, `gdfh`, `kjaslkdj`)
  - Sequências de teclado (`asdf`, `qwer`, `zxcv`, `hjkl`)
  - Repetição da mesma letra 3+ vezes (`aaa`, `bbb`)
- Bloquear domínios descartáveis comuns (`mailinator.com`, `tempmail`, `10minutemail`, `guerrillamail`, `yopmail`, `throwaway`)

#### 4. Validar **celular brasileiro** (10 ou 11 dígitos, DDD válido)

- Limpa não-dígitos, remove `55` se presente
- Exige 10 ou 11 dígitos
- DDD entre 11–99 (rejeita `00`, `01`...)
- Se 11 dígitos, o terceiro tem que ser `9` (celular)
- Rejeita sequências óbvias: `11111111111`, `12345678901`

#### 5. Logar **IP + payload mascarado** quando bloqueia

Hoje o IP só serve pra rate limit. Vou inserir em `system_events` cada bloqueio com:
- `event_type: "lead_bloqueado_validacao"`
- `metadata: { ip, motivo, email_mascarado, webhook_name }`

Você consegue ver em `/admin/eventos` de onde vêm as tentativas e o motivo de cada bloqueio. Email mascarado tipo `gd***@hotmail.com` (LGPD).

#### 6. Mensagens de erro claras (em PT, pra landing page mostrar)

| Status | Erro |
|---|---|
| 400 | "Nome, email e celular são obrigatórios" |
| 400 | "Email inválido. Informe um email real" |
| 400 | "Celular inválido. Use formato (DDD) 9XXXX-XXXX" |
| 400 | "Cadastro suspeito detectado" (genérico para anti-bot, não revela regra) |

### Limpar os 21 leads ruins?

**Não vou apagar agora** — só travar daqui pra frente. Os 12 com tag `expirado` já estão filtrados nas métricas. Se quiser, num passo seguinte você decide se purga os bots históricos por padrão (`celular IS NULL AND nome = email`).

### Arquivos editados

- `supabase/functions/receive-lead/index.ts` — adiciona validações + logging de bloqueio

### Fora de escopo

- Não mexo no `Integracoes.tsx` (UI admin já mostra exemplo com nome/email/celular)
- Não giro o token do webhook (avisa se quiser)
- Não apago os leads ruins existentes
- Não mexo em `RegisterWizard` (usuário web já valida tudo isso)
- Não adiciono CAPTCHA (pode ser passo 2 se o spam continuar)

### Resultado esperado

Próximo `gdfh@hotmail.com` que tentar entrar recebe **400 "Cadastro suspeito"**, fica registrado em `/admin/eventos` com IP, e nenhum perfil é criado.

