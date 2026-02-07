
# Plano: Gerador de Fechamento

## Resumo
Criar uma nova página "Gerador de Fechamento" que permite ao usuário selecionar dezenas em um grid visual 5x5, com indicadores de propriedades matemáticas (Par/Ímpar, Moldura, Múltiplo de 3) em cada quadrado, e gerar combinações fechadas baseadas no tipo de fechamento selecionado.

---

## O que é Fechamento?
O fechamento é uma técnica de loteria onde você seleciona mais dezenas do que o necessário e gera todas as combinações possíveis para garantir um prêmio mínimo caso acerte determinada quantidade de números.

---

## Estrutura Visual do Grid 5x5

Cada quadrado do grid terá indicadores nos cantos:

```text
┌─────────────┐
│ I         P │  ← I = Ímpar (esquerda), P = Par (direita)
│     01      │  ← Número central
│ M        M3 │  ← M = Moldura (esquerda), M3 = Múltiplo 3 (direita)
└─────────────┘
```

---

## Componentes a Criar

### 1. Página Principal
**Arquivo:** `src/pages/Fechamento.tsx`
- Usa `MainLayout` com `pageTitle="Gerador de Fechamento"`
- Desktop: Header com ícone e descrição
- Card de configuração com seletores

### 2. Seletor de Tipo de Fechamento (Dropdown)
**Arquivo:** `src/components/fechamento/TipoFechamentoSelector.tsx`
- Dropdown com tipos de fechamento comuns:
  - 18 dezenas - Garante 14 pontos
  - 19 dezenas - Garante 14 pontos
  - 20 dezenas - Garante 14 pontos
  - 21 dezenas - Garante 13 pontos
  - 22 dezenas - Garante 13 pontos
  - 23 dezenas - Garante 12 pontos
  - 24 dezenas - Garante 12 pontos
  - 25 dezenas - Garante 11 pontos

### 3. Seletor de Chave (Modo de Seleção)
**Arquivo:** `src/components/fechamento/ModoChaveSelector.tsx`
- Radio buttons para alternar entre:
  - **Selecionar**: Modo padrão de escolha
  - **Fixar**: Dezenas que obrigatoriamente estarão em todos os jogos

### 4. Grid 5x5 de Dezenas com Indicadores
**Arquivo:** `src/components/fechamento/GridDezenasVolante.tsx`
- Grid 5x5 representando o volante da Lotofácil
- Cada célula mostra:
  - Número central formatado (01-25)
  - **Canto superior esquerdo**: "I" se ímpar
  - **Canto superior direito**: "P" se par
  - **Canto inferior esquerdo**: "M" se moldura
  - **Canto inferior direito**: "M3" se múltiplo de 3
- Estados visuais:
  - Normal: borda cinza
  - Selecionada: fundo roxo/primário
  - Fixa: fundo amarelo/dourado (destaque especial)

---

## Fluxo de Uso

1. Usuário seleciona o tipo de fechamento (ex: 18 dezenas - 14 pontos)
2. Define o modo: Selecionar ou Fixar
3. Clica nas dezenas do grid para selecioná-las/fixá-las
4. Sistema valida se a quantidade mínima de dezenas foi atingida
5. Botão "Gerar Fechamento" fica habilitado
6. Ao clicar, gera as combinações (futura implementação do backend)

---

## Detalhes Técnicos

### Rota
```tsx
// App.tsx
<Route path="/fechamento" element={<ProtectedRoute><Fechamento /></ProtectedRoute>} />
```

### Uso das Funções Existentes
```tsx
// Reutilizar do src/lib/lotofacil.ts
import { 
  isPar, 
  isImpar, 
  isMoldura, 
  isMultiploDe3, 
  formatarDezena 
} from "@/lib/lotofacil";
```

### Validações do Grid
- Mínimo de dezenas = quantidade do fechamento selecionado
- Máximo de dezenas fixas = quantidade do fechamento - 15
- Feedback visual quando limites são atingidos

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Fechamento.tsx` | Página principal |
| `src/components/fechamento/TipoFechamentoSelector.tsx` | Dropdown de tipos |
| `src/components/fechamento/ModoChaveSelector.tsx` | Seletor de modo |
| `src/components/fechamento/GridDezenasVolante.tsx` | Grid 5x5 interativo |
| `src/components/fechamento/DezenaVolante.tsx` | Célula individual do grid |

---

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar rota `/fechamento` |

---

## Cores e Estilos

- **Dezena normal**: `bg-card border-border`
- **Dezena selecionada**: `bg-primary/20 border-primary`
- **Dezena fixa**: `bg-amber-100 border-amber-500` (dourado para destaque)
- **Indicador I (ímpar)**: `text-purple-600 text-[10px]`
- **Indicador P (par)**: `text-blue-600 text-[10px]`
- **Indicador M (moldura)**: `text-amber-600 text-[10px]`
- **Indicador M3 (múltiplo 3)**: `text-green-600 text-[10px]`

---

## Resultado Esperado

Interface limpa e intuitiva seguindo o padrão de layout do sistema, com grid visual que facilita a seleção de dezenas mostrando todas as propriedades matemáticas de cada número, ideal para usuários seniores que precisam de informações visuais claras.
