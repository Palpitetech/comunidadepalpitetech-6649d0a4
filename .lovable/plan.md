

## Criar Gerador de Estudo para Mega-Sena

### O que já existe (reaproveitamento)
- ✅ Página `src/pages/lotofacil/GeradorEstudo.tsx` já é multi-loteria via prop `loteria`
- ✅ Backend `generate-palpites-from-estudo` já suporta Mega-Sena (`extrairBaseGeracaoMegasena`, pipeline shared)
- ✅ Hook `useEstudosDisponiveis` já aceita `"megasena"`
- ✅ Hook `useGeradorEstudo` é loteria-agnóstico
- ✅ `EstudoSelector` e `EstudoInfoCard` são genéricos
- ✅ `ResultadosSheetMegaSena` já aceita `dezenasFixes` e `estrategia`
- ✅ Botão da comunidade já roteia para `/megasena/gerador-estudo` (`GerarPalpitesDoEstudoButton`)

### O que falta
1. A página atual usa `ResultadosSheet` (genérico Lotofácil, 25 dezenas). Para Mega-Sena precisa usar `ResultadosSheetMegaSena` (60 dezenas + cores corretas).
2. Registrar a rota `/megasena/gerador-estudo` no `App.tsx`.
3. Adicionar o card "Gerador de Estudo" no `HubMegaSena`.

### Implementação

**1. Refatorar `src/pages/lotofacil/GeradorEstudo.tsx`** (sem mover arquivo — continua sendo o componente compartilhado)
- Selecionar dinamicamente o `ResultadosSheet` correto:
  ```ts
  const SheetComponent = loteria === "megasena" ? ResultadosSheetMegaSena : ResultadosSheet;
  ```
- Ajustar `qtdDezenas` default por loteria: 15 (Lotofácil) ou 6 (Mega-Sena)
- Ajustar `max` do `DezenasSelector` (Mega aceita 6-12). Conferir se `DezenasSelector` aceita prop ou se precisamos do `DezenasSelectorMegaSena` (a investigar rapidamente — se existir, usar; se não, parametrizar `min`/`max`).
- Ajustar título da página e cor do ícone

**2. Registrar rota em `src/App.tsx`** (após linha 218):
```tsx
<Route path="/megasena/gerador-estudo" element={
  <ProtectedRoute>
    <GatedPage feature="gerador">
      <GeradorEstudo loteria="megasena" />
    </GatedPage>
  </ProtectedRoute>
} />
```

**3. Adicionar entrada no `HubMegaSena`** após "Gerador de Palpites":
```ts
{ title: "Gerador de Estudo", description: "Palpites prontos a partir dos estudos da comunidade", icon: BookOpen, path: "/megasena/gerador-estudo" }
```

### Arquivos tocados

| Ação | Arquivo |
|---|---|
| Editar | `src/pages/lotofacil/GeradorEstudo.tsx` (sheet condicional + defaults por loteria) |
| Editar | `src/App.tsx` (nova rota) |
| Editar | `src/pages/megasena/HubMegaSena.tsx` (novo card) |

### Garantias
- **Zero código duplicado** — mesma página, mesmo hook, mesmo backend
- **UI nativa Mega-Sena** — bolinhas verdes 60 números via `ResultadosSheetMegaSena`/`JogoCardMegaSena`
- **Quota e estratégia** já funcionam (backend testado nas fases anteriores)
- **Botão da comunidade** já aponta para a rota correta (sem mudanças)

### Não-objetivos
- Mexer no backend (já suporta megasena)
- Renomear/mover o arquivo `GeradorEstudo.tsx` (mantém em `lotofacil/` por simplicidade — é genérico)
- Adicionar suporte a Quina/Dupla Sena (escopo separado quando engines de estudo existirem)

