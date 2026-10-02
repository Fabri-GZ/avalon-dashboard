-- Paid Media client entity — RPCs and client_name mirror triggers
-- (change: paid-media-client-entity, slice S1; depends on 20261001_001).
--
-- Multi-row writes that must be atomic go through SECURITY INVOKER functions,
-- so every statement still runs under the caller's RLS (the app stays
-- RLS-only, no service role). All functions pin `search_path = ''` and
-- schema-qualify every object. Execute is revoked from public/anon and granted
-- to authenticated; each RPC also checks the caller's role itself.
begin;

-- ---------------------------------------------------------------------------
-- 1. create_paid_media_client
-- ---------------------------------------------------------------------------
-- The id is generated up front so the function never depends on RETURNING
-- being visible through the clients SELECT policy. Both inserts live in one
-- function call, hence one transaction: either both rows exist or neither.
-- A duplicate name surfaces as 23505 from `clients_company_name_norm_uidx`.
create function public.create_paid_media_client(
  p_company_name   text,
  p_website_url    text,
  p_instagram_url  text,
  p_pm_name        text,
  p_operator_name  text,
  p_status         text
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if not (public.is_paid_media() or public.is_admin_global()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(p_company_name), '') is null then
    raise exception 'company_name is required' using errcode = '22023';
  end if;

  insert into public.clients (id, company_name, portal_enabled, website_url, instagram_url)
  values (
    v_id,
    btrim(p_company_name),
    false,
    nullif(btrim(p_website_url), ''),
    nullif(btrim(p_instagram_url), '')
  );

  insert into public.client_paid_media (client_id, pm_name, operator_name, status)
  values (
    v_id,
    nullif(btrim(p_pm_name), ''),
    nullif(btrim(p_operator_name), ''),
    nullif(btrim(p_status), '')
  );

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. trash_paid_media_client
-- ---------------------------------------------------------------------------
-- The client and its still-active accounts get the same `now()` (one
-- transaction, one timestamp). That shared value is what restore uses to tell
-- cascade-trashed accounts from individually trashed ones.
create function public.trash_paid_media_client(p_client_id uuid)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now   timestamptz := now();
  v_found uuid;
begin
  if not (public.is_paid_media() or public.is_admin_global()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.client_paid_media
     set deleted_at = v_now
   where client_id = p_client_id
     and deleted_at is null
  returning client_id into v_found;

  if v_found is null then
    raise exception 'client not found or already trashed' using errcode = 'P0002';
  end if;

  update public.ad_accounts
     set deleted_at = v_now
   where client_id = p_client_id
     and deleted_at is null;

  return v_now;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. restore_paid_media_client
-- ---------------------------------------------------------------------------
-- Restores only accounts whose deleted_at equals the client's trash timestamp.
-- An account trashed on its own earlier carries an app-clock (Node, ms
-- precision) value that never equals the DB `now()`, so it stays trashed.
-- Returns the number of accounts restored.
create function public.restore_paid_media_client(p_client_id uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ts    timestamptz;
  v_count integer;
begin
  if not (public.is_paid_media() or public.is_admin_global()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select deleted_at
    into v_ts
    from public.client_paid_media
   where client_id = p_client_id
     for update;

  if v_ts is null then
    raise exception 'client not found or not trashed' using errcode = 'P0002';
  end if;

  update public.client_paid_media
     set deleted_at = null
   where client_id = p_client_id;

  update public.ad_accounts
     set deleted_at = null
   where client_id = p_client_id
     and deleted_at = v_ts;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.create_paid_media_client(text, text, text, text, text, text) from public, anon;
revoke all on function public.trash_paid_media_client(uuid) from public, anon;
revoke all on function public.restore_paid_media_client(uuid) from public, anon;
grant execute on function public.create_paid_media_client(text, text, text, text, text, text) to authenticated;
grant execute on function public.trash_paid_media_client(uuid) to authenticated;
grant execute on function public.restore_paid_media_client(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. ad_accounts.client_name mirror (D7)
-- ---------------------------------------------------------------------------
-- When client_id is set, the name always comes from `clients`. If the caller
-- cannot see that client, RLS makes the lookup return nothing and we refuse
-- (paid_media may not link accounts to clients it cannot see). Unlinking
-- clears the name. While client_id is null the given text is kept, so the
-- pre-backfill app keeps working after S1 is applied.
create function public.ad_accounts_sync_client_name()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_name text;
begin
  if new.client_id is not null then
    select c.company_name
      into v_name
      from public.clients c
     where c.id = new.client_id;

    if not found then
      raise exception 'client not found or not accessible' using errcode = '42501';
    end if;

    new.client_name := v_name;
  elsif tg_op = 'UPDATE' and old.client_id is not null then
    new.client_name := null;
  end if;

  return new;
end;
$$;

create trigger ad_accounts_sync_client_name
  before insert or update of client_id, client_name on public.ad_accounts
  for each row execute function public.ad_accounts_sync_client_name();

-- Rename propagation: the update re-enters the BEFORE trigger above, which
-- rewrites the same value, so the two directions cannot diverge.
create function public.clients_propagate_company_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.ad_accounts
     set client_name = new.company_name
   where client_id = new.id;

  return null;
end;
$$;

create trigger clients_propagate_company_name
  after update of company_name on public.clients
  for each row
  when (old.company_name is distinct from new.company_name)
  execute function public.clients_propagate_company_name();

commit;
