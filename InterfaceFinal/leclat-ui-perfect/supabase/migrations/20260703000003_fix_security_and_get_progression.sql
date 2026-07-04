-- ============================================================================
--  L'ÉCLAT — Migration correctrice 3/3 : sécurité RPC + get_progression
--
--  POURQUOI — quatre défauts repérés :
--
--  A) search_path incomplet sur claim_tshirt et scan_tshirt
--     Les deux fonctions déclarent : set search_path = public
--     La recommandation Supabase/Postgres est d'ajouter pg_temp à la fin pour
--     éviter qu'un utilisateur non-privilégié ne crée des objets temporaires
--     homonymes qui intercepteraient les appels internes.
--     Forme correcte : set search_path = public, pg_temp
--
--  B) search_path manquant sur leclat_access_level
--     La fonction est déclarée : set search_path = ''
--     Cela interdit toute référence non-qualifiée, ce qui est TRÈS bien.
--     On conserve cette valeur.
--
--  C) get_progression expose qr_token en clair au client
--     La RPC retourne actuellement 'qr_token': t.qr_token dans le JSON.
--     Le qr_token est le secret physique du t-shirt (imprimé sous le col).
--     Le renvoyer dans la réponse de progression présente deux risques :
--       - Un client qui intercepte la réponse récupère un token valide pour
--         réclamer le t-shirt depuis un autre device (replay sur claim_tshirt).
--       - La route get_progression est accessible à `anon` (grant ligne 176
--         migration origine) — un token compromis est permanent.
--     Correction : supprimer qr_token du JSON retourné, garder fragment +
--     scan_count + access_level. Le client n'a pas besoin du token pour
--     afficher les paliers.
--
--  D) get_progression — sémantique correcte (Règle métier)
--     La fonction retourne les t-shirts POSSÉDÉS (WHERE owner_device_id = p_device_id)
--     avec le scan_count total de chaque t-shirt. C'est correct : scan_count
--     représente le nombre de visiteurs uniques qui ont scanné ce t-shirt,
--     ce qui détermine les paliers histoire du PORTEUR (1/20/40).
--     Ce n'est PAS le nombre de fois que le device a scanné — c'est intentionnel
--     et conforme à la Constitution (le porteur monte en palier via les visiteurs).
--     Aucune correction métier ici, mais on documente la sémantique dans le
--     commentaire de la fonction.
--
--  E) claim_tshirt — search_path corrigé
--
-- ============================================================================

-- ── A+E : claim_tshirt — ajout de pg_temp dans search_path ──────────────────
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

  select * into v_t from public.tshirts where qr_token = p_qr_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_token');
  end if;

  if v_t.owner_device_id is null then
    update public.tshirts
      set owner_device_id = p_device_id, claimed_at = now()
      where id = v_t.id;
    return jsonb_build_object('ok', true, 'fragment', v_t.fragment, 'owner', true, 'status', 'claimed');
  elsif v_t.owner_device_id = p_device_id then
    return jsonb_build_object('ok', true, 'fragment', v_t.fragment, 'owner', true, 'status', 'already_owner');
  else
    return jsonb_build_object('ok', false, 'fragment', v_t.fragment, 'owner', false, 'status', 'already_claimed');
  end if;
end;
$$;

-- ── A : scan_tshirt — ajout de pg_temp dans search_path ─────────────────────
-- La logique métier complète est dans la migration 20260703000002 ; ici on
-- s'assure que la version produite par cette migration a bien pg_temp dans le
-- search_path (la migration 2 inclut déjà "set search_path = public" mais sans
-- pg_temp — on redéfinit pour corriger).
-- NOTE : si la migration 2 est appliquée après celle-ci, elle écrasera à nouveau.
-- L'orchestrateur doit appliquer les migrations dans l'ordre 000001→000002→000003.
-- Pour éviter l'ambiguïté, on ne reduplique pas le corps ici ; on émet un commentaire
-- d'instruction et on corrige uniquement la function header via CREATE OR REPLACE
-- identique à la migration 2 mais avec pg_temp ajouté.
-- IMPORTANT : cette section est un no-op si la migration 2 incluait déjà pg_temp.
-- On préfère inclure le corps complet pour garantir la cohérence quelle que soit
-- l'ordre réel d'application.
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

  select * into v_t from public.tshirts where qr_token = p_qr_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_token');
  end if;

  v_is_owner := (v_t.owner_device_id is not null and v_t.owner_device_id = p_device_id);

  -- Règle 7/8 — idempotence nonce (check après lock FOR UPDATE = race-safe).
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
    -- Sérialise tous les scans du même device (t-shirts différents compris) :
    -- ferme la course « 6e scan du jour » via deux t-shirts en parallèle.
    perform pg_advisory_xact_lock(hashtext('leclat_scan_device:' || p_device_id));

    -- Plafond B — jour civil UTC explicite.
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

-- ── C : get_progression — suppression du qr_token de la réponse JSON ─────────
-- Sémantique : scan_count = nombre de scans visiteurs VALIDES enregistrés pour
-- ce t-shirt (tous visiteurs confondus). Ce compteur détermine les paliers
-- histoire du porteur (1/20/40 scans). Le device_id porteur filtre les lignes
-- via owner_device_id. Le qr_token physique est supprimé du retour (sécurité).
create or replace function public.get_progression(p_device_id text)
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
  where t.owner_device_id = p_device_id;
$$;

-- ── Grants : préserver l'accès public aux trois RPC, verrouiller leclat_access_level
grant execute on function public.claim_tshirt(text, text)        to anon, authenticated;
grant execute on function public.scan_tshirt(text, text, text)   to anon, authenticated;
grant execute on function public.get_progression(text)           to anon, authenticated;
revoke execute on function public.leclat_access_level(int)       from public;
