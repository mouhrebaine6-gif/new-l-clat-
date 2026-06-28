import { useCallback, useEffect, useMemo, useState } from "react";
import { loadRemoteProgression } from "@/lib/progressionApi";
import { useLeclatProgression } from "@/lib/progression";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import type { Lang } from "@/lib/i18n";

type RemoteStatus = "preview" | "loading" | "synced" | "error";

export const useAccountProgression = (lang?: Lang) => {
  const auth = useSupabaseSession();
  const authUserId = auth.user?.id;
  const authUserEmail = auth.user?.email;
  const ownerId = authUserId || "guest";
  const pseudo = authUserEmail?.split("@")[0] || "Porteur";
  const progressionScope = useMemo(
    () => ({
      ownerId,
      mode: authUserId ? ("account" as const) : ("guest" as const),
      pseudo,
      lang,
    }),
    [authUserId, lang, ownerId, pseudo],
  );
  const progression = useLeclatProgression(progressionScope);
  const { mergeRemoteSnapshot } = progression;
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus>(
    auth.configured ? "loading" : "preview",
  );
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const refreshRemoteProgression = useCallback(async () => {
    if (!auth.configured || !authUserId) {
      setRemoteStatus("preview");
      setRemoteError(null);
      return { ok: false as const, skipped: true as const };
    }

    setRemoteStatus("loading");
    const result = await loadRemoteProgression(authUserId);
    if (result.ok) {
      mergeRemoteSnapshot(result.data);
      setRemoteStatus("synced");
      setRemoteError(null);
      return result;
    }

    if ("skipped" in result && result.skipped) {
      setRemoteStatus("preview");
      setRemoteError(null);
      return result;
    }

    setRemoteStatus("error");
    setRemoteError(
      "error" in result && result.error
        ? result.error.message
        : "Progression distante indisponible",
    );
    return result;
  }, [auth.configured, authUserId, mergeRemoteSnapshot]);

  useEffect(() => {
    if (auth.status === "loading") return;
    void refreshRemoteProgression();
  }, [auth.status, ownerId, refreshRemoteProgression]);

  return {
    ...progression,
    auth,
    remoteError,
    remoteStatus,
    refreshRemoteProgression,
  };
};
