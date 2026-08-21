-- Slice (a) of the paid media account registry: platform guard + write RLS.
--
-- `platform` distinguishes Meta accounts (the only ones the reporting
-- pipeline can generate for today) from Google/TikTok accounts that already
-- live in `ad_accounts`. Defaulting existing rows to 'meta' is correct: every
-- row currently in the table came from the Meta sync.
--
-- `is_paid_media()` is assumed to already exist (same untracked-then-adopted
-- pattern as `get_user_role()` / `is_admin_global()` in
-- 20260720_001_crm_rls_helpers.sql) — it is not created here.
--
-- No DELETE policy: soft delete (slice d) goes through UPDATE, and there is
-- no hard-delete path for this table.
alter table public.ad_accounts
  add column platform text not null default 'meta'
    check (platform in ('meta', 'google', 'tiktok'));

-- No `deleted_at` filter here on purpose (D4): an UPDATE first SELECTs the
-- row under RLS, so narrowing this to `deleted_at is null` would make
-- restore-from-trash silently affect 0 rows once slice (d) ships.
-- Scoped `to authenticated` to match `ad_accounts_select_paid_media`. Omitting
-- it defaults the policy to PUBLIC, which includes `anon`. That is not
-- exploitable today because `is_paid_media()` resolves `auth.uid()` and an
-- anonymous request has none — but the role scope is the second layer, and it
-- is the one that still holds if that function is ever changed.
create policy ad_accounts_insert_paid_media
  on public.ad_accounts
  for insert
  to authenticated
  with check (public.is_paid_media());

create policy ad_accounts_update_paid_media
  on public.ad_accounts
  for update
  to authenticated
  using (public.is_paid_media())
  with check (public.is_paid_media());
