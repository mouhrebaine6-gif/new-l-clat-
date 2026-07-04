create extension if not exists pgcrypto;

create schema if not exists api;
create schema if not exists leclat_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null default 'Porteur',
  lang text not null default 'fr' check (lang in ('fr', 'en', 'ar')),
  country text,
  level int not null default 1 check (level >= 1),
  xp_total int not null default 0 check (xp_total >= 0),
  coins int not null default 0 check (coins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  name text not null,
  fragment_id text not null,
  collection text not null,
  rarity text not null default 'essentiel',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.garment_tokens (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  serial_code text not null unique,
  qr_token_hash text not null unique,
  nfc_uid_hash text unique,
  activated_by uuid references auth.users(id) on delete set null,
  activated_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_garments (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  token_id uuid not null unique references public.garment_tokens(id) on delete restrict,
  serial_code text not null,
  status text not null default 'active' check (status in ('active', 'locked', 'revoked')),
  active_skin_id text,
  activated_at timestamptz not null default now(),
  primary key (user_id, product_id, token_id)
);

create table if not exists public.missions (
  id text primary key,
  title text not null,
  description text not null,
  mission_type text not null,
  target_count int not null check (target_count > 0),
  reward_xp int not null default 0 check (reward_xp >= 0),
  reward_coins int not null default 0 check (reward_coins >= 0),
  active boolean not null default true,
  sort_order int not null default 100
);

create table if not exists public.user_missions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null references public.missions(id) on delete cascade,
  progress int not null default 0 check (progress >= 0),
  completed_at timestamptz,
  claimed_at timestamptz,
  primary key (user_id, mission_id)
);

create table if not exists public.ar_skins (
  id text primary key,
  fragment_id text not null,
  name text not null,
  skin_type text not null,
  unity_model_id text not null unique,
  placement text not null check (placement in ('back', 'side', 'shoulder', 'front')),
  required_level int not null default 1 check (required_level >= 1),
  required_mission_id text references public.missions(id) on delete set null,
  required_product_id uuid references public.products(id) on delete set null,
  preview_available boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 100
);

create table if not exists public.user_skins (
  user_id uuid not null references auth.users(id) on delete cascade,
  skin_id text not null references public.ar_skins(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  source text not null default 'progression',
  primary key (user_id, skin_id)
);

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  trusted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.garment_tokens enable row level security;
alter table public.user_garments enable row level security;
alter table public.missions enable row level security;
alter table public.user_missions enable row level security;
alter table public.ar_skins enable row level security;
alter table public.user_skins enable row level security;
alter table public.app_events enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.garment_tokens from anon, authenticated;
revoke all on table public.user_garments from anon, authenticated;
revoke all on table public.missions from anon, authenticated;
revoke all on table public.user_missions from anon, authenticated;
revoke all on table public.ar_skins from anon, authenticated;
revoke all on table public.user_skins from anon, authenticated;
revoke all on table public.app_events from anon, authenticated;

grant select on table public.products, public.missions, public.ar_skins to anon, authenticated;
grant select on table public.profiles, public.user_garments, public.user_missions, public.user_skins, public.app_events to authenticated;
grant update (pseudo, lang, country, updated_at) on table public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "profiles_update_own_public_fields" on public.profiles;
create policy "profiles_update_own_public_fields"
on public.profiles for update to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "products_read_active" on public.products;
create policy "products_read_active"
on public.products for select to anon, authenticated
using (active);

drop policy if exists "missions_read_active" on public.missions;
create policy "missions_read_active"
on public.missions for select to anon, authenticated
using (active);

drop policy if exists "skins_read_active" on public.ar_skins;
create policy "skins_read_active"
on public.ar_skins for select to anon, authenticated
using (active);

drop policy if exists "user_garments_select_own" on public.user_garments;
create policy "user_garments_select_own"
on public.user_garments for select to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_missions_select_own" on public.user_missions;
create policy "user_missions_select_own"
on public.user_missions for select to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_skins_select_own" on public.user_skins;
create policy "user_skins_select_own"
on public.user_skins for select to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "app_events_select_own" on public.app_events;
create policy "app_events_select_own"
on public.app_events for select to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create or replace function leclat_private.level_from_xp(xp int)
returns int
language sql
stable
as $$
  select case
    when xp >= 900 then 5 + floor(sqrt(greatest(xp - 900, 0) / 180.0))::int
    when xp >= 500 then 4
    when xp >= 250 then 3
    when xp >= 100 then 2
    else 1
  end;
$$;

create or replace function leclat_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'pseudo', 'Porteur'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function leclat_private.handle_new_user();

create or replace function leclat_private.bump_mission(
  p_user_id uuid,
  p_mission_id text,
  p_progress int,
  p_absolute boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target int;
  v_current int;
  v_completed_at timestamptz;
  v_new_progress int;
begin
  select target_count into v_target
  from public.missions
  where id = p_mission_id and active;

  if v_target is null then
    return;
  end if;

  select progress, completed_at
  into v_current, v_completed_at
  from public.user_missions
  where user_id = p_user_id and mission_id = p_mission_id;

  v_current := coalesce(v_current, 0);
  v_new_progress := case
    when p_absolute then least(v_target, greatest(v_current, p_progress))
    else least(v_target, v_current + greatest(p_progress, 0))
  end;

  insert into public.user_missions (user_id, mission_id, progress, completed_at)
  values (
    p_user_id,
    p_mission_id,
    v_new_progress,
    case when v_new_progress >= v_target then coalesce(v_completed_at, now()) end
  )
  on conflict (user_id, mission_id) do update
  set progress = excluded.progress,
      completed_at = case
        when excluded.progress >= v_target then coalesce(public.user_missions.completed_at, now())
        else public.user_missions.completed_at
      end;
end;
$$;

create or replace function leclat_private.apply_event_progress(
  p_user_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_trusted boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_scan_days int;
begin
  if p_event_type = 'garment_scanned' then
    perform leclat_private.bump_mission(p_user_id, 'first_scan', 1, false);

    select count(distinct created_at::date)
    into v_scan_days
    from public.app_events
    where user_id = p_user_id and event_type = 'garment_scanned';

    perform leclat_private.bump_mission(p_user_id, 'scan_three_days', v_scan_days, true);
  elsif p_event_type = 'garment_activated' and p_trusted then
    perform leclat_private.bump_mission(p_user_id, 'first_garment', 1, false);
  elsif p_event_type = 'ar_launched' then
    perform leclat_private.bump_mission(p_user_id, 'open_ar', 1, false);
  elsif p_event_type = 'skin_unlocked' and p_trusted then
    perform leclat_private.bump_mission(p_user_id, 'first_skin', 1, false);
  elsif p_event_type = 'lore_opened' then
    perform leclat_private.bump_mission(p_user_id, 'read_lore', 1, false);
  elsif p_event_type = 'walking_steps' and (p_payload ->> 'server_verified') = 'true' then
    perform leclat_private.bump_mission(
      p_user_id,
      'walk_1000',
      least(1000, greatest((p_payload ->> 'steps_total')::int, 0)),
      true
    );
  elsif p_event_type = 'quiz_completed' and (p_payload ->> 'server_verified') = 'true' then
    perform leclat_private.bump_mission(p_user_id, 'quiz_first', 1, false);
    if coalesce((p_payload ->> 'percent')::int, 0) >= 80 then
      perform leclat_private.bump_mission(p_user_id, 'quiz_80', 1, false);
    end if;
  end if;
end;
$$;

create or replace function api.log_app_event(
  event_type text,
  payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, leclat_private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  insert into public.app_events (user_id, event_type, payload, trusted)
  values (v_user_id, event_type, coalesce(payload, '{}'::jsonb), false)
  returning id into v_event_id;

  perform leclat_private.apply_event_progress(v_user_id, event_type, payload, false);

  return jsonb_build_object('ok', true, 'event_id', v_event_id);
end;
$$;

create or replace function api.activate_garment(token text)
returns jsonb
language plpgsql
security definer
set search_path = public, leclat_private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_hash text := encode(digest(token, 'sha256'), 'hex');
  v_token public.garment_tokens%rowtype;
  v_product public.products%rowtype;
  v_event_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_token
  from public.garment_tokens
  where qr_token_hash = v_hash and disabled_at is null
  for update;

  if v_token.id is null then
    raise exception 'Invalid garment token' using errcode = '22023';
  end if;

  if v_token.activated_by is not null and v_token.activated_by <> v_user_id then
    raise exception 'Garment already activated' using errcode = '23505';
  end if;

  select * into v_product
  from public.products
  where id = v_token.product_id and active;

  update public.garment_tokens
  set activated_by = coalesce(activated_by, v_user_id),
      activated_at = coalesce(activated_at, now())
  where id = v_token.id;

  insert into public.user_garments (user_id, product_id, token_id, serial_code)
  values (v_user_id, v_token.product_id, v_token.id, v_token.serial_code)
  on conflict do nothing;

  insert into public.app_events (user_id, event_type, payload, trusted)
  values (
    v_user_id,
    'garment_activated',
    jsonb_build_object(
      'product_id', v_product.id,
      'fragment_id', v_product.fragment_id,
      'serial_code', v_token.serial_code
    ),
    true
  )
  returning id into v_event_id;

  perform leclat_private.apply_event_progress(v_user_id, 'garment_activated', '{}'::jsonb, true);

  return jsonb_build_object(
    'ok', true,
    'event_id', v_event_id,
    'product_id', v_product.id,
    'fragment_id', v_product.fragment_id,
    'serial_code', v_token.serial_code
  );
end;
$$;

create or replace function api.claim_mission_reward(mission_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, leclat_private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_mission public.missions%rowtype;
  v_user_mission public.user_missions%rowtype;
  v_xp int;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_mission from public.missions where id = mission_id and active;
  select * into v_user_mission
  from public.user_missions
  where user_id = v_user_id and mission_id = claim_mission_reward.mission_id
  for update;

  if v_mission.id is null or v_user_mission.completed_at is null then
    raise exception 'Mission not completed' using errcode = '22023';
  end if;

  if v_user_mission.claimed_at is not null then
    return jsonb_build_object('ok', true, 'already_claimed', true);
  end if;

  update public.user_missions
  set claimed_at = now()
  where user_id = v_user_id and mission_id = claim_mission_reward.mission_id;

  update public.profiles
  set xp_total = xp_total + v_mission.reward_xp,
      coins = coins + v_mission.reward_coins,
      updated_at = now()
  where id = v_user_id
  returning xp_total into v_xp;

  update public.profiles
  set level = leclat_private.level_from_xp(v_xp)
  where id = v_user_id;

  insert into public.app_events (user_id, event_type, payload, trusted)
  values (
    v_user_id,
    'mission_completed',
    jsonb_build_object('mission_id', mission_id, 'reward_xp', v_mission.reward_xp, 'reward_coins', v_mission.reward_coins),
    true
  );

  return jsonb_build_object(
    'ok', true,
    'mission_id', mission_id,
    'reward_xp', v_mission.reward_xp,
    'reward_coins', v_mission.reward_coins,
    'xp_total', v_xp,
    'level', leclat_private.level_from_xp(v_xp)
  );
end;
$$;

create or replace function api.unlock_skin_if_eligible(skin_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, leclat_private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_skin public.ar_skins%rowtype;
  v_profile public.profiles%rowtype;
  v_ok boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_skin from public.ar_skins where id = skin_id and active;
  select * into v_profile from public.profiles where id = v_user_id;

  if v_skin.id is null then
    raise exception 'Unknown skin' using errcode = '22023';
  end if;

  v_ok := v_profile.level >= v_skin.required_level;

  if v_ok and v_skin.required_mission_id is not null then
    v_ok := exists (
      select 1 from public.user_missions
      where user_id = v_user_id
        and mission_id = v_skin.required_mission_id
        and claimed_at is not null
    );
  end if;

  if v_ok and v_skin.required_product_id is not null then
    v_ok := exists (
      select 1 from public.user_garments
      where user_id = v_user_id
        and product_id = v_skin.required_product_id
        and status = 'active'
    );
  end if;

  if not v_ok then
    raise exception 'Skin locked' using errcode = '42501';
  end if;

  insert into public.user_skins (user_id, skin_id, source)
  values (v_user_id, v_skin.id, 'progression')
  on conflict do nothing;

  insert into public.app_events (user_id, event_type, payload, trusted)
  values (
    v_user_id,
    'skin_unlocked',
    jsonb_build_object('skin_id', v_skin.id, 'unity_model_id', v_skin.unity_model_id),
    true
  );

  perform leclat_private.apply_event_progress(v_user_id, 'skin_unlocked', '{}'::jsonb, true);

  return jsonb_build_object('ok', true, 'skin_id', v_skin.id, 'unity_model_id', v_skin.unity_model_id);
end;
$$;

revoke all on schema api from public;
grant usage on schema api to authenticated;
revoke all on function api.log_app_event(text, jsonb) from public;
revoke all on function api.activate_garment(text) from public;
revoke all on function api.claim_mission_reward(text) from public;
revoke all on function api.unlock_skin_if_eligible(text) from public;
grant execute on function api.log_app_event(text, jsonb) to authenticated;
grant execute on function api.activate_garment(text) to authenticated;
grant execute on function api.claim_mission_reward(text) to authenticated;
grant execute on function api.unlock_skin_if_eligible(text) to authenticated;

insert into public.products (id, product_code, name, fragment_id, collection, rarity)
values
  ('00000000-0000-0000-0000-000000000101', 'drop01_eveil', 'T-shirt L''Eveil', 'eveil', 'Drop 01', 'essentiel'),
  ('00000000-0000-0000-0000-000000000102', 'drop01_souffle', 'T-shirt Le Souffle', 'souffle', 'Drop 01', 'essentiel'),
  ('00000000-0000-0000-0000-000000000103', 'drop01_forge', 'T-shirt La Forge', 'forge', 'Drop 01', 'essentiel'),
  ('00000000-0000-0000-0000-000000000104', 'drop01_prisme', 'T-shirt Le Prisme', 'prisme', 'Drop 01', 'essentiel'),
  ('00000000-0000-0000-0000-000000000105', 'drop01_atome', 'T-shirt L''Atome', 'atome', 'Drop 01', 'rare')
on conflict (id) do update
set name = excluded.name,
    fragment_id = excluded.fragment_id,
    collection = excluded.collection,
    rarity = excluded.rarity,
    active = true;

insert into public.missions (id, title, description, mission_type, target_count, reward_xp, reward_coins, sort_order)
values
  ('first_scan', 'Premier scan', 'Scanner un vetement ou un marqueur de test.', 'scan', 1, 75, 20, 10),
  ('first_garment', 'T-shirt active', 'Lier une piece textile au dressing digital.', 'garment', 1, 125, 35, 20),
  ('open_ar', 'Presence AR', 'Ouvrir une experience AR depuis le scan.', 'ar', 1, 90, 25, 30),
  ('scan_three_days', 'Trois jours de signes', 'Scanner sur trois jours differents.', 'scan', 3, 220, 60, 40),
  ('quiz_first', 'Memoire du Voile', 'Reussir une question canonique verifiee serveur.', 'quiz', 1, 80, 20, 50),
  ('quiz_80', 'Porteur attentif', 'Obtenir au moins 80% sur une sequence quiz verifiee serveur.', 'quiz', 1, 180, 50, 60),
  ('walk_1000', 'Marche textile', 'Valider 1000 pas via une source fiable.', 'walk', 1000, 120, 30, 70),
  ('read_lore', 'Archive ouverte', 'Debloquer ou lire une histoire canonique.', 'lore', 1, 110, 25, 80),
  ('first_skin', 'Skin revele', 'Debloquer un skin AR autorise.', 'unlock', 1, 100, 35, 90)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    mission_type = excluded.mission_type,
    target_count = excluded.target_count,
    reward_xp = excluded.reward_xp,
    reward_coins = excluded.reward_coins,
    sort_order = excluded.sort_order,
    active = true;

insert into public.ar_skins (
  id,
  fragment_id,
  name,
  skin_type,
  unity_model_id,
  placement,
  required_level,
  required_mission_id,
  preview_available,
  sort_order
)
values
  ('skin_wings_animated', 'eveil', 'Ailes animees', 'wings', 'FRAGMENT_13_ANIMATED_WING_TEST', 'back', 1, null, true, 10),
  ('skin_angel_wings', 'souffle', 'Ailes ange', 'wings', 'FRAGMENT_10_ANGEL_WINGS_TEST', 'back', 2, 'first_scan', true, 20),
  ('skin_dragon_wings', 'forge', 'Ailes dragon', 'wings', 'FRAGMENT_11_DRAGON_WINGS_TEST', 'back', 3, 'first_garment', false, 30),
  ('skin_side_dragon', 'prisme', 'Dragon cote', 'dragon', 'FRAGMENT_15_DRAGON_TEST', 'side', 5, 'open_ar', false, 40),
  ('skin_shoulder_butterfly', 'atome', 'Papillon epaule', 'companion', 'FRAGMENT_16_ANIMAL_TEST', 'shoulder', 4, 'quiz_first', false, 50),
  ('skin_shoulder_robot', 'forge', 'Robot epaule', 'companion', 'FRAGMENT_17_ROBOT_TEST', 'shoulder', 6, 'walk_1000', false, 60)
on conflict (id) do update
set name = excluded.name,
    skin_type = excluded.skin_type,
    unity_model_id = excluded.unity_model_id,
    placement = excluded.placement,
    required_level = excluded.required_level,
    required_mission_id = excluded.required_mission_id,
    preview_available = excluded.preview_available,
    sort_order = excluded.sort_order,
    active = true;

insert into public.garment_tokens (product_id, serial_code, qr_token_hash)
values
  ('00000000-0000-0000-0000-000000000101', 'TEST-EVEIL-001', encode(digest('LECLAT-EVEIL-TEST', 'sha256'), 'hex')),
  ('00000000-0000-0000-0000-000000000102', 'TEST-SOUFFLE-001', encode(digest('LECLAT-SOUFFLE-TEST', 'sha256'), 'hex')),
  ('00000000-0000-0000-0000-000000000103', 'TEST-FORGE-001', encode(digest('LECLAT-FORGE-TEST', 'sha256'), 'hex')),
  ('00000000-0000-0000-0000-000000000104', 'TEST-PRISME-001', encode(digest('LECLAT-PRISME-TEST', 'sha256'), 'hex')),
  ('00000000-0000-0000-0000-000000000105', 'TEST-ATOME-001', encode(digest('LECLAT-ATOME-TEST', 'sha256'), 'hex'))
on conflict (serial_code) do nothing;

