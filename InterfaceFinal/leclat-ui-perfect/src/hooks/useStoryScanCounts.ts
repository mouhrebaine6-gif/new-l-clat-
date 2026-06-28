import { useEffect, useMemo, useState } from "react";
import { loadRemoteFragmentScanCounts } from "@/lib/progressionApi";
import { usePorteur } from "@/lib/porteur";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type StoryScanStatus = "local" | "loading" | "synced" | "error";

const mergeCounts = (localCounts: Record<string, number>, remoteCounts: Record<string, number>) => {
  const next: Record<string, number> = { ...localCounts };
  for (const [fragmentId, remoteCount] of Object.entries(remoteCounts)) {
    next[fragmentId] = Math.max(next[fragmentId] || 0, remoteCount);
  }
  return next;
};

export const useStoryScanCounts = () => {
  const { state } = usePorteur();
  const auth = useSupabaseSession();
  const [remoteCounts, setRemoteCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<StoryScanStatus>(auth.configured ? "loading" : "local");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!auth.configured || auth.status === "disabled" || auth.status === "guest") {
        setRemoteCounts({});
        setStatus("local");
        setError(null);
        return;
      }

      if (auth.status === "loading") {
        setStatus("loading");
        return;
      }

      if (auth.status === "error") {
        setRemoteCounts({});
        setStatus("error");
        setError(auth.error || "Progression distante indisponible");
        return;
      }

      setStatus("loading");
      const result = await loadRemoteFragmentScanCounts();
      if (cancelled) return;

      if (result.ok) {
        setRemoteCounts(result.data);
        setStatus("synced");
        setError(null);
      } else if ("skipped" in result && result.skipped) {
        setRemoteCounts({});
        setStatus("local");
        setError(null);
      } else {
        setRemoteCounts({});
        setStatus("error");
        setError("error" in result && result.error ? result.error.message : "Sync unavailable");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [auth.configured, auth.error, auth.status, auth.user?.id]);

  const fragmentScanCounts = useMemo(
    () => mergeCounts(state.fragmentScanCounts, remoteCounts),
    [remoteCounts, state.fragmentScanCounts],
  );

  return {
    error,
    fragmentScanCounts,
    localState: state,
    status,
  };
};
