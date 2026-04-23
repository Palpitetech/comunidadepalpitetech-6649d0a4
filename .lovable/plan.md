

## Nova página `/palpites-estudos` — Link na Bio

### Conceito
Página **standalone** (sem `MainLayout`, sem header, sem footer, sem bottom nav) — visual de "linktree" próprio da Palpite Tech, usando as cores das loterias por card, tipografia grande e direta, sem carnaval visual.

### Rota
- Adicionar em `src/App.tsx`, na seção de **Rotas Públicas**:
  ```tsx
  <Route path="/palpites-estudos" element={<PalpitesEstudos />} />
  ```
- Sem `ProtectedRoute`, sem `MainLayout` — página totalmente isolada.

### Arquivo novo: `src/pages/PalpitesEstudos.tsx`

**Estrutura visual (top → bottom):**

```text
┌─────────────────────────────────────────────┐  ← 100% largura
│  [▶ Vídeos novos todos os Dias no YouTube]  │  banner clicável
│        (gradient vermelho YouTube)          │  + sombra forte abaixo
└─────────────────────────────────────────────┘
                 ↓ shadow drop ↓

           ╭─────────────────────╮
           │   [Logo Palpite     │   ← header centralizado 80%
           │    Tech]            │
           │                     │
           │  @palpitetech       │
           ╰─────────────────────╯

      ╭───────────────────────────────╮
      │  Gere palpites Exclusivos     │  ← Card 1 (cor neutra/primary)
      │  com nosso gerador inteligente│
      │  A partir de R$ 30,44/mês     │
      ╰───────────────────────────────╯

      ╭───────────────────────────────╮
      │  Receba 15 palpites quentes   │  ← Card 2 (ROXO Lotofácil)
      │  para Lotofácil               │
      │  Apenas R$ 19,00 (único)      │
      ╰───────────────────────────────╯

      ╭───────────────────────────────╮
      │  Receba 15 palpites quentes   │  ← Card 3 (VERDE Mega)
      │  para Mega-Sena               │
      │  Apenas R$ 19,00 (único)      │
      ╰───────────────────────────────╯

      ╭───────────────────────────────╮
      │  Estudos diários              │  ← Card 4 (VERDE Mega, outline)
      │  Mega-Sena                    │
      │  100% de graça                │
      ╰───────────────────────────────╯

      ╭───────────────────────────────╮
      │  Estudos diários              │  ← Card 5 (ROXO Lotofácil, outline)
      │  Lotofácil                    │
      │  100% de graça                │
      ╰───────────────────────────────╯

           Footer minimalista
           © Palpite Tech · CNPJ
```

### Especificações de design

**Container global:**
- `min-h-screen bg-gradient-to-b from-slate-50 to-white`
- Sem header/nav/footer da app

**Banner YouTube (topo, 100% largura):**
- `<a href="https://www.youtube.com/@palpitetech" target="_blank" rel="noopener">` (placeholder — **vou perguntar URL real após aprovação**)
- Background: gradient `from-red-600 to-red-700`
- Ícone Play (lucide `Play`) + texto branco bold "Vídeos novos todos os Dias no YouTube"
- Altura: ~64px, `shadow-[0_20px_40px_-10px_rgba(220,38,38,0.4)]` para o efeito sombra abaixo
- Hover: subtle scale + brightness

**Bloco logo (centralizado, abaixo do banner):**
- Largura 80% (`max-w-md mx-auto`), padding top
- Espaço para logo: `<img src="/logo-palpite-tech.png" alt="Palpite Tech" className="h-20 mx-auto" />` — **placeholder até receber a logo**
- Subtexto pequeno opcional

**Cards de oferta (5 cards, max-w-md mx-auto, w-[80%]):**

Cada card é um `<a target="_blank">` clicável com:
- Padding generoso (`p-6`)
- `rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all`
- 3 linhas de texto: **título grande bold** / **subtítulo médio** / **preço/CTA pequeno bold**
- Largura total do container, empilhados com `space-y-4`

**Identidade por card (cor de borda esquerda 4px + fundo a 4% — padrão "floating box" do projeto):**

| Card | Cor HSL | Estilo |
|---|---|---|
| 1 — Gerador Inteligente | `--primary` (azul app) | `border-l-4 border-primary bg-primary/5` |
| 2 — 15 Palpites Lotofácil | `270 60% 50%` (roxo) | `border-l-4` + `bg-[hsl(270_60%_50%/0.05)]` — preço em roxo |
| 3 — 15 Palpites Mega | `125 70% 40%` (verde) | `border-l-4` + `bg-[hsl(125_70%_40%/0.05)]` — preço em verde |
| 4 — Estudos Mega Grátis | `125 70% 40%` (verde) | mesmo estilo, badge "GRÁTIS" verde |
| 5 — Estudos Lotofácil Grátis | `270 60% 50%` (roxo) | mesmo estilo, badge "GRÁTIS" roxo |

**Tipografia (letras grandes, direto ao ponto):**
- Linha 1 (chamada): `text-xl font-black text-senior-dark`
- Linha 2 (complemento): `text-base font-semibold text-foreground/80`
- Linha 3 (preço): `text-sm font-bold` na cor da loteria

### Links de destino (configuráveis no topo do arquivo)

Como não foram passados os checkouts, deixarei constantes no topo para edição rápida:
```tsx
const LINKS = {
  youtube: "https://www.youtube.com/@palpitetech",
  geradorInteligente: "/planos",          // placeholder
  palpitesLotofacil: "#",                 // placeholder — pedir checkout
  palpitesMega: "#",                      // placeholder — pedir checkout
  estudosMega: "/login",                  // free → cadastro
  estudosLotofacil: "/login",             // free → cadastro
};
```
**Após aprovação do plano**, perguntarei os links reais de checkout dos 2 produtos pagos de R$ 19,00 e o canal do YouTube.

### SEO
- `<Helmet>` com `<title>Palpite Tech · Links</title>` + `<meta name="robots" content="noindex" />` (página de bio não precisa indexar — evita canibalização da home)

### Detalhes técnicos
| Ação | Arquivo |
|---|---|
| Criar | `src/pages/PalpitesEstudos.tsx` (~150 LOC, standalone) |
| Editar | `src/App.tsx` (1 linha: import + 1 `<Route>`) |

### Garantias
- **Desanexada de tudo**: zero `MainLayout`, zero auth, zero context dependencies além do necessário pra renderizar
- **Cores das loterias** aplicadas com sobriedade (border-left 4px + fundo 4% — padrão já estabelecido no projeto)
- **Mobile-first**: 80% de largura no mobile, max-w-md no desktop, centralizado
- **Logo**: deixarei `<img src="/logo-palpite-tech.png" />` apontando para `public/` — você só precisa subir o arquivo da logo nesse caminho (ou me dizer onde está)
- **Sem impacto** em rotas/páginas existentes

