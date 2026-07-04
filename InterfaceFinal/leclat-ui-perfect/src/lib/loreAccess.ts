import { QUIZ_FRAGMENT_ORDER } from "@/data/quiz";

/**
 * Accès au « Compagnon de lecture » (analyses littéraires).
 *
 * ⚠️ Le compagnon RÉVÈLE toute l'intrigue ET la fin. Il n'est donc accessible
 * qu'une fois le roman ACHEVÉ par le porteur : les 10 fragments portés au
 * palier le plus profond (40 scans). C'est une récompense de fin de lecture.
 *
 * Tant qu'un backend n'existe pas, le contenu est lazy-loadé depuis docs/lore
 * (chunk séparé, jamais dans le bundle initial). À terme, ce contenu doit être
 * SERVI PAR LE SERVEUR sur accès confirmé — même logique que le roman profond.
 */

export const STORY_FRAGMENT_IDS = QUIZ_FRAGMENT_ORDER;
export const LORE_UNLOCK_THRESHOLD = 40 as const;

/** Roman achevé : tous les fragments ont atteint le palier profond. */
export const isStoryComplete = (counts: Record<string, number>): boolean =>
  STORY_FRAGMENT_IDS.every((id) => (counts[id] || 0) >= LORE_UNLOCK_THRESHOLD);

/** Nombre de fragments qu'il reste à mener au palier profond. */
export const fragmentsRemainingForLore = (counts: Record<string, number>): number =>
  STORY_FRAGMENT_IDS.filter((id) => (counts[id] || 0) < LORE_UNLOCK_THRESHOLD).length;
