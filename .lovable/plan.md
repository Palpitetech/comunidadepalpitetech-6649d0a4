

## Por que tudo está como rascunho

### Causa raiz

O `precompute-daily-posts` **gerou todos os 19 rascunhos hoje às 16:01 BRT** (`created_at = 19:01 UTC`). Os horários de publicação dos schedules da Lotofácil são **08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00 BRT**.

Como os rascunhos só foram criados às 16:01:
- Slots de **08h a 15h** já tinham passado quando o rascunho nasceu → o cron `process-scheduled-posts` (que checa "hora atual ≈ horário do schedule ±1 min") **nunca mais vai bater nesses horários hoje**.
- Slot de **16:00** publicou (`analise_cenarios` às 18:36 UTC = 15:36 BRT, com tolerância) → virou `publicado`.
- Slot de **18:00** publicou (`analise_como_calculamos`)... espera, na verdade publicou foi `analise_cenarios` e `analise_movimentacao`. Os outros 9 ficaram "órfãos": rascunho existe, mas o gatilho de publicação (cron) só dispara quando a hora atual = horário do schedule.

**Em resumo:** o `process-scheduled-posts` não tem lógica de "pegar atrasados". Ele só publica se a hora atual coincidir com o horário do schedule. Rascunhos cujos horários já passaram ficam parados para sempre.

### O fix em 1 linha

Adicionar no `process-scheduled-posts`, antes do loop dos schedules, uma **passagem de catch-up** que publica todo rascunho do dia BRT cujo `publicar_em <= now()` e ainda está como `rascunho`. Independente de schedule.

### Plano

**Editar `supabase/functions/process-scheduled-posts/index.ts`:**

1. Logo no início do `try`, adicionar bloco de catch-up:
   ```ts
   // CATCH-UP: publica rascunhos atrasados (publicar_em <= now)
   const { data: atrasados } = await supabaseAdmin
     .from("postagens")
     .select("id, loteria_tag, tipo, publicar_em")
     .eq("status", "rascunho")
     .not("publicar_em", "is", null)
     .lte("publicar_em", new Date().toISOString())
     .order("publicar_em", { ascending: true })
     .limit(50);

   for (const p of atrasados || []) {
     await supabaseAdmin
       .from("postagens")
       .update({ status: "publicado", created_at: new Date().toISOString() })
       .eq("id", p.id);
     published.push(`catchup:${p.loteria_tag}/${p.tipo}: ${p.id}`);
   }
   ```
2. Manter o loop atual de schedules como está (publica os que casam com a hora exata + fallback síncrono).

**Resultado:** na próxima execução do cron (que roda a cada minuto), os 16 rascunhos atrasados de hoje viram `publicado` em <2s, sem chamar IA. Daqui pra frente, qualquer rascunho gerado depois do horário do slot é publicado no minuto seguinte.

### Por que isso não vai gerar duplicatas

- Catch-up só pega `status='rascunho'` — ignora publicados.
- Loop normal pega rascunho do tipo e publica. Se catch-up já publicou, não acha mais.
- A janela de dedup de 30min do fallback síncrono continua válida.

### Por que aconteceu hoje

O `precompute-daily-posts` deveria rodar **na noite anterior** (21:30/22:30/23:00 BRT, via os crons safety-net já criados). Mas hoje ele rodou só às 16:01 BRT — possivelmente porque foi disparado **manualmente** durante a verificação de idempotência da rodada anterior, e os crons da noite anterior (22/04 21:30→23:00) ou não rodaram, ou rodaram antes de você ter os schedules ativos.

A partir de hoje à noite (21:30 BRT), os crons safety-net vão gerar os rascunhos de amanhã com `publicar_em` para os 11 horários do dia 24/04. Aí o `process-scheduled-posts` publica certinho hora a hora.

### Arquivos tocados

- `supabase/functions/process-scheduled-posts/index.ts` (adicionar bloco catch-up no início)

### Riscos

| Risco | Mitigação |
|---|---|
| Catch-up publicar rascunho de dia anterior esquecido | Filtro `publicar_em <= now()` + limite 50/execução. Se houver lixo antigo, expurgo manual depois. |
| Rascunho com `publicar_em = NULL` | `not("publicar_em","is",null)` exclui — fica para o loop normal por schedule. |
| Race com cron simultâneo | Cron roda a cada 1 min e duração <2s. Improvável colidir. UPDATE é idempotente (`status='publicado'`). |

