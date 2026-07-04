import { text, type Localized } from "@/lib/i18n";

/**
 * Grades du Porteur — un titre « supercool » tous les 5 niveaux (jusqu'à 30),
 * ancré dans l'univers de L'ÉCLAT : le Voile, le Seuil, les Coutures, la Faille
 * (la blessure du roman), la couture Miroir, puis l'Origine.
 *
 * Le niveau brut reste calculé par l'XP (voir progression.ts). Le grade n'est
 * qu'une lecture : le palier nommé le plus élevé que le porteur a atteint.
 */
export type LevelGrade = {
  /** Niveau minimum pour porter ce grade. */
  atLevel: number;
  name: Localized<string>;
  /** Phrase courte, lien direct avec le roman / l'univers. */
  aura: Localized<string>;
};

export const LEVEL_GRADES: LevelGrade[] = [
  {
    atLevel: 1,
    name: text("Initié du Voile", "Veil Initiate", "مُريد السِّتار"),
    aura: text(
      "Le Voile vient de s'entrouvrir.",
      "The Veil has just parted.",
      "السِّتار انفتح للتو.",
    ),
  },
  {
    atLevel: 5,
    name: text("Porteur du Seuil", "Threshold Bearer", "حامل العتبة"),
    aura: text(
      "Vous avez franchi le premier seuil.",
      "You crossed the first threshold.",
      "عبرت العتبة الأولى.",
    ),
  },
  {
    atLevel: 10,
    name: text("Lecteur de Coutures", "Reader of Seams", "قارئ الغُرَز"),
    aura: text("Les coutures vous parlent.", "The seams speak to you.", "الغُرَز تكلّمك."),
  },
  {
    atLevel: 15,
    name: text("Veilleur du Voile", "Veil Watcher", "حافظ السِّتار"),
    aura: text(
      "Vous tenez la lumière éveillée.",
      "You keep the light awake.",
      "تُبقي الضوء يقظًا.",
    ),
  },
  {
    atLevel: 20,
    name: text("Témoin de la Faille", "Witness of the Rift", "شاهد الشَّرخ"),
    aura: text("Vous avez vu la blessure.", "You have seen the wound.", "رأيت الجرح."),
  },
  {
    atLevel: 25,
    name: text("Gardien du Miroir", "Keeper of the Mirror", "حارس المرآة"),
    aura: text(
      "La couture miroir vous est ouverte.",
      "The mirror seam is open to you.",
      "خياطة المرآة مفتوحة لك.",
    ),
  },
  {
    atLevel: 30,
    name: text("Éclat d'Origine", "Origin's Light", "بريق الأصل"),
    aura: text("Vous touchez l'Origine.", "You reach the Origin.", "تلمس الأصل."),
  },
];

/** Le palier nommé le plus élevé atteint à ce niveau. */
export const gradeForLevel = (level: number): LevelGrade => {
  let current = LEVEL_GRADES[0];
  for (const grade of LEVEL_GRADES) {
    if (level >= grade.atLevel) current = grade;
    else break;
  }
  return current;
};

/** Prochain grade à débloquer (ou null si grade maximal atteint). */
export const nextGrade = (level: number): LevelGrade | null =>
  LEVEL_GRADES.find((grade) => grade.atLevel > level) ?? null;
