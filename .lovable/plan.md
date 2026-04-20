

## Ativar plano "Grupo VIP Lotofácil" e exibir em /planos

### Diagnóstico — por que está inativo e oculto

| Item | Estado atual |
|---|---|
| Nome no banco | "Grupo-vip-lotofacil" (capitalização ruim) |
| Slug | `grupo-vip-lotofacil` ✅ (já está como pediu) |
| Preço | R$ 19,00 ✅ |
| Checkout link Kirvano | ✅ configurado |
| `is_active` | **false** — provavelmente desativado quando foi criado como rascunho |
| `display_order` | **0** — empatado com Grátis e Trial |
| Aparece em `/planos`? | **Não.** A página filtra `price > 0` (passaria) MAS o grid é fixo em **3 colunas** (Mensal/Anual/AnualVIP) e usa configs hardcoded (`PLAN_HIGHLIGHTS`, `INSTALLMENTS`) que não incluem este slug |

**Por que estava inativo:** plano foi criado em uma migração antiga como produto WhatsApp-only (palpites enviados pelo grupo, sem acesso premium ao app), provavelmente desativado por não ter UI pronta para exibir.

---

### Mudanças propostas

#### 1. Atualizar registro no banco (via insert tool — UPDATE)

```sql
UPDATE plans SET
  name = 'Grupo VIP Lotofácil',
  is_active = true,
  display_order = 1,        -- aparece antes do Mensal (que é 1) → ajustar Mensal pra 2, Anual 3, VIP 4
  description = 'Receba palpites prontos da Lotofácil direto no seu WhatsApp em grupo exclusivo.'
WHERE slug = 'grupo-vip-lotofacil';

-- Reordenar os outros para abrir espaço
UPDATE plans SET display_order = 2 WHERE slug = 'mensal';
UPDATE plans SET display_order = 3 WHERE slug = 'anual';
UPDATE plans SET display_order = 4 WHERE slug = 'plano-anual-vip';
```

#### 2. `src/pages/Planos.tsx` — exibir o 4º card

- Trocar grid `md:grid-cols-3` → **`md:grid-cols-2 lg:grid-cols-4`** (2 cols no tablet, 4 no desktop ≥1024px). No viewport atual (1147px) o usuário verá 4 colunas alinhadas.
- Adicionar entradas no `PLAN_HIGHLIGHTS`:
  ```ts
  "grupo-vip-lotofacil": [
    "Palpites prontos no WhatsApp",
    "Grupo exclusivo Lotofácil",
    "Análises diárias da equipe",
    "Sem precisar usar ferramentas",
  ],
  ```
- Sem entrada em `INSTALLMENTS` (R$ 19 à vista, sem parcelamento).
- Adicionar nova "categoria visual" no card — ribbon `Mensal · Grupo` (cor secundária neutra, distinta dos 3 atuais).
- Reduzir `min-h-[520px]` para `min-h-[480px]` (Grupo VIP tem menos features → não estica os outros).
- Ajustar `max-w-4xl` do container para **`max-w-6xl`** para acomodar 4 cards confortavelmente.

#### 3. `supabase/functions/_shared/sync_perfil_tags` (DB function) — adicionar tag

A função `sync_perfil_tags` mapeia slug → tag. Precisa incluir o novo slug para CRM/disparos:

```sql
-- Migração: atualizar função sync_perfil_tags
-- Adicionar caso: WHEN 'grupo-vip-lotofacil' THEN tag = 'pago_grupovip_lotofacil'
```

Com isso, novos compradores do Grupo VIP recebem automaticamente a tag `pago_grupovip_lotofacil`, ficando segmentáveis no Disparo Manual e Templates.

#### 4. Backfill de tags (se houver assinantes)

```sql
-- Reaplicar trigger em quem já tem esse plano
UPDATE perfis SET updated_at = now() WHERE plan_id = 'a23694fd-87f4-4edd-a6eb-8e51b3c90430';
```

---

### Visual esperado em /planos (desktop)

```text
┌──────────┬──────────┬──────────┬──────────┐
│ Grupo VIP│  Mensal  │   Anual  │  AnualVIP│
│  R$ 19   │  R$ 47   │  R$ 297  │  R$ 397  │
│ Mensal·  │ Flexível │ Melhor   │  Mais    │
│ Grupo    │          │ custo-   │ completo │
│          │          │ benef.   │          │
└──────────┴──────────┴──────────┴──────────┘
```

No mobile: 2 colunas (md), 1 coluna (sm).

---

### Fora de escopo

- Sem mudanças em `kirvano_offer_plan_map` (já está mapeado se houver oferta cadastrada — posso verificar se necessário num próximo loop)
- Sem mudanças no AdminPlanos (já lista corretamente, vai mostrar como ativo após o UPDATE)
- Sem novas features/permissões — Grupo VIP não dá acesso premium ao app, é produto WhatsApp puro

### Arquivos editados

| Arquivo | Mudança |
|---|---|
| Insert tool (UPDATE plans) | Ativa, renomeia, reordena display_order dos 4 planos pagos |
| `src/pages/Planos.tsx` | Grid 4 colunas, highlights + ribbon do novo plano, container largura maior |
| Migração SQL nova | Atualiza função `sync_perfil_tags` para mapear slug → tag `pago_grupovip_lotofacil` |

### Resultado esperado

- Plano aparece ativo no admin e visível em `/planos` para usuários
- Compradores via Kirvano recebem automaticamente tag de CRM correta
- Layout responsivo mantém 4 cards alinhados sem quebrar mobile

