## Mudanças

### 1. `LoginWizard.tsx` — remover "Esqueci minha senha"
- Substituir o botão `Esqueci minha senha` (linha ~304) por um link "Falar com suporte" abrindo `https://wa.me/5516997175392?text=Olá! Preciso resetar minha senha do Palpite Tech` em nova aba.
- Remover a função `handleForgotPassword` (linhas 130-148) — não é mais usada.
- Remover a etapa/UI de "esqueci senha" se houver tela dedicada.

### 2. `UserDataTab.tsx` (Admin) — reset direto para 12345678
Substituir `handleResetPassword` (linhas 115-191):
- Adicionar `AlertDialog` de confirmação ("Tem certeza? A senha será definida como `12345678`").
- Ao confirmar, chamar a edge function **já existente** `recuperar-senha` com `{ identificador: user.email }` — ela já reseta para `12345678` e envia email com a nova senha.
- Após sucesso: toast "Senha redefinida para 12345678" + opcionalmente disparar WhatsApp para o celular do usuário com a mensagem da nova senha (reaproveitar o trecho de envio Evolution já existente).
- Atualizar texto do card "Senha":
  - Título: "Resetar Senha"
  - Descrição: "Define a senha para `12345678` e notifica o usuário por email/WhatsApp."
  - Botão: "Resetar para 12345678"

### 3. Limpeza
- Remover edge function `admin-generate-recovery-link` (não será mais usada).
- Remover `src/pages/ResetPassword.tsx` e a rota `/reset-password` em `App.tsx` (fluxo de link de recuperação não existe mais).
- Manter `recuperar-senha` (já é a fonte da nova senha 12345678).
- Manter `TrocarSenhaDialog` no perfil (usuário logado ainda pode trocar a própria senha).

## Arquivos afetados
- `src/components/auth/LoginWizard.tsx` (editar)
- `src/components/admin/UserDataTab.tsx` (editar)
- `src/pages/ResetPassword.tsx` (deletar)
- `src/App.tsx` (remover rota)
- `supabase/functions/admin-generate-recovery-link/` (deletar)

## Resultado
- Usuário comum: sem opção self-service de reset → vai pro WhatsApp do suporte.
- Admin: 1 clique → senha vira `12345678` → usuário recebe email + WhatsApp com a nova senha → faz login → troca pela própria depois.
- Sem mais links de recuperação que expiram por pre-fetch de scanner.