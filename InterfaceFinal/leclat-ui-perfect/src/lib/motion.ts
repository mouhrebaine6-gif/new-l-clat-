/**
 * Tokens de mouvement L'ÉCLAT V2.
 * Cinema Mobile easing, springs tactiles, durées nommées.
 * Aucun `any`, TS strict, compatible Framer Motion 12.
 */

/* === Courbes (easing) === */
// Seuil : départ franc, sortie lente — courbe Cinema Mobile canonique.
export const EASE_SEUIL: [number, number, number, number] = [0.16, 1, 0.3, 1];
// Fil : easing maison historique, plus doux à l'arrivée.
export const EASE_FIL: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
// Couture : S-curve symétrique, idéal pour les déplacements latéraux.
export const EASE_COUTURE: [number, number, number, number] = [0.65, 0, 0.35, 1];
// Tactile : léger overshoot, réservé aux ressorts < 200 ms.
export const EASE_TACTILE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

/* === Springs Framer Motion === */
export const SPRING = {
  tactile: { type: "spring", stiffness: 420, damping: 26 },
  doux: { type: "spring", stiffness: 180, damping: 24 },
  lourd: { type: "spring", stiffness: 90, damping: 20 },
  aimant: { type: "spring", stiffness: 150, damping: 18, mass: 0.6 },
} as const;

/* === Durées nommées (en secondes) === */
export const DUR = {
  instant: 0.08,
  quick: 0.18,
  base: 0.32,
  medium: 0.55,
  slow: 0.95,
  ritual: 1.6,
  veil: 2.4,
} as const;

/* === Types utilitaires === */
export type SpringKey = keyof typeof SPRING;
export type DurKey = keyof typeof DUR;
export type EaseKey = "seuil" | "fil" | "couture" | "tactile";

/** Convertit une clé d'easing en tuple numérique pour Framer Motion. */
export const ease = (key: EaseKey): [number, number, number, number] => {
  switch (key) {
    case "fil":
      return EASE_FIL;
    case "couture":
      return EASE_COUTURE;
    case "tactile":
      return EASE_TACTILE;
    case "seuil":
    default:
      return EASE_SEUIL;
  }
};
