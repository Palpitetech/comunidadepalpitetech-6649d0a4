

## Ajustar textos da página Gerador de Estudo para refletir contexto da Mega-Sena

### Diagnóstico
Após Fase 3, a página `GeradorEstudo` já é multi-loteria, mas alguns textos genéricos foram pensados originalmente para Lotofácil (15 fixas / 25 dezenas no universo). Para Mega-Sena (60 dezenas / 6–12 por jogo) precisamos refinar microcopy para o usuário não estranhar.

### Pontos identificados

**1. `src/pages/lotofacil/GeradorEstudo.tsx`**
- Subtítulo `"Palpites a partir de um estudo"` → ok, mas pode ganhar contexto da loteria.
- Badge "estudos/dia" e fallback `"30/dia"` → texto certo, sem ajuste necessário.
- Texto do botão `"Gerar X Palpite(s)"` → genérico, ok.
- Loading: `"Aplicando o estudo aos seus palpites..."` → genérico, ok.

**2. `src/components/gerador/QuantidadeSelector.tsx`**
- `"Escolha ou digite até {max} jogos"` → já parametriza via `max`, funciona para ambos.

**3. `src/components/gerador/DezenasSelector.tsx`**
- Título `"Dezenas por palpite"` e helper `"Quantas dezenas em cada jogo?"` → genéricos, ok.
- Já aceita `options` (6-12 para Mega).

**4. `src/components/gerador-estudo/EstudoInfoCard.tsx`**
- `TEMA_LABEL` já mapeia `analise_moldura_megasena`. Ok.
- Helper texts (`"Estudo selecionado"`, badge de tema, badge de loteria_tag) → genéricos, ok.

### Ajustes propostos (mínimos e cirúrgicos)

**`src/pages/lotofacil/GeradorEstudo.tsx`** — apenas o subtítulo do header da página:

Atual:
```tsx
<h2 className="text-lg font-bold text-foreground">Palpites a partir de um estudo</h2>
```

Novo (contextual por loteria):
```tsx
const subtitulo = loteria === "megasena"
  ? "Palpites de Mega-Sena (6 a 12 dezenas) a partir de um estudo"
  : "Palpites de Lotofácil (15 a 20 dezenas) a partir de um estudo";
```

E ajustar a cor do ícone `BookOpen` para refletir a identidade visual:
- Lotofácil: `text-primary` (roxo) — atual
- Mega-Sena: `text-[hsl(125,70%,40%)]` (verde Mega) — usar variável de cor já existente ou classe utilitária

**`src/components/gerador/DezenasSelector.tsx`** — refinar helper para deixar a faixa explícita:

Atual:
```tsx
<p className="text-xs text-muted-foreground">Quantas dezenas em cada jogo?</p>
```

Novo (derivar da prop `options`):
```tsx
const min = Math.min(...DEZENAS_OPTIONS);
const max = Math.max(...DEZENAS_OPTIONS);
<p className="text-xs text-muted-foreground">Quantas dezenas em cada jogo? ({min} a {max})</p>
```

Isso vale automaticamente para Lotofácil ("15 a 20"), Mega-Sena ("6 a 12") e qualquer loteria futura — zero hardcode.

### Não-objetivos
- Não tocar `EstudoSelector`, `EstudoInfoCard`, `QuantidadeSelector` (já neutros/parametrizados).
- Não mover `GeradorEstudo.tsx` da pasta `lotofacil/` (continua sendo o arquivo compartilhado).
- Não mexer em backend/hook (já loteria-agnósticos).

### Arquivos tocados

| Ação | Arquivo |
|---|---|
| Editar | `src/pages/lotofacil/GeradorEstudo.tsx` (subtítulo contextual + cor do ícone por loteria) |
| Editar | `src/components/gerador/DezenasSelector.tsx` (helper mostra faixa derivada das `options`) |

### Garantias
- **Lotofácil**: continua exibindo "15 a 20 dezenas" no helper e ícone roxo.
- **Mega-Sena**: passa a exibir "6 a 12 dezenas" no helper e ícone verde.
- **Zero impacto** em Quina/Dupla quando ganharem o gerador de estudo — o helper se adapta sozinho.

