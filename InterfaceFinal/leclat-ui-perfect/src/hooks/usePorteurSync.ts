import { useCallback, useEffect, useRef, useState } from "react";
import { usePorteur, computeLevel, type PorteurState } from "@/lib/porteur";

/**
 * Modèle hybride : localStorage = source de vérité immédiate (offline-first).
 * Si VITE_API_BASE est défini, on tente une synchro silencieuse au montage et
 * on merge le résultat (union des collected, max des scans). Sans backend
 * configuré, le hook reste inerte mais expose la même API.
 */

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "";
const SYNC_THROTTLE = 30_000;

type ServerState = {
  level?: number;
  collected?: string[];
  scans?: number;
  qualifiedProgressPoints?: number;
  relations?: PorteurState["relations"];
  badges?: string[];
};

export const usePorteurSync = () => {
  const porteur = usePorteur();
  const [isStale, setIsStale] = useState<boolean>(Boolean(API_BASE));
  const [error, setError] = useState<string | null>(null);
  const lastSync = useRef(0);

  const sync = useCallback(async () => {
    if (!API_BASE) {
      setIsStale(false);
      return;
    }
    const now = Date.now();
    if (now - lastSync.current < SYNC_THROTTLE) return;
    lastSync.current = now;
    setIsStale(true);
    try {
      const res = await fetch(`${API_BASE}/v1/porteur/state`, {
        headers: { "x-sceau": porteur.state.sceauId },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remote: ServerState = await res.json();

      // Merge non destructif : union des collected, max des scans.
      const merged: Partial<PorteurState> = {
        collected: Array.from(new Set([...porteur.state.collected, ...(remote.collected ?? [])])),
        scans: Math.max(porteur.state.scans, remote.scans ?? 0),
        qualifiedProgressPoints: Math.max(
          porteur.state.qualifiedProgressPoints,
          remote.qualifiedProgressPoints ?? 0,
        ),
        relations: { ...porteur.state.relations, ...(remote.relations ?? {}) },
      };
      // Persiste via le store local
      const raw = localStorage.getItem("eclat_porteur_v1");
      if (raw) {
        const cur = JSON.parse(raw);
        localStorage.setItem("eclat_porteur_v1", JSON.stringify({ ...cur, ...merged }));
        window.dispatchEvent(new CustomEvent("porteur:update"));
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "sync failed");
    } finally {
      setIsStale(false);
    }
  }, [
    porteur.state.sceauId,
    porteur.state.collected,
    porteur.state.scans,
    porteur.state.qualifiedProgressPoints,
    porteur.state.relations,
  ]);

  useEffect(() => {
    void sync();
    // re-sync quand on revient en avant-plan
    const onVis = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const level = computeLevel(porteur.state.collected.length, porteur.state.qualifiedProgressPoints);

  return {
    state: porteur.state,
    ...level,
    isStale,
    error,
    sync,
    enabled: Boolean(API_BASE),
  };
};
