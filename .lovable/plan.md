

## Remover título duplicado dentro da página Gerador de Estudo

### Diagnóstico
A página `src/pages/lotofacil/GeradorEstudo.tsx` (compartilhada entre Lotofácil e Mega-Sena) exibe o título da página duas vezes:
1. No header superior via `MainLayout pageTitle={tituloPagina}` ✅ manter
2. Logo abaixo, dentro do conteúdo, com ícone `BookOpen` + subtítulo ❌ remover

### Mudança
Remover o bloco que renderiza o ícone + subtítulo dentro do `container-senior`:

```tsx
<div className="flex items-center gap-2 px-1">
  <BookOpen className={`h-5 w-5 ${iconColorClass}`} />
  <h2 className="text-lg font-bold text-foreground">{subtitulo}</h2>
</div>
```

Também remover variáveis e import que ficam órfãos:
- `subtitulo` (variável)
- `iconColorClass` (variável)
- `BookOpen` (do import `lucide-react`)

### Arquivos tocados
| Ação | Arquivo |
|---|---|
| Editar | `src/pages/lotofacil/GeradorEstudo.tsx` (remover bloco do título interno + cleanup) |

### Garantias
- Header superior intacto (continua mostrando "Gerador de Estudo · Lotofácil" / "· Mega-Sena").
- Vale para ambas as loterias automaticamente (componente compartilhado).
- Zero impacto em backend, hooks, ou outros componentes.

