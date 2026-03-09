

# Sistema de Convites (Referral)

## Visão Geral
Criar um sistema onde qualquer usuário autenticado pode gerar um link de convite único e acompanhar quantas pessoas se cadastraram através dele.

## Arquitetura Proposta

### 1. Banco de Dados

**Nova tabela `convites`:**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| referrer_id | uuid | Quem convidou (FK → perfis.id) |
| referred_id | uuid | Quem foi convidado (FK → perfis.id, único) |
| created_at | timestamp | Data do cadastro via convite |

**Alteração na tabela `perfis`:**
- Adicionar coluna `referral_code` (varchar, único) — código curto como "ABC123" para URLs amigáveis

### 2. Fluxo do Convite

```text
┌─────────────────────────────────────────────────────────────┐
│  Usuário A acessa /convites                                 │
│  → Vê seu código: comunidadepalpitetech.lovable.app?ref=ABC123  │
│  → Compartilha no WhatsApp/Redes                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Visitante B abre o link                                    │
│  → ref=ABC123 é salvo no localStorage                       │
│  → Redireciona para /login (modo cadastro)                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Visitante B completa cadastro                              │
│  → Trigger no banco registra convite (referrer_id → A)      │
│  → Usuário A vê +1 convite na página /convites              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Componentes Frontend

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Convites.tsx` | Página principal com link de convite + lista de convidados |
| `src/hooks/useConvites.ts` | Hook para buscar/gerar código e listar convidados |
| `src/components/convites/ConviteCard.tsx` | Card com o link copiável |
| `src/components/convites/ConvidadosList.tsx` | Lista de pessoas que se cadastraram |

### 4. Modificações no Cadastro

- `RegisterWizard.tsx`: Ler `ref` do localStorage após cadastro
- `useAuth.ts`: Passar `referral_code` ao criar perfil
- Trigger no banco: Após INSERT em `perfis`, verificar se há referral_code e criar registro em `convites`

## Detalhes Técnicos

### Geração do Código
- Código de 6 caracteres alfanuméricos (ex: "XK7M2P")
- Gerado automaticamente no primeiro acesso à página /convites
- Único por usuário

### RLS (Segurança)
- Usuários só veem seus próprios convites
- Service role pode inserir (para o trigger funcionar)

### Custo de Armazenamento
- Mínimo: ~100 bytes por convite
- Sem custo adicional de IA ou API externa

## Arquivos a Criar/Editar

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/Convites.tsx` |
| Criar | `src/hooks/useConvites.ts` |
| Criar | `src/components/convites/ConviteCard.tsx` |
| Criar | `src/components/convites/ConvidadosList.tsx` |
| Editar | `src/App.tsx` (nova rota /convites) |
| Editar | `src/components/auth/RegisterWizard.tsx` (capturar ref) |
| Editar | `src/hooks/useAuth.ts` (passar referral ao signUp) |
| Migração | Tabela `convites` + coluna `referral_code` em `perfis` + trigger |

