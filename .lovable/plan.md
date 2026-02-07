

## Plano para Unificar Verificações de `can_create_posts` nas Edge Functions

### Problema Identificado
As três principais edge functions que geram posts têm **inconsistências nas verificações de permissão**:

| Função | Verifica `ativo` | Verifica `can_create_posts` | Status |
|--------|------------------|------------------------------|--------|
| `generate-bot-post` | ✅ Sim (linha 37) | ✅ Sim (linha 37) | ✅ Correto |
| `process-scheduled-posts` | ✅ Sim (linha 42) | ✅ Sim (linha 43) | ✅ Correto |
| `generate-guide-post` | ✅ Sim (linha 289) | ❌ **NÃO** | ⚠️ **BUG** |

**Resultado**: Sr. Zé (e outros bots) conseguem criar posts via `generate-guide-post` mesmo com `can_create_posts = false`.

### Solução Proposta

#### 1. **Criar Utilitário Compartilhado** (Nova Função)
   - Criar arquivo: `supabase/functions/_shared/bot-permissions.ts`
   - Função reutilizável: `validateBotPermissions(guide, options)`
   - **Benefícios**: 
     - DRY (Don't Repeat Yourself)
     - Lógica centralizada
     - Fácil manutenção futura
   
   ```typescript
   interface BotPermissionCheck {
     requireActive?: boolean;  // default: true
     requireCanCreatePosts?: boolean;  // default: true
   }
   
   export async function validateBotPermissions(
     guide: any,
     options: BotPermissionCheck = {}
   ): Promise<void> {
     const { requireActive = true, requireCanCreatePosts = true } = options;
     
     if (requireActive && !guide.ativo) {
       throw new Error("Bot não está ativo");
     }
     
     if (requireCanCreatePosts && !guide.can_create_posts) {
       throw new Error("Bot não pode criar posts");
     }
   }
   ```

#### 2. **Corrigir `generate-guide-post/index.ts`**
   - Adicionar verificação: `.eq("can_create_posts", true)` na query (linha 288-289)
   - Alternativa: Importar validador compartilhado após buscar o guide
   
   **Opção A (Simples)**: Adicionar `.eq("can_create_posts", true)` à query
   ```typescript
   .eq("ativo", true)
   .eq("can_create_posts", true)  // ← Adicionar
   ```

   **Opção B (Robusta)**: Usar validador reutilizável
   ```typescript
   await validateBotPermissions(guide, {
     requireActive: true,
     requireCanCreatePosts: true
   });
   ```

#### 3. **Refatorar as 3 Edge Functions**
   - **Arquivos a modificar**:
     - `supabase/functions/generate-bot-post/index.ts` (linha 37)
     - `supabase/functions/process-scheduled-posts/index.ts` (linhas 42-43)
     - `supabase/functions/generate-guide-post/index.ts` (linha 289)
   
   - Substituir verificações manuais pelo validador compartilhado

#### 4. **Adicionar Logging Detalhado**
   - Log quando um bot é **rejeitado** por falta de permissão
   - Log quando um bot é **aceito** (com nome e tipo de post)
   - Facilita debugging de problemas futuros

#### 5. **Testar Cenários**
   - ✅ Bot ativo + `can_create_posts = true` → Criar post
   - ❌ Bot inativo → Rejeitar com erro
   - ❌ Bot ativo + `can_create_posts = false` → Rejeitar com erro
   - ⚠️ Edge case: Bot deletado → Verificar comportamento

### Sequência de Implementação

```text
1. Criar arquivo utilitário (_shared/bot-permissions.ts)
   ↓
2. Corrigir generate-guide-post/index.ts
   ↓
3. Refatorar generate-bot-post/index.ts (usar validador)
   ↓
4. Refatorar process-scheduled-posts/index.ts (usar validador)
   ↓
5. Adicionar logs consolidados em todas as funções
   ↓
6. Deploy e testes manuais
```

### Impacto

- **Zero breaking changes**: A correção apenas torna mais restritivo (reject mais bots)
- **Comportamento esperado**: Respeitar a configuração `can_create_posts`
- **Segurança**: Impede criação de posts por bots desativados
- **Manutenibilidade**: Código mais limpo e centralizado

### Notas Técnicas

- ⚠️ Não é possível criar subpastas em edge functions; o arquivo compartilhado será inline ou duplicado
- 📝 Supabase não suporta importação entre funções; melhor duplicar a lógica ou inline

