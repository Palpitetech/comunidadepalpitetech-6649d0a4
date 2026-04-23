

## Filtro de loteria no dashboard Estudos

### Onde

Página `src/pages/Comunidade.tsx` (rota `/comunidade`, título "Estudos"). O filtro fica logo **abaixo** dos dois botões verdes ("Gerar meus palpites" / "Sala Secreta") e **acima** do feed.

### Comportamento

- **Estado local** `loteriaFiltro: 'lotofacil' | 'megasena'` (padrão `'lotofacil'`).
- **Filtragem no cliente**: o feed atual já vem com `loteria_tag` em cada post. Filtra-se em memória por `post.loteria_tag === 'Lotofácil'` ou `'Mega-Sena'` antes do split `pinnedPost`/`otherPosts`. Sem mudar `useCommunityPosts` (mantém cache único e realtime único).
- **Persona/regras automáticas**: nenhuma mudança extra é necessária — cada post já carrega seu autor (persona) via `perfis_publicos`. Quando a Fase 3 (Mega-Sena) entrar, os posts da Mega aparecerão automaticamente com o autor Mega-Sena ao trocar o filtro. Hoje (sem posts Mega), o filtro Mega exibirá estado vazio com mensagem amigável.
- **Mega-Sena "quando disponível"**: o botão Mega fica **sempre visível e clicável**. Ao selecioná-lo, se não houver posts com `loteria_tag = 'Mega-Sena'`, mostra placeholder: *"Estudos de Mega-Sena em breve. Por enquanto, confira os estudos de Lotofácil."* com link para voltar ao filtro Lotofácil. (Decisão: deixar visível ensina o usuário sobre a expansão futura sem exigir gating.)

### Visual dos botões (mobile-first, 44px tap target)

Grid 2 colunas, gap 2, abaixo dos botões verdes:

```text
[ Lotofácil  ]   [ Mega-Sena ]
   roxo            verde
```

- **Lotofácil ativo**: bg `hsl(270 60% 50%)` (Roxo), texto branco, ring sutil.
- **Lotofácil inativo**: borda roxa, texto roxo, bg branco.
- **Mega-Sena ativo**: bg `hsl(125 70% 40%)` (Verde Mega), texto branco, ring sutil.
- **Mega-Sena inativo**: borda verde Mega, texto verde Mega, bg branco.
- Label pequeno acima do par de botões: `Ver estudos:` (text-xs, muted).

Cores HSL conforme memória `mem://design/lottery-branding-colors`.

### Mudanças técnicas

**Arquivo único:** `src/pages/Comunidade.tsx`

1. Adicionar `useState<'lotofacil' | 'megasena'>('lotofacil')`.
2. Adicionar mapa local `LOTERIA_TAG_MAP = { lotofacil: 'Lotofácil', megasena: 'Mega-Sena' }`.
3. No `useMemo` que calcula `pinnedPost`/`otherPosts`, filtrar `posts.filter(p => p.loteria_tag === LOTERIA_TAG_MAP[loteriaFiltro])` antes do split.
4. Renderizar bloco do seletor entre os botões verdes (linha 65) e o `isLoading` (linha 67).
5. Ajustar empty state para mensagem específica quando `loteriaFiltro === 'megasena'` e o filtro retorna vazio.

### O que NÃO muda

- `useCommunityPosts.ts` — segue inalterado (1 query, 1 canal realtime, cache único).
- Backend / RLS / engines — nada. Posts Mega-Sena já entrarão no feed quando a Fase 3 inserir registros com `loteria_tag = 'Mega-Sena'`.
- Persona, prompts, regras — já são automáticos por loteria desde a Fase 1.
- Botões verdes superiores — preservados.
- Outras páginas (`/`, `/central`) — fora de escopo.

### Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Posts antigos sem `loteria_tag` sumirem | Migração já garantiu `loteria_tag = 'Lotofácil'` nos posts atuais; novos vêm preenchidos pelo engine. |
| Filtro Mega vazio confundir usuário | Empty state explícito com CTA pra voltar a Lotofácil. |
| Trocar filtro perder scroll/posição | `useState` local não desmonta o feed; React Query mantém cache — troca instantânea. |
| Mais loterias no futuro | Mapa `LOTERIA_TAG_MAP` cresce; pode virar `lottery-configs` compartilhado quando passar de 3 loterias. |

### Verificação

1. Filtro Lotofácil ativo por padrão → feed idêntico ao atual.
2. Clicar Mega-Sena → feed esvazia → mostra placeholder amigável.
3. Inserir manualmente um post com `loteria_tag = 'Mega-Sena'` → aparece só no filtro Mega.
4. Trocar entre filtros → instantâneo, sem requisições novas (cache).
5. Mobile 390px → botões com tap target ≥44px, sem overflow.

