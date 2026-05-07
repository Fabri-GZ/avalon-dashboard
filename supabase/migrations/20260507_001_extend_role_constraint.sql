ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role = ANY (ARRAY[
    'admin_global'::text,
    'client_user'::text,
    'comercial'::text,
    'pm'::text,
    'cm'::text
  ]));
