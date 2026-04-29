## Objetivo

Reescrever a mensagem principal + 9 variações do template **"Lead pré-checkout - Sala Secreta Lotofácil"** (id `319592b0-...`) para o novo contexto fornecido: anúncio do estudo/palpites pós-sorteio, oferta de R$ 19,00 com garantia de 7 dias, e CTA secundário para a sala secreta gratuita.

## Novo contexto (base das 10 mensagens)

> Olá NOME, em breve enviaremos o novo estudo e os novos palpites quentes após o sorteio. É sério — fazemos estudos de todos os concursos, você vai se surpreender. Não fique de fora: garanta **15 palpites quentes diários + estudos completos** de todos os concursos da Lotofácil. Apenas **R$ 19,00**, com **reembolso em 7 dias** se não estiver contente.
>
> Gere um novo PIX e acesse: [https://pay.kirvano.com/19990908-ca9b-4df1-a0df-e2690927490b](https://pay.kirvano.com/19990908-ca9b-4df1-a0df-e2690927490b)
>
> Ou, se quiser receber só os estudos de graça (sem os palpites), entre na sala secreta Lotofácil sem custo: [https://www.palpitetech.com.br/g/grupo-vip-assinantes](https://www.palpitetech.com.br/g/grupo-vip-assinantes)

## O que muda

- **Mantém** variável `{{nome}}` em todas as 10 mensagens.
- **Mantém** o link Kirvano com os mesmos UTMs já existentes (`utm_content=v1_main` a `v10`) por variante.
- **Adiciona** o segundo link da sala secreta gratuita em todas as variantes.
- **Remove** a narrativa antiga de "reserva de vaga / comprovante / 30 minutos".
- **Aplica** o tom Palpite Tech: sem acentos, leves erros humanos (vc, tbm, agr, pra, ta), 1–2 emojis no máx., variar abertura/ordem/fechamento entre as 10.

## Como será feito

1. Update no registro principal `message_templates.content` (mensagem v1_main).
2. Update em cada uma das 9 linhas de `message_template_variants` (positions 2–10), preservando `id`, `position`, `is_active` e o `utm_content=vN` correspondente em cada link Kirvano.
3. As 10 mensagens serão escritas manualmente (não via IA) para garantir fidelidade ao novo contexto, com variações de abertura, ordem das frases (oferta primeiro vs. CTA primeiro vs. garantia primeiro), e fechamentos distintos.

## Exemplo de variação (v1_main, ilustrativo)

```
Olá {{nome}} 🍀 *Chegou* seus 15 papites quentes para Lotofácil.

Em breve vamos liberar o novo estudo e os palpites quentes do próximo sorteio da Lotofacil. É serio, fazemos estudo de TODOS os concursos, vc vai se surpreender.

Garante já: *15 palpites quentes por dia* + estudos completos da Lotofacil por apenas R$ 19,00. E se não curtir, pede reembolso em 7 dias, sem stress.

Gera o PIX e acessa agr:
👉 https://pay.kirvano.com/19990908-ca9b-4df1-a0df-e2690927490b?utm_source=whatsapp&utm_medium=recuperacao_carrinho&utm_campaign=sala_secreta_lotofacil&utm_content=v1_main

Ou, se preferir só os estudos de graça (sem os palpites), entra na sala secreta Lotofacil, é sem custo:
👉 https://www.palpitetech.com.br/g/grupo-vip-assinantes
```

As outras 9 seguirão o mesmo conteúdo em estilos variados (mais curtas, mais informais, focadas na garantia, focadas no CTA gratuito primeiro etc.). Na primeira linha sempre adicionar algo induzindo o clique que chegou os 15 palpites quentes e deixe em destauqe palavras importantes

## Importante

- **Não** vou disparar mensagens nem corrigir as tags dos 13 leads ainda — isso fica para a próxima etapa, conforme solicitado.
- Após o update, basta abrir o template no admin e revisar antes de ativar o disparo.

Pronto para aplicar os updates nas 10 mensagens?