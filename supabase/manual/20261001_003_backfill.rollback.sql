-- Rollback of 20261001_003_paid_media_clients_backfill.sql
-- (change: paid-media-client-entity, slice S2).
--
-- MANUAL, NOT A MIGRATION: lives outside supabase/migrations/ so `db push`
-- never picks it up. Fabri runs it by hand, as a role that bypasses RLS.
--
-- Restores `ad_accounts.client_name`, `management_status` and `deleted_at`
-- from `backup.ad_accounts_20261001`, unlinks every account, and removes the
-- backfill's data: all extension rows and all `portal_enabled = false`
-- clients. It also re-seeds the 5 client-level keys in
-- `ad_account_management_status` (labels and order from 20260821_002).
--
-- ONLY SAFE BEFORE S3a IS LIVE. Once users create clients or edit accounts
-- through the new app, this script would also delete those clients and revert
-- those edits. Past that point, fix forward instead.
--
-- It does not drop the S1 schema (see the S1 migrations to undo that) and it
-- keeps the backup table. Any failed check rolls the whole script back.
begin;

do $$
declare
  n integer;
begin
  select count(*) into n from backup.ad_accounts_20261001;
  if n <> 24 then
    raise exception 'rollback: backup snapshot has % rows, expected 24', n;
  end if;
end $$;

-- 1. Re-seed the account-level lookup first: step 3 restores statuses that
--    reference these keys.
insert into public.ad_account_management_status (key, label, sort_order, is_active) values
  ('nuevo_cliente',        'Nuevo Cliente',        1, true),
  ('activo',               'Activo',               2, true),
  ('pausado',              'Pausado',              3, true),
  ('esperar_confirmacion', 'Esperar Confirmación', 4, true),
  ('pendiente',            'Pendiente',            6, true)
on conflict (key) do nothing;

-- 2. Unlink. Two statements on purpose: the mirror trigger blanks client_name
--    when client_id goes from set to null, so the name is restored afterwards,
--    while client_id is already null (the trigger then keeps the given text).
update public.ad_accounts set client_id = null where client_id is not null;

-- 3. Restore the snapshot columns.
update public.ad_accounts a
   set client_name       = b.client_name,
       management_status = b.management_status,
       deleted_at        = b.deleted_at
  from backup.ad_accounts_20261001 b
 where b.id = a.id;

-- 4. Remove the backfill's data. Accounts are unlinked, so the RESTRICT FK on
--    ad_accounts.client_id no longer blocks the client deletes.
delete from public.client_paid_media;
delete from public.clients where not portal_enabled;

-- 5. Checks.
do $$
declare
  n integer;
begin
  select count(*) into n
    from public.ad_accounts a
    join backup.ad_accounts_20261001 b on b.id = a.id
   where a.client_id is not null
      or a.client_name       is distinct from b.client_name
      or a.management_status is distinct from b.management_status
      or a.deleted_at        is distinct from b.deleted_at;
  if n <> 0 then raise exception 'rollback: % accounts differ from the snapshot', n; end if;

  select count(*) into n from public.ad_account_management_status;
  if n <> 8 then raise exception 'rollback: expected 8 account status keys, found %', n; end if;

  select count(*) into n from public.clients;
  if n <> 3 then raise exception 'rollback: expected 3 clients, found %', n; end if;
end $$;

commit;
