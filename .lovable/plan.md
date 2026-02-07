
# Remoção de Avatares dos Bots

## Situação Atual

Foram identificados **6 bots** no sistema:

| Bot | Avatar Atual |
|-----|-------------|
| Ana | DiceBear (precisa remover) |
| Prof. Mário | DiceBear (precisa remover) |
| Sr. Zé | DiceBear (precisa remover) |
| Augusto Honorato | Sem avatar |
| Bot Teste | Sem avatar |
| Augusto Angelis | Sem avatar |

## Ação a Executar

Limpar o campo `avatar_url` para `NULL` nos 3 bots que têm avatares DiceBear:
- Ana
- Prof. Mário  
- Sr. Zé

## Próximos Passos Após Aprovação

1. Executar UPDATE na tabela `perfis` definindo `avatar_url = NULL` para os 3 bots
2. Os bots ficarão sem foto, exibindo o fallback padrão (ícone de usuário)
3. Você poderá fazer upload de novas fotos em `/admin/bots` clicando em cada bot

---

## Detalhes Técnicos

```sql
UPDATE perfis
SET avatar_url = NULL
WHERE id IN (
  '98d31554-c19a-4f0b-8913-d3f3a9c88ec8',  -- Ana
  '4e4700b1-7313-47bd-8b09-cff448b53dae',  -- Prof. Mário
  'b2b3b833-9713-4275-ab90-2eb6c890f4f6'   -- Sr. Zé
);
```
