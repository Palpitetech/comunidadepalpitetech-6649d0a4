

## Plano: Botão "Renovado" — cria novo registro mantendo histórico

### Comportamento

Ao clicar em **Renovado** numa linha da tabela:

1. Lê os dados da assinatura atual (`identificacao`, `valor`, `provedor`, `periodo_validade`, `periodo_dias_custom`).
2. Insere um **novo registro** na tabela `assinaturas_operacionais` com:
   - Mesmos campos acima (cópia)
   - `data_inicio = hoje` (CURRENT_DATE)
   - `data_fim` será calculada automaticamente pelo trigger `validate_assinatura_operacional`
3. **NÃO altera o registro antigo** — ele permanece como está e migra naturalmente para o status "Expirado" quando a `data_fim` passar.
4. Exibe toast: *"Assinatura renovada — novo ciclo iniciado em [data]"*.
5. Invalida a query → tabela atualiza automaticamente, mostrando os 2 registros (antigo expirando + novo ativo).

### Visibilidade do botão

Aparece **apenas** quando a assinatura está **expirando ou expirada**:

```ts
const isRenewable =
  status.days !== null && status.days <= 30; // inclui dias negativos (expirado)
```

- ✅ Mostra: 30 dias restantes ou menos, já expirado
- ❌ Esconde: > 30 dias restantes, ou `nd` (sem validade — não há o que renovar)

### Mudanças em `src/pages/admin/AdminAssinaturasOperacionais.tsx`

**1. Import**: adicionar ícone `RotateCw` do `lucide-react`.

**2. Nova função** `handleRenovar(assinatura)`:
```ts
const handleRenovar = async (a: AssinaturaOperacional) => {
  const payload = {
    identificacao: a.identificacao,
    valor: a.valor,
    provedor: a.provedor,
    periodo_validade: a.periodo_validade,
    periodo_dias_custom: a.periodo_dias_custom,
    data_inicio: new Date().toISOString().split("T")[0],
  };
  const { error } = await supabase
    .from("assinaturas_operacionais" as any)
    .insert(payload as any);
  if (error) {
    toast.error("Erro ao renovar: " + error.message);
    return;
  }
  toast.success("Assinatura renovada — novo ciclo iniciado");
  queryClient.invalidateQueries({ queryKey: ["admin-assinaturas-operacionais"] });
};
```

**3. Botão na coluna "Ações"** — adicionar antes do botão de editar, condicional:
```tsx
{status.days !== null && status.days <= 30 && (
  <Button
    size="icon"
    variant="ghost"
    className="h-8 w-8 text-green-600 hover:text-green-700"
    onClick={() => handleRenovar(assinatura)}
    title="Renovar (criar novo ciclo)"
  >
    <RotateCw className="h-3.5 w-3.5" />
  </Button>
)}
```

### Resultado esperado

- Linhas com ≤30 dias ou expiradas mostram um botão verde com ícone de seta circular (`RotateCw`).
- Clique = novo registro criado imediatamente, sem confirmação.
- Histórico preservado: você verá o gasto antigo + o novo lado a lado.
- Card "Custo Mensal" e demais somas se ajustam automaticamente (o registro novo entra como ativo, o antigo eventualmente sai quando expirar).

### Fora de escopo

- Sem migração de banco (estrutura atual já suporta).
- Não altera a função `validate_assinatura_operacional` (ela já recalcula `data_fim` no INSERT).
- Não cria coluna de "renovado a partir de" — se quiser linkar pai→filho no futuro, é outra etapa.

