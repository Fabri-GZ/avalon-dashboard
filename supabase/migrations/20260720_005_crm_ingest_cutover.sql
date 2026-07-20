-- Cutover migration: generic ingest RPC + backfill of gn_leads/gn_messages
-- into leads/messages + the 3 wrappers (gn_/fz_/viviera_ingest_whatsapp_turn)
-- pointed at it. After this commits, n8n keeps calling the same wrapper
-- signatures it already calls today, but the data lands in the new schema.
--
-- The transaction is opened explicitly rather than relying on the runner. This
-- file is applied by hand in the SQL editor, and the lock in step 0 only holds
-- until the end of the enclosing transaction -- if the statements were to run
-- autocommitted one by one, the lock would be released immediately and the
-- backfill would lose any turn arriving mid-migration. Postgres DDL is
-- transactional, so the whole thing commits or none of it does.
begin;

-- 0. Without this lock, a GN turn that INSERTs/UPDATEs gn_leads or gn_messages
-- between the backfill's SELECT and this transaction's COMMIT is captured by
-- neither: the old row it wrote is missed by the backfill (already scanned),
-- and the new schema doesn't exist for the RPC to write to yet, because the
-- wrapper swap (step 3) hasn't happened. SHARE ROW EXCLUSIVE blocks other
-- writers but still allows concurrent reads, so the dashboard stays up.
lock table public.gn_leads, public.gn_messages in share row exclusive mode;

-- 1. Generic RPC ---------------------------------------------------------
--
-- Stage mapping (applied here AND in the backfill below, kept identical on
-- purpose so a lead ingested today and one migrated from history land on the
-- same value):
--   nuevo               -> conversando
--   conversando         -> conversando
--   sin_respuesta       -> conversando
--   reunion_solicitada  -> conversando (Viviera's "reunion requested" is not a
--                          distinct stage anymore; the flag moves into
--                          details.reunion so the UI can still show it)
--   derivado            -> derivado
--   cerrado             -> cerrado
--
-- The old RPCs computed "nuevo vs conversando" from message count. That
-- distinction doesn't exist in the 3-stage model: everything that isn't
-- derivado/cerrado is conversando, so the CASE below only has to decide
-- between derivado, cerrado and conversando -- no history to inspect.
--
-- `p_details` merges via `l.details || jsonb_strip_nulls(excluded.details)`.
-- jsonb `||` overwrites duplicate keys; `strip_nulls` is what prevents a
-- turn that doesn't mention a given field from wiping it out by writing an
-- explicit null over an existing value (the jsonb analogue of
-- `coalesce(nullif(x,''), l.x)` for plain columns).
create or replace function public.ingest_whatsapp_turn(
  p_client_id  uuid,
  p_session_id text,
  p_channel    text default 'whatsapp',
  p_nombre     text default null,
  p_contacto   text default null,
  p_intencion  text default null,
  p_derivado   boolean default false,
  p_details    jsonb default '{}'::jsonb,
  p_user_msg   text default null,
  p_bot_msg    text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stage    text;
  -- A DEFAULT only applies when the caller omits the argument. n8n passes every
  -- argument explicitly, and an expression that resolves to null sends a real
  -- null, which the default does not catch. Both of these land in NOT NULL
  -- columns, so they are floored here exactly as the old RPCs did with
  -- `coalesce(p_derivado, false)`.
  v_derivado boolean := coalesce(p_derivado, false);
  v_details  jsonb   := coalesce(jsonb_strip_nulls(p_details), '{}'::jsonb);
  v_channel  text    := coalesce(nullif(p_channel, ''), 'whatsapp');
begin
  -- No p_stage parameter: `cerrado` is a stage a human sets from the UI on an
  -- existing lead (crm-actions.ts), never something a bot turn produces. A
  -- fresh ingest only ever needs to decide between conversando and derivado.
  v_stage := case when v_derivado then 'derivado' else 'conversando' end;

  insert into public.leads as l (
    client_id, channel, session_id, stage, nombre, contacto, intencion,
    derivado, last_snippet, details, first_contact_at, last_message_at
  )
  values (
    p_client_id, v_channel, p_session_id, v_stage, p_nombre, p_contacto,
    p_intencion, v_derivado, left(p_bot_msg, 120),
    v_details, now(), now()
  )
  on conflict (client_id, channel, session_id) do update set
    -- Empty-string guard preserves the original RPCs' behavior: a turn that
    -- sends '' for a field never overwrites a previously known value.
    nombre       = coalesce(nullif(excluded.nombre, ''), l.nombre),
    contacto     = coalesce(nullif(excluded.contacto, ''), l.contacto),
    intencion    = coalesce(nullif(excluded.intencion, ''), l.intencion),
    -- Booleans only ever move false -> true, never back. `derivado` is the
    -- one boolean the generic RPC owns directly; per-client booleans that now
    -- live inside `details` (tiene_usada, reunion) are resolved further down.
    derivado     = l.derivado or excluded.derivado,
    -- Unlike every other text column, last_snippet always overwrites, even
    -- with an empty string -- this is the one field the old RPCs pinned to
    -- "always reflects the latest bot reply", not "never lose known data".
    last_snippet = excluded.last_snippet,
    details      = l.details || jsonb_strip_nulls(
                     excluded.details
                     || case when l.details ? 'tiene_usada' or excluded.details ? 'tiene_usada'
                          then jsonb_build_object(
                                 'tiene_usada',
                                 coalesce((l.details->>'tiene_usada')::boolean, false)
                                 or coalesce((excluded.details->>'tiene_usada')::boolean, false)
                               )
                          else '{}'::jsonb
                        end
                     || case when l.details ? 'reunion' or excluded.details ? 'reunion'
                          then jsonb_build_object(
                                 'reunion',
                                 coalesce((l.details->>'reunion')::boolean, false)
                                 or coalesce((excluded.details->>'reunion')::boolean, false)
                               )
                          else '{}'::jsonb
                        end
                   ),
    last_message_at = now(),
    -- Guarantee #7 from the old RPCs: once a human closes a lead, no ingest
    -- turn may reopen it.
    --
    -- The derivado test reads `l.derivado or excluded.derivado`, not just
    -- `excluded.derivado`. A lead is derived once and stays derived: the very
    -- next turn arrives with p_derivado = false (the bot doesn't re-derive an
    -- already-derived lead), and testing only the incoming value would walk the
    -- lead back to `conversando` on that turn. This mirrors the old RPCs, which
    -- all wrote `when (l.derivado or excluded.derivado) then 'derivado'`.
    stage        = case
                     when l.stage = 'cerrado' then l.stage
                     when l.derivado or excluded.derivado then 'derivado'
                     else 'conversando'
                   end;

  -- v_channel, not p_channel: the messages must land on the same channel the
  -- lead row was just written to, or the composite foreign key has nothing to
  -- point at.
  if coalesce(p_user_msg, '') <> '' then
    insert into public.messages (client_id, channel, session_id, role, content)
    values (p_client_id, v_channel, p_session_id, 'user', p_user_msg);
  end if;

  if coalesce(p_bot_msg, '') <> '' then
    insert into public.messages (client_id, channel, session_id, role, content)
    values (p_client_id, v_channel, p_session_id, 'bot', p_bot_msg);
  end if;
end;
$$;

-- `public` is an exposed schema (see the supabase skill's security
-- checklist): a security definer function must not be reachable by anon/
-- authenticated. n8n calls this exclusively as service_role.
revoke all on function public.ingest_whatsapp_turn(
  uuid, text, text, text, text, text, boolean, jsonb, text, text
) from public, anon, authenticated;

grant execute on function public.ingest_whatsapp_turn(
  uuid, text, text, text, text, text, boolean, jsonb, text, text
) to service_role;

-- 2. Backfill -------------------------------------------------------------
--
-- `notas` and `meta` are deliberately dropped here, not forgotten: verified
-- before writing this migration that both columns are empty across every row
-- in gn_leads and are never referenced anywhere under src/. Carrying them
-- forward would just be dead weight in `details`.
insert into public.leads (
  client_id, channel, session_id, stage, nombre, contacto, intencion,
  calificado, derivado, last_snippet, details, first_contact_at, last_message_at
)
select
  client_id,
  channel,
  session_id,
  -- `cerrado` is tested first on purpose. It is the only stage a human sets by
  -- hand, so it outranks everything, exactly as the old RPCs' stage CASE did.
  -- Testing `derivado` first would silently demote a lead that someone closed
  -- after it had already been derived -- there are no such rows right now
  -- (stage and the derivado flag agree on all 255), but that can change between
  -- writing this migration and running it.
  --
  -- The derivado test reads both the boolean and the old stage text so a row
  -- where the two ever disagreed still lands on `derivado`.
  case
    when stage = 'cerrado' then 'cerrado'
    when derivado or stage = 'derivado' then 'derivado'
    else 'conversando'
  end as stage,
  nombre,
  contacto,
  intencion,
  -- Both booleans are nullable in gn_leads but NOT NULL here, so they need a
  -- floor. `calificado` is null on all 255 rows (the column was carried in the
  -- schema but never written); `derivado` has no nulls today, but its source
  -- column allows them, so it gets the same guard rather than relying on the
  -- current contents.
  coalesce(calificado, false),
  coalesce(derivado, false),
  last_snippet,
  jsonb_strip_nulls(jsonb_build_object(
    'material', material,
    'ubicacion', ubicacion,
    'cantidad_aberturas', cantidad_aberturas,
    'detalle_aberturas', detalle_aberturas,
    'tipo_derivacion', tipo_derivacion,
    'comercial_asignado', comercial_asignado
  )) as details,
  first_contact_at,
  last_message_at
from public.gn_leads;

-- Message content/roles carry over verbatim; created_at is preserved so
-- thread ordering and any future "response time" analytics stay accurate.
insert into public.messages (client_id, channel, session_id, role, content, created_at)
select client_id, channel, session_id, role, content, created_at
from public.gn_messages;

-- 3. Wrappers ---------------------------------------------------------------
--
-- Signatures below are copied verbatim from what pg_get_functiondef() showed
-- on the live database (task 3.3) -- not retyped from memory. fz_ is the one
-- with a DEFAULT on every parameter; gn_ and viviera_ have none. That
-- asymmetry is preserved exactly, since n8n's existing workflow nodes depend
-- on which parameters are optional.

create or replace function public.gn_ingest_whatsapp_turn(
  p_session_id text,
  p_nombre text,
  p_intencion text,
  p_material text,
  p_ubicacion text,
  p_detalle text,
  p_tipo_derivacion text,
  p_derivado boolean,
  p_user_msg text,
  p_bot_msg text
) returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform public.ingest_whatsapp_turn(
    p_client_id  => 'b7859a5a-d306-488a-ba3d-6733ae8430ad'::uuid,
    p_session_id => p_session_id,
    p_channel    => 'whatsapp',
    p_nombre     => p_nombre,
    -- Old RPCs set contacto := p_session_id directly; there was never a
    -- separate contacto parameter. Preserved here rather than left null.
    p_contacto   => p_session_id,
    p_intencion  => p_intencion,
    p_derivado   => p_derivado,
    p_details    => jsonb_strip_nulls(jsonb_build_object(
                       'material', p_material,
                       'ubicacion', p_ubicacion,
                       'detalle_aberturas', p_detalle,
                       'tipo_derivacion', p_tipo_derivacion
                     )),
    p_user_msg   => p_user_msg,
    p_bot_msg    => p_bot_msg
  );
end;
$$;

create or replace function public.fz_ingest_whatsapp_turn(
  p_session_id text default null::text,
  p_nombre text default null::text,
  p_intencion text default null::text,
  p_producto text default null::text,
  p_ubicacion text default null::text,
  p_forma_pago text default null::text,
  p_tiene_usada boolean default false,
  p_usada_modelo text default null::text,
  p_usada_anio text default null::text,
  p_nivel_interes text default null::text,
  p_match_stock text default null::text,
  p_nota_comercial text default null::text,
  p_derivado boolean default false,
  p_sucursal text default null::text,
  p_user_msg text default null::text,
  p_bot_msg text default null::text
) returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform public.ingest_whatsapp_turn(
    p_client_id  => 'f2000000-0000-4000-8000-000000000001'::uuid,
    p_session_id => p_session_id,
    p_channel    => 'whatsapp',
    p_nombre     => p_nombre,
    p_contacto   => p_session_id,
    p_intencion  => p_intencion,
    p_derivado   => p_derivado,
    p_details    => jsonb_strip_nulls(jsonb_build_object(
                       'producto', p_producto,
                       'ubicacion', p_ubicacion,
                       'forma_pago', p_forma_pago,
                       'tiene_usada', p_tiene_usada,
                       'usada_modelo', p_usada_modelo,
                       'usada_anio', p_usada_anio,
                       'nivel_interes', p_nivel_interes,
                       'match_stock', p_match_stock,
                       'nota_comercial', p_nota_comercial,
                       'sucursal', p_sucursal
                     )),
    p_user_msg   => p_user_msg,
    p_bot_msg    => p_bot_msg
  );
end;
$$;

create or replace function public.viviera_ingest_whatsapp_turn(
  p_session_id text,
  p_nombre text,
  p_intencion text,
  p_reunion boolean,
  p_derivado boolean,
  p_tipo_derivacion text,
  p_user_msg text,
  p_bot_msg text
) returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform public.ingest_whatsapp_turn(
    p_client_id  => 'b45141ef-1929-44b6-851a-b213c1491ec6'::uuid,
    p_session_id => p_session_id,
    p_channel    => 'whatsapp',
    p_nombre     => p_nombre,
    p_contacto   => p_session_id,
    p_intencion  => p_intencion,
    p_derivado   => p_derivado,
    p_details    => jsonb_strip_nulls(jsonb_build_object(
                       'reunion', p_reunion,
                       'tipo_derivacion', p_tipo_derivacion
                     )),
    p_user_msg   => p_user_msg,
    p_bot_msg    => p_bot_msg
  );
end;
$$;

-- Run this file in ONE execution, `commit;` included.
--
-- There is no "run it, check, then commit later" path: the Supabase SQL editor
-- does not hold a transaction across executions. Each run gets its own session,
-- and an uncommitted block is discarded when that session is released -- it
-- reports success and persists nothing.
--
-- The gate for this migration was a dry run of exactly these statements ending
-- in `rollback;` instead of `commit;`, executed against production data on
-- 2026-07-20: backfill produced 201 conversando + 54 derivado + 1241 messages,
-- and a three-turn wrapper test confirmed every carry-over guarantee. If the
-- verification counts at the bottom disagree after this commits, the abort path
-- is supabase/rollback/20260720_005_restore_original_rpcs.sql plus
-- `truncate public.messages, public.leads;`.
commit;

-- =============================================================================
-- NOT PART OF THE MIGRATION -- run separately, after this file has been
-- reviewed and applied. Each SELECT is wrapped in its own begin/rollback so
-- none of them leave test data behind.
-- =============================================================================

-- begin;
-- select public.gn_ingest_whatsapp_turn(
--   'test-session-gn-001', 'Juan Perez', 'compra', 'aluminio', 'CABA',
--   '3 ventanas 1.20x1.50', null, false,
--   'Hola, quiero cotizar aberturas', 'Hola Juan! Contame que necesitas'
-- );
-- select * from public.leads where session_id = 'test-session-gn-001';
-- rollback;

-- begin;
-- select public.fz_ingest_whatsapp_turn(
--   p_session_id => 'test-session-fz-001',
--   p_nombre => 'Maria Lopez',
--   p_intencion => 'compra',
--   p_producto => 'Honda Wave 110',
--   p_ubicacion => 'Rosario',
--   p_forma_pago => 'financiado',
--   p_tiene_usada => true,
--   p_usada_modelo => 'Honda Biz 100',
--   p_usada_anio => '2015',
--   p_user_msg => 'Tengo una Biz 2015 para entregar',
--   p_bot_msg => 'Genial, te paso los planes de financiacion'
-- );
-- select * from public.leads where session_id = 'test-session-fz-001';
-- rollback;

-- begin;
-- select public.viviera_ingest_whatsapp_turn(
--   'test-session-viv-001', 'Carlos Gomez', 'consulta', true, false, null,
--   'Quisiera agendar una reunion', 'Perfecto, te paso los horarios disponibles'
-- );
-- select * from public.leads where session_id = 'test-session-viv-001';
-- rollback;

-- Post-migration verification counts (expected: 201 conversando + 54 derivado,
-- 1241 messages):
-- select stage, count(*) from public.leads group by stage;
-- select count(*) from public.messages;
