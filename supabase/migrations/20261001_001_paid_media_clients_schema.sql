-- Paid Media client entity — schema, RLS and guard (change: paid-media-client-entity, slice S1).
--
-- `public.clients` becomes the single source of truth for a paid-media client.
-- Paid-media-only clients are `clients` rows with `portal_enabled = false`;
-- portal tenants (FZ Motos, Grupo Norte, Viviera) keep `portal_enabled = true`.
-- Internal fields live in a 1:1 extension, `client_paid_media`, so they never
-- ship to portal users through `select('*')` on `clients`.
--
-- Purely additive: no existing row is touched and no column is dropped.
-- `ad_accounts.client_name` stays for one release as a trigger-maintained
-- mirror (see 20261001_002) so `search_text` and old readers keep working.
-- The data move (new clients, `client_id` links, status split) is the S2
-- backfill, run by hand after this migration.
--
-- Prerequisite (task 0.1): every Meta account id already matches
-- `^act_[0-9]+$`, otherwise the CHECK in section 5 fails and the whole
-- transaction rolls back.
begin;

-- ---------------------------------------------------------------------------
-- 1. Client status lookup (D1)
-- ---------------------------------------------------------------------------
-- Same keys/labels as the client-level subset of `ad_account_management_status`.
-- After the S2 backfill deletes those 5 keys from the account lookup, each FK
-- alone enforces its own side of the client/account status split.
create table public.paid_media_client_status (
  key         text primary key,
  label       text not null unique,
  sort_order  int  not null,
  is_active   boolean not null default true
);

alter table public.paid_media_client_status enable row level security;

create policy paid_media_client_status_select_authenticated
  on public.paid_media_client_status
  for select
  to authenticated
  using (true);

insert into public.paid_media_client_status (key, label, sort_order, is_active) values
  ('nuevo_cliente',          'Nuevo Cliente',          1, true),
  ('activo',                 'Activo',                 2, true),
  ('pausado',                'Pausado',                3, true),
  ('esperar_confirmacion',   'Esperar Confirmación',   4, true),
  ('pendiente',              'Pendiente',              5, true);

-- ---------------------------------------------------------------------------
-- 2. clients: portal flag, web/IG, global unique name (D6)
-- ---------------------------------------------------------------------------
-- DEFAULT true keeps every existing insert path (create-client route, auth
-- upsert) producing portal clients with no code change.
alter table public.clients
  add column portal_enabled boolean not null default true,
  add column website_url    text,
  add column instagram_url  text;

-- Global, not per-active: a trashed client keeps its name reserved so it can
-- be offered for restore instead of silently duplicated.
create unique index clients_company_name_norm_uidx
  on public.clients (public.pm_unaccent(lower(btrim(company_name))));

-- ---------------------------------------------------------------------------
-- 3. client_paid_media (1:1 extension)
-- ---------------------------------------------------------------------------
-- No separate `deleted_at` index: `client_id` is the primary key, so a partial
-- index on it would add write cost without serving any query.
create table public.client_paid_media (
  client_id      uuid primary key references public.clients (id) on delete cascade,
  pm_name        text,
  operator_name  text,
  status         text references public.paid_media_client_status (key) on delete restrict,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create function public.client_paid_media_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger client_paid_media_updated_at
  before update on public.client_paid_media
  for each row execute function public.client_paid_media_set_updated_at();

alter table public.client_paid_media enable row level security;

-- No DELETE policy: removal is soft (deleted_at) and cascades only from clients.
-- The policy deliberately does not reference `clients`: the `clients` policies
-- below read this table, so a back-reference would recurse.
create policy client_paid_media_select
  on public.client_paid_media
  for select
  to authenticated
  using ((select public.is_admin_global()) or (select public.is_paid_media()));

create policy client_paid_media_insert
  on public.client_paid_media
  for insert
  to authenticated
  with check ((select public.is_admin_global()) or (select public.is_paid_media()));

create policy client_paid_media_update
  on public.client_paid_media
  for update
  to authenticated
  using ((select public.is_admin_global()) or (select public.is_paid_media()))
  with check ((select public.is_admin_global()) or (select public.is_paid_media()));

revoke all on public.client_paid_media from anon;
grant select, insert, update on public.client_paid_media to authenticated;

-- ---------------------------------------------------------------------------
-- 4. ad_accounts.client_id (D5)
-- ---------------------------------------------------------------------------
-- Nullable: unassigned accounts (e.g. SEPINO) are a supported state. RESTRICT
-- because a client with accounts must be trashed, never deleted.
alter table public.ad_accounts
  add column client_id uuid references public.clients (id) on delete restrict;

-- Full index, not partial: RESTRICT checks and the cascade restore both scan
-- trashed rows, which a `deleted_at is null` index cannot serve.
create index ad_accounts_client_id_idx
  on public.ad_accounts (client_id);

-- ---------------------------------------------------------------------------
-- 5. Meta account ids must carry the `act_` prefix
-- ---------------------------------------------------------------------------
-- Defense in depth for the account form: a bare numeric id breaks the Meta API
-- calls in Reportes. Requires task 0.1 (Tan&Go id fix) to be done first.
alter table public.ad_accounts
  add constraint ad_accounts_meta_id_format
    check (platform <> 'meta' or id ~ '^act_[0-9]+$');

-- ---------------------------------------------------------------------------
-- 6. clients RLS for paid_media (D4)
-- ---------------------------------------------------------------------------
-- paid_media sees paid-media-only clients plus any portal client that has an
-- extension row; a pure portal client (FZ Motos) stays invisible. These add to
-- the existing admin/client_user/pm policies (permissive policies OR together).
-- UPDATE needs a SELECT policy to find the row, hence the select policy.
create policy clients_paid_media_select
  on public.clients
  for select
  to authenticated
  using (
    (select public.is_paid_media())
    and (
      portal_enabled = false
      or exists (
        select 1 from public.client_paid_media p where p.client_id = clients.id
      )
    )
  );

create policy clients_paid_media_insert
  on public.clients
  for insert
  to authenticated
  with check ((select public.is_paid_media()) and portal_enabled = false);

create policy clients_paid_media_update
  on public.clients
  for update
  to authenticated
  using (
    (select public.is_paid_media())
    and (
      portal_enabled = false
      or exists (
        select 1 from public.client_paid_media p where p.client_id = clients.id
      )
    )
  )
  with check (
    (select public.is_paid_media())
    and (
      portal_enabled = false
      or exists (
        select 1 from public.client_paid_media p where p.client_id = clients.id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 7. Column whitelist guard (D3)
-- ---------------------------------------------------------------------------
-- Every role shares the `authenticated` grant, so column GRANTs cannot tell
-- paid_media from admin. A jsonb diff whitelists the editable columns, which
-- means a column added later is denied by default. Admin and service role
-- (auth.uid() is null) pass through untouched.
create function public.clients_paid_media_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_paid_media() and not public.is_admin_global() then
    if (to_jsonb(new) - '{company_name,website_url,instagram_url}'::text[])
       is distinct from (to_jsonb(old) - '{company_name,website_url,instagram_url}'::text[])
    then
      raise exception 'column not editable' using errcode = '42501';
    end if;

    if old.portal_enabled and new.company_name is distinct from old.company_name then
      raise exception 'portal client name is admin-only' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger clients_paid_media_guard
  before update on public.clients
  for each row execute function public.clients_paid_media_guard();

commit;
