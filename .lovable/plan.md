## Objetivo

Permitir trocar a foto de perfil do WhatsApp de **todas as instâncias cadastradas** (online), usando a Evolution API. Hoje o módulo `/admin/whatsapp` → aba **Instâncias** gerencia conexão, proxy, QR code, mas **não tem ação de foto de perfil**.

## Como vai funcionar

Na aba **Instâncias** será adicionado um novo card no topo: **"Foto de perfil das instâncias"**.

1. Você faz upload de uma imagem (JPG/PNG, máx. 2 MB) ou cola uma URL pública.
2. Pré-visualização da foto.
3. Botão **"Aplicar em todas as instâncias online"** (com confirmação).
4. Opcional: botão **"Aplicar só nesta"** dentro de cada card de instância individual (via menu de ações).
5. Resultado mostrado em toast: `X de Y instâncias atualizadas`, com lista de erros se houver.

A imagem enviada é guardada no bucket de storage `whatsapp-assets` (criado se não existir) e a URL pública é enviada para a Evolution API.

## Como fica tecnicamente

### 1. Bucket de storage
- Criar bucket público `whatsapp-assets` (somente admins podem fazer upload; leitura pública).
- Política: `INSERT/UPDATE/DELETE` apenas para `has_role(auth.uid(),'admin')`.

### 2. Edge Function `evolution-proxy` — nova action
Adicionar em `supabase/functions/evolution-proxy/index.ts`:

```ts
case "updateProfilePicture": {
  // PUT /chat/updateProfilePicture/{instanceName}  body: { picture: <url> }
  return await callEvolution(`/chat/updateProfilePicture/${instanceName}`, "PUT", { picture });
}
```

Aceita `{ action: "updateProfilePicture", instanceName, picture }`.

### 3. Novo componente `ProfilePictureCard.tsx`
Em `src/components/admin/whatsapp/`:
- Input file + preview + input URL alternativo.
- Faz upload para `whatsapp-assets/profile-pictures/{timestamp}.jpg`, pega `getPublicUrl`.
- Lista instâncias com `status = 'online'` da tabela `whatsapp_instances`.
- Loop sequencial chamando `evolution-proxy` com `updateProfilePicture` por instância (delay de ~1.5s entre chamadas para evitar rate limit).
- Acumula sucessos/falhas e mostra resumo.

### 4. Integração na `InstanciasTab.tsx`
- Importar e renderizar `<ProfilePictureCard />` no topo (acima do botão "Adicionar instância").
- Adicionar item "Trocar foto" no menu de ações de cada instância (chama mesma lógica para 1 só).

## Observações importantes

- **Apenas instâncias com status `online`** (conectadas) aceitam troca de foto. Instâncias offline são puladas automaticamente com mensagem clara.
- A foto pode demorar alguns segundos para refletir no app WhatsApp do celular (cache do dispositivo).
- A Evolution API aceita URL pública **ou** base64 — vou usar URL pública (mais leve para o request).
- Não armazena a foto na tabela de instâncias (a "foto atual" fica só no WhatsApp).

## Arquivos alterados

- `supabase/functions/evolution-proxy/index.ts` — nova action `updateProfilePicture`
- `src/components/admin/whatsapp/ProfilePictureCard.tsx` — **novo**
- `src/components/admin/whatsapp/InstanciasTab.tsx` — render do card + item de menu por instância
- Migração SQL — bucket `whatsapp-assets` + policies
