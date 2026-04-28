## Objetivo

Dentro de cada card de configuração em **Disparo em Grupo**, adicionar um painel **"Administradores do Grupo"** que:

1. Lista todas as instâncias (chips) cadastradas em `whatsapp_instances`.
2. Para cada grupo da config, mostra quais instâncias **já são admin** no WhatsApp (consultado via Evolution API em tempo real).
3. Permite **promover** uma instância como admin do grupo com 1 clique.
4. Sugere automaticamente a **próxima instância da fila** (rotação Round Robin) para evitar bloqueio do WhatsApp ao promover sempre o mesmo número.

## Como funciona

### Detecção
Ao abrir o painel, fazemos `GET /group/participants/{instance}?groupJid=…` na Evolution API. Cada participante traz um campo `admin` (`"admin"` | `"superadmin"` | `null`). Cruzamos os números (`phone_number` da `whatsapp_instances`) com os participantes do grupo para identificar:

- ✅ **Já é admin** (badge verde, botão desabilitado)
- ⚪ **Membro do grupo** (botão "Promover" disponível)
- ⚠️ **Não está no grupo** (badge cinza, sem ação)

### Promoção
Botão "Promover" chama nova Edge Function `group-promote-admin` que executa:
```
POST /group/updateParticipant/{instance}
{ groupJid, action: "promote", participants: ["<numero>@s.whatsapp.net"] }
```

A instância usada para emitir o comando precisa **já ser admin** do grupo. A função escolhe automaticamente a primeira instância online que já é admin daquele grupo. Se nenhuma for admin ainda, retorna erro pedindo para promover o primeiro admin manualmente pelo WhatsApp.

### Rotação (Round Robin)
Para evitar bloqueio, mostramos uma **fila sugerida**: a próxima instância a ser promovida segue a ordem de cadastro (`created_at` em `whatsapp_instances`), pulando as que já são admin. O painel destaca em laranja "Próxima da fila →" para guiar o admin.

Não automatizamos a promoção em massa — cada clique é manual e auditado, como o usuário pediu ("Ao clicar vai selecionando para adicionar como Admin").

## Mudanças técnicas

### Backend
- **Nova Edge Function** `supabase/functions/group-promote-admin/index.ts`
  - Actions: `list` (lista admins+membros por grupo) e `promote` (promove uma instância)
  - Reusa padrão da `sync-group-members` para auth + Evolution API
  - Sem novas tabelas — estado vive no WhatsApp e é lido on-demand

### Frontend
- **Novo componente** `src/components/admin/whatsapp/GroupAdminsCard.tsx`
  - Recebe `config: BlastConfig` e `instances: WhatsAppInstance[]`
  - Para cada `group_jid`: collapsible com tabela (Instância | Telefone | Status | Ação)
  - Botão "Atualizar" para refazer o `list`
  - Indicador "🔄 Próxima da fila" na primeira instância elegível

- **`DisparoGrupoTab.tsx`**: 
  - Adicionar `fetchInstances()` no `useEffect` inicial
  - Renderizar `<GroupAdminsCard config={config} instances={instances} />` dentro de cada card de configuração, após os slots e antes dos botões de ação

### Sem mudanças
- Schema do banco (não criamos tabela nova)
- Lógica de envio/agendamento existente
- `group_blast_configs.group_jids` continua igual

## Estrutura visual no card

```text
┌─ Config: Grupo VIP Lotofácil ──────┐
│ ● Ativo                            │
│ 120363xxx@g.us (1 grupo)           │
│ [Slots existentes...]              │
│                                    │
│ ▼ Administradores do Grupo  [🔄]   │
│   Grupo: 120363xxx@g.us            │
│   ┌──────────────────────────────┐ │
│   │ Galaxy   ✅ Admin            │ │
│   │ Eros     ⚪ Membro [Promover]│ │
│   │ Iphone   🔄 Próxima [Promover]│ │
│   │ Tablet   ⚠️ Fora do grupo    │ │
│   └──────────────────────────────┘ │
│ [Editar] [Pausar] [Testar]         │
└────────────────────────────────────┘
```

## Arquivos afetados

- `supabase/functions/group-promote-admin/index.ts` (novo)
- `src/components/admin/whatsapp/GroupAdminsCard.tsx` (novo)
- `src/components/admin/whatsapp/DisparoGrupoTab.tsx` (montar o novo card e fetch de instances)
