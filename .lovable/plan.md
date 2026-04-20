

## Diagnóstico: por que "Por Bot" está vazia

**Sim, é normal — mas não é bom sinal.** Os dados existem no banco (39 logs de bot, 10 bots diferentes, último em 19/abr), mas o filtro padrão da página é **últimos 7 dias** (`weekAgo` → `today` = 13/abr a 20/abr).

Olhando os últimos 14 dias:

| Dia | Logs com bot | Total |
|---|---|---|
| 19/abr → 09/abr | **0** | 26 |
| **08/abr** | **12** | 25 |
| 07/abr | 0 | 1 |

**Tudo que é "Por Bot" parou em 08/abr.** Os 187 logs sem bot da última semana são 100% ações de usuário (Gerador, Chat, Auto-Fill).

### Por que os bots pararam de logar?

Três causas possíveis (preciso investigar para confirmar):

1. **Bots automáticos pararam de rodar** — `process-scheduled-posts` está rodando (vi nos logs: "✅ 4 bots encontrados"), mas todos retornam "Horário não bate com agenda" → nenhum post novo está sendo gerado, então nenhum log de IA novo aparece.
2. **Chat com bots especialistas caiu** — `chat-assistant` não foi chamado nos últimos 11 dias por nenhum usuário em conversa com bot.
3. **As edge functions que acabamos de instrumentar** (`generate-guide-post`, `group-blast-send`, `warming-run`, etc.) **ainda não dispararam nenhuma vez** desde o deploy — então também não geraram log.

### O que vou propor (após sua aprovação)

#### 1. Mostrar mensagem clara quando vazio

Em vez de tabela vazia silenciosa, mostrar:
> "Nenhum bot consumiu tokens entre 13/abr e 20/abr. Último uso de bot: 08/abr (12 chamadas). Amplie o intervalo para ver dados anteriores."

Com botão **"Ver últimos 30 dias"** que ajusta o filtro automaticamente.

#### 2. Aplicar a mesma lógica nas outras abas (Por Usuário, Por Ferramenta)

Quando uma aba estiver vazia mas houver dados em outro período, mostrar a data do último registro + atalho para expandir.

#### 3. Investigar por que os bots não estão postando/conversando

Causas reais a confirmar olhando o agendamento dos 4 bots e o cron:
- **Ana** (Mesa Redonda) — última atividade 08/abr → agenda quebrada?
- **Especialista Mega-Sena, Estrategista Lucas** (Chat) — sem conversas há 11 dias → ninguém está usando o /chat com bot?
- **Vendedor Matheus, Carlos, Fernanda, Sistema Tech** (comentários automáticos) → `bot-interact-with-post` não roda há 11 dias

→ Vou ler `process-scheduled-posts` + `bot-interact-with-post` + agenda dos bots e dizer **exatamente** o que está bloqueando cada um, com plano de correção (sem código ainda — só diagnóstico para você decidir).

### Arquivos que serão editados (na implementação)

- `src/pages/admin/AdminCustos.tsx` — empty state inteligente nas 3 abas + botão "ampliar para 30 dias"
- Possíveis correções de agenda nos bots (após o diagnóstico)

### Fora de escopo

- Não muda lógica de cálculo
- Não cria gráfico de evolução temporal (pode virar passo seguinte)

