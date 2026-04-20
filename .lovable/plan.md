

## Validar emails de verdade no `receive-lead`

### Como está hoje (só sintaxe)

| Camada | Tem? | O que pega |
|---|---|---|
| Regex formato `a@b.c` | ✅ | `gdfh` (sem `@`) |
| Local part ≥ 4 chars | ✅ | `fd@gmail.com` |
| Domínios descartáveis (lista fixa de 14) | ✅ | `mailinator.com` etc |
| Heurística anti-bot (teclado, consoantes, repetição) | ✅ | `jkhjk`, `gdfh`, `aaa` |
| **MX do domínio existe?** | ❌ | `joao@dominioqueninguem.com` passa |
| **Caixa de email existe?** | ❌ | `inexistente123@gmail.com` passa |
| **Email confirmado pelo dono?** | ❌ | qualquer um pode botar email alheio |

Resultado: bot esperto que escreve `mariasilva@gmail.com` (nome plausível, gmail real) **passa hoje**, conta é criada, magic link é enviado pro Resend, e se a caixa não existir o Resend dá bounce — mas o perfil já está no banco sujando métricas.

### O que vou implementar (3 camadas, da mais barata pra mais forte)

#### Camada 1 — Validação de **MX do domínio** (DNS lookup, grátis, ~50ms)

Antes de criar a conta, uso `Deno.resolveDns(domain, "MX")`. Se o domínio não tem MX, **não aceita correio** → bloqueia.

```ts
async function dominioTemMX(domain: string): Promise<boolean> {
  try {
    const records = await Deno.resolveDns(domain, "MX");
    return records.length > 0;
  } catch {
    return false; // NXDOMAIN ou sem MX
  }
}
```

Pega:
- Domínios inventados (`palpite@xyzabc123.com`)
- Typos óbvios (`joao@gmial.com` → gmial.com não tem MX)
- Domínios descartáveis novos (que ainda não estão na nossa lista)

Não pega: caixa específica que não existe (mas o domínio é real).

#### Camada 2 — Lista expandida de descartáveis + **typos comuns**

Hoje tenho 14 domínios. Vou:
- Subir lista para **~200 domínios descartáveis** (do projeto open-source `disposable-email-domains`, embutido como const)
- Adicionar detecção de **typos de provedores grandes** e sugerir correção:

| Digitado | Sugestão | Ação |
|---|---|---|
| `gmial.com`, `gmai.com`, `gnail.com` | `gmail.com` | Bloqueia + retorna `{sugestao: "gmail.com"}` |
| `hotmial.com`, `hotmai.com` | `hotmail.com` | idem |
| `outloo.com`, `outlok.com` | `outlook.com` | idem |
| `yaho.com`, `yahho.com` | `yahoo.com` | idem |

Mensagem na resposta: `"Você quis dizer joao@gmail.com?"` — landing page pode mostrar.

#### Camada 3 — **Confirmação ativa** via magic link (já existe, só endurecer)

Hoje a conta é criada **antes** do magic link e o usuário ganha trial automático. Vou inverter:

**Novo fluxo:**
1. Lead chega → valida sintaxe + MX + descartáveis (camadas 1 e 2)
2. Cria perfil com tag **`email_pendente`** (sem trial ativo, sem `premium` role)
3. Envia magic link
4. Quando usuário clica e confirma → trigger ou edge function remove `email_pendente`, adiciona `email_verificado`, ativa o trial de 3 dias

**Ganhos:**
- Bot que usar email alheio nunca confirma → fica como `email_pendente` e some das métricas
- Trial só conta a partir da confirmação (justo pro usuário real)
- Bot que usar email inventado (passou MX mas caixa não existe) → Resend bounceia, perfil fica pendente

Existe uma **flag no `/admin/eventos`** já: vou criar event_type `lead_email_confirmado` quando ativar o trial, pra você ver taxa de conversão real.

#### Camada 4 (opcional, **não vou habilitar** por padrão) — **SMTP probe**

Tem APIs grátis (Hunter.io free 25/mês, Abstract API free 100/dia) que fazem SMTP `RCPT TO` e devolvem se a caixa existe. Não vou plugar agora porque:
- Custa secret + cota
- MX + magic link já resolve 95% dos casos
- Dá pra adicionar depois se o spam continuar

Deixo um **TODO comentado** no código pra plugar fácil.

### Mudanças no banco (migration)

```sql
-- Adicionar campo email_verificado no perfis (já existe, só garantir default)
-- Já tem coluna email_verificado boolean. Vou usar.

-- Função pra ativar trial só depois de confirmar email
CREATE OR REPLACE FUNCTION public.ativar_trial_pos_confirmacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  trial_plan_id UUID := 'b3a2a9e3-8e3b-4e3b-8e3b-8e3b8e3b8e3b';
BEGIN
  -- Só ativa se mudou de false → true
  IF OLD.email_verificado IS FALSE AND NEW.email_verificado IS TRUE THEN
    -- Remove tag pendente, adiciona verificado
    NEW.tags := array_remove(NEW.tags, 'email_pendente');
    IF NOT ('email_verificado' = ANY(NEW.tags)) THEN
      NEW.tags := array_append(NEW.tags, 'email_verificado');
    END IF;
    -- Ativa trial se ainda não ativou
    IF NEW.status_assinatura IS NULL OR NEW.status_assinatura != 'ativa' THEN
      NEW.plan_id := trial_plan_id;
      NEW.status_assinatura := 'ativa';
      NEW.validade_assinatura := now() + interval '3 days';
      NEW.trial_used := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ativar_trial_pos_confirmacao
BEFORE UPDATE ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.ativar_trial_pos_confirmacao();
```

### Mudanças no código

| Arquivo | Mudança |
|---|---|
| `supabase/functions/receive-lead/index.ts` | + `dominioTemMX()`, lista expandida de descartáveis, detecção de typos, criar perfil com `tag: email_pendente` em vez de trial direto |
| `supabase/functions/receive-lead/disposable-domains.ts` | Novo arquivo com lista de ~200 domínios |
| `src/pages/AtivarConta.tsx` | Sem mudança (já marca `email_verificado = true` ao processar token) |

### Mensagens de erro novas

| Erro | Mensagem |
|---|---|
| MX inválido | `"Domínio do email não recebe correio. Verifique o endereço."` |
| Typo detectado | `"Você quis dizer joao@gmail.com?"` (com campo `sugestao`) |
| Descartável (nova lista) | `"Use um email pessoal permanente"` |

### Logging em `system_events`

Adiciono novos motivos que aparecem em `/admin/eventos`:
- `mx_inexistente` — domínio sem MX
- `typo_detectado` — sugestão oferecida
- `email_pendente_criado` — conta criada aguardando confirmação
- `email_confirmado_trial_ativado` — usuário clicou no link

Você consegue ver a taxa real: quantos leads chegam → quantos confirmam.

### Fora de escopo

- Não plugo Hunter.io / Abstract API (camada 4)
- Não mexo em `RegisterWizard` (já tem OTP que é mais forte que magic link)
- Não invalido leads pendentes antigos (só daqui pra frente)
- Não mexo no fluxo Kirvano (compra confirma email automaticamente)
- Não mudo aparência da landing page externa (só o JSON de resposta)

### Resultado esperado

- `joao@gmial.com` → **400** com `{sugestao: "gmail.com"}`
- `teste@dominioinventado.xyz` → **400** "Domínio não recebe correio"
- `mariasilva@gmail.com` (caixa real) → cria pendente → email chega → clica → trial ativa
- `inexistente@gmail.com` (caixa fake mas gmail real) → cria pendente → Resend bounceia → fica pendente eterno → não suja métrica de "verificados"

