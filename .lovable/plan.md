

## Adicionar data do próximo concurso em todos os posts (universal)

### Decisão: injeção centralizada no router

A frase do próximo concurso é a mesma para qualquer loteria — só mudam os valores. Em vez de modificar cada engine (Lotofácil, Mega-Sena, futuras), adiciono **um único bloco no `generate-guide-post/index.ts`** que monta e anexa o rodapé universal logo antes de inserir o post no banco.

Vantagem: novas loterias herdam automaticamente sem nenhum código novo.

### Fonte dos dados

Tabela `proximos_concursos` — já existe, já é populada de hora em hora pela edge function `sync-proximos-concursos`, e tem todas as 6 loterias atualizadas:

```text
loteria    | numero_concurso | data_sorteio | premio_estimado
megasena   | 2999            | 2026-04-23   | R$ 70.000.000
lotofacil  | 3668            | 2026-04-23   | R$ 2.000.000
quina      | 7008            | 2026-04-23   | R$ 34.000.000
...
```

### Bloco que será adicionado ao final de todo post

```text
📅 Próximo Concurso
Mega-Sena 2999 • Quinta-feira, 23/04/2026
💰 Prêmio estimado: R$ 70.000.000,00
```

Formato adapta-se à loteria automaticamente porque puxa `loteria_tag`, `numero_concurso`, `data_sorteio` e `premio_estimado` direto do registro.

Se a loteria não tiver registro em `proximos_concursos` (caso raro/transiente), o rodapé é simplesmente omitido — post não quebra.

### Mudanças técnicas (2 arquivos)

**1. `supabase/functions/_shared/guide-post/glossario.ts`** — adicionar helper:

```ts
export function montarRodapeProximoConcurso(
  loteria_tag: string,
  numero_concurso: string | null,
  data_sorteio: string | null,
  premio_estimado: number | null,
): string {
  if (!numero_concurso || !data_sorteio) return "";
  
  const data = new Date(`${data_sorteio}T12:00:00-03:00`);
  const diasSemana = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  const diaSemana = diasSemana[data.getDay()];
  const dataFmt = data.toLocaleDateString("pt-BR");
  
  const premioFmt = premio_estimado != null
    ? premio_estimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;
  
  let bloco = `\n\n📅 Próximo Concurso\n${loteria_tag} ${numero_concurso} • ${diaSemana}, ${dataFmt}`;
  if (premioFmt) bloco += `\n💰 Prêmio estimado: ${premioFmt}`;
  return bloco;
}
```

**2. `supabase/functions/generate-guide-post/index.ts`** — entre o cálculo do `conteudo` (linha ~155) e o insert do post (linha ~177), adicionar:

```ts
// Rodapé universal: dados do próximo concurso (todas as loterias)
const { data: prox } = await supabaseAdmin
  .from("proximos_concursos")
  .select("numero_concurso, data_sorteio, premio_estimado")
  .eq("loteria", loteria)
  .maybeSingle();

if (prox) {
  const rodape = montarRodapeProximoConcurso(
    config.loteria_tag,
    prox.numero_concurso,
    prox.data_sorteio,
    prox.premio_estimado,
  );
  // Anexa sem cortar (limite por engine já foi aplicado; rodapé é informacional)
  conteudo = conteudo + rodape;
}
```

Importar `montarRodapeProximoConcurso` no topo do arquivo.

### Pontos importantes

- **Posição:** rodapé entra **depois** da recomendação ("Como montar seu palpite") e do disclaimer "Loteria envolve sorte" — fica como última informação visível, separado por linha em branco.
- **Limite de caracteres:** o `substring(limiteConteudo)` aplicado pela engine acontece **antes** da injeção do rodapé. O rodapé (~120 chars) é considerado metadata informacional, não parte do conteúdo editorial. Sem risco de cortar análise.
- **Whitelist de números:** validação anti-alucinação roda **antes** da injeção. O número do concurso e prêmio do rodapé não passam pela whitelist (são fatos do banco, não da IA), evitando falso positivo.
- **Posts sem `proximos_concursos` cadastrado:** rodapé omitido silenciosamente. Post continua publicando.

### O que NÃO muda

- Nenhuma engine (Lotofácil/Mega-Sena/futuras) — zero código novo nelas.
- Frontend (`PostDetalhes`, `PostCard`, `Comunidade`) — o rodapé já vem renderizado no `conteudo`.
- Sync de `proximos_concursos` — já roda de hora em hora.
- Posts já existentes — mantêm o conteúdo atual. Só novos posts trazem o rodapé. Se quiser atualizar os de hoje, deleto e regero (ver verificação).
- Whitelist, dedup, fallback — intactos.

### Verificação

1. **Deploy** de `generate-guide-post`.
2. **Lotofácil:** chamar `generate-guide-post` com `{ loteria: "lotofacil", tipo_post: "analise_movimentacao", force: true }` → conferir rodapé "Lotofácil 3668 • Quinta-feira, 23/04/2026 • R$ 2.000.000,00".
3. **Mega-Sena:** chamar `{ loteria: "megasena", tipo_post: "analise_moldura", force: true }` → conferir rodapé "Mega-Sena 2999 • Quinta-feira, 23/04/2026 • R$ 70.000.000,00".
4. **Feed Estudos:** abrir `/comunidade`, alternar Lotofácil ↔ Mega-Sena → posts novos exibem o rodapé como última seção.
5. **Resiliência:** se `proximos_concursos.lotofacil` ficar sem registro temporariamente, post da Lotofácil ainda é gerado (sem rodapé).

### Riscos

| Risco | Mitigação |
|---|---|
| `proximos_concursos` desatualizado | Sync horário cobre. Se vencer, rodapé mostra dado defasado por <1h. |
| Posts antigos sem rodapé | Aceito. Para regerar os de hoje, deleto e disparo `force: true`. |
| Quina/Dupla Sena/Lotomania/Dia de Sorte no futuro | Quando criarmos esses engines, o rodapé entra automaticamente — zero código adicional. |
| Data parsing fuso horário | Uso `T12:00:00-03:00` para forçar BRT e evitar shift de dia. |

