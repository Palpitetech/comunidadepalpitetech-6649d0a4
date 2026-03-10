

## Plan: Add Foreign Key to `events` table

Single migration to add the missing foreign key constraint linking `events.user_id` to `perfis.id`.

```sql
ALTER TABLE public.events
  ADD CONSTRAINT events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.perfis(id) ON DELETE CASCADE;
```

Uses `ON DELETE CASCADE` so events are automatically cleaned up if a user profile is deleted.

