## Objetivo

Criar uma apresentação fullscreen (1 página, 6 slides horizontais) para gravação de vídeo do estudo **Posições Finais da Mega-Sena**, na rota `/admin/gravacao-estudo/megasena/posicoes-finais`. Visual escuro premium, dados reais vindos do hook `useDezenasporPosicaoMegaSena`.

## Arquitetura

Reutilizar o padrão já existente (`GravacaoShell` + slides em `src/components/gravacao/`), mas com um **shell dedicado** para estudos (sem header de "concurso") e tipografia maior pensada para gravação. Sempre 100vw × 100vh, sem rolagem.

## Arquivos a criar

1. **`src/pages/admin/gravacao/estudos/PosicoesFinaisMegaSena.tsx`**
   - Página principal. Busca último concurso da Mega-Sena (`resultados_loterias`) e usa `useDezenasporPosicaoMegaSena(100)`.
   - Monta os 6 slides dentro de um shell de estudo.

2. **`src/components/gravacao/estudos/EstudoShell.tsx`**
   - Container fullscreen reaproveitando o esqueleto do `GravacaoShell`, mas com:
     - Barra de progresso superior (linha fina roxa preenchendo conforme slide atual).
     - Setas laterais (esquerda/direita) sempre visíveis com hover sutil.
     - Navegação por teclado (← →, Espaço, Esc → volta para `/admin`).
     - Suporte a swipe (touch).
     - Indicador "1 / 6" discreto no canto inferior direito.
     - Watermark "PALPITE TECH" repetido em opacidade ~2% (igual ao shell atual).
     - Transição suave entre slides via `transform: translateX(-N * 100vw)` com `transition: 0.6s cubic-bezier(0.65, 0, 0.35, 1)`.

3. **6 componentes de slide** em `src/components/gravacao/estudos/posicoes-finais/`:
   - `Slide1Intro.tsx` — Título "Posições Finais da Mega-Sena", subtítulo "Estudo estatístico baseado nos últimos 100 concursos", número do concurso, animação fade+scale de entrada (`animate-fade-in` + `animate-scale-in` do tailwind config existente).
   - `Slide2Explicacao.tsx` — Visualização da regra matemática `P1 < P2 < P3 < P4 < P5 < P6`, com 6 caixas em linha e setas conectando. Gráfico horizontal mostrando faixas típicas de cada posição (P1: 1–20, P2: 8–30, ..., P6: 45–60), destacando faixa **30–60** como zona-chave em verde claro.
   - `Slide3P4.tsx` — Top 5 dezenas da posição 4 em cards grandes (180×180px), com número gigante (text-7xl) e frequência logo abaixo ("aparece em XX%").
   - `Slide4P5.tsx` — Mesmo padrão, posição 5.
   - `Slide5P6.tsx` — Posição 6 com cards ainda maiores (220×220px), glow roxo mais intenso, badge "MAIS DECISIVA".
   - `Slide6Conclusao.tsx` — Trio recomendado (top1 de P4, P5, P6) em 3 círculos grandes centralizados; checklist estratégico ao lado (4 itens, ex: "Combine com 3 dezenas baixas (P1–P3)", "Evite P6 < 30", "Use ao menos 1 dezena ≥ 50", "Confira faixa final 30–60"); card inferior com prêmio estimado do próximo concurso.

## Estilo visual (centralizado nos slides)

```
fundo:          #070B16
card:           #111827  (bg) com border #1F2937
roxo principal: #7C3AED
glow:           0 0 60px rgba(124, 58, 237, 0.35)
verde sucesso:  #10B981
vermelho alerta:#EF4444
texto primário: #F9FAFB
texto suave:    rgba(255,255,255,0.55)
```

Tipografia para gravação: títulos `text-7xl/text-8xl font-extrabold`, subtítulos `text-2xl`, corpo `text-xl`. Tudo em escala generosa (mínimo 20px) — leitura fácil mesmo em smartphone.

## Roteamento

Adicionar em `src/App.tsx`:
```tsx
import PosicoesFinaisMegaSena from "./pages/admin/gravacao/estudos/PosicoesFinaisMegaSena";

<Route
  path="/admin/gravacao-estudo/megasena/posicoes-finais"
  element={<AdminRoute><PosicoesFinaisMegaSena /></AdminRoute>}
/>
```

## Dados

- **Último concurso**: `supabase.from("resultados_loterias").select("concurso, data_sorteio, dezenas").eq("loteria", "megasena").order("concurso", { ascending: false }).limit(1)`.
- **Top dezenas por posição**: `useDezenasporPosicaoMegaSena(100)` (já retorna top5 de P1–P6, exatamente o que precisamos).
- **Próximo prêmio estimado** (slide 6): consultar a mesma origem que `useGravacaoDataMegasena` já usa (verificar campo `proximo_concurso_premio_estimado` em `resultados_loterias`); se indisponível, omitir o card.

## Estados

- Loading: tela escura com spinner roxo central + texto "Carregando estudo…".
- Erro / sem dados: mensagem centralizada "Estudo indisponível — sem resultados suficientes".
- Sem dados de concurso atual: ainda assim renderiza slides 1, 2 e 6 (estes dois últimos sem trio); ou bloqueia toda a apresentação. **Decisão proposta:** bloquear se faltar dado de posição (necessita ≥ 1 concurso).

## Acessibilidade / UX de gravação

- Cursor desaparece após 3s de inatividade (`cursor: none` em wrapper, voltando ao mover mouse).
- Botão "voltar" (← canto superior esquerdo) discreto, opacity 30% → 100% em hover, navega para `/admin/gravacao/estudos/megasena`.
- Sem badge Lovable, sem distrações, sem layout responsivo (forçar 100vw × 100vh — pensado para gravação horizontal).

## Padrão para próximos estudos

O `EstudoShell` e a estrutura `src/components/gravacao/estudos/<nome-estudo>/` ficam preparados para receber novos estudos (Frequência, Tendências, Linhas/Colunas etc.) seguindo o mesmo padrão de 6 slides e o mesmo visual.

## Resumo de entregáveis

- 1 nova rota
- 1 página
- 1 shell reutilizável para estudos
- 6 componentes de slide
- 1 entrada em `App.tsx`

Nenhuma alteração de banco de dados, RLS ou edge function é necessária — todos os dados já estão acessíveis via hooks existentes.