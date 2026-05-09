## Estrutura

**Rota nova**: `/admin/gravacao/mega-30-anos` (isolada da `GravacaoMegasena` existente)

**Assets**:
```
src/assets/gravacao/megasena-30anos/
  background.jpg          ← fundo padrão (já enviado)
  capas/capa-01.jpg       ← capa Estudo 01 (já enviada)
  capas/capa-02..15.jpg   ← futuras
```

**Componentes novos**:
```
src/pages/admin/gravacao/GravacaoMega30Anos.tsx
src/components/gravacao/mega30anos/
  Mega30Shell.tsx       (background fixo + navegação teclado)
  Mega30Header.tsx      (header persistente topo)
  Mega30Capa.tsx        (capa fullscreen sem overlay)
  estudo01/
    Slide01TopPorMes.tsx
    Slide02TopPorAno.tsx
    Slide03TopPorSemestre.tsx
    Slide04Top15Geral.tsx
src/hooks/useGravacaoMega30Anos.ts
```

## Header persistente (slides 2+)

Faixa dourada no topo:
- Linha 1: `Aula 01 de 15 — Maratona Mega Especial 30 anos`
- Linha 2: `Análise · Top 15 dezenas · [tipo]`

## Slides do Estudo 01

| # | Slide | Conteúdo |
|---|-------|----------|
| 1 | Capa | `capa-01.jpg` fullscreen, sem overlay |
| 2 | Top 15 por Mês | 12 blocos (Jan…Dez) somando todos anos |
| 3 | Top 15 por Ano | Lista 1996→2026 (paginada, ~8 anos/slide) |
| 4 | Top 15 por Semestre | 1º vs 2º semestre (agregado todos anos) |
| 5 | Top 15 nos 30 anos | Ranking final hero (15 bolas grandes) |

## Lógica de dados

Hook `useGravacaoMega30Anos`:
- Busca todos 3.005 concursos de `resultados_loterias` (loteria=megasena)
- Calcula em memória:
  - `topPorMes[1..12]` → 15 dezenas mais sorteadas
  - `topPorAno[1996..2026]` → 15 dezenas por ano
  - `topPorSemestre[1, 2]` → 15 dezenas
  - `top15Geral` → 15 + frequência
- React Query, staleTime 1h

## Identidade visual

- Paleta: verde escuro `#0A2818` / dourado `#D4AF37` / off-white `#F5EFE0`
- Tipografia: serif display (Cinzel) p/ títulos, Inter p/ dados
- Bolas estilo capa (verde escuro + número dourado)
- Sem emojis

## Fora deste escopo

- Capas e conteúdo dos Estudos 02-15 (próximas iterações conforme você enviar)
- Integração com módulo de gravação OBS existente
