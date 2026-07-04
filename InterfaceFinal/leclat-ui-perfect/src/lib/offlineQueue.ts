/**
 * File d'attente locale des scans tentés hors-ligne.
 *
 * Doctrine (rulebook) : un scan ne suffit jamais à lui seul à accorder un palier profond.
 * Hors-ligne, on ne donne au porteur qu'un teaser (preview). Le marqueur est conservé
 * localement et — si un jour une edge function de validation est branchée — il sera
 * envoyé pour reconnaissance serveur. Aucun palier ne peut être atteint sans ce passage.
 */

const QUEUE_KEY = "eclat_offline_queue_v1";

export type OfflineScan = {
  fragmentId: string;
  at: number;
  /** "preview" — seul niveau accordé hors-ligne, jamais plus. */
  tier: "preview";
  context?: string;
};

const read = (): OfflineScan[] => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
};

const write = (q: OfflineScan[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  window.dispatchEvent(new CustomEvent("offlineQueue:update"));
};

export const enqueueOfflineScan = (fragmentId: string, context?: string) => {
  const q = read();
  q.push({ fragmentId, at: Date.now(), tier: "preview", context });
  // Limite raisonnable, les anciens cèdent la place
  write(q.slice(-50));
};

export const getOfflineQueue = (): OfflineScan[] => read();

export const clearOfflineQueue = () => write([]);

/**
 * Purge au retour du Voile.
 * Décision produit (2026-07-03) : hors-ligne = aperçu SEULEMENT — les scans
 * hors-ligne ne sont jamais comptés ni rejoués côté serveur. La file n'est
 * qu'une trace UX locale ; on la vide au retour du réseau, sans transmission.
 */
export const syncOfflineQueue = async (): Promise<number> => {
  const q = read();
  if (!q.length) return 0;
  clearOfflineQueue();
  return q.length;
};
