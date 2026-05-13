-- pm_user_configs: per-PM Asana token (stored in Vault) + project GID list
-- Token is stored in vault.secrets — only service_role can decrypt it

create table public.pm_user_configs (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  asana_token_secret_id uuid not null,        -- vault.secrets.id — never the token itself
  asana_project_gids    text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.pm_user_configs enable row level security;
-- No policies for authenticated role — service_role only (reads token via supabaseAdmin)

-- Auto-update updated_at on row change
create or replace function public.pm_user_configs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pm_user_configs_updated_at
  before update on public.pm_user_configs
  for each row execute function public.pm_user_configs_set_updated_at();
