import { getFragment } from "@/data/fragments";
import { scanTshirt, ensureClaimed, hasSupabaseScanBackend } from "./supabaseScan";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "";

export type ScanAccessLevel =
  | "scanner_preview"
  | "fragment_awakened"
  | "fragment_bonded"
  | "fragment_deep";

export type BondStatus =
  | "none"
  | "seen"
  | "awakened"
  | "bonded_active"
  | "bonded_dormant"
  | "bonded_frozen"
  | "bonded_revoked"
  | "deep_active";

export type ScanTier = "preview" | "porteur" | "profond";

export type ScanResolution = {
  fragment_id: string;
  public_code: string;
  access_level: ScanAccessLevel;
  bond_status: BondStatus;
  qualified_progress_delta: number;
  legacy_tier: ScanTier;
  source: "backend" | "local_preview";
  context_confirmed: boolean;
  /** Vérité serveur : false = scan du t-shirt d'un AUTRE porteur (visiteur). */
  is_owner?: boolean;
  scan_session_id?: string;
  ephemeral_token?: string;
  expires_at?: string;
  anti_abuse_flags?: string[];
};

export type ScanResolveInput = {
  qrToken: string;
  sceauId: string;
  hint?: string;
  markerId?: string;
  scanSessionId?: string;
  poseQuality?: number;
  stabilityMs?: number;
  /** Nonce d'idempotence stable pour toute la tentative (retries compris). */
  nonce?: string;
};

type BackendResolvePayload = Record<string, unknown>;

export const hasScanBackend = () => API_BASE.length > 0;

export const normalizePublicCode = (raw: string): string => {
  const value = raw.trim();
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const qIndex = parts.findIndex((p) => p.toLowerCase() === "q");
    if (qIndex >= 0 && parts[qIndex + 1]) return cleanCode(parts[qIndex + 1]);
  } catch {
    // Not a URL, keep parsing as an opaque token.
  }

  const withoutQuery = value.split(/[?#]/)[0] || value;
  const tail = withoutQuery.split(/[\\/]/).filter(Boolean).pop() || withoutQuery;
  return cleanCode(tail);
};

export const isProgressionAccess = (access: ScanAccessLevel) => access !== "scanner_preview";

export const accessLevelToTier = (access: ScanAccessLevel): ScanTier => {
  if (access === "fragment_deep") return "profond";
  if (access === "fragment_awakened" || access === "fragment_bonded") return "porteur";
  return "preview";
};

export const accessLevelToBondStatus = (access: ScanAccessLevel): BondStatus => {
  if (access === "fragment_deep") return "deep_active";
  if (access === "fragment_bonded") return "bonded_active";
  if (access === "fragment_awakened") return "awakened";
  return "seen";
};

export const createLocalPreviewResolution = (
  fragmentId: string,
  qrToken: string,
): ScanResolution => ({
  fragment_id: fragmentId,
  public_code: normalizePublicCode(qrToken),
  access_level: "scanner_preview",
  bond_status: "seen",
  qualified_progress_delta: 0,
  legacy_tier: "preview",
  source: "local_preview",
  context_confirmed: false,
});

export async function resolveLeclatScan(input: ScanResolveInput): Promise<ScanResolution> {
  const publicCode = normalizePublicCode(input.qrToken);

  // Backend Supabase (Constitution des scans) prioritaire s'il est configuré.
  // Le serveur tranche : access_level + qualified_progress_delta réels.
  if (hasSupabaseScanBackend()) {
    await ensureClaimed(input.qrToken); // 1ʳᵉ activation du QR = propriétaire (Règle 1)
    const server = await scanTshirt(input.qrToken, input.nonce);
    if (server && server.ok) {
      const access = normalizeAccessLevel(server.access_level);
      return {
        fragment_id: server.fragment || inferFragmentId(input.hint, input.qrToken) || "",
        public_code: publicCode,
        access_level: access,
        bond_status: accessLevelToBondStatus(access),
        qualified_progress_delta:
          access === "scanner_preview" ? 0 : clampProgressDelta(server.qualified_progress_delta),
        legacy_tier: accessLevelToTier(access),
        source: "backend",
        context_confirmed: true,
        is_owner: server.is_owner === true || server.owner === true,
      };
    }
    // Serveur indisponible / token inconnu → aperçu local (montre l'AR, ne compte pas).
  }

  if (!API_BASE) {
    const fragmentId = inferFragmentId(input.hint, input.qrToken);
    if (!fragmentId) throw new Error("no_backend_no_hint");
    return createLocalPreviewResolution(fragmentId, input.qrToken);
  }

  const resolveRes = await fetch(`${API_BASE}/v1/scan/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sceau": input.sceauId },
    credentials: "include",
    body: JSON.stringify({
      public_code: publicCode,
      token: input.qrToken,
      session_id: input.scanSessionId,
      app_version: "webview",
      platform: "webview",
      account_id: input.sceauId,
    }),
  });

  if (!resolveRes.ok) throw new Error(`HTTP ${resolveRes.status}`);
  let resolution = normalizeBackendResolution(await resolveRes.json(), publicCode, input.hint);

  const canConfirmContext =
    resolution.scan_session_id &&
    resolution.ephemeral_token &&
    (input.markerId || input.poseQuality !== undefined || input.stabilityMs !== undefined);

  if (!canConfirmContext) return resolution;

  try {
    const confirmRes = await fetch(`${API_BASE}/v1/scan/confirm-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sceau": input.sceauId },
      credentials: "include",
      body: JSON.stringify({
        scan_session_id: resolution.scan_session_id,
        ephemeral_token: resolution.ephemeral_token,
        context_type: "embroidered_logo",
        tracked_logo_seen: Boolean(input.markerId || input.poseQuality),
        ar_session_present: true,
        verification: {
          marker_id: input.markerId,
          pose_quality: input.poseQuality,
          stability_ms: input.stabilityMs,
        },
      }),
    });

    if (!confirmRes.ok) return resolution;
    const confirmed = normalizeBackendResolution(
      await confirmRes.json(),
      publicCode,
      resolution.fragment_id,
    );
    resolution = {
      ...resolution,
      ...confirmed,
      fragment_id: confirmed.fragment_id || resolution.fragment_id,
      public_code: publicCode,
      context_confirmed: true,
    };
  } catch {
    return resolution;
  }

  return resolution;
}

function normalizeBackendResolution(
  raw: BackendResolvePayload,
  publicCode: string,
  fallbackFragment?: string,
): ScanResolution {
  const fragmentId =
    asString(raw.fragment_id) || asString(raw.fragmentId) || fallbackFragment || "";
  const access = normalizeAccessLevel(raw.access_level ?? raw.new_access_level ?? raw.tier);
  const bondStatus = normalizeBondStatus(raw.bond_status) || accessLevelToBondStatus(access);
  const delta = clampProgressDelta(raw.qualified_progress_delta ?? raw.progress_delta);

  return {
    fragment_id: fragmentId,
    public_code: asString(raw.public_code) || publicCode,
    access_level: access,
    bond_status: bondStatus,
    qualified_progress_delta: access === "scanner_preview" ? 0 : delta,
    legacy_tier: accessLevelToTier(access),
    source: "backend",
    context_confirmed: Boolean(raw.context_confirmed),
    scan_session_id: asString(raw.scan_session_id),
    ephemeral_token: asString(raw.ephemeral_token) || asString(raw.ephemeral_key),
    expires_at: asString(raw.expires_at),
    anti_abuse_flags: Array.isArray(raw.anti_abuse_flags)
      ? raw.anti_abuse_flags.filter((flag): flag is string => typeof flag === "string")
      : undefined,
  };
}

function normalizeAccessLevel(value: unknown): ScanAccessLevel {
  const v = String(value || "").toLowerCase();
  if (v === "fragment_deep" || v === "profond" || v === "deep") return "fragment_deep";
  if (v === "fragment_bonded" || v === "bonded") return "fragment_bonded";
  if (v === "fragment_awakened" || v === "porteur" || v === "awakened") {
    return "fragment_awakened";
  }
  return "scanner_preview";
}

function normalizeBondStatus(value: unknown): BondStatus | undefined {
  const v = String(value || "").toLowerCase();
  const allowed: BondStatus[] = [
    "none",
    "seen",
    "awakened",
    "bonded_active",
    "bonded_dormant",
    "bonded_frozen",
    "bonded_revoked",
    "deep_active",
  ];
  return allowed.includes(v as BondStatus) ? (v as BondStatus) : undefined;
}

function inferFragmentId(hint?: string, qrToken?: string): string | undefined {
  if (hint && getFragment(hint)?.unlocked) return hint;
  const value = `${hint || ""} ${qrToken || ""}`.toLowerCase();
  for (const id of ["eveil", "souffle", "forge", "prisme", "atome"]) {
    if (value.includes(id) && getFragment(id)?.unlocked) return id;
  }
  return undefined;
}

function cleanCode(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase()
    .slice(0, 64);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function clampProgressDelta(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.floor(n)));
}
