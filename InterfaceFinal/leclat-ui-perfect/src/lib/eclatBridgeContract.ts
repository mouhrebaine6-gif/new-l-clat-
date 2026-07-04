/**
 * L'Ã‰CLAT â€” Contrat de messages Web â‡„ Unity.
 *
 * Source de vÃ©ritÃ© unique pour tout message qui circule entre l'interface
 * React (WebView) et l'hÃ´te natif (Unity / iOS / Android / Vuplex).
 *
 * RÃ¨gles d'or :
 *  - Toute modification de format ici implique une bump de ECLAT_BRIDGE_VERSION
 *    et une coordination avec l'app Unity.
 *  - Le client React n'a JAMAIS autoritÃ© sur la progression profonde.
 *    Il ne peut qu'afficher ce que le backend / Unity confirme.
 *  - Le sessionNonce est gÃ©nÃ©rÃ© cÃ´tÃ© web au dÃ©marrage. Unity doit le rÃ©Ã©cho
 *    dans tout SCAN_RESULT pour que le client accepte de l'afficher.
 */

export const ECLAT_BRIDGE_VERSION = "1.1.0" as const;

/**
 * Mapping des 10 fragments narratifs → marker AR + model 3D (ailes).
 * Source de vérité unique pour le bridge React ↔ Unity.
 * Les fichiers .jpg / .glb sont générés par `D:\LECLAT\_gen_markers.js`
 * et `D:\LECLAT\_gen_wings.js`.
 */
export type FragmentArMapping = {
  fragmentId: string;
  markerName: string;
  modelPath: string;
  /** Échelle du modèle 3D au-dessus du marqueur (mètres). */
  scale: number;
  /** Position relative (mètres) au-dessus du centre du marqueur. */
  anchor: { x: number; y: number; z: number };
  /** Animation suggérée (Unity applique). */
  animation: "idle" | "breathe" | "flare" | "spiral";
};

export const FRAGMENT_AR_MAPPING: Record<string, FragmentArMapping> = {
  eveil: {
    fragmentId: "eveil",
    markerName: "FRAGMENT_EVEIL_MARKER",
    modelPath: "back_wings/FRAGMENT_EVEIL.glb",
    scale: 0.18,
    anchor: { x: 0, y: 0.04, z: 0 },
    animation: "breathe",
  },
  souffle: {
    fragmentId: "souffle",
    markerName: "FRAGMENT_SOUFFLE_MARKER",
    modelPath: "back_wings/FRAGMENT_SOUFFLE.glb",
    scale: 0.2,
    anchor: { x: 0, y: 0.05, z: 0 },
    animation: "idle",
  },
  forge: {
    fragmentId: "forge",
    markerName: "FRAGMENT_FORGE_MARKER",
    modelPath: "back_wings/FRAGMENT_FORGE.glb",
    scale: 0.22,
    anchor: { x: 0, y: 0.05, z: 0 },
    animation: "flare",
  },
  prisme: {
    fragmentId: "prisme",
    markerName: "FRAGMENT_PRISME_MARKER",
    modelPath: "back_wings/FRAGMENT_PRISME.glb",
    scale: 0.16,
    anchor: { x: 0, y: 0.04, z: 0 },
    animation: "spiral",
  },
  atome: {
    fragmentId: "atome",
    markerName: "FRAGMENT_ATOME_MARKER",
    modelPath: "back_wings/FRAGMENT_ATOME/scene.gltf",
    scale: 0.14,
    anchor: { x: 0, y: 0.03, z: 0 },
    animation: "breathe",
  },
  eclipse: {
    fragmentId: "eclipse",
    markerName: "FRAGMENT_ECLIPSE_MARKER",
    modelPath: "back_wings/FRAGMENT_ECLIPSE.glb",
    scale: 0.2,
    anchor: { x: 0, y: 0.05, z: 0 },
    animation: "flare",
  },
  horizon: {
    fragmentId: "horizon",
    markerName: "FRAGMENT_HORIZON_MARKER",
    modelPath: "back_wings/FRAGMENT_HORIZON/scene.gltf",
    scale: 0.24,
    anchor: { x: 0, y: 0.06, z: 0 },
    animation: "idle",
  },
  resonance: {
    fragmentId: "resonance",
    markerName: "FRAGMENT_RESONANCE_MARKER",
    modelPath: "back_wings/FRAGMENT_RESONANCE.glb",
    scale: 0.18,
    anchor: { x: 0, y: 0.04, z: 0 },
    animation: "breathe",
  },
  ascension: {
    fragmentId: "ascension",
    markerName: "FRAGMENT_ASCENSION_MARKER",
    modelPath: "back_wings/FRAGMENT_ASCENSION.glb",
    scale: 0.22,
    anchor: { x: 0, y: 0.06, z: 0 },
    animation: "spiral",
  },
  origine: {
    fragmentId: "origine",
    markerName: "FRAGMENT_ORIGINE_MARKER",
    modelPath: "back_wings/FRAGMENT_ORIGINE.glb",
    scale: 0.2,
    anchor: { x: 0, y: 0.05, z: 0 },
    animation: "breathe",
  },
};

export const FRAGMENT_AR_IDS = Object.keys(FRAGMENT_AR_MAPPING) as Array<
  keyof typeof FRAGMENT_AR_MAPPING
>;

/**
 * SÃ©curitÃ© du nonce :
 * - Le client gÃ©nÃ¨re SESSION_NONCE au dÃ©marrage et le transmet via WEB_READY.
 * - Tout message Unity â†’ Web sensible (SCAN_RESULT, AR_LAUNCH callbacksâ€¦)
 *   doit rÃ©-Ã©cho le mÃªme nonce, sinon il est REJETÃ‰ silencieusement en
 *   production. En DEV (`import.meta.env.DEV`), la vÃ©rification est relÃ¢chÃ©e
 *   pour permettre la simulation locale via window.__eclat__.simulateScan.
 */

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Types de messages                          */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type WebToUnityType =
  | "WEB_READY" // Handshake initial, payload = { url, sessionNonce }
  | "SCAN_REQUEST" // Demande l'ouverture de la camÃ©ra
  | "SCAN_CANCEL" // Annule le scan en cours
  | "AR_LAUNCH" // Lance une scÃ¨ne AR pour un fragment prÃ©cis
  | "HAPTIC_REQUEST" // Demande un retour haptique natif
  | "NAV_BACK" // L'utilisateur a demandÃ© un retour
  | "NAV_STATE"; // Notifie Unity de l'URL/route courante

export type UnityToWebType =
  | "DEVICE_INFO" // RÃ©ponse au handshake : infos device
  | "SCAN_READY" // La camÃ©ra est ouverte cÃ´tÃ© natif
  | "SCAN_RESULT" // Un QR a été décodé
  | "AR_RESULT" // Résultat du lancement AR
  | "TRACKING" // Etat de suivi AR du marqueur
  | "SCAN_CANCEL" // L'utilisateur a fermÃ© la camÃ©ra
  | "NAV_TO_PAGE" // Unity demande au web de naviguer
  | "NAV_BACK_REQUEST" // Bouton retour hardware Android
  | "ERROR"; // Erreur native

export type AnyMessageType = WebToUnityType | UnityToWebType;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Enveloppe standard                          */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export interface BridgeEnvelope<T = unknown> {
  type: AnyMessageType | string;
  payload: T;
  ts: number;
  bridgeVersion: string;
  /** PrÃ©sent sur les messages sensibles (handshake + scan). */
  nonce?: string;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Payloads sortants (Web â†’ Unity)            */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export interface WebReadyPayload {
  url: string;
  sessionNonce: string;
  userAgent: string;
}

export interface ScanRequestPayload {
  from: string;
  /** Conseil purement UX, le serveur reste autoritaire. */
  hint?: string;
  /** Fragment 3D choisi pour le test AR local. Unity garde l'autoritÃ© d'exÃ©cution. */
  selected_fragment_id?: string;
  /** Alias pratique pour les hÃ´tes natifs qui attendent fragment_id. */
  fragment_id?: string;
  /** Scan textile : le host natif doit privilegier la camera arriere. */
  camera_facing_mode?: "environment";
}

export interface ArLaunchPayload {
  fragment_id: string;
  /** Optionnel : Unity peut utiliser un mode AR particulier. */
  mode?: "preview" | "rituel";
}

export interface HapticRequestPayload {
  kind: "tap" | "select" | "rituel";
}

export interface NavStatePayload {
  path: string;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Payloads entrants (Unity â†’ Web)            */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export interface DeviceInfoPayload {
  platform: "ios" | "android" | "editor" | "unknown";
  appVersion?: string;
  bridgeVersion?: string;
  hasCamera?: boolean;
}

export interface ScanResultPayload {
  qr_token: string;
  public_code?: string;
  fragment_hint?: string;
  marker_id?: string;
  scan_session_id?: string;
  access_level?: "scanner_preview" | "fragment_awakened" | "fragment_bonded" | "fragment_deep";
  qualified_progress_delta?: number;
  context_confirmed?: boolean;
  timestamp?: number;
  /** 0â€“1 : qualitÃ© de pose / stabilitÃ© estimÃ©e par Unity. */
  pose_quality?: number;
  /** DurÃ©e pendant laquelle le marqueur est restÃ© stable. */
  stability_ms?: number;
}

export interface NavToPagePayload {
  path: string;
}

export interface ArResultPayload {
  fragment_id: string;
  model_id?: string;
  model_path?: string;
  tracking_reference?: string;
  model_loaded?: boolean;
  tracking_ready?: boolean;
  license_policy?: string;
}

export interface TrackingPayload {
  state: "tracking" | "limited" | "none" | string;
}

export interface ErrorPayload {
  code: string;
  message?: string;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Validation runtime                          */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export function isBridgeEnvelope(raw: unknown): raw is BridgeEnvelope {
  if (!isObj(raw)) return false;
  if (typeof raw.type !== "string") return false;
  // payload peut Ãªtre absent/null ; on tolÃ¨re.
  if ("ts" in raw && typeof raw.ts !== "number") return false;
  return true;
}

export function isScanResultPayload(p: unknown): p is ScanResultPayload {
  return isObj(p) && typeof p.qr_token === "string" && p.qr_token.length > 0;
}

export function isDeviceInfoPayload(p: unknown): p is DeviceInfoPayload {
  return isObj(p) && typeof p.platform === "string";
}

/** GÃ©nÃ¨re un nonce de session client. Pas un secret cryptographique : juste
 *  un identifiant opaque pour appairer un Ã©change Webâ†”Unity. */
export function generateSessionNonce(): string {
  // crypto.getRandomValues si disponible, fallback Math.random pour SSR/tests.
  const g = typeof globalThis !== "undefined" ? globalThis : ({} as typeof globalThis);
  const c = (g as { crypto?: Crypto }).crypto;
  if (c?.getRandomValues) {
    const buf = new Uint8Array(16);
    c.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
