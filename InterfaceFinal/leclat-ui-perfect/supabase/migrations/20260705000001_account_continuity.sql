-- ============================================================================
--  L'ÉCLAT — Continuité de compte (2026-07-05)
--
--  POURQUOI :
--  La propriété des t-shirts et la progression d'histoire étaient rattachées
--  au SEUL device_id : changer de téléphone = tout perdre. Désormais, lier son
--  email (magic link, page Profil) attache le téléphone au compte :
--    - `device_links` : les téléphones d'un même compte ;
--    - `link_device()` : appelée par le web à la connexion (idempotente) ;
--    - `get_progression_account()` : progression agrégée de TOUS les
--      téléphones liés (même forme JSON que get_progression) ;
--    - claim/scan_tshirt reconnaissent comme PROPRIÉTAIRE tout téléphone lié
--      au compte du propriétaire (Règle 5 préservée sur le nouveau téléphone).
--  Aucun changement pour les anonymes : auth.uid() NULL = comportement actuel.
--  APPLIQUÉE au projet distant lwpzsqtyhskkcoutufjc le 2026-07-05.
-- ============================================================================

create table if not exists public.device_links (
  user_id   uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  linked_at timestamptz not null default now(),
  primary key (user_id, device_id)
);
create index if not exists device_links_device_idx on public.device_links (device_id);
alter table public.device_links enable row level security;
drop policy if exists device_links_select_own on public.device_links;
create policy device_links_select_own on public.device_links
  for select using (user_id = (select auth.uid()));
-- Pas de policy insert/update/delete : écriture uniquement via link_device().

-- Vrai si p_device appartient au même compte que le propriétaire p_owner_device.
create or replace function public.leclat_same_account(p_owner_device text, p_device text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1 from public.device_links
    where user_id = auth.uid() and device_id = p_owner_device
  );
$$;
revoke execute on function public.leclat_same_account(text, text) from public, anon, authenticated;

create or replace function public.link_device(p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  if coalesce(p_device_id, '') = '' or length(p_device_id) > 128 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_device');
  end if;
  if not public.leclat_throttle('linkdev:' || v_uid::text, 12, interval '1 minute') then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;
  -- Garde-fou : 10 téléphones max par compte.
  if not exists (select 1 from public.device_links where user_id = v_uid and device_id = p_device_id)
     and (select count(*) from public.device_links where user_id = v_uid) >= 10 then
    return jsonb_build_object('ok', false, 'reason', 'too_many_devices');
  end if;
  insert into public.device_links (user_id, device_id)
    values (v_uid, p_device_id)
    on conflict (user_id, device_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;
revoke execute on function public.link_device(text) from public, anon;
grant execute on function public.link_device(text) to authenticated;

-- Progression agrégée du COMPTE (tous les téléphones liés). Même forme que
-- get_progression : [{fragment, scan_count, access_level}].
create or replace function public.get_progression_account()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'fragment',     t.fragment,
    'scan_count',   c.cnt,
    'access_level', public.leclat_access_level(c.cnt)
  ) order by t.claimed_at), '[]'::jsonb)
  from public.tshirts t
  cross join lateral (
    select count(*)::int as cnt from public.scans s where s.tshirt_id = t.id
  ) c
  where auth.uid() is not null
    and t.owner_device_id in (
      select device_id from public.device_links where user_id = auth.uid()
    );
$$;
revoke execute on function public.get_progression_account() from public, anon;
grant execute on function public.get_progression_account() to authenticated;

-- claim_tshirt : un téléphone lié au compte du propriétaire = déjà propriétaire.
create or replace function public.claim_tshirt(p_qr_token text, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_t public.tshirts;
begin
  if coalesce(p_qr_token, '') = '' or coalesce(p_device_id, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_params');
  end if;

  if not public.leclat_throttle('scanrpc:' || public.leclat_client_key(p_device_id), 30, interval '1 minute') then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  select * into v_t from public.tshirts where qr_token = p_qr_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_token');
  end if;

  if v_t.owner_device_id is null then
    update public.tshirts
      set owner_device_id = p_device_id, claimed_at = now()
      where id = v_t.id;
    return jsonb_build_object('ok', true, 'fragment', v_t.fragment, 'owner', true, 'status', 'claimed');
  elsif v_t.owner_device_id = p_device_id
        or public.leclat_same_account(v_t.owner_device_id, p_device_id) then
    return jsonb_build_object('ok', true, 'fragment', v_t.fragment, 'owner', true, 'status', 'already_owner');
  else
    return jsonb_build_object('ok', false, 'fragment', v_t.fragment, 'owner', false, 'status', 'already_claimed');
  end if;
end;
$$;

-- scan_tshirt : idem — le nouveau téléphone du compte ne compte pas comme visiteur.
create or replace function public.scan_tshirt(p_qr_token text, p_device_id text, p_nonce text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t           public.tshirts;
  v_is_owner    boolean;
  v_today       int;
  v_count       int;
  v_counted     boolean := false;
  c_tz constant text := 'UTC';
begin
  if coalesce(p_qr_token, '') = '' or coalesce(p_device_id, '') = '' or coalesce(p_nonce, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_params');
  end if;

  if not public.leclat_throttle('scanrpc:' || public.leclat_client_key(p_device_id), 30, interval '1 minute') then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  select * into v_t from public.tshirts where qr_token = p_qr_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_token');
  end if;

  v_is_owner := (v_t.owner_device_id is not null and v_t.owner_device_id = p_device_id)
                or public.leclat_same_account(v_t.owner_device_id, p_device_id);

  if exists (select 1 from public.scans where nonce = p_nonce) then
    select count(*) into v_count from public.scans where tshirt_id = v_t.id;
    return jsonb_build_object(
      'ok', true, 'fragment', v_t.fragment, 'is_owner', v_is_owner, 'counted', false,
      'scan_count', v_count,
      'access_level', case when v_is_owner then public.leclat_access_level(v_count) else 'scanner_preview' end,
      'qualified_progress_delta', 0
    );
  end if;

  if not v_is_owner then
    perform pg_advisory_xact_lock(hashtext('leclat_scan_device:' || p_device_id));

    select count(*) into v_today
    from public.scans
    where scanner_device_id = p_device_id
      and created_at >= date_trunc('day', now() at time zone c_tz) at time zone c_tz;

    if v_today < 5 then
      begin
        insert into public.scans (tshirt_id, scanner_device_id, nonce)
          values (v_t.id, p_device_id, p_nonce);
        v_counted := true;
      exception when unique_violation then
        v_counted := false;
      end;
    end if;
  end if;

  select count(*) into v_count from public.scans where tshirt_id = v_t.id;

  return jsonb_build_object(
    'ok', true,
    'fragment', v_t.fragment,
    'is_owner', v_is_owner,
    'counted', v_counted,
    'scan_count', v_count,
    'access_level', case when v_is_owner then public.leclat_access_level(v_count) else 'scanner_preview' end,
    'qualified_progress_delta', case when v_counted then 1 else 0 end
  );
end;
$$;

grant execute on function public.claim_tshirt(text, text)      to anon, authenticated;
grant execute on function public.scan_tshirt(text, text, text) to anon, authenticated;
