-- ============================================================================
--  L'ÉCLAT — Migration correctrice 4/4 : index app_events (schéma progression)
--
--  POURQUOI :
--  loadRemoteFragmentScanCounts (web) lit :
--    SELECT payload FROM app_events
--    WHERE event_type = 'garment_scanned' AND user_id = <auth.uid via RLS/.eq>
--    ORDER BY created_at DESC LIMIT 1000
--  Sans index adapté, c'est un seq scan + tri sur toute la table — lent dès
--  ~100 000 événements. L'index composite couvre le filtre ET le tri.
--  Idempotent (IF NOT EXISTS).
-- ============================================================================

create index if not exists app_events_user_type_created_idx
  on public.app_events (user_id, event_type, created_at desc);
