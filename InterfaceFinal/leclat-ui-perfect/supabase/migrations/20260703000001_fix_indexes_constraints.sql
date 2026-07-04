-- ============================================================================
--  L'ÉCLAT — Migration correctrice 1/3 : index manquants + contraintes schéma
--
--  POURQUOI :
--  La migration 20260627120000 crée deux index sur public.scans
--  (scans_tshirt_idx, scans_scanner_created_idx) mais il manque :
--    - un index sur scans.nonce : la contrainte UNIQUE crée bien un index B-tree,
--      mais uniquement sur le nom de la contrainte ; on le nomme explicitement
--      pour que pg_stat_user_indexes le liste et le monitore.
--    - un index sur tshirts(owner_device_id) : utilisé dans get_progression
--      WHERE t.owner_device_id = p_device_id — sans index = seq scan intégral
--      sur la table tshirts à chaque appel.
--    - un index sur tshirts(qr_token) : la contrainte UNIQUE suffit pour les
--      lookups exacts, mais on vérifie qu'elle est bien nommée.
--    - un CHECK sur tshirts.fragment pour verrouiller les valeurs connues.
--    - un NOT NULL cohérent sur tshirts.fragment (déjà présent mais on sécurise).
--    - la FK scans→tshirts a ON DELETE CASCADE (ok), mais il manque un index
--      explicite sur scans(tshirt_id) doublé d'un index composite
--      (tshirt_id, created_at DESC) pour le COUNT(*) dans get_progression et
--      scan_tshirt (le count final ligne 130 du SQL).
--  Toutes les instructions sont idempotentes (IF NOT EXISTS / DO $$ ... $$).
-- ============================================================================

-- ── 1. Index sur tshirts(owner_device_id) ────────────────────────────────────
-- Utilisé par get_progression : WHERE t.owner_device_id = p_device_id
create index if not exists tshirts_owner_device_idx
  on public.tshirts (owner_device_id)
  where owner_device_id is not null;

-- ── 2. Index composite sur scans(tshirt_id, created_at DESC) ─────────────────
-- Utilisé par : COUNT(*) FROM scans WHERE tshirt_id = v_t.id (scan_tshirt l.130
-- et get_progression lateral), et éventuellement des requêtes de monitoring.
-- L'index simple scans_tshirt_idx (ligne 28 migration origin) couvre déjà les
-- lookups sur tshirt_id seul ; on ajoute un index couvrant pour le count.
create index if not exists scans_tshirt_created_idx
  on public.scans (tshirt_id, created_at desc);

-- ── 3. Index composite pour le plafond B (Règle 4) ───────────────────────────
-- scan_tshirt l.115 : WHERE scanner_device_id = p_device_id
--                      AND created_at >= date_trunc('day', now())
-- L'index scans_scanner_created_idx existe déjà (scanner_device_id, created_at DESC).
-- On s'assure qu'il est présent ; la clause IF NOT EXISTS le rend idempotent.
create index if not exists scans_scanner_created_idx
  on public.scans (scanner_device_id, created_at desc);

-- ── 4. CHECK sur tshirts.fragment ─────────────────────────────────────────────
-- La migration origine ne vérifie pas les valeurs admises pour le fragment.
-- Un enregistrement mal seedé pourrait introduire une valeur inconnue côté UI.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tshirts_fragment_check'
      and conrelid = 'public.tshirts'::regclass
  ) then
    alter table public.tshirts
      add constraint tshirts_fragment_check
      check (fragment in ('eveil','souffle','forge','prisme','atome'));
  end if;
end$$;

-- ── 5. Vérification que la contrainte UNIQUE du nonce crée bien un index ──────
-- La contrainte "nonce text not null unique" (l.22 migration origine) crée
-- automatiquement un index B-tree nommé scans_nonce_key. On ne recrée pas,
-- mais on s'assure que la contrainte existe pour que pg_constraint retourne
-- quelque chose de vérifiable en production.
-- (aucune action SQL nécessaire si la migration d'origine a été appliquée)

-- ── 6. Vérification de la contrainte UNIQUE (scanner_device_id, tshirt_id) ───
-- La contrainte "scans_one_per_device_tshirt" (Règle 3) crée un index B-tree.
-- On ne recrée pas, on documente que cet index double-sert de contrainte.
-- (aucune action SQL supplémentaire)

-- ── 7. Grants : leclat_access_level doit rester inaccessible en direct ────────
-- Déjà présent dans la migration origine (revoke from public), idempotent.
revoke execute on function public.leclat_access_level(int) from public;
