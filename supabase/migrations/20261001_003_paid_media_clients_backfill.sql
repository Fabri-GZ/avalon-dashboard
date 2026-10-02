-- Paid Media client entity — data backfill (change: paid-media-client-entity,
-- slice S2; depends on 20261001_001 and 20261001_002).
--
-- RUN BY FABRI DURING THE EDIT FREEZE (tasks O2/O3), AFTER REVIEW. Do NOT let
-- `supabase db push` apply this blind: it moves live data, nulls account
-- statuses and DELETEs rows from `ad_account_management_status`. Run it as a
-- role that bypasses RLS (SQL editor / postgres), right before deploying
-- S2+S3a+S3b together, with no paid-media edits in flight.
--
-- Everything runs in one transaction. Two DO blocks assert the expected state
-- (one before the first write, one after the last); any failed invariant
-- RAISEs, which rolls the whole transaction back. Nothing is matched fuzzily:
-- the name map below is explicit, and an unmapped `client_name` aborts the run.
--
-- Undo (only before S3a is live): supabase/manual/20261001_003_backfill.rollback.sql,
-- which restores from the snapshot taken in step 1.
--
-- How it gets applied: this repo has no supabase/config.toml and does not use
-- the CLI migration history; every file here is applied by hand in the SQL
-- editor (the 20261001_00N files even share a version prefix the CLI would
-- reject). Same pattern as the 20260825_006 initial load. The asserts below
-- pin production data on purpose, so on any other database (local reset,
-- preview branch, CI) this file is expected to RAISE and must be skipped,
-- not "fixed". If the project ever adopts `supabase db push`, move this file
-- to supabase/manual/ first.
begin;

-- ---------------------------------------------------------------------------
-- 0. Preconditions (before the first write)
-- ---------------------------------------------------------------------------
-- The map in step 2 was built from the live data of 2026-10-01: 24 accounts,
-- 20 distinct client names, SEPINO and Tan&Go with no client_name. If the data
-- drifted since then, stop and re-check instead of guessing.
do $$
declare
  n integer;
begin
  select count(*) into n from public.ad_accounts;
  if n <> 24 then
    raise exception 'precondition: expected 24 ad_accounts, found %', n;
  end if;

  select count(*) into n from public.ad_accounts where client_id is not null;
  if n <> 0 then
    raise exception 'precondition: % accounts already have client_id (backfill already ran?)', n;
  end if;

  select count(*) into n from public.paid_media_client_status;
  if n <> 5 then
    raise exception 'precondition: paid_media_client_status must hold the 5 seeded keys, found %', n;
  end if;

  -- The 5 client-level keys must still exist in the account lookup: step 7
  -- deletes them, and the rollback re-seeds them.
  select count(*) into n
    from public.ad_account_management_status s
    join public.paid_media_client_status c on c.key = s.key;
  if n <> 5 then
    raise exception 'precondition: expected the 5 client keys in ad_account_management_status, found %', n;
  end if;

  select count(*) into n from public.clients
   where id in ('b7859a5a-d306-488a-ba3d-6733ae8430ad', 'b45141ef-1929-44b6-851a-b213c1491ec6');
  if n <> 2 then
    raise exception 'precondition: Grupo Norte / Viviera client rows not found (found % of 2)', n;
  end if;

  -- Tan&Go account (id fixed in task 0.1) exists and is still unassigned.
  select count(*) into n from public.ad_accounts
   where id = 'act_2998314530250032' and client_name is null;
  if n <> 1 then
    raise exception 'precondition: Tan&Go account act_2998314530250032 not found or already named';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Snapshot (D2)
-- ---------------------------------------------------------------------------
-- Non-exposed schema, RLS on and no grants: only the owner role can read it.
-- Plain `create table` on purpose: a re-run fails here instead of overwriting
-- the snapshot the rollback depends on.
create schema if not exists backup;

create table backup.ad_accounts_20261001 as
  select id, client_name, management_status, deleted_at
    from public.ad_accounts;

alter table backup.ad_accounts_20261001 enable row level security;
revoke all on backup.ad_accounts_20261001 from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Explicit name map
-- ---------------------------------------------------------------------------
-- source_client_name = the exact `ad_accounts.client_name` text today (values
-- written by 20260825_006). Grupo Norte and Viviera keep their existing portal
-- clients; every other name gets a fresh id. Tan&Go has no client_name, so it
-- is linked by account id in step 4; its row here only reserves the client.
-- SEPINO is deliberately absent: it stays unassigned.
create temp table _map (
  source_client_name text primary key,
  existing_client_id uuid,
  client_id          uuid not null
) on commit drop;

insert into _map (source_client_name, existing_client_id, client_id)
select v.name, v.existing_id, coalesce(v.existing_id, gen_random_uuid())
  from (values
    ('Amsterdam Importador',         null::uuid),
    ('Asiscom',                      null),
    ('Avalon Agency',                null),
    ('Bioben',                       null),
    ('Bomberos 3F',                  null),
    ('Cemed',                        null),
    ('D''Benedetto Constructora',    null),
    ('Decopoint',                    null),
    ('Garden Free',                  null),
    ('Garzón Deco',                  null),
    ('Grupo Norte',                  'b7859a5a-d306-488a-ba3d-6733ae8430ad'),
    ('Hotel Acapulco',               null),
    ('Las Mercedes',                 null),
    ('Las Vicas',                    null),
    ('Maria Luján',                  null),
    ('Mansilla Cards',               null),
    ('Openn Pilar',                  null),
    ('Sister SRL',                   null),
    ('Tallón',                       null),
    ('Tan&Go',                       null),
    ('Viviera',                      'b45141ef-1929-44b6-851a-b213c1491ec6')
  ) as v(name, existing_id);

-- Any client_name outside the map means the data drifted: abort, never guess.
do $$
declare
  v_unmapped text;
begin
  select string_agg(distinct a.client_name, ', ') into v_unmapped
    from public.ad_accounts a
   where a.client_name is not null
     and not exists (select 1 from _map m where m.source_client_name = a.client_name);

  if v_unmapped is not null then
    raise exception 'unmapped client_name values: %', v_unmapped;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. New clients (paid-media only)
-- ---------------------------------------------------------------------------
insert into public.clients (id, company_name, portal_enabled)
select client_id, source_client_name, false
  from _map
 where existing_client_id is null;

-- ---------------------------------------------------------------------------
-- 4. Link accounts
-- ---------------------------------------------------------------------------
-- The mirror trigger (002) rewrites `client_name` from `clients.company_name`
-- on every row touched here, so the text and the link cannot diverge.
update public.ad_accounts a
   set client_id = m.client_id
  from _map m
 where a.client_name = m.source_client_name;

update public.ad_accounts a
   set client_id = m.client_id
  from _map m
 where m.source_client_name = 'Tan&Go'
   and a.id = 'act_2998314530250032';

-- ---------------------------------------------------------------------------
-- 5. Client-level fields (extension rows)
-- ---------------------------------------------------------------------------
-- A client's PM / operator / status come from its ACTIVE accounts; a client
-- with no active account falls back to all of its (trashed) accounts. That
-- rule resolves Asiscom: the active ASISCOM (CARO / Gus / activo) wins over
-- the trashed Asiscom-2 (Juan / Gus / null). Status counts only when it is a
-- client-level key; account-level keys (saldo_agregado, ...) stay on the
-- account.
create temp table _winners on commit drop as
select a.client_id, a.pm_name, a.operator_name, s.key as client_status
  from public.ad_accounts a
  left join public.paid_media_client_status s on s.key = a.management_status
 where a.client_id is not null
   and (
     a.deleted_at is null
     or not exists (
       select 1 from public.ad_accounts x
        where x.client_id = a.client_id and x.deleted_at is null
     )
   );

-- If two winning accounts disagree, `max()` below would pick one silently.
-- Abort so the conflict is resolved by a person.
do $$
declare
  v_conflicts text;
begin
  select string_agg(c.company_name, ', ') into v_conflicts
    from public.clients c
   where c.id in (
     select client_id from _winners
      group by client_id
     having count(distinct pm_name) > 1
         or count(distinct operator_name) > 1
         or count(distinct client_status) > 1
   );

  if v_conflicts is not null then
    raise exception 'conflicting pm/operator/status among winning accounts of: %', v_conflicts;
  end if;
end $$;

insert into public.client_paid_media (client_id, pm_name, operator_name, status)
select client_id, max(pm_name), max(operator_name), max(client_status)
  from _winners
 group by client_id;

-- Clients linked to no account would have no extension row; every client in
-- the map has at least one account today, and the assertions check that.

-- ---------------------------------------------------------------------------
-- 6. All-trashed clients
-- ---------------------------------------------------------------------------
-- A client whose accounts are ALL trashed is trashed. Its extension and every
-- one of its accounts get the same `deleted_at` (the latest one), the same
-- shape `trash_paid_media_client` produces, so "Restaurar cliente" restores
-- the whole group.
create temp table _trashed on commit drop as
select client_id, max(deleted_at) as ts
  from public.ad_accounts
 where client_id is not null
 group by client_id
having count(*) filter (where deleted_at is null) = 0;

update public.client_paid_media e
   set deleted_at = t.ts
  from _trashed t
 where e.client_id = t.client_id;

update public.ad_accounts a
   set deleted_at = t.ts
  from _trashed t
 where a.client_id = t.client_id;

-- ---------------------------------------------------------------------------
-- 7. Move client-level statuses off the accounts
-- ---------------------------------------------------------------------------
-- The values already live in `client_paid_media.status` (step 5). Null them on
-- the accounts, then drop the 5 keys from the account lookup so each FK only
-- accepts its own side of the split. Remaining account keys: saldo_agregado,
-- cuenta_creada, activa_cuenta_prepaga.
update public.ad_accounts
   set management_status = null
 where management_status in (select key from public.paid_media_client_status);

delete from public.ad_account_management_status
 where key in (select key from public.paid_media_client_status);

-- ---------------------------------------------------------------------------
-- 8. Assertions (any failure rolls back everything)
-- ---------------------------------------------------------------------------
do $$
declare
  n integer;
begin
  -- Row count unchanged; SEPINO is the only unassigned account.
  select count(*) into n from public.ad_accounts;
  if n <> 24 then raise exception 'assert: expected 24 accounts, found %', n; end if;

  select count(*) into n from public.ad_accounts where client_id is null;
  if n <> 1 then raise exception 'assert: expected exactly 1 account without client_id, found %', n; end if;

  select count(*) into n from public.ad_accounts where client_id is null and name = 'SEPINO';
  if n <> 1 then raise exception 'assert: the unassigned account is not SEPINO'; end if;

  -- Clients: 3 portal (FZ Motos + the 2 linked), 19 new paid-media-only,
  -- each of the 21 with an extension row; FZ Motos stays without one.
  select count(*) into n from public.clients where portal_enabled;
  if n <> 3 then raise exception 'assert: expected 3 portal clients, found %', n; end if;

  select count(*) into n from public.clients where not portal_enabled;
  if n <> 19 then raise exception 'assert: expected 19 paid-media-only clients, found %', n; end if;

  select count(*) into n from public.client_paid_media;
  if n <> 21 then raise exception 'assert: expected 21 extension rows, found %', n; end if;

  select count(*) into n
    from public.client_paid_media e
    join public.clients c on c.id = e.client_id
   where c.portal_enabled;
  if n <> 2 then raise exception 'assert: expected extension rows on exactly 2 portal clients, found %', n; end if;

  -- Mirror: client_name equals the linked client's name everywhere.
  select count(*) into n
    from public.ad_accounts a
    join public.clients c on c.id = a.client_id
   where a.client_name is distinct from c.company_name;
  if n <> 0 then raise exception 'assert: % accounts with client_name out of sync', n; end if;

  -- Status split: no client key left on accounts or in the account lookup.
  select count(*) into n from public.ad_accounts
   where management_status in (select key from public.paid_media_client_status);
  if n <> 0 then raise exception 'assert: % accounts still hold a client-level status', n; end if;

  select count(*) into n from public.ad_account_management_status
   where key in (select key from public.paid_media_client_status);
  if n <> 0 then raise exception 'assert: client keys still present in ad_account_management_status'; end if;

  -- Trashed clients: exactly the 10 all-trashed ones (Viviera included), and
  -- the extension and every account share one deleted_at.
  select count(*) into n from public.client_paid_media where deleted_at is not null;
  if n <> 10 then raise exception 'assert: expected 10 trashed clients, found %', n; end if;

  select count(*) into n
    from public.client_paid_media e
    join _map m on m.client_id = e.client_id
   where e.deleted_at is not null
     and m.source_client_name in (
       'Amsterdam Importador', 'Bioben', 'D''Benedetto Constructora', 'Decopoint',
       'Las Mercedes', 'Las Vicas', 'Mansilla Cards', 'Openn Pilar', 'Tallón', 'Viviera'
     );
  if n <> 10 then raise exception 'assert: the trashed set differs from the expected 10 clients'; end if;

  select count(*) into n
    from public.client_paid_media e
    join public.ad_accounts a on a.client_id = e.client_id
   where e.deleted_at is not null
     and a.deleted_at is distinct from e.deleted_at;
  if n <> 0 then raise exception 'assert: % accounts of trashed clients with a different deleted_at', n; end if;

  -- An active client must have at least one active account.
  select count(*) into n
    from public.client_paid_media e
   where e.deleted_at is null
     and not exists (
       select 1 from public.ad_accounts a where a.client_id = e.client_id and a.deleted_at is null
     );
  if n <> 0 then raise exception 'assert: % active clients without any active account', n; end if;

  -- Asiscom takes CARO / Gus / activo from the active account.
  select count(*) into n
    from public.client_paid_media e
    join _map m on m.client_id = e.client_id
   where m.source_client_name = 'Asiscom'
     and e.pm_name = 'CARO' and e.operator_name = 'Gus' and e.status = 'activo';
  if n <> 1 then raise exception 'assert: Asiscom did not take CARO/Gus/activo from its active account'; end if;

  -- Tan&Go: new client, account linked, CARO / Sabi / activo.
  select count(*) into n
    from public.ad_accounts a
    join public.clients c on c.id = a.client_id
    join public.client_paid_media e on e.client_id = c.id
   where a.id = 'act_2998314530250032'
     and c.company_name = 'Tan&Go' and not c.portal_enabled
     and e.pm_name = 'CARO' and e.operator_name = 'Sabi' and e.status = 'activo';
  if n <> 1 then raise exception 'assert: Tan&Go client/account link is wrong'; end if;
end $$;

commit;
