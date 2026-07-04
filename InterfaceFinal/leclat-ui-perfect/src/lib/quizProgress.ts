import { useCallback, useEffect, useState } from "react";
import {
  FRAGMENT_QUIZZES,
  getFragmentQuiz,
  QUIZ_TOTAL_QUESTIONS,
  type QuizThreshold,
} from "@/data/quiz";

/**
 * Persistance du quiz — même mécanisme que le porteur (localStorage + event).
 * On ne stocke que l'index de réponse choisi par question ; la justesse est
 * recalculée à la lecture depuis la banque (src/data/quiz.ts), donc aucun
 * « secret » de bonne réponse n'a besoin d'être dupliqué dans le store.
 */

const KEY = "eclat_quiz_v1";
const EVENT = "eclat:quiz-update";

export type QuizStore = {
  /** clé `${fragmentId}:${threshold}:${questionIndex}` → index d'option choisi. */
  answers: Record<string, number>;
};

export type PalierScore = { answered: number; correct: number; total: number };

const empty = (): QuizStore => ({ answers: {} });

const read = (): QuizStore => {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<QuizStore>;
    const answers: Record<string, number> = {};
    if (parsed.answers && typeof parsed.answers === "object") {
      for (const [k, v] of Object.entries(parsed.answers)) {
        const n = Number(v);
        if (Number.isInteger(n) && n >= 0) answers[k] = n;
      }
    }
    return { answers };
  } catch {
    return empty();
  }
};

const write = (store: QuizStore) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const answerKey = (fragmentId: string, threshold: QuizThreshold, questionIndex: number) =>
  `${fragmentId}:${threshold}:${questionIndex}`;

const correctIndexFor = (
  fragmentId: string,
  threshold: QuizThreshold,
  questionIndex: number,
): number | undefined =>
  getFragmentQuiz(fragmentId)?.paliers.find((p) => p.threshold === threshold)?.questions[
    questionIndex
  ]?.answerIndex;

export const palierScore = (
  store: QuizStore,
  fragmentId: string,
  threshold: QuizThreshold,
): PalierScore => {
  const palier = getFragmentQuiz(fragmentId)?.paliers.find((p) => p.threshold === threshold);
  const total = palier?.questions.length ?? 0;
  let answered = 0;
  let correct = 0;
  for (let i = 0; i < total; i++) {
    const chosen = store.answers[answerKey(fragmentId, threshold, i)];
    if (chosen === undefined) continue;
    answered++;
    if (chosen === palier!.questions[i].answerIndex) correct++;
  }
  return { answered, correct, total };
};

export const fragmentScore = (store: QuizStore, fragmentId: string): PalierScore => {
  const quiz = getFragmentQuiz(fragmentId);
  if (!quiz) return { answered: 0, correct: 0, total: 0 };
  return quiz.paliers.reduce<PalierScore>(
    (acc, palier) => {
      const s = palierScore(store, fragmentId, palier.threshold);
      return {
        answered: acc.answered + s.answered,
        correct: acc.correct + s.correct,
        total: acc.total + s.total,
      };
    },
    { answered: 0, correct: 0, total: 0 },
  );
};

export const totalScore = (store: QuizStore): PalierScore =>
  FRAGMENT_QUIZZES.reduce<PalierScore>(
    (acc, quiz) => {
      const s = fragmentScore(store, quiz.fragmentId);
      return {
        answered: acc.answered + s.answered,
        correct: acc.correct + s.correct,
        total: acc.total + s.total,
      };
    },
    { answered: 0, correct: 0, total: QUIZ_TOTAL_QUESTIONS },
  );

export const useQuizProgress = () => {
  const [store, setStore] = useState<QuizStore>(() => read());

  useEffect(() => {
    const handler = () => setStore(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const recordAnswer = useCallback(
    (
      fragmentId: string,
      threshold: QuizThreshold,
      questionIndex: number,
      selectedIndex: number,
    ) => {
      const current = read();
      const key = answerKey(fragmentId, threshold, questionIndex);
      if (current.answers[key] !== undefined) return current.answers[key]; // figé au 1er choix
      const next: QuizStore = { answers: { ...current.answers, [key]: selectedIndex } };
      write(next);
      return selectedIndex;
    },
    [],
  );

  const isCorrect = useCallback(
    (fragmentId: string, threshold: QuizThreshold, questionIndex: number, selectedIndex: number) =>
      correctIndexFor(fragmentId, threshold, questionIndex) === selectedIndex,
    [],
  );

  const reset = useCallback(() => write(empty()), []);

  return { store, recordAnswer, isCorrect, reset };
};
