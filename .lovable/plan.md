## Objetivo

Reorganizar `/admin/gravacao/estudos/:loteria` (hoje desorganizada — mistura "apresentações", "estudos disponíveis" e "rascunhos do dia" em listas separadas) em uma estrutura **agrupada por tema de estudo**, escalável para receber novos temas (Posições Finais, Frequência, Tendências, Desdobramento, etc.) em todas as loterias (Mega-Sena, Lotofácil, Quina, Dupla-Sena…).

## Problema atual

- Card "Apresentação" é genérico ("Mais recente") e fica separado da lista de estudos sincronizados, criando duplicidade visual.
- Lista de estudos só aparece para Mega-Sena/Posições Finais via condicional hardcoded.
- "Rascunhos de hoje" mostra texto cru — irrelevante para a tarefa de escolher um estudo para gravar.
- Não há padrão para adicionar um 2º tema (ex: "Frequência") sem duplicar todo o bloco.

## Nova estrutura visual

```text
┌─ Header: Gravação Estudos · Mega-Sena ──────────────── [3 temas ativos] ─┐
│                                                                          │
│  ╔══ TEMA: Posições Finais ════════════════════ [Fullscreen · 6 slides] ╗│
│  ║  Análise das dezenas mais frequentes nas posições 4, 5 e 6.         ║│
│  ║                                                                     ║│
│  ║  Versões disponíveis (rascunho + publicado, mais recentes primeiro):║│
│  ║  ┌─────────────┬─────────────┬─────────────┬─────────────┐          ║│
│  ║  │ #3001 ⬤ RAS │ #3000 ✓ PUB │ #2999 ✓ PUB │ #2998 ✓ PUB │  ▶       ║│
│  ║  │ Hoje 14:32  │ Ontem 21:10 │ Sáb 21:10   │ Qui 21:10   │          ║│
│  ║  └─────────────┴─────────────┴─────────────┴─────────────┘          ║│
│  ║  [Ver todos os 15 estudos ▾]                                        ║│
│  ╚═════════════════════════════════════════════════════════════════════╝│
│                                                                          │
│  ╔══ TEMA: Frequência (em breve) ═══════════════════════════════════════╗│
│  ║  Aguardando rascunho do dia.                              [bloqueado]║│
│  ╚═════════════════════════════════════════════════════════════════════╝│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Cada **tema** vira um único bloco autocontido:
- Cabeçalho com nome do tema, badge (Fullscreen · N slides), descrição curta.
- Grid horizontal de **cards de versão** (rascunho/publicado), cada um clicável → abre o player com `?postagem=<id>`.
- Estado vazio amigável quando não há nenhum estudo daquele tema ainda.
- Toggle "Ver todos" se houver mais de 6 versões.

## Plano de implementação

### 1. Configuração declarativa de temas (`src/components/gravacao/estudos/temasConfig.ts`)

Mapa central, único ponto a editar quando criar novo tema:

```ts
export interface TemaGravacao {
  slug: string;              // "posicoes-finais"
  titulo: string;
  descricao: string;
  tema_estudo: string;       // valor em postagens.tema_estudo
  rotaBase: string;          // "/admin/gravacao-estudo/megasena/posicoes-finais"
  totalSlides: number;
  cor: string;               // neon principal do tema
  status: "ativo" | "em_breve";
}

export const TEMAS_POR_LOTERIA: Record<string, TemaGravacao[]> = {
  megasena: [ /* posicoes-finais */ ],
  lotofacil: [],
  quina: [],
  duplasena: [],
};
```

### 2. Hook genérico (`src/hooks/useEstudosGravacaoLista.ts`)

Generalização do `useEstudosPosicoesFinaisLista`: recebe `loteria_tag` + `tema_estudo` + `limit` e devolve `EstudoListItem[]`. O hook específico de Posições Finais passa a ser apenas um wrapper.

### 3. Componente reutilizável `TemaGravacaoCard.tsx`

Recebe o `TemaGravacao` + lista de estudos → renderiza o bloco completo (header, descrição, grid de versões, "Ver todos", estado vazio, estado "Em breve").

### 4. Refatorar `GravacaoEstudos.tsx`

- Remover seções "Apresentações" e "Rascunhos de hoje" atuais.
- Iterar sobre `TEMAS_POR_LOTERIA[loteria]` renderizando um `<TemaGravacaoCard />` por tema.
- Manter header sticky e contagem total de estudos no topo (em vez de "rascunhos do dia").

### 5. Visual

Manter o tom **admin clean** (não o tema neon dark) na seleção — esse é o "lobby". O tema neon só entra ao abrir o player. Usar:
- Cards arredondados com borda esquerda colorida pelo tema.
- Badge de status (RASCUNHO em âmbar, PUBLICADO em verde) consistente com o que já existe.
- Tipografia já adotada no admin (sem emojis, conforme regras do projeto).

## Arquivos afetados

- **Criar**: `src/components/gravacao/estudos/temasConfig.ts`
- **Criar**: `src/components/gravacao/estudos/TemaGravacaoCard.tsx`
- **Criar**: `src/hooks/useEstudosGravacaoLista.ts`
- **Editar**: `src/pages/admin/gravacao/GravacaoEstudos.tsx` (refatoração completa do main)
- **Editar**: `src/hooks/useEstudoPosicoesFinais.ts` (lista vira wrapper do hook genérico)

## Fora do escopo

- Não altera o player de gravação (`EstudoShell`, slides, `SeletorEstudo` interno).
- Não cria novos temas — apenas deixa a estrutura pronta para receber. Quando um novo tema for criado (ex: "Frequência" da Mega-Sena), basta adicionar uma entrada em `TEMAS_POR_LOTERIA.megasena`.
