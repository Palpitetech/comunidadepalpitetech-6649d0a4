
## Investigação

O usuário quer adicionar 7 screenshots de posts da comunidade na página inicial (sem slug = `/` = `Index.tsx`), mapeando cada imagem ao conteúdo correspondente já existente na seção "Receba estudos diários sem custo nenhum".

**Imagens fornecidas (mapeadas pelo conteúdo):**
1. `Screenshot_20260417_163109` — 🚨 SAIU O RESULTADO! (Plantão Lotofácil 3663 — Raio-X)
2. `Screenshot_20260417_163126` — 📊 Análise Par/Ímpar (Distribuição e Médias)
3. `Screenshot_20260417_163143` — 📊 Análise do Ciclo 44 (Status do Ciclo)
4. `Screenshot_20260417_163201` — 📊 Lotofácil: Movimentação (Quentes/Frias)
5. `Screenshot_20260417_163221` — Análise Técnica: Ciclo (Insights dos Últimos Concursos)
6. `Screenshot_20260417_163233` — 🔍 Análise de Moldura (Moldura vs Miolo)
7. `Screenshot_20260417_163245` — 📊 Análise de Repetidas (Repetidas Recentes)

## Próximos passos (modo de execução)

1. **Verificar a seção atual** em `src/pages/Index.tsx` que fala sobre "Receba estudos diários sem custo nenhum" para entender estrutura atual e onde inserir as imagens.
2. **Copiar as 7 imagens** do `user-uploads://` para `src/assets/` com nomes semânticos:
   - `estudo-resultado-saiu.jpg`
   - `estudo-par-impar.jpg`
   - `estudo-ciclo.jpg`
   - `estudo-quentes-frias.jpg`
   - `estudo-tecnica-ciclo.jpg`
   - `estudo-moldura.jpg`
   - `estudo-repetidas.jpg`
3. **Importar como ES6 modules** no `Index.tsx`.
4. **Renderizar um grid/carrossel** de cards na seção identificada, cada card exibindo:
   - A imagem (screenshot do post)
   - Um título curto correspondente ao conteúdo (ex: "Plantão de Resultados", "Análise Par/Ímpar", etc.)
   - Uma descrição breve do tipo de estudo
5. **Layout responsivo**: grid de 2 colunas no mobile, 3-4 colunas no desktop, com imagens em proporção retrato (mobile screenshots).
6. **Acessibilidade/SEO**: alt text descritivo em cada imagem reforçando palavras-chave (Lotofácil, ciclo, par/ímpar, moldura, etc.).
7. **Estilo**: cards com sombra suave, bordas arredondadas, hover effect leve, mantendo o design existente da página.

Sem mudanças em backend, banco de dados ou outras páginas — somente em `Index.tsx` e cópia de assets.
