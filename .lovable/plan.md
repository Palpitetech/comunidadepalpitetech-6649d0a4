

# Finalizar aba "Leads" em /admin/usuarios

Concluir os 3 itens pendentes da implementação anterior, sem alterar nada do que já funciona.

## Mudanças

### 1. Renderizar tabela de leads no desktop
**Arquivo:** `src/pages/admin/AdminUsuarios.tsx`

No bloco desktop (que hoje renderiza a tabela de usuários), adicionar branch condicional: quando `activeFilter === "leads"`, renderizar uma `<Table>` específica com colunas:

| Nome | Email | Celular | Origem | Página | Tags | Data |

- Linha clicável → `handleLeadClick(lead)` (já existe, abre o sheet)
- Origem = `webhook_name` ou `source` ou `utm_source` (fallback em cascata)
- Página = `pagina_origem` truncado com tooltip
- Tags = primeiras 2 + "+N" se houver mais
- Data = `format(created_at, "dd/MM HH:mm", { locale: ptBR })`
- Badge de status no início (novo/contatado/convertido/descartado) com cores já definidas no `LeadDetailSheet`
- Estado vazio: "Nenhum lead capturado ainda" com ícone

### 2. Montar `<LeadDetailSheet />` no fim do JSX
**Arquivo:** `src/pages/admin/AdminUsuarios.tsx`

Adicionar antes do fechamento do componente:
```tsx
<LeadDetailSheet
  lead={selectedLead}
  open={leadSheetOpen}
  onOpenChange={setLeadSheetOpen}
  onChanged={() => { fetchData(); }}
/>
```

Garantir que os states `selectedLead`, `leadSheetOpen` e `handleLeadClick` existam (criados na iteração anterior — confirmar/criar se faltar).

### 3. Esconder subfiltros quando na aba Leads
**Arquivo:** `src/pages/admin/AdminUsuarios.tsx`

Os subfiltros de **plano** (Free/Premium/etc) e **verificação de email** não fazem sentido para leads (não têm conta).

- Envolver o bloco de subfiltros com: `{activeFilter !== "leads" && (...)}` 
- Mesmo tratamento para o campo de busca avançada se ele filtrar por critérios de usuário (manter busca por nome/email/celular que funciona em ambos)
- Manter o input de busca textual ativo (já que busca por nome/email/celular serve para leads também) — só ajustar o `placeholder` quando for leads: "Buscar lead por nome, email ou celular..."

## Detalhes técnicos
- Reaproveitar componentes shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` (já em uso na página)
- `filteredLeads` já existe da iteração anterior — usar como fonte
- Sem mudanças em hooks, edge functions, banco ou outros componentes

## Arquivos
| Arquivo | Ação |
|---|---|
| `src/pages/admin/AdminUsuarios.tsx` | **Editar** — adicionar tabela desktop de leads, montar sheet, condicionar subfiltros |

## Fora de escopo
- Mexer no `LeadDetailSheet` (já está pronto)
- Mudar edge functions, schema ou outros arquivos
- Adicionar paginação ou exportação CSV de leads (próxima iteração)

## Resultado esperado
- Aba **Leads** exibe tabela completa no desktop com origem/página/tags/data
- Clique em qualquer linha abre o `LeadDetailSheet` para gerenciar
- Subfiltros irrelevantes (plano, verificação) somem quando estiver em Leads
- Tabela de usuários e demais abas continuam **idênticas**

