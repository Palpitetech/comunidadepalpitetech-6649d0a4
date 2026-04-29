## Contexto

O lead da última falha de "Compra Aprovada" foi:
- **Nome:** Alexandre Nalon
- **Email:** `alexandre_nalon@hotmail.com`
- **Celular:** `33991540838` (WhatsApp retornou `exists: false`)
- **Template falhado:** "Compra aprovada (Grupo VIP Lotofácil)" — `sale_confirmed`
- **Queue ID:** `4962fb83-341e-4762-adc0-d2e8d64a0bfc`

Como o WhatsApp do número não existe, o canal correto de fallback é **email**. O domínio `palpitetech.com.br` já está verificado no Resend e usado pelas funções existentes (`enviar-codigo-email`, `send-subscription-email`).

## Ação proposta

Disparo único, manual, via Resend, reutilizando o padrão visual da função `send-subscription-email` (header, CTA, bloco de suporte, rodapé Palpite Tech).

### Conteúdo do email
- **De:** `Comunidade Palpite Tech <solicitacao@palpitetech.com.br>`
- **Para:** `alexandre_nalon@hotmail.com`
- **Assunto:** `✅ Compra aprovada — Bem-vindo ao Grupo VIP Lotofácil`
- **Corpo:** mensagem de boas-vindas com nome do cliente, confirmação do plano VIP Lotofácil, instruções de acesso ao grupo, link de suporte WhatsApp (51 98185-4281) e rodapé padrão.

### Implementação técnica
1. Script one-off em `/tmp` que chama a Resend API diretamente usando `RESEND_API_KEY` já configurada no projeto (verificada via secrets).
2. O script monta o HTML no mesmo estilo de `send-subscription-email` para manter identidade visual.
3. Não cria edge function nova, não altera código do projeto, não adiciona dependências — é um envio pontual para resolver a falha específica.
4. Após envio, registra o `id` retornado pelo Resend para auditoria.

## O que NÃO faz parte deste plano
- Não cria template de "compra aprovada por email" no banco — foi conversado anteriormente como melhoria opcional, mas o pedido aqui é envio único.
- Não automatiza fallback WhatsApp → Email para futuros casos (pode ser proposto depois como melhoria de resiliência).
- Não marca o perfil com tag `telefone_invalido` (sugestão pendente da auditoria anterior).

## Validação após envio
- Confirmar resposta `200` do Resend com `id` do email.
- Reportar ao usuário o status (entregue ao Resend) e ID para rastreio.
