// Deep-link Unity. L'app AR doit gérer le scheme `eclat://`.
// Web fallback : on retombe sur la page web cible si l'app n'a pas pris la main.

import { postToUnity, getCurrentBridgeRoute } from "@/lib/unityBridge";

const SCHEME = "eclat://";

export const launchUnityScan = (selectedFragmentId?: string): { triedDeeplink: boolean } => {
  if (typeof window === "undefined") return { triedDeeplink: false };
  // Si on est déjà dans Unity, on demande au host plutôt qu'au scheme
  if (
    postToUnity("SCAN_REQUEST", {
      from: getCurrentBridgeRoute(),
      hint: selectedFragmentId,
      selected_fragment_id: selectedFragmentId,
      fragment_id: selectedFragmentId,
      camera_facing_mode: "environment",
    })
  ) {
    return { triedDeeplink: true };
  }
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!isMobile) return { triedDeeplink: false };
  window.location.href = selectedFragmentId
    ? `${SCHEME}scan?fragment=${encodeURIComponent(selectedFragmentId)}`
    : `${SCHEME}scan`;
  return { triedDeeplink: true };
};

// Le scan AR Unity peut renvoyer vers la web app avec ?fragment=eveil
export const readScanCallback = (): string | null => {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get("fragment");
};

export const isMobileDevice = () =>
  typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Résout un deeplink eclat://… en route web.
 * Schémas supportés :
 *   eclat://scan
 *   eclat://fragment/:id
 *   eclat://checkout/:product_id
 *   eclat://back
 *   eclat://page/<chemin/web>
 */
export const resolveDeeplink = (raw: string): { path?: string; back?: boolean } => {
  try {
    const url = new URL(raw);
    if (url.protocol !== "eclat:") return {};
    const host = url.host || url.pathname.replace(/^\/+/, "").split("/")[0];
    const segs = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    const tail = host === url.host ? segs : segs.slice(1);

    switch (host) {
      case "scan":
        return { path: "/scan" };
      case "back":
        return { back: true };
      case "fragment":
        return tail[0] ? { path: `/fragments/${tail[0]}` } : { path: "/fragments" };
      case "checkout":
        return tail[0] ? { path: `/boutique/${tail[0]}` } : { path: "/boutique" };
      case "page":
        return { path: "/" + tail.join("/") };
      default:
        return {};
    }
  } catch {
    return {};
  }
};
