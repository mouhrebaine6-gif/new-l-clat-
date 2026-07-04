/**
 * L'ÉCLAT — Bridge runtime Web ⇄ Unity.
 *
 * Voir src/lib/eclatBridgeContract.ts pour le contrat de messages.
 *
 * Transports supportés :
 *   - GREE Unity WebView      : window.Unity.call(JSON)
 *   - Vuplex (Android)        : window.vuplex.postMessage(JSON)
 *   - WKWebView (iOS)         : window.webkit.messageHandlers.unity.postMessage(JSON)
 *   - API directe Unity       : window.__eclat__.receive({ ... })
 *   - MessageEvent (générique): window.dispatchEvent(new MessageEvent('message', ...))
 *
 * Logs uniquement en dev (import.meta.env.DEV).
 */

import {
  ECLAT_BRIDGE_VERSION,
  generateSessionNonce,
  isBridgeEnvelope,
  isScanResultPayload,
  type AnyMessageType,
  type BridgeEnvelope,
  type ScanResultPayload,
  type WebToUnityType,
} from "./eclatBridgeContract";

/* ─────────────────────────────────────────── */
/*  Types runtime                               */
/* ─────────────────────────────────────────── */

export type UnityEventType = AnyMessageType | string;
export type UnityMessage<T = unknown> = BridgeEnvelope<T>;
type Handler<T = unknown> = (payload: T, raw: UnityMessage<T>) => void;

declare global {
  interface Window {
    vuplex?: {
      postMessage: (msg: string) => void;
      addEventListener?: (t: string, h: (e: { data: string }) => void) => void;
    };
    Unity?: {
      call: (msg: string) => void;
    };
    webkit?: { messageHandlers?: { unity?: { postMessage: (msg: unknown) => void } } };
    __eclat__?: {
      version: string;
      /** Exposé uniquement en dev (debug) — le nonce voyage dans WEB_READY. */
      sessionNonce?: string;
      receive: (msg: UnityMessage) => void;
      simulateScan: (fragmentId?: string) => void;
    };
  }
}

const LISTENERS = new Map<string, Set<Handler>>();
const SESSION_NONCE = generateSessionNonce();

const log = (...a: unknown[]) => {
  if (import.meta.env.DEV) console.debug("[unityBridge]", ...a);
};

const emitBridgeEvent = (name: "eclat:bridge-in" | "eclat:bridge-out", msg: UnityMessage) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail: msg }));
};

/* ─────────────────────────────────────────── */
/*  Détection environnement                     */
/* ─────────────────────────────────────────── */

export const isInUnity = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.vuplex ||
    window.Unity ||
    window.webkit?.messageHandlers?.unity ||
    /UnityPlayer|UnityWebView/i.test(navigator.userAgent),
  );
};

export const getSessionNonce = () => SESSION_NONCE;

/**
 * Route complète à transmettre à Unity (compatible HashRouter).
 * Renvoie `pathname + search + hash` — en HashRouter le vrai chemin
 * est dans le hash (`#/scan?x=1`).
 */
export const getCurrentBridgeRoute = (): string => {
  if (typeof window === "undefined") return "/";
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}` || "/";
};

/* ─────────────────────────────────────────── */
/*  Sortie : Web → Unity                        */
/* ─────────────────────────────────────────── */

export const postToUnity = <T extends object>(
  type: WebToUnityType | string,
  payload: T = {} as T,
): boolean => {
  if (typeof window === "undefined") return false;
  const msg: BridgeEnvelope<T> = {
    type,
    payload,
    ts: Date.now(),
    bridgeVersion: ECLAT_BRIDGE_VERSION,
    nonce: SESSION_NONCE,
  };
  emitBridgeEvent("eclat:bridge-out", msg);
  const serialized = JSON.stringify(msg);

  try {
    if (window.vuplex?.postMessage) {
      window.vuplex.postMessage(serialized);
      log("→ vuplex", msg);
      return true;
    }
    if (window.Unity?.call) {
      window.Unity.call(serialized);
      log("to gree-unity-webview", msg);
      return true;
    }
    if (window.webkit?.messageHandlers?.unity?.postMessage) {
      window.webkit.messageHandlers.unity.postMessage(serialized);
      log("→ webkit", msg);
      return true;
    }
  } catch (e) {
    log("postToUnity error", e);
  }

  // Fallback dev / test : event local pour permettre la simulation.
  if (import.meta.env.DEV) {
    log("(dev) no Unity host —", msg);
    window.dispatchEvent(new CustomEvent("eclat:web-to-unity", { detail: msg }));
  }
  return false;
};

/* ─────────────────────────────────────────── */
/*  Entrée : Unity → Web                        */
/* ─────────────────────────────────────────── */

/**
 * Types sensibles : doivent ré-écho le SESSION_NONCE en production.
 * En DEV, on tolère l'absence de nonce pour permettre la simulation.
 */
const NONCE_REQUIRED: ReadonlySet<string> = new Set(["SCAN_RESULT", "AR_RESULT"]);

const dispatch = (msg: UnityMessage) => {
  log("← unity", msg);

  // Validation : on n'accepte que les messages bien formés.
  if (!isBridgeEnvelope(msg)) {
    log("dropped (invalid envelope)", msg);
    return;
  }

  // Vérification du nonce pour les messages sensibles (prod uniquement).
  if (!import.meta.env.DEV && NONCE_REQUIRED.has(msg.type) && msg.nonce !== SESSION_NONCE) {
    log("dropped (invalid nonce)", msg.type);
    return;
  }

  // Validation spécifique pour les messages sensibles.
  if (msg.type === "SCAN_RESULT" && !isScanResultPayload(msg.payload)) {
    log("dropped SCAN_RESULT (invalid payload)");
    return;
  }

  emitBridgeEvent("eclat:bridge-in", msg);

  LISTENERS.get(msg.type)?.forEach((h) => {
    try {
      h(msg.payload, msg);
    } catch (e) {
      if (import.meta.env.DEV) console.error("[unityBridge] handler error", e);
    }
  });
  LISTENERS.get("*")?.forEach((h) => {
    try {
      h(msg.payload, msg);
    } catch (e) {
      if (import.meta.env.DEV) console.error("[unityBridge] handler error", e);
    }
  });
};

const tryParse = (raw: unknown): UnityMessage | null => {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null && "type" in raw) {
    return raw as UnityMessage;
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object" && "type" in p) return p as UnityMessage;
    } catch {
      /* not json */
    }
  }
  return null;
};

let bootstrapped = false;
const bootstrap = () => {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;

  // 1) MessageEvent générique
  window.addEventListener("message", (ev: MessageEvent) => {
    const msg = tryParse(ev.data);
    if (msg) dispatch(msg);
  });

  // 2) Vuplex (Android) — exposé tardivement
  const wireVuplex = () => {
    const v = window.vuplex;
    if (v?.addEventListener) {
      v.addEventListener("message", (e) => {
        const msg = tryParse(e.data);
        if (msg) dispatch(msg);
      });
    }
  };
  if (window.vuplex) wireVuplex();
  else window.addEventListener("vuplexready", wireVuplex);

  // 3) API directe + simulation dev
  window.__eclat__ = {
    version: ECLAT_BRIDGE_VERSION,
    // Le nonce n'est exposé au global qu'en dev : en prod il voyage uniquement
    // dans le handshake WEB_READY, hors de portée d'un script tiers.
    ...(import.meta.env.DEV ? { sessionNonce: SESSION_NONCE } : {}),
    receive: (m) => dispatch(m),
    simulateScan: (fragmentId = "eveil") => {
      if (!import.meta.env.DEV) return;
      dispatch({
        type: "SCAN_RESULT",
        payload: {
          qr_token: `dev-${fragmentId}-${Date.now()}`,
          fragment_hint: fragmentId,
          timestamp: Date.now(),
        } as ScanResultPayload,
        ts: Date.now(),
        bridgeVersion: ECLAT_BRIDGE_VERSION,
        nonce: SESSION_NONCE,
      });
    },
  };

  // Handshake initial avec l'hôte natif.
  postToUnity("WEB_READY", {
    url: getCurrentBridgeRoute(),
    sessionNonce: SESSION_NONCE,
    userAgent: navigator.userAgent,
  });
};

bootstrap();

/**
 * Écoute un type de message Unity. Retourne une fonction d'unsubscription.
 * Utiliser "*" pour écouter tous les messages (debug).
 */
export const onUnityMessage = <T = unknown>(
  type: UnityEventType | "*",
  handler: Handler<T>,
): (() => void) => {
  bootstrap();
  let set = LISTENERS.get(type);
  if (!set) {
    set = new Set();
    LISTENERS.set(type, set);
  }
  set.add(handler as Handler);
  return () => set!.delete(handler as Handler);
};

/* ─────────────────────────────────────────── */
/*  Helpers métier                              */
/* ─────────────────────────────────────────── */

export const requestUnityScan = () =>
  postToUnity("SCAN_REQUEST", { from: getCurrentBridgeRoute() });
export const cancelUnityScan = () => postToUnity("SCAN_CANCEL", {});
export const requestNavBack = () => postToUnity("NAV_BACK", { from: getCurrentBridgeRoute() });
export const requestUnityHaptic = (kind: "tap" | "select" | "rituel" = "tap") =>
  postToUnity("HAPTIC_REQUEST", { kind });
export const launchAr = (fragment_id: string, mode: "preview" | "rituel" = "rituel") =>
  postToUnity("AR_LAUNCH", { fragment_id, mode });
export const notifyNavState = (path: string) => postToUnity("NAV_STATE", { path });
