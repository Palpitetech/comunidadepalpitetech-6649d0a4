

# Tela de Cadastro Fullscreen sem Scroll

## Contexto

O `RegisterWizard` é renderizado dentro do `LoginWizard`, que por sua vez fica dentro de um `Card` na página `/login`. O formulário de cadastro (Step 1 - `StepDadosPessoais`) tem 6 campos + checkbox + botão, o que causa scroll no mobile.

## Plano

### 1. Refatorar `StepDadosPessoais` para layout fullscreen mobile

- Remover `CardHeader`/`CardContent` wrappers no mobile, usar layout `flex flex-col h-full` que distribui o conteúdo verticalmente
- Reduzir espaçamento entre campos (`space-y-2` no mobile)
- Usar inputs mais compactos: `h-10` no mobile (em vez de `h-11`)
- Remover ícones dos Labels no mobile para economizar espaço vertical
- Compactar o bloco de termos LGPD (padding menor, texto menor)
- Manter o botão "Continuar" fixo no bottom com `mt-auto`

### 2. Ajustar `RegisterWizard` para fullscreen mobile

- Remover o `Card` wrapper no mobile, usar `div` com `min-h-[100dvh]` ou `h-[100dvh]` e `flex flex-col`
- O `StepIndicator` fica no topo compacto
- O conteúdo do step ocupa o restante com `flex-1`

### 3. Ajustar `LoginWizard` quando `etapa === "cadastro"`

- Quando estiver na etapa de cadastro no mobile, o Card inteiro deve virar fullscreen (`fixed inset-0 z-50` ou `min-h-[100dvh]`)
- O botão "Voltar" fica no topo como header compacto

### 4. Ajustar página `Login.tsx`

- No mobile, quando em cadastro, remover padding/centering do wrapper para permitir fullscreen

## Arquivos a editar

1. **`src/components/auth/steps/StepDadosPessoais.tsx`** - Layout compacto, sem scroll
2. **`src/components/auth/RegisterWizard.tsx`** - Fullscreen container no mobile
3. **`src/components/auth/LoginWizard.tsx`** - Fullscreen quando etapa=cadastro

