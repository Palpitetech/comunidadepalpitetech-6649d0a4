

## Plano: Otimizar Tela do Gerador de Palpites

### Resumo das Alterações

Vou remover todas as referências à IA, redesenhar a tela inicial para ser mais limpa, exibir os jogos em formato de lista compacta e adicionar um botão de copiar.

---

### 1. Remover Referências à IA

**Arquivo:** `supabase/functions/generate-palpites/index.ts`
- Alterar o system prompt de "Você é o PT Analista" para algo neutro como "Você é um especialista em análise estatística"
- Remover menções a "PT Analista" ou "IA"

---

### 2. Otimizar Tela Inicial

**Arquivo:** `src/pages/Gerador.tsx`
- Simplificar o header removendo o card wrapper desnecessário
- Manter o status de uso, seletor de quantidade e botão de forma mais compacta
- Remover ícone "Sparkles" que pode dar alusão a algo mágico/IA

---

### 3. Reformular Visualização da Estratégia

**Arquivo:** `src/components/gerador/EstrategiaCard.tsx`
- Usar um componente Collapsible para mostrar/ocultar a estratégia
- Título simplificado: "Metodologia Aplicada"
- Visual mais discreto com opção de expandir

---

### 4. Jogos em Lista Compacta

**Novo componente:** `src/components/gerador/JogoLista.tsx`
- Exibir cada jogo em no máximo 2 linhas
- Formato: `Jogo 1: 01-02-03-04-05-06-07-08-09-10-11-12-13-14-15`
- Visual limpo com badges para estatísticas opcionais

**Arquivo:** `src/pages/Gerador.tsx`
- Substituir o grid de `JogoCard` pelo novo `JogoLista`
- Agrupar todos os jogos em um único card

---

### 5. Botão de Copiar Palpites

**Arquivo:** `src/pages/Gerador.tsx`
- Adicionar botão "Copiar Palpites" na área de resultados
- Ao clicar, copia todos os jogos no formato:
  ```
  Jogo 1: 01-02-03-04-05-06-07-08-09-10-11-12-13-14-15
  Jogo 2: 01-03-05-07-09-11-13-15-17-19-21-22-23-24-25
  ```
- Mostrar toast de confirmação "Palpites copiados!"

---

### Detalhes Técnicos

**Dependências utilizadas:**
- `lucide-react`: ícones Copy, Check, ChevronDown
- `@radix-ui/react-collapsible`: para estratégia expansível
- `sonner` ou `use-toast`: para notificações

**Componentes afetados:**
```text
src/pages/Gerador.tsx
src/components/gerador/EstrategiaCard.tsx
src/components/gerador/JogoLista.tsx (novo)
supabase/functions/generate-palpites/index.ts
```

**Estrutura do novo JogoLista:**
```text
+--------------------------------------------------+
| Seus Palpites                      [Copiar]      |
+--------------------------------------------------+
| Jogo 1: 01-02-03-04-05-06-07-08-09-10-11-12-13   |
|         -14-15                                    |
| Jogo 2: 02-04-06-08-10-12-14-16-18-20-21-22-23   |
|         -24-25                                    |
+--------------------------------------------------+
```

