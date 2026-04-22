

# Fluxo simplificado: Nova Instância → QR → Conectado (auto)

## Problema

Hoje, criar uma instância exige preencher 4 campos (Apelido, Nome de amigo, Telefone, ID Evolution) **antes** do QR. O ID da Evolution é digitado manualmente, e o telefone também — o que é frágil e desalinha com o que existe na Evolution v2.

## Novo fluxo desejado

```text
[Botão "Nova Instância"]
        ↓
[Dialog: 1 campo "Apelido"]    ← só nome
        ↓ Criar
[Backend: cria instância na Evolution v2 + reserva proxy + aplica proxy]
        ↓
[Dialog: QR Code aparece automaticamente]
        ↓ usuário escaneia
[Polling de status a cada 2s — visual: "Aguardando leitura..." → "Conectado!"]
        ↓ status = "open" detectado
[Backend: pega owner/phone da Evolution e salva no banco]
        ↓
[Card aparece online no grid, com telefone preenchido]

→ Limite diário, fila de descanso, nome de amigo: editáveis pelo botão "Editar" depois.
```

## Mudanças

### 1. Edge Function `evolution-proxy` — nova action `createAndConnect`

Recebe `{ apelido }` e executa atomicamente:

1. **Slugifica** o apelido para gerar `evolution_instance_id` único (ex.: `"Tablet Final"` → `tablet-final-7k2p`, com sufixo aleatório de 4 chars para evitar colisão).
2. **Insere** no banco `whatsapp_instances` com `name = friendly_name = apelido`, `evolution_instance_id = slug`, `phone_number = ""`, `status = "offline"`, `daily_limit = 100`, `cooldown_queue = [3]`.
3. **Cria na Evolution**: `POST /instance/create` com `{ instanceName: slug, integration: "WHATSAPP-BAILEYS", qrcode: true }`. Captura `qrcode.base64` da resposta.
4. **Reserva proxy** via `claim_proxy_for_instance` + **aplica proxy** + **restart** (mesma lógica do `connect`).
5. Rollback completo se qualquer passo falhar (deleta da Evolution, deleta do banco, libera proxy).
6. Retorna `{ success, instanceId, qrCode (base64), evolutionInstanceId }`.

### 2. Edge Function `evolution-proxy` — nova action `syncInstancePhone`

Recebe `{ instanceId }`. Chama `connectionState` na Evolution; se `state === "open"`, busca via `fetchInstances` o `ownerJid` da instância e atualiza no banco:
- `phone_number = ownerJid.replace("@s.whatsapp.net", "")`
- `status = "online"`

Retorna `{ status, phone }` para o front saber se já conectou.

### 3. `InstanciasTab.tsx` — refatorar criação

**Dialog "Nova Instância"** (modo create) reduz a 1 campo:

```text
┌─────────────────────────────────┐
│  Nova Instância                 │
│                                 │
│  Apelido *                      │
│  [ex: Tablet Sala            ]  │
│  Este será o nome interno e o   │
│  identificador na Evolution.    │
│                                 │
│  [ Criar e gerar QR Code     ]  │
└─────────────────────────────────┘
```

Ao clicar "Criar e gerar QR Code":
1. `invoke("evolution-proxy", { action: "createAndConnect", apelido })`
2. Fecha dialog de criação, abre **dialog de QR** com o `qrCode` retornado.
3. Inicia **polling** a cada 2s chamando `syncInstancePhone`:
   - Se `status !== "online"` → continua polling, mostra "Aguardando leitura do QR Code..."
   - Se `status === "online"` → para polling, mostra checkmark verde "Conectado! Telefone: +55 11 9...", aguarda 1.5s, fecha dialog, refetch da lista.
   - Timeout de 90s → mostra "QR Code expirou. Tente novamente." com botão "Gerar novo QR".
4. Tratamento de `code: "no_proxy_available"` / `proxy_invalid` igual hoje (toast com link para Proxies).

**Dialog "Editar Instância"** (modo edit) mantém os 4 campos atuais (apelido, friendly_name, phone, daily_limit, cooldown_queue) para ajustes posteriores. Apenas remove o campo `evolution_instance_id` (passa a ser readonly informativo, gerado pelo backend).

### 4. Fallbacks visuais no dialog de QR

- **Estado loading inicial** (criando na Evolution): spinner + texto "Criando instância e reservando proxy..."
- **Estado QR disponível**: imagem + texto "Escaneie com o WhatsApp" + indicador animado "Aguardando leitura..." (dot pulsando).
- **Estado conectado**: checkmark verde grande + "Conectado! Telefone +55 XX XXXXX-XXXX" → fecha automático em 1.5s.
- **Estado erro/timeout**: ícone de alerta + mensagem clara + botão "Tentar novamente" (re-chama createAndConnect com o mesmo apelido) ou "Cancelar" (deleta a instância criada).
- **Estado sem proxy**: ícone de alerta amarelo + "Sem proxy disponível. Adicione proxies em WhatsApp → Proxies." + botão para a aba Proxies.

### 5. Limpeza

Remover do form de criação os campos `friendly_name`, `phone_number`, `evolution_instance_id`, `daily_limit`, `cooldown_queue` — eles continuam existindo no Editar.

## Resultado esperado

- Admin clica em "Nova Instância" → digita só "Tablet Sala" → vê QR em ~3s → escaneia → vê "Conectado!" automaticamente → card aparece online com telefone preenchido.
- Sincronização total entre nome local e ID Evolution (são o mesmo slug derivado do apelido).
- Telefone vem direto da Evolution após conexão, sem digitação.
- Configurações avançadas (limite, cooldown, friendly_name) ficam para o "Editar" — não atrapalham o onboarding.

## Detalhes técnicos

- Slug: `apelido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + 4charsRandom`.
- Polling no front via `setInterval(2000)`, limpo em `useEffect` cleanup e em todos os branches de saída.
- `POST /instance/create` da Evolution v2 retorna `{ instance, hash, qrcode: { base64, code, count } }`. Usar `qrcode.base64`.
- Webhook `GROUP_PARTICIPANTS_UPDATE` continua sendo configurado em `ensureWebhookConfigured` quando o status vira `open` (já existente).
- Sem mudanças em RLS, schema ou RPC.
- Arquivos tocados: `supabase/functions/evolution-proxy/index.ts` (+ ~120 linhas), `src/components/admin/whatsapp/InstanciasTab.tsx` (refatorar dialog de criação + lógica de polling).

