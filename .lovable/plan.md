

## Adicionar colunas Verificado/Ativo + remover usuários sem celular

### Parte 1 — Novas colunas na listagem `/admin/usuarios`

**Coluna "Verificado":**
- ✅ verde se `email_verificado = true`
- ⚠️ âmbar se `email_verificado = false`

**Coluna "Ativo":**
- ✅ verde "Ativo" se tem plano pago ativo (`isPaidActive(u)` — slug pago + `status_assinatura = ativa` + dentro da validade)
- ⚪ cinza "—" se não tem plano pago ativo (free, trial, vencido, cancelado)

#### Desktop (tabela)
Adicionar 2 colunas entre "Plano" e "Origem":

```
| Usuário | Plano | Verificado | Ativo | Origem | Cadastro |
```

Cada célula renderiza um ícone + label compacta (`CheckCircle2` / `AlertCircle` do lucide).

#### Mobile (cards)
Adicionar 2 micro-badges na linha de status (junto com plano/bloqueado):
- `✓ Verificado` ou `⚠ Não verificado`
- `● Ativo` (só aparece se pago ativo, pra não poluir)

### Parte 2 — Limpeza de usuários sem celular

Como celular agora é obrigatório nos 2 fluxos de cadastro, perfis antigos sem celular válido devem ser removidos.

**Critério de "sem celular":**
- `celular IS NULL` OU
- `celular = ''` OU
- celular não-normalizado (não começa com `55`) OU
- celular com menos de 12 dígitos OU mais de 13

**Proteções (NÃO deletar):**
- Admins (têm role `admin` em `user_roles`)
- Bots/sistema (`is_bot = true`)
- Usuários com plano pago ativo (`status_assinatura = 'ativa'` E slug pago) — segurança extra: nunca deletar quem está pagando, mesmo sem celular

**Como executar:**

Criar migração SQL que:
1. Lista quantos usuários se enquadram (preview no log)
2. Chama `admin-delete-user` em loop? Não — vai por SQL direto via cascade já configurado em `perfis` → `auth.users` (ON DELETE CASCADE existe)
3. Deleta de `auth.users` (cascateia tudo: perfis, palpites, etc.)

```sql
-- Preview
SELECT COUNT(*) FROM perfis p
WHERE p.is_bot = false
  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')
  AND NOT (p.status_assinatura = 'ativa' AND p.plano_id IN (SELECT id FROM planos WHERE slug IN ('mensal','anual','plano-anual-vip','semestral','grupo')))
  AND (
    p.celular IS NULL 
    OR p.celular = ''
    OR length(regexp_replace(p.celular, '\D', '', 'g')) < 12
    OR length(regexp_replace(p.celular, '\D', '', 'g')) > 13
    OR regexp_replace(p.celular, '\D', '', 'g') NOT LIKE '55%'
  );

-- Delete via auth.users (cascade)
DELETE FROM auth.users WHERE id IN ( <mesmo SELECT> );
```

A migração mostra a contagem antes de executar e o usuário aprova.

### Parte 3 — Atualizar o subfiltro "Celular OK"

Já existe e está correto. Após a limpeza, o contador ficará igual ao total — útil pra confirmar que a limpeza funcionou.

### Fora de escopo

- Não mexo em validação de cadastro (já obrigatório)
- Não mexo no `RequireCelularModal` (continua disponível pra casos edge)
- Não mexo em `UserDetailSheet` (já mostra celular)
- Não mexo no schema do banco

### Arquivos editados

| Arquivo | Mudança |
|---|---|
| `src/pages/admin/AdminUsuarios.tsx` | +2 colunas (Verificado, Ativo) na tabela desktop e cards mobile |
| **Migração SQL nova** | Deleta usuários sem celular válido (com proteções pra admins/bots/pagantes) |

### Resultado esperado

- Admin vê de relance quem verificou email e quem tem assinatura ativa
- Base limpa: 100% dos usuários têm celular válido normalizado
- Subfiltro `Celular OK` passa a refletir 100% dos cadastros

