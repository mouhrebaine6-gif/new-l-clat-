// Pont web → Constitution des scans (Supabase RPC). Tout est tranché côté serveur.
// Le client ne fait qu'appeler claim_tshirt / scan_tshirt / get_progression.
import { supabase, hasSupabaseConfig } from "./supabaseClient";

const DEVICE_KEY = "leclat.device_id";

/** Identité stable du téléphone (1 device = 1 scanneur). Persistée localement. */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
        `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev-ephemeral-${Math.random().toString(36).slice(2)}`;
  }
}

/** Nonce à usage unique (anti-rejeu) pour chaque scan envoyé au serveur. */
export function newNonce(): string {
  return (
    (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
    `n-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export type ScanServerResult = {
  ok: boolean;
  fragment?: string;
  owner?: boolean;
  is_owner?: boolean;
  counted?: boolean;
  scan_count?: number;
  access_level?: string;
  qualified_progress_delta?: number;
  status?: string;
  reason?: string;
};

export const hasSupabaseScanBackend = (): boolean => hasSupabaseConfig();

/** Scan (comptage). Le serveur applique les 10 règles et renvoie l'état réel. */
export async function scanTshirt(
  qrToken: string,
  nonce: string = newNonce(),
): Promise<ScanServerResult | null> {
  if (!hasSupabaseConfig() || !supabase) return null;
  const { data, error } = await supabase.rpc("scan_tshirt", {
    p_qr_token: qrToken,
    p_device_id: getDeviceId(),
    p_nonce: nonce,
  });
  if (error) return { ok: false, reason: error.message };
  return (data as ScanServerResult) ?? null;
}

/** Revendication de propriété (1ʳᵉ activation du QR du col, à l'achat). */
export async function claimTshirt(qrToken: string): Promise<ScanServerResult | null> {
  if (!hasSupabaseConfig() || !supabase) return null;
  const { data, error } = await supabase.rpc("claim_tshirt", {
    p_qr_token: qrToken,
    p_device_id: getDeviceId(),
  });
  if (error) return { ok: false, reason: error.message };
  return (data as ScanServerResult) ?? null;
}

const CLAIMED_KEY = "leclat.claimed_tokens";

/**
 * Revendique le t-shirt UNE fois par (device, token) — la 1ʳᵉ activation du QR
 * devient PROPRIÉTAIRE (Règle 1). Best-effort : ne réussit que si le t-shirt
 * est encore libre côté serveur ; sinon le device reste visiteur.
 */
export async function ensureClaimed(qrToken: string): Promise<void> {
  if (!hasSupabaseConfig() || !supabase || !qrToken) return;
  let set: Set<string>;
  try {
    set = new Set<string>(JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]"));
  } catch {
    set = new Set<string>();
  }
  if (set.has(qrToken)) return;
  const result = await claimTshirt(qrToken);
  const claimSucceeded =
    result?.ok === true &&
    (result.owner === true || result.status === "claimed" || result.status === "already_owner");
  if (!claimSucceeded) return;
  set.add(qrToken);
  try {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage indisponible — on retentera au prochain scan.
  }
}

export type ProgressionEntry = {
  fragment: string;
  scan_count: number;
  access_level: string;
};

/**
 * État des fragments possédés par ce device (paliers serveur).
 * `null` = serveur injoignable (le consommateur garde son cache) ;
 * `[]` = réponse valide, aucun t-shirt possédé.
 */
export async function getProgression(): Promise<ProgressionEntry[] | null> {
  if (!hasSupabaseConfig() || !supabase) return null;
  const { data, error } = await supabase.rpc("get_progression", { p_device_id: getDeviceId() });
  if (error) return null;
  return Array.isArray(data) ? (data as ProgressionEntry[]) : [];
}
