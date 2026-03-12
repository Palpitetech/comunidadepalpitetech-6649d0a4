
-- Add slot_id to group_blast_logs
ALTER TABLE public.group_blast_logs ADD COLUMN IF NOT EXISTS slot_id text;

-- Add slots JSONB to group_blast_configs
ALTER TABLE public.group_blast_configs ADD COLUMN IF NOT EXISTS slots jsonb DEFAULT '[]';

-- Drop old columns from group_blast_configs
ALTER TABLE public.group_blast_configs
  DROP COLUMN IF EXISTS message_content,
  DROP COLUMN IF EXISTS schedule_times,
  DROP COLUMN IF EXISTS last_scheduled_index,
  DROP COLUMN IF EXISTS messages_per_day;

-- Drop the old validation trigger
DROP TRIGGER IF EXISTS trg_validate_messages_per_day ON public.group_blast_configs;
DROP FUNCTION IF EXISTS public.validate_messages_per_day();
