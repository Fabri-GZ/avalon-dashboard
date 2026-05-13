-- Seed pm_user_configs para Lucas y Salma
-- Ejecutar como service_role en el SQL Editor de Supabase
-- Idempotente: si ya existe el secret en Vault lo actualiza; si ya existe la config la sobreescribe

-- ── LUCAS ─────────────────────────────────────────────────────────────────────

do $$
declare
  v_lucas_secret_id uuid;
begin
  select id into v_lucas_secret_id from vault.secrets where name = 'asana_pat_lucas';

  if v_lucas_secret_id is not null then
    perform vault.update_secret(
      v_lucas_secret_id,
      '00135943-b585-4d28-8b85-ce30c26ff705',
      'asana_pat_lucas',
      'Asana PAT - lucas@avalon3.com'
    );
  else
    v_lucas_secret_id := vault.create_secret(
      '00135943-b585-4d28-8b85-ce30c26ff705',
      'asana_pat_lucas',
      'Asana PAT - lucas@avalon3.com'
    );
  end if;

  insert into public.pm_user_configs (user_id, asana_token_secret_id, asana_project_gids)
  select
    id,
    v_lucas_secret_id,
    array[
      '1214267906411177', -- Amsterdamn
      '1210718832603538', -- BIOBEN
      '1212242836234958', -- D BENEDETTO Constructora
      '1214137928981460', -- Garden FREE
      '1213694411564083', -- GRUPO NORTE
      '1210702265905684', -- Hotel Acapulco
      '1214267849403800', -- INSUMA SRL
      '1208272457375417', -- Las Mercedes
      '1210252076517129', -- Mansilla Cards
      '1214267906411130', -- MPF IMPRESOS
      '1211760778143308', -- SISTER
      '1214317439814153', -- TALLON
      '1214064913221960', -- TIF
      '1208103748859865'  -- Viviera
    ]
  from auth.users
  where email = 'lucas@avalon3.com'
  on conflict (user_id) do update set
    asana_token_secret_id = excluded.asana_token_secret_id,
    asana_project_gids    = excluded.asana_project_gids;
end $$;


-- ── SALMA ─────────────────────────────────────────────────────────────────────

do $$
declare
  v_salma_secret_id uuid;
begin
  select id into v_salma_secret_id from vault.secrets where name = 'asana_pat_salma';

  if v_salma_secret_id is not null then
    perform vault.update_secret(
      v_salma_secret_id,
      'a38e6205-2751-4c87-8771-23f4008e647b',
      'asana_pat_salma',
      'Asana PAT - salma@avalon3.com'
    );
  else
    v_salma_secret_id := vault.create_secret(
      'a38e6205-2751-4c87-8771-23f4008e647b',
      'asana_pat_salma',
      'Asana PAT - salma@avalon3.com'
    );
  end if;

  insert into public.pm_user_configs (user_id, asana_token_secret_id, asana_project_gids)
  select
    id,
    v_salma_secret_id,
    array[
      '1211914081209632', -- Sentí
      '1210427153997654', -- Garzón
      '1214064913221960', -- TIF
      '1214137928981460', -- Garden FREE
      '1213522970149470', -- Sedai Sushi (SEDAI SHUSHI en Asana)
      '1213569941796620', -- Best South America Tours
      '1208103748859826', -- María Lujan Ristaurante
      '1208103746629395', -- Terrazas María Luján
      '1212424433920552', -- Cemed
      '1212520601477869', -- Abreaction
      '1214317439814153', -- TALLON
      '1213812321852494'  -- Frakxel (FRAKXELPY en Asana)
    ]
  from auth.users
  where email = 'salma@avalon3.com'
  on conflict (user_id) do update set
    asana_token_secret_id = excluded.asana_token_secret_id,
    asana_project_gids    = excluded.asana_project_gids;
end $$;


-- ── VERIFICACIÓN ──────────────────────────────────────────────────────────────

select u.email, c.asana_token_secret_id, array_length(c.asana_project_gids, 1) as total_proyectos
from public.pm_user_configs c
join auth.users u on u.id = c.user_id;

select name, length(decrypted_secret) as token_length
from vault.decrypted_secrets
where name in ('asana_pat_lucas', 'asana_pat_salma');
