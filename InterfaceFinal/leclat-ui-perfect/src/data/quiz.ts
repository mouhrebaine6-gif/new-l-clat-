import { text, type Localized } from "@/lib/i18n";
import { QUIZ_LECLAT, type QuizQuestion as RawQuizQuestion } from "@/data/quizLeclat";

/**
 * L'ÉCLAT — Banque de quiz « Le Seuil ».
 *
 * SOURCE DE VÉRITÉ UNIQUE : src/data/quizLeclat.ts (80 questions vérifiées au
 * mot près contre le roman, dédupliquées, trilingues FR/EN/AR inline, position
 * des bonnes réponses déjà équilibrée). Ce module ne fait que PROJETER cette
 * banque dans le schéma consommé par QuizPage / quizProgress — sans rien
 * paraphraser, sans re-mélanger les options ni les réponses.
 *
 * Trilingue réel : prompt/options sont des Localized<…> issus directement des
 * champs fr/en/ar de quizLeclat → aucune retombée FR. quizLeclat n'ayant pas
 * d'explication, `explanation` est vide et l'UI la masque.
 *
 * Mapping fragment (numéro) → fragmentId :
 *   1 eveil · 2 souffle · 3 forge · 4 prisme · 5 atome
 *   6 eclipse · 7 horizon · 8 resonance · 9 ascension · 10 origine
 */

export const QUIZ_THRESHOLDS = [1, 20, 40] as const;
export type QuizThreshold = (typeof QUIZ_THRESHOLDS)[number];

export type QuizQuestion = {
  id: string;
  prompt: Localized<string>;
  options: Localized<string[]>;
  answerIndex: number;
  explanation: Localized<string>;
};

export type QuizPalier = {
  threshold: QuizThreshold;
  questions: QuizQuestion[];
};

export type FragmentQuiz = {
  fragmentId: string;
  paliers: QuizPalier[];
};

/** Index 0 → fragment numéro 1, etc. (ordre canonique du roman). */
export const QUIZ_FRAGMENT_ORDER = [
  "eveil",
  "souffle",
  "forge",
  "prisme",
  "atome",
  "eclipse",
  "horizon",
  "resonance",
  "ascension",
  "origine",
] as const;

const EMPTY_EXPLANATION = text("", "", "");

const buildQuestion = (raw: RawQuizQuestion): QuizQuestion => ({
  id: raw.id,
  prompt: text(raw.q.fr, raw.q.en, raw.q.ar),
  options: text(
    raw.options.map((o) => o.fr),
    raw.options.map((o) => o.en),
    raw.options.map((o) => o.ar),
  ),
  answerIndex: raw.answer,
  // quizLeclat ne fournit pas d'explication → vide (masquée par l'UI).
  explanation: EMPTY_EXPLANATION,
});

export const FRAGMENT_QUIZZES: FragmentQuiz[] = QUIZ_FRAGMENT_ORDER.map((fragmentId, index) => {
  const fragmentNumber = index + 1;
  const paliers = QUIZ_THRESHOLDS.map((threshold) => ({
    threshold,
    questions: QUIZ_LECLAT.filter(
      (raw) => raw.fragment === fragmentNumber && raw.scan === threshold,
    ).map(buildQuestion),
  })).filter((palier) => palier.questions.length > 0);
  return { fragmentId, paliers };
}).filter((fragmentQuiz) => fragmentQuiz.paliers.length > 0);

export const getFragmentQuiz = (fragmentId: string): FragmentQuiz | undefined =>
  FRAGMENT_QUIZZES.find((quiz) => quiz.fragmentId === fragmentId);

export const countPalierQuestions = (fragmentId: string, threshold: QuizThreshold): number =>
  getFragmentQuiz(fragmentId)?.paliers.find((palier) => palier.threshold === threshold)?.questions
    .length ?? 0;

export const QUIZ_TOTAL_QUESTIONS = FRAGMENT_QUIZZES.reduce(
  (total, quiz) => total + quiz.paliers.reduce((sum, palier) => sum + palier.questions.length, 0),
  0,
);
