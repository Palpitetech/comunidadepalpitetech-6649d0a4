## Plano revisado — sem UI de mapeamento, com triggers automáticas

Mantém os fixes dos arquivos `.ts` do plano anterior, mas substitui a UI manual por **triggers Postgres** que populam `whatsapp_instance_groups` sozinhas.

---

### BUG 1 — `send_now` retornando 500 (Edge Function)

**`supabase/functions/group-blast-send/index.ts`**
- Envolver `validateAdmin(req)` em try/catch próprio dentro do handler, retornando 401 explícito quando o JWT lançar exceção (em vez de cair no `catch` genérico que vira 500):

```ts
if (action !== "send") {
  try {
    const authErr = await validateAdmin(req);
    if (authErr) return authErr;
  } catch (e: any) {
    return jsonResponse({ error: "Falha na autenticação: " + e.message }, 401);
  }
}
```

**`supabase/functions/_shared/group-blast/send-now.ts`**
- Após o loop de inserts, se `insertedLogs.length === 0` e havia `group_jids` para inserir, retornar 500 explícito com mensagem clara em vez de 200 silencioso:

```ts
if (insertedLogs.length === 0 && groupJids.length > 0) {
  return jsonResponse({ 
    error: "Nenhum log inserido — verifique RLS ou conexão com Postgres" 
  }, 500);
}
```

---

### BUG 2a — `select_best_instances` não filtra por pertencimento ao grupo

**Migração SQL (uma migração só com tudo):**

1. **Criar tabela `whatsapp_instance_groups`** com FK para `whatsapp_instances` (ON DELETE CASCADE), constraint UNIQUE(instance_id, group_jid), RLS admin-only + service-role full access.

2. **Atualizar RPC `select_best_instances`** adicionando `p_group_jid text DEFAULT NULL`. Quando informado, filtra apenas instâncias que tenham linha em `whatsapp_instance_groups` para aquele JID:

```sql
CREATE OR REPLACE FUNCTION public.select_best_instances(
  p_limit integer DEFAULT 5,
  p_group_jid text DEFAULT NULL
)
RETURNS TABLE(instance_id uuid, evolution_instance_id text, phone_number text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT wi.id, wi.evolution_instance_id, wi.phone_number
  FROM public.whatsapp_instances wi
  WHERE wi.status = 'online'
    AND COALESCE(wi.messages_sent_today, 0) < COALESCE(wi.daily_limit, 100)
    AND (
      wi.last_message_at IS NULL
      OR wi.last_message_at <= now() - (
        COALESCE(
          (wi.cooldown_queue -> (COALESCE(wi.cooldown_queue_index, 0) % NULLIF(jsonb_array_length(wi.cooldown_queue), 0)))::int,
          1
        ) || ' minutes'
      )::interval
    )
    AND (
      p_group_jid IS NULL
      OR EXISTS (
        SELECT 1 FROM public.whatsapp_instance_groups wig
        WHERE wig.instance_id = wi.id AND wig.group_jid = p_group_jid
      )
    )
  ORDER BY wi.last_message_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$;
```

3. **Trigger 1 — auto-mapear nova instância para todos os grupos ativos:**

```sql
CREATE OR REPLACE FUNCTION public.auto_map_instance_to_all_groups()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  INSERT INTO public.whatsapp_instance_groups (instance_id, group_jid)
  SELECT NEW.id, g.group_jid
  FROM (
    SELECT DISTINCT unnest(group_jids) AS group_jid
    FROM public.group_blast_configs
    WHERE is_active = true
  ) g
  ON CONFLICT (instance_id, group_jid) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_map_instance_to_groups
AFTER INSERT ON public.whatsapp_instances
FOR EACH ROW EXECUTE FUNCTION public.auto_map_instance_to_all_groups();
```

> Nota: `group_jids` é `text[]` (não jsonb) — uso `unnest()` em vez de `jsonb_array_elements_text()`. Também uso `is_active` (nome real da coluna).

4. **Trigger 2 — auto-mapear todas instâncias para grupos novos da config:**

```sql
CREATE OR REPLACE FUNCTION public.auto_map_all_instances_to_new_group()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
  INSERT INTO public.whatsapp_instance_groups (instance_id, group_jid)
  SELECT wi.id, ng.group_jid
  FROM public.whatsapp_instances wi
  CROSS JOIN (SELECT DISTINCT unnest(NEW.group_jids) AS group_jid) ng
  ON CONFLICT (instance_id, group_jid) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_map_groups_to_instances
AFTER INSERT OR UPDATE OF group_jids ON public.group_blast_configs
FOR EACH ROW EXECUTE FUNCTION public.auto_map_all_instances_to_new_group();
```

5. **Backfill histórico (one-time, na mesma migração):**

```sql
INSERT INTO public.whatsapp_instance_groups (instance_id, group_jid)
SELECT wi.id, g.group_jid
FROM public.whatsapp_instances wi
CROSS JOIN (
  SELECT DISTINCT unnest(group_jids) AS group_jid
  FROM public.group_blast_configs
) g
ON CONFLICT (instance_id, group_jid) DO NOTHING;
```

**`supabase/functions/_shared/group-blast/send.ts`**
- Passar `log.group_jid` ao chamar `select_best_instances`:
  ```ts
  const { data: candidates, error: candErr } = await supabase.rpc(
    "select_best_instances",
    { p_limit: 5, p_group_jid: log.group_jid },
  );
  ```
- Quando `candidates` vier vazio, marcar log como `failed` com `error_message = "Nenhuma instância disponível para este grupo"` (em vez do `skippedCooldown++` silencioso).

---

### BUG 2b — Validação real do body da Evolution API

**`supabase/functions/_shared/group-blast/send.ts`** — `attemptSendThroughInstance`:

Substituir o `await res.text()` descartado por validação do JSON real da Evolution. A Evolution API retorna `{ key: { id, remoteJid, fromMe }, status, message: {...} }` em sucesso. Se faltar `key.id`, é falha lógica mesmo com HTTP 200:

```ts
const body = await res.json().catch(() => null);

if (!res.ok || !body?.key?.id) {
  const reason = body?.message ?? body?.error ?? `HTTP ${res.status}`;
  await supabase
    .from("whatsapp_instances")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", instance.instance_id);
  return { ok: false, status: res.status, error: reason };
}

return { ok: true };
```

---

### O que NÃO será feito (vs plano anterior rejeitado)

- ❌ Não criar `InstanceGroupMappingCard.tsx`
- ❌ Não modificar `DisparoGrupoTab.tsx` para adicionar UI de mapeamento manual
- ✅ Triggers automáticas cobrem 100% dos casos: nova instância → mapeada em todos os grupos; novo grupo na config → mapeado em todas instâncias

---

### Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/group-blast-send/index.ts` | try/catch no validateAdmin |
| `supabase/functions/_shared/group-blast/send-now.ts` | 500 explícito quando 0 inserts |
| `supabase/functions/_shared/group-blast/send.ts` | passar `p_group_jid`; tratar candidates vazio como `failed`; validar body Evolution |
| Nova migração SQL | tabela `whatsapp_instance_groups` + RLS + RPC atualizada + 2 triggers + backfill |

### Premissas confirmadas no schema atual

- `group_blast_configs.group_jids` é `text[]` (não jsonb) → uso `unnest()`
- Coluna de ativação é `is_active` (não `active`)
- `whatsapp_instances.id` é UUID PK existente