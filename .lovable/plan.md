

## Plan: Add Events page to Admin panel

### 1. Create `src/pages/admin/AdminEventos.tsx`
A new admin page following the same patterns as `AdminVendas.tsx` and `AdminUsuarios.tsx`:
- Fetch from `events` table joined with `perfis` (for user name/avatar)
- Filter tabs by event_type (todos, novo_cadastro, nova_venda, pix_gerado, etc.)
- Search by user name/email
- Pagination (20 per page)
- Mobile: card list with event icon, user info, timestamp
- Desktop: table with columns (User, Event Type, Metadata preview, Date)
- Click row to open detail sheet showing full metadata JSON

### 2. Register route in `src/App.tsx`
Add at line ~151:
```tsx
<Route path="/admin/eventos" element={<AdminRoute><AdminEventos /></AdminRoute>} />
```

### 3. Add to AdminIndex modules list
Add entry to `ADMIN_MODULES` array:
```tsx
{ to: "/admin/eventos", icon: Activity, label: "Eventos", desc: "Timeline de eventos por lead" }
```
(`Activity` icon is already imported)

### 4. Add to Desktop Header admin dropdown
Add a new `DropdownMenuItem` linking to `/admin/eventos` with `Activity` icon after the "Vendas Kirvano" item (~line 415).

### 5. Add to Mobile Menu admin section
Add a new `Link` to `/admin/eventos` in the admin nav block (~line 536) following the same pattern.

### Files changed
- `src/pages/admin/AdminEventos.tsx` (new)
- `src/App.tsx` (add route + import)
- `src/pages/admin/AdminIndex.tsx` (add module card)
- `src/components/layout/DesktopHeader.tsx` (add dropdown item)
- `src/components/layout/MobileMenuSheet.tsx` (add link)

