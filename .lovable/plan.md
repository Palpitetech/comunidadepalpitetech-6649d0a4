## Parte 1 — Estrutura e Navegação da aba "Monitor Grupos"

Objetivo: criar a aba vazia (4 seções placeholder) e registrá-la entre "Disparo Grupo" e "Aquecimento" no painel `/admin/whatsapp`. Sem lógica de dados ainda.

### Arquivos a criar

**1. `src/components/admin/whatsapp/MonitorGruposTab.tsx`** (novo)
- Componente `export default function MonitorGruposTab()`
- Cabeçalho:
  - Título: "Monitor Grupos"
  - Subtítulo (text-sm text-muted-foreground): "Saúde do pipeline de disparo em grupo"
- 4 cards placeholder usando `Card` / `CardHeader` / `CardTitle` / `CardContent` de `@/components/ui/card`, cada um com título e corpo "Em construção..." (text-muted-foreground):
  1. Pipeline Health
  2. Auditoria do Prepare
  3. Instâncias × Grupos
  4. Histórico Detalhado
- Layout: `space-y-4`, seguindo padrão do `DisparoGrupoTab`.

**2. `src/components/admin/whatsapp/monitor/index.ts`** (novo, vazio)
- Arquivo praticamente vazio (apenas um comentário `// Subcomponentes do Monitor Grupos — preenchidos nas próximas partes`) para preparar a pasta sem quebrar build.

### Arquivos a editar

**3. `src/components/admin/whatsapp/WhatsAppSubSidebar.tsx`**
- Importar `Activity` de `lucide-react` (adicionar ao import existente).
- No array `sections[0].items` (WhatsApp), inserir entre `disparo-grupo` e `aquecimento`:
  ```ts
  { value: "monitor-grupos", label: "Monitor Grupos", icon: Activity },
  ```

**4. `src/pages/admin/AdminWhatsApp.tsx`**
- Importar: `import MonitorGruposTab from "@/components/admin/whatsapp/MonitorGruposTab";`
- Adicionar entrada em `TAB_TITLES`: `"monitor-grupos": "Monitor Grupos",` (entre `disparo-grupo` e `aquecimento`).
- No bloco de renderização condicional, adicionar entre `disparo-grupo` e `aquecimento`:
  ```tsx
  {activeTab === "monitor-grupos" && <MonitorGruposTab />}
  ```

### Verificação (Etapa 1.4)
- Aba "Monitor Grupos" com ícone Activity aparece na sidebar desktop e nas pills mobile, posicionada entre "Disparo Grupo" e "Aquecimento".
- Clicar renderiza header + 4 cards "Em construção...".
- Demais abas (Instâncias, Logs, Disparo Grupo, etc.) seguem funcionando.

### Limpeza (Etapa 1.5)
- Sem imports não utilizados em `MonitorGruposTab.tsx`.
- `MonitorGruposTab` exportado como `default`.
- Sem entradas duplicadas em `whatsappTabs`, `TAB_TITLES` ou nos `&&` de render.

### Não faz parte desta parte
- Nenhuma chamada a Supabase/Edge Function.
- Nenhum hook novo, nenhum componente em `monitor/` além do `index.ts` vazio. Isso vem nas Partes 2–5.
