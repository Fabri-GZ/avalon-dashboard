-- CRM multiclient schema: one `leads` table and one `messages` table for every
-- client, replacing the per-client clones (`gn_*`, `fz_*`, `viviera_*`).
--
-- This migration only CREATES. Nothing reads or writes these tables yet: the
-- ingest RPC and the app still point at the old tables, and the cutover happens
-- in the next migration. Grupo Norte is untouched and keeps working.
--
-- Column vs `details` jsonb follows one rule: a column if it is filtered,
-- ordered or rendered for every client; `details` if it is one client's
-- vocabulary. `details` is deliberately unvalidated beyond "is an object" --
-- its keys come from the bot prompts in n8n and change without a deploy, so a
-- strict constraint would turn a prompt edit into a lost turn in production.

create table public.leads (
  client_id        uuid not null references public.clients(id),
  channel          text not null default 'whatsapp',
  session_id       text not null,
  stage            text not null default 'conversando',
  nombre           text,
  contacto         text,
  intencion        text,
  derivado         boolean not null default false,
  calificado       boolean not null default false,
  last_snippet     text,
  first_contact_at timestamptz,
  last_message_at  timestamptz,
  details          jsonb not null default '{}'::jsonb,
  primary key (client_id, channel, session_id),
  constraint leads_stage_check      check (stage in ('conversando','derivado','cerrado')),
  constraint leads_details_object   check (jsonb_typeof(details) = 'object')
);

-- `client_id` is carried on messages too. It is derivable through the foreign
-- key, but RLS and the thread index both need it locally to avoid a join.
create table public.messages (
  id         bigint generated always as identity primary key,
  client_id  uuid not null,
  channel    text not null default 'whatsapp',
  session_id text not null,
  role       text not null check (role in ('user','bot')),
  content    text not null,
  created_at timestamptz not null default now(),
  foreign key (client_id, channel, session_id)
    references public.leads (client_id, channel, session_id) on delete cascade
);

-- Equality columns first, ordering column last: this is the index the kanban
-- board scans, and the keyset cursor `(last_message_at desc, session_id desc)`
-- matches its tail exactly.
create index leads_board_idx
  on public.leads (client_id, stage, last_message_at desc nulls last, session_id desc);

create index messages_thread_idx
  on public.messages (client_id, channel, session_id, created_at, id);

alter table public.leads    enable row level security;
alter table public.messages enable row level security;
  
-- Every helper call is wrapped in `(select ...)` so Postgres evaluates it once
-- per query as an InitPlan instead of once per row. That wrapper only works
-- because migration 20260720_001 marked the helpers STABLE.
create policy leads_select on public.leads
  for select to authenticated
  using (
    (select public.is_admin_global())
    or client_id = (select public.get_user_client_id())
  );

-- Three things this policy fixes at once:
--   * `using` is scoped by client_id -- the policy it replaces on gn_leads had
--     `USING (true)`, letting any authenticated user update any client's rows.
--   * `with check` repeats the client_id test so a row cannot be moved into
--     another tenant.
--   * `stage <> 'derivado'` keeps the old guarantee: reaching `derivado` stays
--     the exclusive job of the derive flow, never a drag on the board. Moving
--     a lead OUT of `derivado` is still allowed.
create policy leads_update on public.leads
  for update to authenticated
  using (
    (select public.is_admin_global())
    or client_id = (select public.get_user_client_id())
  )
  with check (
    (
      (select public.is_admin_global())
      or client_id = (select public.get_user_client_id())
    )
    and stage <> 'derivado'
  );

create policy messages_select on public.messages
  for select to authenticated
  using (
    (select public.is_admin_global())
    or client_id = (select public.get_user_client_id())
  );

-- No INSERT or DELETE policies on purpose. Writes belong to the ingest RPC,
-- which runs as `service_role` and bypasses RLS. An authenticated session has
-- no path to create or destroy a lead.
