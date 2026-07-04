-- ============================================================================
--  L'ÉCLAT — Migration correctrice 2/3 : plafond B (Règle 4) + race-condition
--
--  POURQUOI — deux défauts dans scan_tshirt (migration 20260627120000) :
--
--  A) FUSEAU HORAIRE DU PLAFOND B (Règle 4 — 5 scans/jour/device)
--     La fenêtre temporelle est actuellement :
--       created_at >= date_trunc('day', now())
--     `now()` sans précision de fuseau renvoie l'heure UTC dans Supabase/PG.
--     Un device situé en Algérie (UTC+1) qui scanne à 23h30 heure locale
--     peut donc obtenir un nouveau quota à 23h00 UTC et contourner le plafond
--     en scannant 5 fois avant minuit UTC, puis 5 fois après.
--     La constitution ne précise pas de fuseau explicite. Deux options :
--       - Rester UTC et l'assumer explicitement (comportement prévisible,
--         recommandé pour la V1 car le serveur ne connaît pas le TZ du device).
--       - Utiliser Africa/Algiers (UTC+1) si le marché est 100 % algérien.
--     On choisit ici UTC explicite avec la timezone du serveur fixée, ce qui
--     rend le comportement identique à l'actuel mais documenté et auditable.
--     Si un choix métier différent est voulu, changer 'UTC' par 'Africa/Algiers'.
--
--  B) RACE CONDITION entre le COUNT(plafond B) et l'INSERT
--     Flux actuel :
--       1. COUNT(*) WHERE scanner_device_id = p_device_id AND created_at >= ...
--       2. if v_today < 5 then INSERT ...
--     Entre 1 et 2, deux sessions concurrentes du même device peuvent toutes
--     deux lire v_today = 4 et toutes deux insérer, dépassant le plafond.
--     La contrainte UNIQUE sur (scanner_device_id, tshirt_id) protège contre
--     le double-comptage du MÊME t-shirt, mais deux t-shirts différents peuvent
--     être insérés simultanément pour le 6ème scan de la journée.
--
--     Solution : lire le COUNT avec un SELECT ... FOR SHARE sur les lignes du
--     jour, ou plus simplement reformuler l'INSERT avec une CTE qui fait le
--     count et l'insert atomiquement via INSERT ... SELECT WHERE count < 5.
--     On remplace la fonction entière par une version corrigée.
--
--  C) nonce idempotent : on vérifie scan_tshirt avant l'acquisition du FOR UPDATE
--     Le check nonce (l.103) est fait AVANT le FOR UPDATE sur tshirts.
--     Une session peut lire "nonce absent" pendant qu'une autre est en train
--     d'insérer ce même nonce. On déplace le check nonce APRÈS le lock.
--     Cela rend le check plus sûr : si deux requêtes arrivent avec le même nonce
--     simultanément, seule la première passera le FOR UPDATE ; la seconde verra
--     le nonce déjà en base et retournera l'état idempotent.
--
-- ============================================================================

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
  -- Fuseau utilisé pour le plafond B — jour civil UTC (documenté explicitement).
  -- Changer en 'Africa/Algiers' si la journée algérienne locale est requise.
  c_tz constant text := 'UTC';
begin
  -- Validation des paramètres d'entrée.
  if coalesce(p_qr_token, '') = '' or coalesce(p_device_id, '') = '' or coalesce(p_nonce, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_params');
  end if;

  -- Lock du t-shirt EN PREMIER → toute la suite de la transaction est sérialisée
  -- par ce verrou, y compris le check nonce et le count du plafond B.
  select * into v_t from public.tshirts where qr_token = p_qr_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_token');
  end if;

  v_is_owner := (v_t.owner_device_id is not null and v_t.owner_device_id = p_device_id);

  -- Règle 7/8 — idempotence : check nonce APRÈS le lock (race-safe).
  -- Si le même nonce arrive deux fois en parallèle, la deuxième session
  -- attendra le verrou et verra le nonce déjà inséré par la première.
  if exists (select 1 from public.scans where nonce = p_nonce) then
    select count(*) into v_count from public.scans where tshirt_id = v_t.id;
    return jsonb_build_object(
      'ok', true, 'fragment', v_t.fragment, 'is_owner', v_is_owner, 'counted', false,
      'scan_count', v_count,
      'access_level', case when v_is_owner then public.leclat_access_level(v_count) else 'scanner_preview' end,
      'qualified_progress_delta', 0
    );
  end if;

  -- Règle 5 — le propriétaire qui scanne SON t-shirt ne compte pas.
  if not v_is_owner then
    -- Sérialise TOUS les scans du même device (t-shirts différents compris) :
    -- ferme la course « 6e scan du jour » via deux t-shirts en parallèle.
    perform pg_advisory_xact_lock(hashtext('leclat_scan_device:' || p_device_id));

    -- Règle 4 — PLAFOND B : max 5 scans/jour par device (jour civil UTC explicite).
    select count(*) into v_today
    from public.scans
    where scanner_device_id = p_device_id
      and created_at >= date_trunc('day', now() at time zone c_tz) at time zone c_tz;

    if v_today < 5 then
      begin
        -- Règle 2 (+1) ; la contrainte UNIQUE applique la Règle 3 (1/à vie).
        insert into public.scans (tshirt_id, scanner_device_id, nonce)
          values (v_t.id, p_device_id, p_nonce);
        v_counted := true;
      exception when unique_violation then
        -- Déjà compté pour ce (device, t-shirt) OU nonce en course (normalement
        -- capté plus haut, mais on gère le cas limite).
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
