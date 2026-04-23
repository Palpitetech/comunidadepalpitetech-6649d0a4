

## Design System por Loteria no Gerador de Estudo

### Conceito
Cada gerador de estudo passa a vestir as cores da sua loteria, criando identificação visual imediata. O azul-marinho `--primary` (genérico do app) é substituído por um **tema local** que injeta a cor da loteria nos elementos-chave da página.

### Tokens por loteria (já existem em `index.css`)
| Loteria | HSL | Aplicado em |
|---|---|---|
| Lotofácil | `270 60% 50%` (Roxo) | botão, badges, destaques, ícone do estudo |
| Mega-Sena | `125 70% 40%` (Verde) | botão, badges, destaques, ícone do estudo |

### Abordagem técnica: CSS variable scoping

Em vez de espalhar `if loteria === ...` em cada elemento, definimos um wrapper com tema local que sobrescreve `--primary` (e tokens auxiliares) **apenas dentro do gerador**.

**Novo arquivo:** `src/components/gerador-estudo/GeradorTheme.tsx`
```tsx
type Loteria = "lotofacil" | "megasena";

const THEMES: Record<Loteria, React.CSSProperties> = {
  lotofacil: {
    "--primary": "270 60% 50%",
    "--primary-foreground": "0 0% 100%",
    "--ring": "270 60% 50%",
    "--accent": "270 60% 95%",
    "--accent-foreground": "270 60% 30%",
  } as React.CSSProperties,
  megasena: {
    "--primary": "125 70% 40%",
    "--primary-foreground": "0 0% 100%",
    "--ring": "125 70% 40%",
    "--accent": "125 70% 95%",
    "--accent-foreground": "125 70% 25%",
  } as React.CSSProperties,
};

export function GeradorTheme({ loteria, children }: { loteria: Loteria; children: React.ReactNode }) {
  return <div style={THEMES[loteria]} className="contents-isolate">{children}</div>;
}
```

> **Por quê?** Todos os componentes filhos (`Button`, `Badge variant=default`, `EstudoInfoCard` com `border-primary/20 bg-primary/5`, link "Ver estudo completo" etc.) já consomem `hsl(var(--primary))`. Trocando a variável **uma vez** no escopo do gerador, **tudo se ajusta automaticamente** — zero refator de classes nos componentes filhos.

### Aplicação em `GeradorEstudo.tsx`
Envolver o conteúdo da página com o tema:
```tsx
<MainLayout pageTitle={tituloPagina}>
  <GeradorTheme loteria={loteria}>
    <div className="container-senior py-6 space-y-4 max-w-md mx-auto">
      {/* ... resto igual ... */}
    </div>
  </GeradorTheme>
</MainLayout>
```

### Efeito visual resultante (sem tocar em nenhum filho)
- **Botão "Gerar X Palpites"**: roxo (Lotofácil) / verde (Mega-Sena) — antes era azul-marinho
- **EstudoInfoCard**: borda + fundo + ícone `BookOpen` + barra lateral da recomendação + link "Ver estudo completo" → todos coloridos com a cor da loteria
- **Badges "Próximo / Já realizado" (variant=default)** no `EstudoSelector`: cor da loteria
- **Ring de foco** dos selects: cor da loteria
- **Ícone "✏️ Digitar valor..."** no `QuantidadeSelector` (`text-primary`): cor da loteria

### Não-objetivos
- **Não** mexer em `MainLayout` / header superior (continua neutro do app)
- **Não** alterar `ResultadosSheet` / `ResultadosSheetMegaSena` (já têm sua própria identidade — bolinhas verdes Mega, etc.)
- **Não** criar tokens novos em `index.css` — reaproveitar os já existentes (`--megasena-primary`, palette Lotofácil)
- **Não** mexer no badge de uso "30/dia" (mantém neutro `bg-background border-border`)

### Arquivos tocados
| Ação | Arquivo |
|---|---|
| Criar | `src/components/gerador-estudo/GeradorTheme.tsx` (~25 LOC) |
| Editar | `src/pages/lotofacil/GeradorEstudo.tsx` (envolver children com `<GeradorTheme loteria={loteria}>`) |

### Garantias
- **Pronto para Quina/Dupla**: basta adicionar a entrada no objeto `THEMES` quando essas loterias ganharem gerador-estudo
- **Reversível e isolado**: o tema vive só no escopo do gerador; resto do app intacto
- **Zero duplicação de código**: nenhum componente filho precisa saber qual loteria está ativa

