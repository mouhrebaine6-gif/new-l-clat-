import { supabase } from "@/lib/supabaseClient";
import {
  AR_SKINS,
  GARMENT_CATALOG,
  type AppEventType,
  type ProgressionState,
  type RemoteProgressionSnapshot,
} from "@/lib/progression";

const api = () => supabase?.schema("api");

type SupabaseMaybeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type RemoteSkippedResult = {
  ok: false;
  skipped: true;
  reason?: string;
};

type RemoteErrorResult = {
  ok: false;
  error: SupabaseMaybeError;
};

type RemoteMutationResult<TData = unknown> =
  | { ok: true; data?: TData }
  | RemoteSkippedResult
  | RemoteErrorResult;

type RemoteLoadResult<TData> = { ok: true; data: TData } | RemoteSkippedResult | RemoteErrorResult;

const missingBackendCodes = new Set([
  "42P01",
  "42883",
  "PGRST106",
  "PGRST202",
  "PGRST204",
  "PGRST205",
]);

const isMissingProgressionBackendError = (error: unknown): error is SupabaseMaybeError => {
  if (!error || typeof error !== "object") return false;
  const e = error as SupabaseMaybeError;
  if (e.code && missingBackendCodes.has(e.code)) return true;
  const text = [e.message, e.details, e.hint].filter(Boolean).join(" ").toLowerCase();
  return (
    text.includes('schema "api"') ||
    text.includes("could not find the schema") ||
    text.includes("could not find the table") ||
    text.includes("could not find the function") ||
    text.includes("schema cache") ||
    (text.includes("relation") && text.includes("does not exist")) ||
    (text.includes("function") && text.includes("does not exist"))
  );
};

const skippedProgressionBackend = (error?: SupabaseMaybeError): RemoteSkippedResult => ({
  ok: false,
  skipped: true,
  reason: error?.message || "Remote progression backend is not deployed.",
});

const isLang = (value: unknown): value is ProgressionState["profile"]["lang"] =>
  value === "fr" || value === "en" || value === "ar";

type ProductRef = {
  id?: string;
  fragment_id?: string;
  product_code?: string;
};

type UserGarmentRow = {
  product_id?: string;
  active_skin_id?: string | null;
  status?: string | null;
  products?: ProductRef | ProductRef[] | null;
};

const productFromGarmentRow = (row: UserGarmentRow): ProductRef | null => {
  if (Array.isArray(row.products)) return row.products[0] ?? null;
  return row.products ?? null;
};

const garmentIdFromFragment = (fragmentId?: string) =>
  GARMENT_CATALOG.find((garment) => garment.fragmentId === fragmentId)?.id;

export const syncAppEvent = async (
  eventType: AppEventType,
  payload: Record<string, unknown>,
): Promise<RemoteMutationResult> => {
  const client = api();
  if (!client) return { ok: false as const, skipped: true as const };
  const { error } = await client.rpc("log_app_event", {
    event_type: eventType,
    payload,
  });
  if (error) {
    return isMissingProgressionBackendError(error)
      ? skippedProgressionBackend(error)
      : { ok: false as const, error };
  }
  return { ok: true as const };
};

export const activateGarmentRemote = async (token: string): Promise<RemoteMutationResult> => {
  const client = api();
  if (!client) return { ok: false as const, skipped: true as const };
  const { data, error } = await client.rpc("activate_garment", { token });
  if (error) {
    return isMissingProgressionBackendError(error)
      ? skippedProgressionBackend(error)
      : { ok: false as const, error };
  }
  return { ok: true as const, data };
};

export const claimMissionRewardRemote = async (
  missionId: string,
): Promise<RemoteMutationResult> => {
  const client = api();
  if (!client) return { ok: false as const, skipped: true as const };
  const { data, error } = await client.rpc("claim_mission_reward", { mission_id: missionId });
  if (error) {
    return isMissingProgressionBackendError(error)
      ? skippedProgressionBackend(error)
      : { ok: false as const, error };
  }
  return { ok: true as const, data };
};

export const unlockSkinRemote = async (skinId: string): Promise<RemoteMutationResult> => {
  const client = api();
  if (!client) return { ok: false as const, skipped: true as const };
  const { data, error } = await client.rpc("unlock_skin_if_eligible", { skin_id: skinId });
  if (error) {
    return isMissingProgressionBackendError(error)
      ? skippedProgressionBackend(error)
      : { ok: false as const, error };
  }
  return { ok: true as const, data };
};

export const loadRemoteProgression = async (
  userId: string,
): Promise<RemoteLoadResult<RemoteProgressionSnapshot>> => {
  if (!supabase) return { ok: false as const, skipped: true as const };

  const [profileResult, garmentsResult, missionsResult, skinsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("pseudo, lang, country, level, xp_total, coins, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_garments")
      .select("product_id, active_skin_id, status, products(fragment_id, product_code)")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("user_missions")
      .select("mission_id, progress, completed_at, claimed_at")
      .eq("user_id", userId),
    supabase.from("user_skins").select("skin_id").eq("user_id", userId),
  ]);

  const firstError =
    profileResult.error || garmentsResult.error || missionsResult.error || skinsResult.error;
  if (firstError) {
    return isMissingProgressionBackendError(firstError)
      ? skippedProgressionBackend(firstError)
      : { ok: false as const, error: firstError };
  }

  const profile = profileResult.data;
  const garments = (garmentsResult.data ?? []) as UserGarmentRow[];
  const ownedGarmentIds = garments
    .map((row) => garmentIdFromFragment(productFromGarmentRow(row)?.fragment_id))
    .filter((id): id is string => Boolean(id));
  const remoteActiveSkinId = garments
    .map((row) => row.active_skin_id || undefined)
    .find((skinId) => skinId && AR_SKINS.some((skin) => skin.id === skinId));
  const unlockedSkinIds = ((skinsResult.data ?? []) as Array<{ skin_id?: string }>)
    .map((row) => row.skin_id)
    .filter((id): id is string => Boolean(id));
  const missions = Object.fromEntries(
    (
      (missionsResult.data ?? []) as Array<{
        mission_id?: string;
        progress?: number;
        completed_at?: string | null;
        claimed_at?: string | null;
      }>
    )
      .filter((row) => row.mission_id)
      .map((row) => [
        row.mission_id as string,
        {
          progress: Math.max(0, Number(row.progress ?? 0)),
          completedAt: row.completed_at || undefined,
          claimedAt: row.claimed_at || undefined,
        },
      ]),
  );

  const snapshot: RemoteProgressionSnapshot = {
    profile: profile
      ? {
          mode: "account",
          pseudo: profile.pseudo || "Porteur",
          lang: isLang(profile.lang) ? profile.lang : "fr",
          country: profile.country || undefined,
          level: Math.max(1, Number(profile.level ?? 1)),
          xpTotal: Math.max(0, Number(profile.xp_total ?? 0)),
          coins: Math.max(0, Number(profile.coins ?? 0)),
          createdAt: profile.created_at || undefined,
        }
      : { mode: "account" },
    ownedGarmentIds,
    activeGarmentId: ownedGarmentIds[0],
    unlockedSkinIds,
    activeSkinId: remoteActiveSkinId,
    missions,
  };

  return { ok: true as const, data: snapshot };
};

// Note : le comptage des paliers d'histoire ne passe plus par app_events —
// il vient de public.get_progression (Constitution des scans), cf.
// useStoryScanCounts. Ce module ne gère plus que profil/missions/skins.
