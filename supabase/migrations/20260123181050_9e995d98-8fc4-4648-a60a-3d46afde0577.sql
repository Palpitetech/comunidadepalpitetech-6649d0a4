-- Add safety/guardrails configuration per bot
ALTER TABLE public.guide_personas
  ADD COLUMN IF NOT EXISTS safety_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS safety_block_pii boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS safety_banned_topics text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS safety_banned_words text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS safety_style text NOT NULL DEFAULT 'safe';

-- Helpful index for tag arrays already exists? (keep minimal; no new indexes unless needed)
