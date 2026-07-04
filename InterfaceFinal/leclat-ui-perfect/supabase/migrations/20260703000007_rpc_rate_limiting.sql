-- ============================================================================
--  L'ÉCLAT — Migration correctrice 7 : rate limiting serveur des RPC scan
--
--  POURQUOI :
--  claim_tshirt / scan_tshirt sont exposées à `anon` (flux anonyme par device,
--  voulu par la Constitution). Sans garde-fou, un script peut brute-forcer des
--  tokens ou spammer les RPC. Limite : ~30 appels/minute par IP (header
--  x-forwarded-for fourni par PostgREST), repli sur le device_id si l'IP est
--  indisponible. Généreux pour un humain, bloquant pour un script.
--  APPLIQUÉE au projet distant lwpzsqtyhskkcoutufjc le 2026-07-03
--  (avec le correctif RETURNING t.hits — alias obligatoire).
-- ============================================================================

create table if not exists public.rpc_throttle (
  bucket text primary key,
  window_start timestamptz not null,
  hits int not null
);
alter table public.rpc_throttle enable row level security; -- deny-all volontaire

create or replace function public.leclat_throttle(p_bucket text, p_limit int, p_window interval)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_allowed boolean;
begin
  -- Nettoyage opportuniste (~1 % des appels) : la table reste minuscule.
  if random() < 0.01 then
    delete from public.rpc_throttle where window_start < now() - interval '1 day';
  end if;

  insert into public.rpc_throttle as t (bucket, window_start, hits)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    hits = case when t.window_start < now() - p_window then 1 else t.hits + 1 end,
    window_start = case when t.window_start < now() - p_window then now() else t.window_start end
  returning t.hits <= p_limit into v_allowed;
  return coalesce(v_allowed, true);
end$$;

revoke execute on function public.leclat_throttle(text, int, interval) from public, anon, authenticated;

-- Clé client : première IP de x-forwarded-for, sinon le device_id.
create or replace function public.leclat_client_key(p_device_id text)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    nullif(split_part(coalesce(current_setting('request.headers', true), '{}')::json->>'x-forwarded-for', ',', 1), ''),
    p_device_id);
$$;

revoke execute on function public.leclat_client_key(text) from public, anon, authenticated;

-- claim_tshirt et scan_tshirt redéfinies avec le garde-fou en tête :
--   if not public.leclat_throttle('scanrpc:' || public.leclat_client_key(p_device_id), 30, interval '1 minute') then
--     return jsonb_build_object('ok', false, 'reason', 'rate_limited');
--   end if;
-- (corps complets identiques à 20260703000003 ; voir l'historique des
--  migrations distantes `leclat_rpc_rate_limiting` pour le SQL exact appliqué)
