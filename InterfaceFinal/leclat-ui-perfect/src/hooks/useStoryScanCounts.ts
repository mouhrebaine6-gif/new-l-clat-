import { useEffect, useMemo, useState } from "react";
import {
  ensureDeviceLinked,
  getProgression,
  getProgressionAccount,
  hasSupabaseScanBackend,
  type ProgressionEntry,
} from "@/lib/supabaseScan";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { usePorteur } from "@/lib/porteur";

type StoryScanStatus = "local" | "loading" | "synced" | "error";

/**
 * Décision produit (2026-07-03) : les paliers d'histoire suivent la
 * Constitution des scans — get_progression renvoie, pour chaque t-shirt
 * POSSÉDÉ par ce device, le nombre de visiteurs qui l'ont scanné. C'est ce
 * compteur serveur qui ouvre les paliers 1/20/40, pas le compteur local.
 * Le compteur local du porteur ne sert que sans backend (dev/preview).
 *
 * Continuité de compte (2026-07-05) : si un compte est connecté, ce téléphone
 * lui est attaché (link_device) et la progression vient du COMPTE — elle
 * couvre tous les téléphones liés, donc elle survit à un changement d'appareil.
 */
const CACHE_KEY = "leclat.story_counts.v2";

const readCache = (): Record<string, number> => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
};

export const useStoryScanCounts = () => {
  const { state } = usePorteur();
  const auth = useSupabaseSession();
  const serverMode = hasSupabaseScanBackend();
  const userId = auth.status === "signed-in" ? auth.user?.id : undefined;
  const [serverCounts, setServerCounts] = useState<Record<string, number>>(readCache);
  const [status, setStatus] = useState<StoryScanStatus>(serverMode ? "loading" : "local");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverMode) return;
    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      let entries: ProgressionEntry[] | null = null;
      if (userId) {
        await ensureDeviceLinked(userId);
        entries = await getProgressionAccount();
      }
      // Sans compte (ou compte injoignable) : progression du téléphone seul.
      if (entries === null) entries = await getProgression();
      if (cancelled) return;

      if (entries === null) {
        // Serveur injoignable : on garde le dernier état synchronisé (cache).
        setStatus("error");
        setError("Progression serveur indisponible");
        return;
      }

      const counts: Record<string, number> = {};
      for (const entry of entries) {
        counts[entry.fragment] = Math.max(0, Number(entry.scan_count) || 0);
      }
      setServerCounts(counts);
      setStatus("synced");
      setError(null);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(counts));
      } catch {
        // Cache best-effort — l'état en mémoire suffit pour la session.
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [serverMode, userId]);

  const fragmentScanCounts = useMemo(
    () => (serverMode ? serverCounts : state.fragmentScanCounts),
    [serverMode, serverCounts, state.fragmentScanCounts],
  );

  return {
    error,
    fragmentScanCounts,
    localState: state,
    status,
  };
};
