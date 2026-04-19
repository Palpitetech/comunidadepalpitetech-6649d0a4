

## Plano: Reduzir altura dos botões CTA na `/home`

### Diagnóstico

Os botões "Gerar meus palpites" e "Entrar na Sala Secreta" estão em `src/pages/Comunidade.tsx` (rota `/home`). Atualmente:
- Padding: `p-3 sm:p-4`
- Altura mínima: `min-h-[60px]`
- Já estão verdes (`bg-green-600`)
- Conteúdo já usa `flex flex-col items-center justify-center` (centralizado)

O botão direito é mais alto porque tem 2 linhas de texto (título + subtítulo), enquanto o esquerdo tem só 1.

### Mudanças

**Arquivo único:** `src/pages/Comunidade.tsx` (os 2 cards de CTA)

1. **Reduzir padding vertical:** `p-3 sm:p-4` → `px-3 py-2 sm:px-4 sm:py-2.5`
2. **Remover altura mínima fixa:** remover `min-h-[60px]` para o botão acompanhar o conteúdo de forma compacta
3. **Garantir mesma altura entre os dois:** adicionar `h-full` no `Card` (já está) e manter `justify-center` no `CardContent` — assim o card menor estica para acompanhar o maior, com conteúdo centralizado verticalmente.
4. **Reduzir espaçamento do subtítulo:** `mt-0.5` → `mt-0` (compacta a segunda linha sem mudar tamanho de fonte)

### Fora de escopo

- Não alterar cores (continuam `bg-green-600`)
- Não alterar tamanhos de fonte
- Não alterar comportamento/onClick
- Não tocar em nenhum outro arquivo
- Não alterar o mesmo bloco em `Index.tsx` (usuário pediu apenas `/home`)

### Resultado esperado

Botões mais baixos, ambos com mesma altura, conteúdo verticalmente centralizado, cor verde mantida.

