-- ============================================================================
--  L'ÉCLAT — Constitution des scans (intégrité 100% serveur)
--  Modèle : 1 t-shirt physique = 1 qr_token UNIQUE. Le QR identifie + compte.
--  Rien n'est cru depuis le téléphone : compteur, paliers, plafonds = ici.
-- ============================================================================

-- ----------------------------- TABLES ---------------------------------------
create table if not exists public.tshirts (
  id              uuid primary key default gen_random_uuid(),
  fragment        text not null,                 -- eveil | souffle | forge | prisme | atome | ...
  qr_token        text not null unique,          -- identité du t-shirt physique
  owner_device_id text,                           -- null tant que non réclamé
  claimed_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- 1 ligne = 1 comptage VALIDE (scan visiteur retenu).
create table if not exists public.scans (
  id                uuid primary key default gen_random_uuid(),
  tshirt_id         uuid not null references public.tshirts(id) on delete cascade,
  scanner_device_id text not null,
  nonce             text not null unique,         -- Règle 8 : idempotence / anti-rejeu
  ip                inet,                          -- Règle 10 : anomalies (log)
  created_at        timestamptz not null default now(),
  -- Règle 3 — PLAFOND A : 1 comptage par (device, t-shirt) À VIE.
  constraint scans_one_per_device_tshirt unique (scanner_device_id, tshirt_id)
);
create index if not exists scans_tshirt_idx          on public.scans (tshirt_id);
create index if not exists scans_scanner_created_idx on public.scans (scanner_device_id, created_at desc);

-- --------------------------- HELPER : paliers -------------------------------
-- Règle 6 — access_level dérivé du compteur (100% serveur).
create or replace function public.leclat_access_level(p_count int)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_count >= 40 then 'fragment_deep'
    when p_count >= 20 then 'fragment_bonded'
    when p_count >= 1  then 'fragment_awakened'
    else 'scanner_preview'
  end;
$$;

-- ===================== RPC 1 : claim_tshirt (Règle 1) =======================
-- 1ʳᵉ activation du QR = PROPRIÉTAIRE. 2ᵉ device sur token déjà réclamé = refusé.
create or replace function public.claim_tshirt(p_qr_token text, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_t public.tshirts;
begin
  if coalesce(p_qr_token,'') = '' or coalesce(p_device_id,'') = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_params');
  end if;

  select * into v_t from public.tshirts where qr_token = p_qr_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_token');
  end if;

  if v_t.owner_device_id is null then
    update public.tshirts set owner_device_id = p_device_id, claimed_at = now()
      where id = v_t.id;
    return jsonb_build_object('ok', true, 'fragment', v_t.fragment, 'owner', true, 'status', 'claimed');
  elsif v_t.owner_device_id = p_device_id then
    return jsonb_build_object('ok', true, 'fragment', v_t.fragment, 'owner', true, 'status', 'already_owner');
  else
    return jsonb_build_object('ok', false, 'fragment', v_t.fragment, 'owner', false, 'status', 'already_claimed');
  end if;
end;
$$;

-- ===================== RPC 2 : scan_tshirt (Règles 2-8) =====================
-- Applique : visiteur=+1 (2), plafond A (3, contrainte), plafond B 5/j (4),
-- owner ne compte pas (5), paliers serveur (6), idempotence nonce (7/8).
-- Retourne le format attendu par le pont : access_level + qualified_progress_delta + scan_count.
create or replace function public.scan_tshirt(p_qr_token text, p_device_id text, p_nonce text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_t           public.tshirts;
  v_is_owner    boolean;
  v_today       int;
  v_count       int;
  v_counted     boolean := false;
begin
  if coalesce(p_qr_token,'') = '' or coalesce(p_device_id,'') = '' or coalesce(p_nonce,'') = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_params');
  end if;

  select * into v_t from public.tshirts where qr_token = p_qr_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_token');
  end if;

  v_is_owner := (v_t.owner_device_id is not null and v_t.owner_device_id = p_device_id);

  -- Règle 7/8 — idempotence : nonce déjà vu → on ne recompte pas, on renvoie l'état.
  if exists (select 1 from public.scans where nonce = p_nonce) then
    select count(*) into v_count from public.scans where tshirt_id = v_t.id;
    return jsonb_build_object(
      'ok', true, 'fragment', v_t.fragment, 'is_owner', v_is_owner, 'counted', false,
      'scan_count', v_count,
      'access_level', case when v_is_owner then public.leclat_access_level(v_count) else 'scanner_preview' end,
      'qualified_progress_delta', 0);
  end if;

  -- Règle 5 — le propriétaire qui scanne SON t-shirt ne compte pas.
  if not v_is_owner then
    -- Règle 4 — PLAFOND B : max 5 scans/jour par device.
    select count(*) into v_today from public.scans
      where scanner_device_id = p_device_id and created_at >= date_trunc('day', now());

    if v_today < 5 then
      begin
        -- Règle 2 (+1) ; la contrainte unique applique la Règle 3 (1/à vie).
        insert into public.scans (tshirt_id, scanner_device_id, nonce)
          values (v_t.id, p_device_id, p_nonce);
        v_counted := true;
      exception when unique_violation then
        v_counted := false;  -- déjà compté pour ce (device, t-shirt) ou nonce en course
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
    -- Le visiteur voit un teaser (scanner_preview) ; le proprio voit son vrai palier.
    'access_level', case when v_is_owner then public.leclat_access_level(v_count) else 'scanner_preview' end,
    'qualified_progress_delta', case when v_counted then 1 else 0 end
  );
end;
$$;

-- ===================== RPC 3 : get_progression ==============================
-- État des fragments POSSÉDÉS par ce device (paliers serveur).
create or replace function public.get_progression(p_device_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'fragment',     t.fragment,
    'qr_token',     t.qr_token,
    'scan_count',   c.cnt,
    'access_level', public.leclat_access_level(c.cnt)
  ) order by t.claimed_at), '[]'::jsonb)
  from public.tshirts t
  cross join lateral (
    select count(*)::int as cnt from public.scans s where s.tshirt_id = t.id
  ) c
  where t.owner_device_id = p_device_id;
$$;

-- --------------------------- RLS (Règle 9) ----------------------------------
-- Deny-all en accès direct : le client anon ne peut QUE passer par les RPC
-- (security definer). Pas d'écriture/lecture directe des compteurs.
alter table public.tshirts enable row level security;
alter table public.scans   enable row level security;
-- (aucune policy → tout accès direct refusé pour anon/authenticated)

-- Les RPC sont le seul point d'entrée du client.
grant execute on function public.claim_tshirt(text, text)        to anon, authenticated;
grant execute on function public.scan_tshirt(text, text, text)   to anon, authenticated;
grant execute on function public.get_progression(text)           to anon, authenticated;
revoke execute on function public.leclat_access_level(int) from public;
