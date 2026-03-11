
-- Step 1: Create auth user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'bot-megasena@palpitetech.com',
  crypt('no-login-megasena', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nome":"Especialista Mega-Sena"}'::jsonb,
  'authenticated', 'authenticated'
);
