/**
 * Mode DÉMO MAX — actif UNIQUEMENT quand le build est compilé avec
 * VITE_DEMO_MAX=1 (APK de validation interne, jamais le site en ligne).
 *
 * Le flag est remplacé STATIQUEMENT à la compilation : dans un build normal,
 * tout ce code se réduit à `false` et les verrous restent intacts — il
 * n'existe aucun moyen d'activer ce mode depuis l'extérieur (URL, storage…).
 *
 * Effets : 10 fragments déverrouillés, histoire complète (palier profond
 * partout), niveau porteur maximal, tous les skins/modèles 3D sélectionnables.
 */
export const DEMO_MAX = import.meta.env.VITE_DEMO_MAX === "1";

/** Niveau porteur forcé en démo (≥ tous les requiredLevel du catalogue). */
export const DEMO_LEVEL = 10;
