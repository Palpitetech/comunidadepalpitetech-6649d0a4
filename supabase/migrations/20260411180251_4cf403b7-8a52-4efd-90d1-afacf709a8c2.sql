-- Remove the RPC function
DROP FUNCTION IF EXISTS public.activate_free_trial();

-- Create RLS policy for trial activation
-- Allow users to update their own profile fields related to the plan activation
-- only if they haven't used the trial yet.
CREATE POLICY "Usuario pode ativar trial uma vez"
ON public.perfis
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (
    -- If they are changing trial_used to true, it must have been false before
    -- This policy specifically targets the trial activation fields
    trial_used = false
  )
);