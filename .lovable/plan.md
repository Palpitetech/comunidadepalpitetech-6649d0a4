
## Plano: Remover Campos Visuais (Cargo, Especialidade, Estilo de Escrita)

### Análise Atual

Os campos **Cargo**, **Especialidade** e **Estilo de Escrita** aparecem em 4 locais da UI:

1. **BotForm.tsx** - Formulário de criação de bot
   - Campo "Cargo" é obrigatório (linha 58, 181-188)
   - Campo "Especialidade" é obrigatório (linha 58, 191-200)
   - Campo "Estilo de Escrita" é um select com opções pré-definidas (217-232)
   - Todos são herdados dos templates (linhas 37-39)

2. **BotProfileTab.tsx** - Edição de perfil do bot
   - Campo "Cargo" em grid 2-colunas (99-108)
   - Campo "Especialidade" em grid 2-colunas (110-119)
   - Campo "Estilo de Escrita" em grid 2-colunas (133-142)
   - Todos são salvos na tabela `guide_personas`

3. **BotDetailSheet.tsx** - Visualização do bot
   - Mostra `bot.cargo` no header (linha 51)

4. **AdminBots.tsx** - Listagem de bots
   - Mostra `{bot.cargo} · {bot.especialidade}` (linha 170)

### Dados Armazenados vs Usados

- **Especialidade** é *levemente* funcional: usada em `bot-reply-user` para weighted selection baseado em keywords (mas removida seria simples)
- **Cargo** e **Estilo de Escrita** são 100% visuais
- Nenhum desses é usado em nenhuma edge function ativa (verified em supabase/functions)
- Todos os três são salvos na tabela `guide_personas` do banco de dados

### Opções de Implementação

**Opção A - Remover completamente (RECOMENDADO)**
- Remove campos da UI (BotForm, BotProfileTab)
- Remove da visualização (BotDetailSheet, AdminBots)
- Mantém os dados no banco para compatibilidade com histórico
- Marca os campos como "deprecated" no banco (opcional - comentário SQL)
- **Pro**: Mais limpo, reduz confusão
- **Con**: Dados legados ficarão no banco indefinidamente

**Opção B - Remover apenas da UI, manter defaults**
- Remove campos de edição
- Manter visualizações minimalistas (ex: só nome + badges)
- Campos no banco recebem defaults fixos na criação
- **Pro**: Menos mudanças, dados legados compatíveis
- **Con**: Ainda há dados no banco que ninguém usa

### Proposta Final (Opção A)

Remover completamente dos formulários e visualizações:

**Arquivos a modificar:**

| Arquivo | Ação |
|---------|------|
| `src/components/admin/BotForm.tsx` | Remove campos Cargo, Especialidade, Estilo de Escrita da criação |
| `src/components/admin/BotProfileTab.tsx` | Remove campos Cargo, Especialidade, Estilo de Escrita da edição |
| `src/components/admin/BotDetailSheet.tsx` | Remove exibição de `bot.cargo` no header |
| `src/pages/admin/AdminBots.tsx` | Remove exibição de `{bot.cargo} · {bot.especialidade}` na listagem |
| `src/types/bots.ts` | Adiciona comentários indicando que os campos são deprecated |

**O que NÃO muda:**

- Banco de dados mantém os campos intactos (compatibilidade)
- Sistema de prompts continua funcionando 100% (baseado em `system_prompt`)
- Edge functions não são afetadas
- Bots existentes continuam funcionando

**Impacto:**

- ✅ Interface muito mais limpa e focada
- ✅ Menos confusão para admins sobre o que afeta o bot
- ✅ Validação simplificada (remove `cargo` obrigatório em BotForm)
- ✅ Criação de bots mais rápida
- ⚠️ Dados legados persistem no banco (sem impacto funcional)

**Fluxo após mudança:**

```text
BotForm (Criar Bot)
├─ Nome ✓
├─ Avatar ✓
├─ Badge Emoji ✓
├─ Modelo IA ✓
├─ System Prompt ✓
└─ [Cargo, Especialidade, Estilo] ✗ REMOVIDOS

BotProfileTab (Editar Bot)
├─ Nome ✓
├─ Avatar ✓
├─ Badge Emoji ✓
├─ Author Roles (Result, Strategy, Tips) ✓
├─ Automação (can_create_posts, etc) ✓
└─ [Cargo, Especialidade, Estilo] ✗ REMOVIDOS

AdminBots (Lista)
├─ Badge Emoji + Nome ✓
├─ Author badges (🎯📚🎁) ✓
├─ Status (Ativo/Inativo) ✓
└─ [Cargo · Especialidade] ✗ REMOVIDOS
```

