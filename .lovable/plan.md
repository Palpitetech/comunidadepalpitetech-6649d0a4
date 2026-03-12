

## Plano: Otimizar tela Usuários com campos copiáveis e reset de senha via WhatsApp

### O que muda

**1. Campos copiáveis no UserDataTab (Email e Celular)**

Adicionar o padrão `CopyableField` do AdminVendas nos campos Email, WhatsApp e Celular. Ao lado de cada campo de leitura, um botao de copiar com ícone `Copy` que aparece no hover, copiando o valor para a clipboard com toast de confirmação.

- Email: campo editável mantém, mas adicionar botão de cópia ao lado
- WhatsApp: idem
- Celular (somente leitura): adicionar botão de cópia ao lado

**2. Botão "Gerar Nova Senha" no UserDataTab**

Substituir o botão atual "Enviar Email de Redefinição de Senha" (que usa `resetPasswordForEmail`) por um botão "Gerar Nova Senha (123456)" que:

1. Chama a Edge Function `recuperar-senha` passando o email do usuário como `identificador`
2. A função já redefine a senha para `123456` e envia email automaticamente via Resend
3. Após sucesso, envia mensagem WhatsApp automática via `evolution-proxy` para o celular/whatsapp do usuário com o texto:

```
Olá [NOME], tudo bem? Estou passando para confirmar que deu tudo certo com sua nova senha. Faça seu login com as credenciais abaixo:

[EMAIL]
Senha: 123456

https://comunidadepalpitetech.lovable.app/login

Recomendo que troque sua senha assim que acessar o sistema.
```

**3. Lógica do envio WhatsApp**

- Buscar uma instância online do `whatsapp_instances`
- Formatar o número do destinatário (celular ou whatsapp do perfil)
- Chamar `evolution-proxy` com action `sendText` incluindo o número formatado com `@s.whatsapp.net`
- Se não houver instância online ou número, enviar apenas o email (já feito pela edge function) e informar no toast

### Arquivos alterados

- `src/components/admin/UserDataTab.tsx` — Adicionar `CopyableField`, trocar botão de reset, adicionar lógica de envio WhatsApp pós-reset

### O que NÃO muda

- Edge Function `recuperar-senha` (já faz tudo: reset para 123456 + email)
- Demais tabs do UserDetailSheet
- AdminUsuarios.tsx

