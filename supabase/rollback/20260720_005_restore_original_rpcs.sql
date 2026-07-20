-- ROLLBACK for migration 20260720_005_crm_ingest_cutover.sql
--
-- Deliberately outside supabase/migrations/ so no migration runner ever picks
-- it up. Run it by hand, and only as part of the full rollback below.
--
-- ⚠️ THIS IS HALF OF A TWO-PART ROLLBACK. Running it alone breaks Grupo Norte.
--
--   1. Revert the Vercel deploy to the commit before PR3, so the dashboard goes
--      back to reading gn_leads / gn_messages.
--   2. Run this file, so the wrappers go back to writing gn_leads / gn_messages.
--
-- Do both, close together. Between step 1 and step 2 the dashboard reads the
-- old tables while the bots still write the new ones: new turns will not show
-- up in the CRM until step 2 lands.
--
-- `leads` and `messages` are intentionally NOT dropped here. They are harmless
-- once nothing writes to them, and keeping them means a retry of the cutover
-- does not have to recreate everything. Drop them separately once you are sure:
--
--   truncate public.messages, public.leads;
--
-- The three bodies below are verbatim pg_get_functiondef() output captured from
-- production on 2026-07-20, before the cutover.

create or replace function public.gn_ingest_whatsapp_turn(p_session_id text, p_nombre text, p_intencion text, p_material text, p_ubicacion text, p_detalle text, p_tipo_derivacion text, p_derivado boolean, p_user_msg text, p_bot_msg text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_client_id uuid := 'b7859a5a-d306-488a-ba3d-6733ae8430ad';
  v_channel   text := 'whatsapp';
begin
  insert into gn_leads as l (
    client_id, channel, session_id, contacto, nombre, intencion, material, ubicacion,
    detalle_aberturas, tipo_derivacion, derivado, stage, last_snippet,
    first_contact_at, last_message_at
  ) values (
    v_client_id, v_channel, p_session_id, p_session_id,
    nullif(p_nombre,''), nullif(p_intencion,''), nullif(p_material,''),
    nullif(p_ubicacion,''), nullif(p_detalle,''), nullif(p_tipo_derivacion,''),
    coalesce(p_derivado,false),
    case
      when coalesce(p_derivado,false) then 'derivado'
      when coalesce(nullif(p_material,''), nullif(p_ubicacion,''),
                    nullif(p_detalle,''), nullif(p_intencion,'')) is not null then 'conversando'
      else 'nuevo'
    end,
    left(p_bot_msg, 120), now(), now()
  )
  on conflict (channel, session_id) do update set
    nombre            = coalesce(nullif(excluded.nombre,''), l.nombre),
    intencion         = coalesce(nullif(excluded.intencion,''), l.intencion),
    material          = coalesce(nullif(excluded.material,''), l.material),
    ubicacion         = coalesce(nullif(excluded.ubicacion,''), l.ubicacion),
    detalle_aberturas = coalesce(nullif(excluded.detalle_aberturas,''), l.detalle_aberturas),
    tipo_derivacion   = coalesce(nullif(excluded.tipo_derivacion,''), l.tipo_derivacion),
    derivado          = l.derivado or excluded.derivado,
    last_snippet      = excluded.last_snippet,
    last_message_at   = now(),
    stage = case
      when l.stage in ('cerrado','sin_respuesta') then l.stage
      when (l.derivado or excluded.derivado) then 'derivado'
      when coalesce(l.material, excluded.material, l.ubicacion, excluded.ubicacion,
                    l.detalle_aberturas, excluded.detalle_aberturas,
                    l.intencion, excluded.intencion) is not null then 'conversando'
      else 'nuevo'
    end;

  if coalesce(p_user_msg,'') <> '' then
    insert into gn_messages (client_id, channel, session_id, role, content)
    values (v_client_id, v_channel, p_session_id, 'user', p_user_msg);
  end if;
  if coalesce(p_bot_msg,'') <> '' then
    insert into gn_messages (client_id, channel, session_id, role, content)
    values (v_client_id, v_channel, p_session_id, 'bot', p_bot_msg);
  end if;
end;
$function$;

create or replace function public.fz_ingest_whatsapp_turn(p_session_id text default null::text, p_nombre text default null::text, p_intencion text default null::text, p_producto text default null::text, p_ubicacion text default null::text, p_forma_pago text default null::text, p_tiene_usada boolean default false, p_usada_modelo text default null::text, p_usada_anio text default null::text, p_nivel_interes text default null::text, p_match_stock text default null::text, p_nota_comercial text default null::text, p_derivado boolean default false, p_sucursal text default null::text, p_user_msg text default null::text, p_bot_msg text default null::text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_client_id uuid := 'f2000000-0000-4000-8000-000000000001';
  v_channel   text := 'whatsapp';
begin
  insert into fz_leads as l (
    client_id, channel, session_id, contacto, nombre, intencion, producto, ubicacion,
    forma_pago, tiene_usada, usada_modelo, usada_anio, nivel_interes, match_stock,
    nota_comercial, sucursal, derivado, stage, last_snippet, first_contact_at, last_message_at
  ) values (
    v_client_id, v_channel, p_session_id, p_session_id,
    nullif(p_nombre,''), nullif(p_intencion,''), nullif(p_producto,''), nullif(p_ubicacion,''),
    nullif(p_forma_pago,''), coalesce(p_tiene_usada,false), nullif(p_usada_modelo,''), nullif(p_usada_anio,''),
    nullif(p_nivel_interes,''), nullif(p_match_stock,''), nullif(p_nota_comercial,''), nullif(p_sucursal,''),
    coalesce(p_derivado,false),
    case
      when coalesce(p_derivado,false) then 'derivado'
      when coalesce(nullif(p_producto,''), nullif(p_ubicacion,''), nullif(p_intencion,'')) is not null then 'conversando'
      else 'nuevo'
    end,
    left(p_bot_msg,120), now(), now()
  )
  on conflict (channel, session_id) do update set
    nombre         = coalesce(nullif(excluded.nombre,''), l.nombre),
    intencion      = coalesce(nullif(excluded.intencion,''), l.intencion),
    producto       = coalesce(nullif(excluded.producto,''), l.producto),
    ubicacion      = coalesce(nullif(excluded.ubicacion,''), l.ubicacion),
    forma_pago     = coalesce(nullif(excluded.forma_pago,''), l.forma_pago),
    tiene_usada    = l.tiene_usada or excluded.tiene_usada,
    usada_modelo   = coalesce(nullif(excluded.usada_modelo,''), l.usada_modelo),
    usada_anio     = coalesce(nullif(excluded.usada_anio,''), l.usada_anio),
    nivel_interes  = coalesce(nullif(excluded.nivel_interes,''), l.nivel_interes),
    match_stock    = coalesce(nullif(excluded.match_stock,''), l.match_stock),
    nota_comercial = coalesce(nullif(excluded.nota_comercial,''), l.nota_comercial),
    sucursal       = coalesce(nullif(excluded.sucursal,''), l.sucursal),
    derivado       = l.derivado or excluded.derivado,
    last_snippet   = excluded.last_snippet,
    last_message_at= now(),
    stage = case
      when l.stage in ('cerrado','sin_respuesta') then l.stage
      when (l.derivado or excluded.derivado) then 'derivado'
      when coalesce(l.producto, excluded.producto, l.ubicacion, excluded.ubicacion, l.intencion, excluded.intencion) is not null then 'conversando'
      else 'nuevo'
    end;

  if coalesce(p_user_msg,'') <> '' then
    insert into fz_messages (client_id, channel, session_id, role, content)
    values (v_client_id, v_channel, p_session_id, 'user', p_user_msg);
  end if;
  if coalesce(p_bot_msg,'') <> '' then
    insert into fz_messages (client_id, channel, session_id, role, content)
    values (v_client_id, v_channel, p_session_id, 'bot', p_bot_msg);
  end if;
end;
$function$;

create or replace function public.viviera_ingest_whatsapp_turn(p_session_id text, p_nombre text, p_intencion text, p_reunion boolean, p_derivado boolean, p_tipo_derivacion text, p_user_msg text, p_bot_msg text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_client_id uuid := 'b45141ef-1929-44b6-851a-b213c1491ec6';
  v_channel   text := 'whatsapp';
begin
  insert into viviera_leads as l (
    client_id, channel, session_id, contacto,
    nombre, intencion, reunion, derivado,
    tipo_derivacion, stage, last_snippet,
    first_contact_at, last_message_at
  ) values (
    v_client_id, v_channel, p_session_id, p_session_id,
    nullif(p_nombre, ''),
    nullif(p_intencion, ''),
    coalesce(p_reunion, false),
    coalesce(p_derivado, false),
    nullif(p_tipo_derivacion, ''),
    case
      when coalesce(p_derivado, false)  then 'derivado'
      when coalesce(p_reunion, false)   then 'reunion_solicitada'
      when coalesce(nullif(p_nombre,''), nullif(p_intencion,'')) is not null then 'conversando'
      else 'nuevo'
    end,
    left(p_bot_msg, 120),
    now(), now()
  )
  on conflict (channel, session_id) do update set
    nombre            = coalesce(nullif(excluded.nombre, ''),          l.nombre),
    intencion         = coalesce(nullif(excluded.intencion, ''),       l.intencion),
    reunion           = l.reunion or excluded.reunion,
    derivado          = l.derivado or excluded.derivado,
    tipo_derivacion   = coalesce(nullif(excluded.tipo_derivacion, ''), l.tipo_derivacion),
    last_snippet      = excluded.last_snippet,
    last_message_at   = now(),
    stage = case
      when l.stage in ('cerrado', 'sin_respuesta') then l.stage
      when (l.derivado or excluded.derivado)         then 'derivado'
      when (l.reunion  or excluded.reunion)          then 'reunion_solicitada'
      when coalesce(l.nombre, excluded.nombre, l.intencion, excluded.intencion) is not null
                                                     then 'conversando'
      else 'nuevo'
    end;

  if coalesce(p_user_msg, '') <> '' then
    insert into viviera_messages (client_id, channel, session_id, role, content)
    values (v_client_id, v_channel, p_session_id, 'user', p_user_msg);
  end if;
  if coalesce(p_bot_msg, '') <> '' then
    insert into viviera_messages (client_id, channel, session_id, role, content)
    values (v_client_id, v_channel, p_session_id, 'bot', p_bot_msg);
  end if;
end;
$function$;
