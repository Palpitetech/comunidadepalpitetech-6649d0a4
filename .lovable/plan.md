

## Plano: Redesenhar 100% os botões CTA da `/home`

### Diagnóstico

Botões atuais em `src/pages/Comunidade.tsx` (linhas 41-77):
- Visual genérico (cards verdes chapados, sem hierarquia)
- Sem ícones
- Tipografia plana, sem destaque
- Aparência "amadora" — só texto centralizado em retângulo verde

### Proposta de redesign

**Conceito:** botões premium com ícone destacado à esquerda, título forte e subtítulo descritivo à direita, gradiente sutil, borda viva, sombra com brilho verde, micro-interação no hover/active.

**Estrutura visual de cada botão:**
```
┌──────────────────────────────────┐
│ [ícone]   Título principal       │
│           Subtítulo descritivo   │
└──────────────────────────────────┘
```

**Mudanças concretas:**

1. **Trocar `Card` por `button` nativo** — mais leve e semântico para CTA.
2. **Layout horizontal:** ícone circular à esquerda + bloco de texto à direita (alinhado à esquerda).
3. **Background:** gradiente `from-green-600 to-green-700` com hover `from-green-500 to-green-600`.
4. **Borda + sombra:** `border border-green-500/40` + `shadow-lg shadow-green-600/30` para dar profundidade premium.
5. **Ícone:** círculo translúcido `bg-white/15` com ícone branco dentro:
   - Botão 1 (Gerar palpites): `Sparkles`
   - Botão 2 (Sala Secreta / 15 palpites): `Lock` (não-pago) ou `Crown` (pago)
6. **Tipografia:**
   - Título: `font-bold text-sm leading-tight`
   - Subtítulo: `text-[11px] text-white/80 leading-tight mt-0.5`
7. **Subtítulo no botão 1 também:** "Estratégias inteligentes" — pareia visualmente com o botão 2.
8. **Micro-interação:** `active:scale-[0.98] transition-all duration-200`, `hover:shadow-green-500/40`.
9. **Altura uniforme:** ambos com `min-h-[68px]` e `items-center` — garante mesma altura sem hack.
10. **Limpar imports:** remover `Card`/`CardContent`, adicionar `Sparkles`, `Lock`, `Crown` do lucide-react (`Sparkles` já importado).

### Fora de escopo

- Não tocar em nenhum outro elemento da página (LatestResults, posts, pinned, etc.)
- Não alterar `/`, não alterar `Index.tsx`
- Não mudar lógica de navegação/links
- Não alterar tokens de design global

### Resultado esperado

Dois botões visualmente premium, com ícone + título + subtítulo, mesma altura, gradiente verde com profundidade, alinhamento horizontal limpo — bem mais profissionais que o estado atual.

