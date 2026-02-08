
# Plano: Novo Layout do Gerador de Fechamento

## Visao Geral

Reorganizar completamente a estrutura visual da pagina `/fechamento` para uma experiencia mais clara e intuitiva, seguindo a nova hierarquia de informacoes solicitada.

## Novo Layout Proposto

```text
+-----------------------------------------------+
|                    Header                      |
+-----------------------------------------------+
|         Escolha sua garantia aqui             |
|            [Dropdown Select]                  |
+-----------------------------------------------+
|                                               |
|  O fechamento "16-14-4" tem as regras:        |
|                                               |
|  1) Selecione 16 numeros + Fixas (opcional)   |
|  2) Clique em Gerar                           |
|  3) Garantia: 14 pontos                       |
|  4) Condicao: Se acertar 15 dos 16            |
|                                               |
+-----------------------------------------------+
|                                               |
|         Grid 5x5 (DezenaVolante)              |
|                                               |
+-----------------------------------------------+
|  Total: 16 | Selecionados: 12 | Fixos: 2     |
+-----------------------------------------------+
|            [Gerar Palpites]                   |
+-----------------------------------------------+
```

## Componentes a Criar/Modificar

### 1. Novo Componente: `FechamentoRulesCard`

Card informativo que exibe as regras dinamicas do fechamento selecionado:

- Recebe a estrategia atual como prop
- Exibe as 4 regras em lista numerada
- Design clean com icones para cada regra
- Atualiza automaticamente quando muda a estrategia

### 2. Novo Componente: `FechamentoStatusBar`

Barra de status compacta que mostra:

- **Total**: Quantidade necessaria para a estrategia (ex: 16)
- **Selecionados**: Quantidade atual de dezenas selecionadas
- **Fixos**: Quantidade de dezenas fixas (se houver)
- Visual clean com separadores

### 3. Modificar: `EstrategiaFechamentoSelector`

Simplificar para exibir apenas:

- Label "Escolha sua garantia"
- Dropdown com opcoes mais descritivas
- Adicionar campo `condicao` na interface para explicar quando a garantia se aplica

### 4. Modificar: `Fechamento.tsx` (Pagina Principal)

Reorganizar a estrutura:

1. Remover contador flutuante sticky
2. Mover dropdown para o topo
3. Adicionar card de regras abaixo do dropdown
4. Manter Grid 5x5 centralizado
5. Adicionar status bar antes do botao
6. Botao "Gerar Palpites" no final

### 5. Estender Interface de Estrategia

Adicionar novos campos ao tipo `EstrategiaFechamento`:

```typescript
interface EstrategiaFechamento {
  // ... campos existentes
  identificacao: string; // ex: "16-14-4"
  condicao: string; // ex: "Se acertar 15 dos 16 numeros"
}
```

## Detalhes Tecnicos

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/fechamento/FechamentoRulesCard.tsx` | Card com regras dinamicas |
| `src/components/fechamento/FechamentoStatusBar.tsx` | Barra de status compacta |

### Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/pages/Fechamento.tsx` | Reorganizar layout completo |
| `src/components/fechamento/EstrategiaFechamentoSelector.tsx` | Simplificar label e adicionar condicao |

### Logica de Fixas

O layout prepara espaco para "Fixas" (dezenas obrigatorias):

- Estado `fixas` ja existe no componente `GridDezenasVolante`
- A contagem de fixas sera exibida na status bar
- Por enquanto, fixas = 0 (funcionalidade futura)

### Responsividade

- Grid mantem `max-w-sm mx-auto` para centralizacao
- Status bar usa flex com justify-between
- Cards usam padding responsivo

## Resultado Esperado

O usuario vera:

1. Dropdown claro no topo para escolher garantia
2. Card explicativo com as regras do fechamento
3. Grid 5x5 para selecionar numeros
4. Barra de status mostrando progresso
5. Botao de acao no final

A experiencia sera mais intuitiva, especialmente para usuarios seniors, pois as regras ficam visiveis antes da interacao com o grid.
