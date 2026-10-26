-- Users could update every column of their own user_profiles row, including
-- `role` and `client_id`, so any logged-in user could promote themselves to
-- admin_global or read another client's data. The app only edits full_name,
-- phone and avatar_url from the browser; role/client_id/email writes go
-- through the service role, which these grants do not affect.
begin;

-- Revoking at table level also drops every column-level UPDATE grant.
revoke update on public.user_profiles from anon, authenticated;

grant update (full_name, phone, avatar_url) on public.user_profiles to authenticated;

alter policy "Users can update own profile" on public.user_profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

commit;
