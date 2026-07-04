-- ============================================================================
--  L'ÉCLAT — Migration correctrice 5 : index couvrants des FK
--
--  POURQUOI :
--  L'advisor performance Supabase (2026-07-03) signale 9 FK sans index couvrant
--  sur les tables du schéma progression. Les tables user_* grossissent avec les
--  utilisateurs ; sans index, les jointures et les vérifications ON DELETE
--  dégénèrent en seq scans. Idempotent (IF NOT EXISTS).
--  APPLIQUÉE au projet distant lwpzsqtyhskkcoutufjc le 2026-07-03.
-- ============================================================================

create index if not exists ar_skins_required_mission_idx on public.ar_skins (required_mission_id) where required_mission_id is not null;
create index if not exists ar_skins_required_product_idx on public.ar_skins (required_product_id) where required_product_id is not null;
create index if not exists garment_tokens_activated_by_idx on public.garment_tokens (activated_by) where activated_by is not null;
create index if not exists garment_tokens_product_idx on public.garment_tokens (product_id);
create index if not exists offline_queue_porteur_idx on public.offline_queue (porteur_id);
create index if not exists scan_events_porteur_idx on public.scan_events (porteur_id);
create index if not exists user_garments_product_idx on public.user_garments (product_id);
create index if not exists user_missions_mission_idx on public.user_missions (mission_id);
create index if not exists user_skins_skin_idx on public.user_skins (skin_id);
