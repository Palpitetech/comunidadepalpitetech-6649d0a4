

## Configurar Especialista Lotofácil como único bot postador

Vou consolidar **todas** as postagens automáticas no bot **"Especialista Lotofácil"** (`7625b931-48dc-4550-81f3-1f8bd8a0ce33`), incluindo o resultado oficial das 23h e os posts diários que já existiam.

## Verificação prévia (antes de aplicar)

Preciso confirmar 2 coisas no banco para montar o schedule correto:

1. **Quais tipos de post existiam antes** — buscar em `postagens` os `tipo` distintos publicados pelo bot até 20/04 e seus horários típicos
2. **Quem é o atual `is_result_author`** — só pode haver 1 autor de resultados ativo (a edge `sync-lotofacil` chama `criarPostResultadoOficial` apontando para o autor configurado)

Isso vira um SELECT rápido assim que o plano for aprovado.

## Mudanças (1 migration)

### Atualizar Especialista Lotofácil

```sql
UPDATE guide_personas
SET 
  ativo = true,
  can_create_posts = true,
  is_result_author = true,        -- recebe o post das 23h via sync-lotofacil
  is_strategy_author = true,       -- também publica análises
  post_schedule = '{
    "dias": [0, 1, 2, 3, 4, 5, 6],
    "horarios": ["09:00", "13:29", "23:00"],
    "tipo_por_horario": {
      "09:00": "estrategia",
      "13:29": "geral",
      "23:00": "resultado_oficial"
    }
  }'::jsonb
WHERE id = '7625b931-48dc-4550-81f3-1f8bd8a0ce33';
```

> Os horários e tipos finais serão **ajustados após o SELECT de verificação** — quero replicar exatamente o padrão histórico (não inventar horários novos).

### Desligar `is_result_author` de qualquer outro bot

```sql
UPDATE guide_personas
SET is_result_author = false
WHERE id != '7625b931-48dc-4550-81f3-1f8bd8a0ce33'
  AND is_result_author = true;
```

Garante que **só** o Especialista Lotofácil receba o gatilho do `sync-lotofacil` às 23h.

## Como o fluxo vai funcionar

```text
23h (após sorteio)  → sync-lotofacil detecta resultado novo
                    → chama criarPostResultadoOficial()
                    → posta no perfil do Especialista Lotofácil (is_result_author=true)

09h, 13:29 (cron)   → process-scheduled-posts roda a cada minuto
                    → encontra Especialista Lotofácil no schedule
                    → chama generate-guide-post com tipo do tipo_por_horario
                    → publica análise/estratégia
```

## O que NÃO faço

- Não mexo em código de edge functions (`process-scheduled-posts`, `generate-guide-post`, `sync-lotofacil` já suportam tudo isso)
- Não toco nos bots Mega-Sena e Dupla Sena (continuam pausados, fora de escopo)
- Não altero schema, RLS ou crons existentes

## Verificação após aplicar

1. SQL confirmando `can_create_posts=true`, `is_result_author=true`, `post_schedule` populado
2. Aguardar próximo horário cruzar para ver post aparecer em `postagens`
3. Logs de `process-scheduled-posts` e `bot_publishing_logs` para confirmar execução

