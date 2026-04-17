ALTER TABLE public.help_content 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS author_experience TEXT,
ADD COLUMN IF NOT EXISTS review_method TEXT;