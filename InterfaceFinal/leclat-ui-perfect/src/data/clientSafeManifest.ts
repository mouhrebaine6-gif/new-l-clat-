/**
 * L'ÉCLAT — Manifeste client-safe.
 *
 * Tout ce qui est exporté depuis src/data/ doit être considéré comme
 * PUBLIC : embarqué dans le bundle, lisible par n'importe quel utilisateur
 * via les DevTools ou un proxy.
 *
 * INTERDIT côté client :
 *   - Récit long complet d'un fragment
 *   - Révélations profondes réservées au canon serveur futur
 *   - Secrets de progression (paliers, scans nécessaires, conditions)
 *   - Logique d'unlock profond
 *   - Correction d'épreuve / réponses canoniques
 *   - Contre-modèle ancien
 *
 * AUTORISÉ côté client :
 *   - Nom + numéro du fragment
 *   - Hook court (1 phrase, sensoriel)
 *   - Texte de preview (court, énigmatique)
 *   - Visuel
 *   - États affichables : dormant / aperçu / éveillé / lié
 *
 * La vérité reste serveur-side. React n'est qu'un porte-voix.
 *
 * Le script scripts/check-client-safe-content.mjs bloque le build si des
 * marqueurs serveur connus s'infiltrent dans src/data ou src/assets.
 */

export type ClientFragmentTier = "dormant" | "apercu" | "eveille" | "lie";

export const CLIENT_SAFE_MANIFEST = {
  version: "1.0.0",
  /** Champs autorisés à apparaître dans src/data/fragments.ts */
  allowedFragmentFields: [
    "id",
    "number",
    "name",
    "hook",
    "preview",
    "visual",
    "icon",
    "unlocked",
    "tier",
  ],
  /** Pour info : l'unlock profond NE doit jamais être source-of-truth client. */
  truthSource: "server",
} as const;
