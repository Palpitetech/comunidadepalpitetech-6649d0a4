

## Gerar 9 variantes por IA com base no slot #1

### Objetivo
Adicionar um botão **"Gerar variações com IA"** dentro do dialog de Novo/Editar Template. O botão fica âmbar/desabilitado enquanto o slot #1 estiver vazio, vira verde quando há mensagem principal escrita. Ao clicar, gera de uma vez as variantes #2-#10 mantendo as variáveis (`{{nome}}`, `{{produto}}`, etc.), no tom: amigável, direto, claro, sem acentos, com pontuação ocasional e leves erros de digitação humanos.

---

### Como o usuário vai ver

```
┌─ Conteúdo da mensagem (até 10 variações) ──┐
│ [1][2][3][+][+][+][+][+][+][+]              │
│                                              │
│ [textarea da variação atual…]                │
│ {{nome}} {{telefone}} {{email}} {{produto}}  │
│                                              │
│ [⚡ Gerar variações com IA]  ← âmbar/verde   │
│ [Pausar variação] [Excluir variação]         │
└──────────────────────────────────────────────┘
```

**Estados do botão:**
- **Cinza/desabilitado**: slot #1 vazio (`mensagem principal vazia`)
- **Âmbar pulsante**: slot #1 com texto, ainda não gerou — sinaliza "ação recomendada"
- **Verde**: variantes já geradas no menos uma vez (pode regenerar)
- **Loading**: spinner + texto "Gerando 9 variações..."

**Confirmação se sobrescrever:** se já houver variantes preenchidas em #2-#10, abre confirm: "Substituir as 9 variações existentes? (slot #1 não muda)"

---

### Mudanças por arquivo

#### 1. Nova edge function `supabase/functions/generate-message-variants/index.ts`

**Input:** `{ main_content: string, count?: number }` (default count=9)

**Lógica:**
- Auth via `getClaims()` + checagem `has_role(user, 'admin')` (apenas admin gera via IA, segue regra do projeto)
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) via tool calling estruturado
- Prompt sistema fixo no backend (não exposto):
  ```
  Você é um especialista em copywriting para WhatsApp transacional.
  Gere {N} variações da mensagem original.
  
  REGRAS OBRIGATÓRIAS:
  - Tom amigável, direto ao ponto, claro
  - SEM acentos (use "voce" ao invés de "você", "nao" ao invés de "não")
  - Pontuação final ocasional (nem sempre)
  - Inserir 1-2 leves erros de digitação humanos (ex: "voce", "tbm", "agr", "obg")
  - PRESERVAR EXATAMENTE todas as variáveis {{nome}} {{produto}} {{telefone}} {{email}} {{link_grupo_vip}} {{plano_nome}}
  - Manter o mesmo significado e CTA da original
  - Variar abertura, ordem das frases e fechamento
  - NUNCA mudar links, números ou dados técnicos
  - Tamanho similar à original (±20%)
  ```
- Tool schema força retorno de array: `{ variants: string[] }` com exatamente N itens
- Log em `ai_usage_logs` com `edge_function='generate-message-variants'`, `action_type='generate_variants'`
- Tratamento 429/402 com mensagem amigável
- Retorna `{ variants: string[] }`

**Validações de output:**
- Valida que cada variante mantém TODAS as variáveis presentes na original (regex `{{[^}]+}}`)
- Se uma variante perdeu variável, descarta e pede reposição (1 retry no máximo)
- Trim e limita 2000 chars

#### 2. `src/components/admin/whatsapp/TemplatesTab.tsx`

**Adicionar:**
- Estado: `const [generatingVariants, setGeneratingVariants] = useState(false)` e `const [hasGenerated, setHasGenerated] = useState(false)`
- Função `handleGenerateVariants()`:
  1. Verifica `slots[0].content.trim()` — se vazio, abort
  2. Se algum slot 2-10 já preenchido → `confirm()` antes
  3. `supabase.functions.invoke('generate-message-variants', { body: { main_content, count: 9 } })`
  4. Atualiza slots[1..9] com as variantes retornadas, todas `exists: true, isActive: true`
  5. `setHasGenerated(true)`, toast sucesso
  6. Catch: toast com mensagem específica (rate limit, créditos, erro)
- Botão posicionado **logo abaixo do textarea**, antes dos botões "Pausar/Excluir":
  ```tsx
  <Button
    type="button"
    variant="outline"
    onClick={handleGenerateVariants}
    disabled={!mainHasContent || generatingVariants}
    className={cn(
      "gap-1.5 transition-colors",
      !mainHasContent && "opacity-50",
      mainHasContent && !hasGenerated && "border-amber-500/60 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 animate-pulse",
      hasGenerated && "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
    )}
  >
    {generatingVariants ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
    {generatingVariants ? "Gerando 9 variações..." : hasGenerated ? "Regenerar variações" : "Gerar variações com IA"}
  </Button>
  ```
- Reset `setHasGenerated(false)` em `openCreate()` e `openEdit()` (cada template começa neutro)

#### 3. Sem mudanças em
- `VariantSlotSelector.tsx` — slots populados pela IA reagem normalmente
- Tabelas / migrações SQL — variantes geradas usam o mesmo schema
- `process-queue/index.ts` — round robin já funciona com qualquer slot preenchido
- `pick_template_variant` — sem mudança

---

### Etapa por etapa (com revisão e refatoração)

**Etapa 1 — Edge function `generate-message-variants`**
- Cria função, prompt, tool schema, validação de variáveis preservadas
- Verifica: deploy automático, log no `ai_usage_logs`
- Refator: extrair `extractVariables(text)` e `hasAllVariables(variant, required)` como helpers internos legíveis

**Etapa 2 — UI no TemplatesTab**
- Adiciona botão, estados, função `handleGenerateVariants`
- Verifica: gerar com slot 1 vazio (deve estar disabled), gerar com slot 1 preenchido (âmbar), regenerar (verde + confirm)
- Refator: extrair `mainHasContent` como `useMemo` para clareza, remover imports não usados

**Etapa 3 — Validação end-to-end**
- Cenário 1: novo template, escrever slot 1 com `{{nome}}` e `{{produto}}`, gerar 9, verificar todas mantêm as variáveis
- Cenário 2: editar template existente sem variantes, gerar, salvar, verificar `message_template_variants` recebeu 9 rows
- Cenário 3: editar template com variantes, regenerar, confirmar substituição
- Cenário 4: testar envio (botão "Testar") após gerar — round robin alterna entre as 10

**Etapa 4 — Refatoração final / cleanup**
- Remover qualquer import não usado em `TemplatesTab.tsx`
- Garantir `Sparkles` importado de `lucide-react`
- Confirmar que erros 429/402 da edge function aparecem como toast amigável no front
- Sem código morto: `hasGenerated` é resetado nos 2 abridores do dialog

---

### Tom e regras de geração (garantidas no prompt do backend)
- ✅ Amigável, direto, claro
- ✅ Sem acentos (preferencial)
- ✅ Pontuação final ocasional
- ✅ Erros de digitação leves e naturais (não exagerados)
- ✅ Variáveis 100% preservadas
- ✅ Links e dados técnicos intocados

---

### Resumo dos arquivos editados

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-message-variants/index.ts` | **Novo** — edge function que gera 9 variantes via Lovable AI |
| `src/components/admin/whatsapp/TemplatesTab.tsx` | Adiciona botão "Gerar variações com IA" + estados + handler |

### Fora de escopo
- Sem mudanças no schema do banco
- Sem alteração no round robin (`pick_template_variant`)
- Sem mudança em `process-queue` ou `VariantSlotSelector`
- Geração só para admins (segue padrão de uso de IA do projeto)

### Resultado esperado
- 1 clique gera 9 variantes contextuais, no tom certo, com variáveis preservadas
- Botão sinaliza visualmente quando "está pronto pra usar" (âmbar) ou "já foi usado" (verde)
- Zero risco de quebrar round robin existente — variantes geradas são salvas pelo mesmo fluxo já implementado

