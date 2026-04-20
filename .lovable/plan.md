

## Padronizar celular obrigatório nos dois fluxos de cadastro

### Estado atual

| Fluxo | Campo coletado | Validação formato | Onde salva no perfil | Problema |
|---|---|---|---|---|
| **Webhook** (`receive-lead`) | `celular` | ✅ Forte (DDD, 9º dígito, 10-11 dígitos, anti-bot) | `perfis.celular` | Nenhum — OK |
| **Cadastro manual** (`LoginWizard` etapa `cadastro-whatsapp`) | `whatsapp` | ❌ Só `!whatsapp.trim()` | `perfis.whatsapp` (celular fica vazio!) | Perfil criado sem `celular` → `RequireCelularModal` abre logo após cadastro pedindo de novo |

### O que vou mudar

#### 1. `LoginWizard.tsx` — etapa `cadastro-whatsapp`

- Renomear a etapa para `cadastro-celular` (mais claro — é o número que vira WhatsApp também)
- **Adicionar máscara automática** `(00) 00000-0000` no input
- **Validar formato** antes de avançar:
  - 10-11 dígitos
  - DDD válido (11-99)
  - Se 11 dígitos → terceiro dígito obrigatoriamente `9`
  - Bloquear sequências óbvias (`11111111111`, `12345678901`)
- Mensagem de erro inline se inválido: `"Celular inválido. Use formato (DDD) 9XXXX-XXXX"`

#### 2. `LoginWizard.tsx` — `handleVerifyCode`

Após verificar OTP do cadastro, salvar **o mesmo número em `celular` E `whatsapp`** (normalizado para só dígitos com prefixo `55`):

```ts
const digits = whatsapp.replace(/\D/g, "");
const normalized = digits.length === 11 ? `55${digits}` : `55${digits}`;
await updateProfile({ 
  nome: nome.trim(), 
  celular: normalized,
  whatsapp: normalized
});
```

Resultado: `RequireCelularModal` não abre mais após cadastro novo, e `celular`/`whatsapp` ficam consistentes.

#### 3. Reaproveitar lógica de validação

Criar helper local `validateCelularBR(value: string)` no `LoginWizard.tsx` espelhando a regra do `receive-lead/index.ts` (mesmo conjunto de checks). **Não vou criar arquivo compartilhado** porque um é Deno (edge) e outro é browser — mantenho a lógica duplicada mas idêntica.

#### 4. UX da etapa cadastro-celular

- Título: "Confirme seu celular"
- Descrição: "Vamos enviar resultados e códigos de acesso pelo WhatsApp."
- Input formata automaticamente enquanto digita
- Botão fica desabilitado se não passar na validação
- Texto de erro embaixo do input em vermelho

### Fora de escopo

- Não mexo no webhook (já está perfeito)
- Não mexo no `RequireCelularModal` (continua existindo pra leads vindos do webhook que confirmam email mas têm celular ausente em algum edge case)
- Não migro perfis antigos sem celular (o modal cuida)
- Não mexo no `AlterarCelularDialog` (fluxo de troca já funciona)

### Resultado esperado

| Cenário | Antes | Depois |
|---|---|---|
| Cadastro manual com `(11) 98765-4321` | `whatsapp` salvo, `celular` vazio → modal aparece | Ambos salvos como `5511987654321`, sem modal |
| Cadastro manual com `12345` | Aceitava, salvava lixo | Bloqueia: "Celular inválido" |
| Cadastro manual com `(11) 88765-4321` (sem 9) | Aceitava | Bloqueia: "Celular inválido" |
| Webhook | OK | OK (sem mudanças) |

