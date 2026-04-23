

## Mensagem IA do Disparo Grupo: do "resumo seco" para "resumo estruturado com vida"

### Contexto

Hoje, em `supabase/functions/group-blast-send/index.ts` (função `generateAIMessage`, linhas 399-475), o slot tipo **`ai`** funciona assim:

1. Pega o último post da comunidade (título + 500 caracteres do conteúdo).
2. Pede para a IA montar 1 gancho + 2 linhas de resumo + CTA fixo + link.
3. Modelo: `gemini-2.5-flash-lite` (rápido e barato, mas raso).

Resultado: mensagens curtas, repetitivas, sem identidade. Parece um teaser genérico — não convida a clicar.

### Objetivo

Mensagem **estruturada, escaneável e com personalidade** — mostra valor real do post antes do clique, mantendo o tamanho ideal pra WhatsApp (até ~600 caracteres / 8-10 linhas).

---

### Novo formato proposto

```text
🔍 [GANCHO — 1 linha forte que prende atenção]

📌 O que tem no post:
• [Bullet 1 — descoberta/dado concreto do conteúdo]
• [Bullet 2 — segundo ponto chave]
• [Bullet 3 — terceiro ponto, opcional se conteúdo curto]

💡 [LINHA DE INSIGHT — 1 frase amarrando os bullets a um benefício prático pro próximo concurso]

Vamos comentar lá na comunidade 👇
[link com UTM]
```

**Por que esse formato funciona:**
- **Gancho com emoji temático** (🔍 análise, 🎯 palpite, 📊 estatística, 🔥 quentes, 👀 alerta, 🎲 cenários — escolhido pela IA conforme `post.tipo`).
- **Bullets escaneáveis**: WhatsApp renderiza `•` nativamente; usuário lê em 3 segundos.
- **Linha de insight**: dá um "porquê" antes do clique — substitui o teaser vazio.
- **CTA mais natural**: "Vamos comentar lá" em vez de "Vamos interagir, deixe seu comentário lá" (menos engessado).

### Mudanças técnicas

**Arquivo único:** `supabase/functions/group-blast-send/index.ts` — só a função `generateAIMessage` (linhas 399-475).

#### 1. Aumentar o contexto enviado à IA
- Hoje: `post.conteudo.slice(0, 500)`.
- Novo: `slice(0, 1500)`. O modelo precisa ver mais do post pra extrair 3 bullets reais em vez de inventar.

#### 2. Trocar modelo de `gemini-2.5-flash-lite` → `google/gemini-3-flash-preview`
- O `flash-lite` é o mais raso da linha; tende a entregar texto chapado.
- O `gemini-3-flash-preview` (default da plataforma) tem melhor síntese e tom, com latência similar e custo equivalente.
- Atualizar também o cálculo de custo no log de `ai_usage_logs` (a tabela aceita `cost_usd: 0` se não houver tabela atualizada — manter neutro).

#### 3. Reescrever o prompt com:
- **System** mais opinativo: "Você cria mensagens que vendem o post, não que resumem. Tom: especialista experiente, direto, sem clichê de marketing."
- **User** com o novo formato + regras claras:
  - Escolher emoji do gancho conforme `post.tipo` (mapa fixo no prompt).
  - 3 bullets se conteúdo ≥ 600 chars; 2 bullets se menor.
  - Cada bullet ≤ 80 caracteres.
  - Linha de insight: começar com verbo ("Aproveite", "Combine", "Use", "Observe").
  - **Proibido**: clichês ("imperdível", "incrível", "não perca"), saudações, emojis fora do gancho/CTA, markdown, asteriscos.
  - **Obrigatório**: penúltima linha exata do CTA, última linha = link puro com UTMs intactos.

#### 4. Validador pós-IA (defesa em profundidade)
Antes de retornar `messageContent`, checar:
- Linha do link existe e termina com `utm_campaign=blast_post` (se faltar, retornar `null` → fallback automático já existente).
- Não contém asteriscos `*` nem `**`.
- Pelo menos 1 bullet `•` está presente.
- Tamanho entre 200 e 900 caracteres.

Se falhar → retorna `null` e o sistema cai no fluxo de "mensagem vazia" já tratado (que pula o slot sem quebrar a fila).

#### 5. Manter compatibilidade
- Assinatura de `generateAIMessage(supabase, apiKey, baseUrl, post)` **não muda**.
- Os 2 pontos de chamada (linhas 234 e 248 — fluxo `palpite→ai_fallback` e `ai`) continuam funcionando sem alteração.
- `ai_usage_logs` continua sendo gravado (apenas com modelo novo).

### Exemplo do antes/depois

**Antes (atual):**
```text
🎯 Análise da Lotofácil quente hoje!

Confira o post com as dezenas mais frequentes do último concurso e veja como aproveitar.

Vamos interagir lá na comunidade, deixe seu comentário lá 👇
https://palpitetech.com.br/comunidade/post/...
```

**Depois (proposto):**
```text
🔥 As dezenas que pararam de sair podem voltar com força no 3668

📌 O que tem no post:
• 5 dezenas em desaceleração com queda de até 4 sorteios
• Efeito ressaca: 70% delas voltam no concurso seguinte
• 12 e 19 são as principais para ficar de olho

💡 Combine 1 ou 2 dessas como apoio nos seus jogos antes do sorteio.

Vamos comentar lá na comunidade 👇
https://palpitetech.com.br/comunidade/post/...
```

### Garantias

- **Sem mudança de schema, sem migration, sem novas envs**.
- **Fallback intacto**: se IA falhar/validar mal, o fluxo de mensagem vazia já implementado evita disparo quebrado.
- **Custo**: mesma ordem de grandeza (gemini-3-flash-preview tem preço equivalente ao 2.5-flash-lite no gateway Lovable — um pouco mais, com qualidade muito superior).
- **Reversível**: 1 função alterada, rollback trivial se o tom não agradar.
- **Configurável depois**: se quiser variar o estilo por config (ex.: "informal vs técnico"), abrimos plano separado para adicionar campo `ai_tone` em `group_blast_configs`.

