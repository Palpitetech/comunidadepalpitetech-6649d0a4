## Aula 09 — Slideshow de 8 imagens

Aula 09 será composta apenas pelas 8 imagens enviadas, em ordem (01 → 08), cada uma ocupando um slide full-bleed (mesmo padrão da capa atual usando `Mega30Capa`).

### Passos

1. **Salvar as 8 imagens** em `src/assets/gravacao/megasena-30anos/aula09/`:
   - `slide-01.jpg` … `slide-08.jpg` (copiadas dos uploads `01.jpg` … `8.jpg`)

2. **Editar `src/pages/admin/gravacao/GravacaoMega30Anos.tsx`**:
   - Importar as 8 imagens
   - Adicionar `"09"` na lista de aulas habilitadas (guard no topo)
   - Adicionar bloco `if (aulaId === "09")` renderizando um `<Mega30Shell capaIndices={[0,1,2,3,4,5,6,7]}>` com 8 `<Mega30Capa>` (todos full-bleed, sem background nem header)

### Fora de escopo
- Sem novos componentes de slide, sem helpers, sem header, sem hooks, sem alterações de backend.
- Sem alterar capa do hub público.
