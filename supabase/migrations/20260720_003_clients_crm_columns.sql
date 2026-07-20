-- Two additive columns on `clients`, both consumed later in the CRM rollout.
--
-- `client_key` is a readable slug. The lead type is a discriminated union over
-- `details`, and the TypeScript registry needs a literal it can switch on -- a
-- uuid is useless for that. Verified before writing: `clients` had no slug
-- column of any kind.
--
-- `webhook_derivar_url` replaces the single global N8N_WEBHOOK_DERIVAR_URL env
-- var, whose payload is hardcoded to Grupo Norte. Null means the client has no
-- derive workflow yet and the button stays disabled.
--
-- Both are nullable and unused until later migrations, so this is safe to run
-- on its own.

alter table public.clients
  add column client_key          text,
  add column webhook_derivar_url text;

-- Partial unique index rather than a plain UNIQUE constraint: only the clients
-- that actually have a key take part, and the rows still without one do not
-- compete for the null slot.
create unique index clients_client_key_key
  on public.clients (client_key)
  where client_key is not null;

-- Backfill the three clients with a chatbot feeding the CRM. Matched by id, not
-- by name, so a later rename cannot silently retarget these rows.
update public.clients set client_key = 'grupo-norte'
  where id = 'b7859a5a-d306-488a-ba3d-6733ae8430ad';

update public.clients set client_key = 'fz-motos'
  where id = 'f2000000-0000-4000-8000-000000000001';

update public.clients set client_key = 'viviera'
  where id = 'b45141ef-1929-44b6-851a-b213c1491ec6';
