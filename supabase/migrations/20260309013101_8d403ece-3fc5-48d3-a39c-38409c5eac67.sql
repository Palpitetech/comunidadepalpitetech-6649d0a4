-- Add referral_code column to perfis
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS referral_code VARCHAR(8) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_perfis_referral_code ON public.perfis(referral_code);

-- Create convites table
CREATE TABLE public.convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_convites_referrer_id ON public.convites(referrer_id);

-- Enable RLS
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

-- RLS policies for convites
CREATE POLICY "Users can view their own referrals"
  ON public.convites FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Service role can insert convites"
  ON public.convites FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.perfis WHERE referral_code = result) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;

-- Trigger function to process referrals on new user signup
CREATE OR REPLACE FUNCTION public.process_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_ref_code TEXT;
  referrer_user_id UUID;
BEGIN
  -- Get referral code from user metadata
  stored_ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF stored_ref_code IS NOT NULL AND stored_ref_code != '' THEN
    -- Find the referrer by their referral_code
    SELECT id INTO referrer_user_id
    FROM public.perfis
    WHERE referral_code = stored_ref_code;
    
    -- If referrer found and not self-referral, create the convite record
    IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
      INSERT INTO public.convites (referrer_id, referred_id)
      VALUES (referrer_user_id, NEW.id)
      ON CONFLICT (referred_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to process referrals
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral();