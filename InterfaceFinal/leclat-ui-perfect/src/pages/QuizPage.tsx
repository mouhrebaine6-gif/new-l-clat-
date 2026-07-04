import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Lock,
  RotateCcw,
  ScanLine,
  Sparkles,
  X,
} from "lucide-react";
import { getFragment, localizeFragment } from "@/data/fragments";
import {
  FRAGMENT_QUIZZES,
  getFragmentQuiz,
  QUIZ_THRESHOLDS,
  type QuizThreshold,
} from "@/data/quiz";
import { answerKey, palierScore, useQuizProgress } from "@/lib/quizProgress";
import { useStoryScanCounts } from "@/hooks/useStoryScanCounts";
import { useAccountProgression } from "@/hooks/useAccountProgression";
import { FragmentIcon } from "@/components/FragmentIcon";
import { Ornement, Sceau } from "@/components/Sceau";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";
import { text, useI18n, type Localized } from "@/lib/i18n";

type View = "hub" | "question" | "result";
type SealState = "scelle" | "ouvert" | "maitrise";

/** Le palier profond (Sceau) = 40 ; un fragment « maîtrisé » l'a atteint. */
const MASTER_THRESHOLD: QuizThreshold = 40;
const TOTAL_FRAGMENTS = FRAGMENT_QUIZZES.length;

/** Niveaux nommés (effet de profondeur), au lieu d'exposer « 1/20/40 scans ». */
const levelLabel = (threshold: QuizThreshold): Localized<string> =>
  threshold === 1
    ? text("Surface", "Surface", "السطح")
    : threshold === 20
      ? text("Lien", "Bond", "الرابط")
      : text("Sceau", "Seal", "الخَتْم");

/** Anti-spoiler : un palier n'est ouvrable que si les scans atteignent son seuil
 *  (lockstep avec la lecture / STORY_THRESHOLDS). Palier 1 exige ≥ 1 scan. */
const isPalierUnlocked = (threshold: QuizThreshold, scans: number) => scans >= threshold;

const copy = {
  eyebrow: text("Mémoire du Voile", "Memory of the Veil", "ذاكرة السِّتار"),
  title: text("Quiz", "Quiz", "اختبار"),
  intro: text(
    "Éprouvez ce que le tissu vous a transmis. Chaque scan ouvre une couche plus profonde.",
    "Test what the fabric has passed on to you. Each scan opens a deeper layer.",
    "اختبر ما نقله إليك القماش. كل مسح يفتح طبقة أعمق.",
  ),
  mastered: text("Fragments maîtrisés", "Fragments mastered", "شذرات مُتقَنة"),
  scan: text("Scanner", "Scan", "امسح"),
  chooseFragment: text("Choisir un fragment", "Choose a fragment", "اختر شذرة"),
  needScans: text("Encore", "Need", "يلزم"),
  scansWord: text("scans", "scans", "مسحات"),
  before: text("avant le", "to reach", "قبل"),
  almost: text("Plus que", "Only", "بقي"),
  next: text("Question suivante", "Next question", "السؤال التالي"),
  question: text("Question", "Question", "سؤال"),
  confirm: text("Confirmer", "Confirm", "أكِّد"),
  seeResult: text("Voir le résultat", "See result", "اعرض النتيجة"),
  back: text("Retour", "Back", "رجوع"),
  correct: text("Juste", "Correct", "صحيح"),
  wrong: text("Pas tout à fait", "Not quite", "ليس تمامًا"),
  toTest: text("À éprouver", "To test", "للاختبار"),
  done: text("Maîtrisé", "Mastered", "مُتقَن"),
  palierDone: text("Palier éprouvé", "Tier tested", "عتبة مُختبَرة"),
  sealMastered: text("Sceau maîtrisé", "Seal mastered", "خَتْم مُتقَن"),
  another: text("Un autre fragment", "Another fragment", "شذرة أخرى"),
  retake: text("Refaire", "Retake", "أعد"),
  companionTitle: text("Compagnon de lecture", "Reading companion", "رفيق القراءة"),
  companionBody: text(
    "Les dix fragments sont maîtrisés. Les analyses du roman s'ouvrent.",
    "All ten fragments are mastered. The novel's analyses open.",
    "أُتقنت الشذرات العشر. تنفتح تحليلات الرواية.",
  ),
  companionCta: text("Ouvrir le compagnon", "Open the companion", "افتح الرفيق"),
  emptyTitle: text("Le Codex est encore vide", "The Codex is still empty", "السجل ما زال فارغًا"),
  emptyBody: text(
    "Reconnaissez un fragment pour ouvrir ses questions.",
    "Recognize a fragment to open its questions.",
    "تعرّف إلى شذرة لفتح أسئلتها.",
  ),
  seal: text(
    "MÉMOIRE DU SEUIL · QUIZ · ",
    "THRESHOLD MEMORY · QUIZ · ",
    "ذاكرة العتبة · اختبار · ",
  ),
};

export default function QuizPage() {
  const { lang, tr } = useI18n();
  const reduceMotion = useReducedMotion();
  const { fragmentScanCounts } = useStoryScanCounts();
  const { store, recordAnswer } = useQuizProgress();
  const { recordEvent } = useAccountProgression(lang);

  const [view, setView] = useState<View>("hub");
  const [fragmentId, setFragmentId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<QuizThreshold | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const activeQuiz = fragmentId ? getFragmentQuiz(fragmentId) : undefined;
  const activePalier =
    activeQuiz && threshold ? activeQuiz.paliers.find((p) => p.threshold === threshold) : undefined;
  const questions = activePalier?.questions ?? [];
  const question = questions[qIndex];

  // Avancement global, scan-based (on cache l'ampleur : pas de « X/80 »).
  const masteredCount = FRAGMENT_QUIZZES.filter(
    (q) => (fragmentScanCounts[q.fragmentId] || 0) >= MASTER_THRESHOLD,
  ).length;
  const allMastered = TOTAL_FRAGMENTS > 0 && masteredCount >= TOTAL_FRAGMENTS;

  // Prochain palier le plus proche du déblocage (curiosity gap).
  const nextHint = useMemo(() => {
    let best: { fragmentId: string; threshold: QuizThreshold; remaining: number } | null = null;
    for (const q of FRAGMENT_QUIZZES) {
      const scans = fragmentScanCounts[q.fragmentId] || 0;
      for (const t of QUIZ_THRESHOLDS) {
        if (scans < t) {
          const remaining = t - scans;
          if (!best || remaining < best.remaining) {
            best = { fragmentId: q.fragmentId, threshold: t, remaining };
          }
        }
      }
    }
    return best;
  }, [fragmentScanCounts]);

  // Restaure l'état d'une question déjà répondue (réponse figée au 1er choix).
  useEffect(() => {
    if (view !== "question" || !fragmentId || !threshold || !question) return;
    const stored = store.answers[answerKey(fragmentId, threshold, qIndex)];
    if (stored !== undefined) {
      setSelected(stored);
      setConfirmed(true);
    } else {
      setSelected(null);
      setConfirmed(false);
    }
  }, [view, fragmentId, threshold, qIndex, question, store.answers]);

  const openPalier = (fId: string, t: QuizThreshold) => {
    // Garde stricte : jamais ouvrir un palier verrouillé.
    if (!isPalierUnlocked(t, fragmentScanCounts[fId] || 0)) return;
    haptic("select");
    setFragmentId(fId);
    setThreshold(t);
    setQIndex(0);
    setView("question");
  };

  const confirmAnswer = () => {
    if (selected === null || confirmed || !fragmentId || !threshold || !question) return;
    const key = answerKey(fragmentId, threshold, qIndex);
    const firstTime = store.answers[key] === undefined;
    recordAnswer(fragmentId, threshold, qIndex, selected);
    setConfirmed(true);
    const isRight = selected === question.answerIndex;
    if (firstTime) {
      haptic(isRight ? "rituel" : "tap");
      recordEvent("quiz_completed", {
        correct: isRight,
        score: isRight ? 1 : 0,
        total: 1,
        fragment_id: fragmentId,
        threshold,
      });
    }
  };

  const goNext = () => {
    if (qIndex < questions.length - 1) setQIndex((i) => i + 1);
    else setView("result");
  };

  const backToHub = () => {
    haptic("tap");
    setView("hub");
    setFragmentId(null);
    setThreshold(null);
    setQIndex(0);
    setSelected(null);
    setConfirmed(false);
  };

  const hasContent = TOTAL_FRAGMENTS > 0;

  return (
    <article className="pb-28">
      {/* En-tête */}
      <section className="relative overflow-hidden border-b border-border/40 px-6 pt-12 pb-9 text-center">
        <div className="absolute inset-0 ciel-poussiere opacity-45 anim-drift pointer-events-none" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-15 pointer-events-none">
          <Sceau className="h-72 w-72" label={tr(copy.seal)} />
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <p className="mb-3 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
            {tr(copy.eyebrow)}
          </p>
          <h1 className="font-serif-rituel text-5xl leading-none sm:text-7xl">{tr(copy.title)}</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-voile-dim">
            {tr(copy.intro)}
          </p>

          {/* Avancement global : fragments maîtrisés (jamais le nombre de questions) */}
          <div className="mx-auto mt-7 max-w-sm">
            <div className="flex items-center justify-between font-mono-eclat text-[10px] uppercase tracking-rituel text-voile-dim">
              <span>{tr(copy.mastered)}</span>
              <span className="text-laiton">
                {masteredCount}/{TOTAL_FRAGMENTS}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden bg-secondary">
              <div
                className="h-full bg-laiton transition-all duration-700"
                style={{
                  width: `${Math.round((masteredCount / Math.max(1, TOTAL_FRAGMENTS)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {!allMastered && nextHint && <NextHint hint={nextHint} />}
          <Ornement className="mx-auto mt-7 max-w-[12rem]" />
        </motion.div>
      </section>

      {allMastered && view === "hub" && <CompanionUnlocked />}

      {!hasContent ? (
        <section className="px-6 py-16 text-center">
          <p className="font-serif-rituel text-2xl">{tr(copy.emptyTitle)}</p>
          <p className="mt-3 font-serif-rituel italic text-voile-dim">{tr(copy.emptyBody)}</p>
        </section>
      ) : view === "hub" ? (
        <QuizHub store={store} fragmentScanCounts={fragmentScanCounts} onOpenPalier={openPalier} />
      ) : view === "question" && question && fragmentId && threshold ? (
        <QuizQuestion
          fragmentId={fragmentId}
          threshold={threshold}
          qIndex={qIndex}
          total={questions.length}
          prompt={tr(question.prompt)}
          options={tr(question.options)}
          answerIndex={question.answerIndex}
          explanation={tr(question.explanation)}
          selected={selected}
          confirmed={confirmed}
          onSelect={setSelected}
          onConfirm={confirmAnswer}
          onNext={goNext}
          onBack={backToHub}
          reduceMotion={Boolean(reduceMotion)}
        />
      ) : view === "result" && fragmentId && threshold ? (
        <QuizResult
          store={store}
          fragmentId={fragmentId}
          threshold={threshold}
          masteredCount={masteredCount}
          totalFragments={TOTAL_FRAGMENTS}
          onAnother={backToHub}
          onRetake={() => openPalier(fragmentId, threshold)}
        />
      ) : null}
    </article>
  );
}

/* ─────────────────────────────────────────── */
/*  Sceaux + indices                            */
/* ─────────────────────────────────────────── */

const SealDot = ({ state }: { state: SealState }) => (
  <span
    aria-hidden="true"
    className={`inline-block h-2.5 w-2.5 rounded-full border transition ${
      state === "maitrise"
        ? "border-laiton bg-laiton shadow-[0_0_8px_hsl(var(--laiton)/0.8)]"
        : state === "ouvert"
          ? "border-laiton/80"
          : "border-voile-dim/30"
    }`}
  />
);

const NextHint = ({
  hint,
}: {
  hint: { fragmentId: string; threshold: QuizThreshold; remaining: number };
}) => {
  const { lang, tr } = useI18n();
  const fragment = localizeFragment(getFragment(hint.fragmentId), lang);
  return (
    <p className="mx-auto mt-5 inline-flex max-w-sm items-center gap-2 border border-laiton/30 px-3 py-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton/90">
      <ScanLine className="h-3 w-3 shrink-0" strokeWidth={1.5} />
      {tr(copy.almost)} {hint.remaining} {tr(copy.scansWord)} · {tr(levelLabel(hint.threshold))} ·{" "}
      {fragment?.name}
    </p>
  );
};

const CompanionUnlocked = () => {
  const { tr } = useI18n();
  return (
    <section className="px-6 pt-5">
      <Link
        to="/compagnon"
        className="tap group mx-auto block max-w-md border border-laiton/40 bg-laiton/5 p-5 transition hover:bg-laiton/10"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-laiton" strokeWidth={1.25} />
          <div className="min-w-0 flex-1">
            <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton">
              {tr(copy.companionCta)}
            </p>
            <h3 className="font-serif-rituel text-2xl leading-none">{tr(copy.companionTitle)}</h3>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-laiton transition group-hover:translate-x-0.5"
            strokeWidth={1.25}
          />
        </div>
        <p className="mt-3 font-serif-rituel italic text-sm leading-snug text-voile-dim">
          {tr(copy.companionBody)}
        </p>
      </Link>
    </section>
  );
};

/* ─────────────────────────────────────────── */
/*  Hub : fragments + paliers (gatés)           */
/* ─────────────────────────────────────────── */

const QuizHub = ({
  store,
  fragmentScanCounts,
  onOpenPalier,
}: {
  store: ReturnType<typeof useQuizProgress>["store"];
  fragmentScanCounts: Record<string, number>;
  onOpenPalier: (fragmentId: string, threshold: QuizThreshold) => void;
}) => {
  const { lang, tr } = useI18n();
  const [openFragmentId, setOpenFragmentId] = useState<string | null>(
    FRAGMENT_QUIZZES[0]?.fragmentId ?? null,
  );

  return (
    <section className="px-5 py-9">
      <p className="mb-5 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
        {tr(copy.chooseFragment)}
      </p>

      <div className="space-y-3">
        {FRAGMENT_QUIZZES.map((quiz) => {
          const fragment = localizeFragment(getFragment(quiz.fragmentId), lang);
          const scans = fragmentScanCounts[quiz.fragmentId] || 0;
          const isOpen = openFragmentId === quiz.fragmentId;

          // État des 3 sceaux (scellé / ouvert / maîtrisé) sur les seuils 1/20/40.
          const sealStates: SealState[] = QUIZ_THRESHOLDS.map((t) => {
            if (scans < t) return "scelle";
            const ps = palierScore(store, quiz.fragmentId, t);
            return ps.total > 0 && ps.answered >= ps.total ? "maitrise" : "ouvert";
          });
          const fragmentRevealed = scans >= MASTER_THRESHOLD; // 3 sceaux ouverts → brille

          return (
            <div
              key={quiz.fragmentId}
              className={`border bg-card/20 transition-colors ${
                fragmentRevealed ? "border-laiton/50" : "border-border/50"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  haptic("tap");
                  setOpenFragmentId((c) => (c === quiz.fragmentId ? null : quiz.fragmentId));
                }}
                aria-expanded={isOpen}
                className="tap flex w-full items-center gap-4 px-4 py-4 text-start"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center border bg-noir-profond/40 text-laiton ${
                    fragmentRevealed
                      ? "border-laiton shadow-[0_0_14px_-2px_hsl(var(--laiton)/0.7)]"
                      : "border-laiton/30"
                  }`}
                >
                  <FragmentIcon id={quiz.fragmentId} className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
                    {fragment?.number || ""}
                  </span>
                  <span
                    className={`block font-serif-rituel text-2xl leading-none ${
                      fragmentRevealed ? "text-laiton" : ""
                    }`}
                  >
                    {fragment?.name || quiz.fragmentId}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                  {sealStates.map((state, i) => (
                    <SealDot key={i} state={state} />
                  ))}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-2 border-t border-border/40 px-4 py-4">
                      {QUIZ_THRESHOLDS.map((t) => {
                        const palier = quiz.paliers.find((p) => p.threshold === t);
                        const unlocked = isPalierUnlocked(t, scans) && Boolean(palier);
                        const remaining = Math.max(0, t - scans);
                        const ps = palier
                          ? palierScore(store, quiz.fragmentId, t)
                          : { answered: 0, total: 0, correct: 0 };
                        const mastered = unlocked && ps.total > 0 && ps.answered >= ps.total;
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => onOpenPalier(quiz.fragmentId, t)}
                            className={`tap flex min-h-12 items-center justify-between gap-3 border px-4 py-3 text-start transition ${
                              unlocked
                                ? "border-laiton/40 text-laiton hover:bg-laiton/10"
                                : "border-border/40 text-voile-dim/50"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              {unlocked ? (
                                mastered ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                ) : (
                                  <BookOpen className="h-4 w-4 shrink-0" strokeWidth={1.4} />
                                )
                              ) : (
                                <Lock className="h-4 w-4 shrink-0" strokeWidth={1.4} />
                              )}
                              <span className="font-mono-eclat text-[11px] uppercase tracking-rituel">
                                {tr(levelLabel(t))}
                              </span>
                            </span>
                            <span className="font-mono-eclat text-[9px] uppercase tracking-rituel">
                              {!unlocked
                                ? `${tr(copy.needScans)} ${remaining} ${tr(copy.scansWord)} ${tr(copy.before)} ${tr(levelLabel(t))}`
                                : mastered
                                  ? tr(copy.done)
                                  : tr(copy.toTest)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <Link
        to="/scan"
        className="tap mx-auto mt-9 flex min-h-12 max-w-xs items-center justify-center gap-3 border border-laiton/40 px-5 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton transition hover:bg-laiton/10"
      >
        <ScanLine className="h-3.5 w-3.5" strokeWidth={1.4} />
        {tr(copy.scan)}
      </Link>
    </section>
  );
};

/* ─────────────────────────────────────────── */
/*  Question                                    */
/* ─────────────────────────────────────────── */

const QuizQuestion = ({
  fragmentId,
  threshold,
  qIndex,
  total,
  prompt,
  options,
  answerIndex,
  explanation,
  selected,
  confirmed,
  onSelect,
  onConfirm,
  onNext,
  onBack,
  reduceMotion,
}: {
  fragmentId: string;
  threshold: QuizThreshold;
  qIndex: number;
  total: number;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  selected: number | null;
  confirmed: boolean;
  onSelect: (i: number) => void;
  onConfirm: () => void;
  onNext: () => void;
  onBack: () => void;
  reduceMotion: boolean;
}) => {
  const { lang, tr } = useI18n();
  const fragment = localizeFragment(getFragment(fragmentId), lang);
  const isRight = confirmed && selected === answerIndex;
  const isLast = qIndex === total - 1;

  return (
    <section className="px-6 py-8 max-w-xl mx-auto">
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="tap inline-flex items-center gap-2 font-mono-eclat text-[10px] uppercase tracking-rituel text-voile-dim transition hover:text-laiton"
          aria-label={tr(copy.back)}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
          {tr(copy.back)}
        </button>
        <span className="font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
          {fragment?.name} · {tr(levelLabel(threshold))}
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
        <span>
          {tr(copy.question)} {qIndex + 1} / {total}
        </span>
      </div>
      <div className="mb-7 h-1 overflow-hidden bg-secondary">
        <div
          className="h-full bg-laiton transition-all duration-500"
          style={{ width: `${Math.round(((qIndex + (confirmed ? 1 : 0)) / total) * 100)}%` }}
        />
      </div>

      <motion.div
        key={qIndex}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-serif-rituel text-2xl leading-snug text-foreground sm:text-3xl">
          {prompt}
        </h2>

        <div className="mt-7 space-y-3">
          {options.map((option, i) => {
            const isPicked = selected === i;
            const isAnswer = i === answerIndex;
            let stateClass =
              "border-border/60 bg-background/30 text-foreground hover:border-laiton/40";
            if (confirmed && isAnswer) stateClass = "border-laiton bg-laiton/15 text-laiton";
            else if (confirmed && isPicked && !isAnswer)
              stateClass = "border-destructive/60 bg-destructive/10 text-foreground/80";
            else if (!confirmed && isPicked) stateClass = "border-laiton bg-laiton/10 text-laiton";
            return (
              <button
                key={i}
                type="button"
                data-testid="quiz-option"
                disabled={confirmed}
                onClick={() => {
                  if (confirmed) return;
                  haptic("tap");
                  onSelect(i);
                }}
                className={`tap flex min-h-12 w-full items-start gap-3 border px-4 py-3 text-start transition ${stateClass} disabled:cursor-default`}
                aria-pressed={isPicked}
              >
                <span className="mt-0.5 font-mono-eclat text-[11px] uppercase tracking-rituel opacity-70">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 font-serif-rituel text-base leading-snug">{option}</span>
                {confirmed && isAnswer && (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-laiton" strokeWidth={2} />
                )}
                {confirmed && isPicked && !isAnswer && (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" strokeWidth={2} />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {confirmed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6 border-s-2 border-laiton/50 bg-card/30 px-4 py-4"
            >
              <p className="mb-2 flex items-center gap-2 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
                {isRight ? (
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                {isRight ? tr(copy.correct) : tr(copy.wrong)}
              </p>
              {explanation.trim() && (
                <p className="font-serif-rituel text-base leading-snug text-voile-dim">
                  {explanation}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {!confirmed ? (
            <Button
              variant="rituel"
              size="lg"
              onClick={onConfirm}
              disabled={selected === null}
              className="min-h-12 flex-1 whitespace-normal"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.25} />
              {tr(copy.confirm)}
            </Button>
          ) : (
            <Button
              variant="rituel"
              size="lg"
              onClick={onNext}
              className="min-h-12 flex-1 whitespace-normal"
            >
              {isLast ? tr(copy.seeResult) : tr(copy.next)}
              <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
};

/* ─────────────────────────────────────────── */
/*  Résultat de palier                          */
/* ─────────────────────────────────────────── */

const QuizResult = ({
  store,
  fragmentId,
  threshold,
  masteredCount,
  totalFragments,
  onAnother,
  onRetake,
}: {
  store: ReturnType<typeof useQuizProgress>["store"];
  fragmentId: string;
  threshold: QuizThreshold;
  masteredCount: number;
  totalFragments: number;
  onAnother: () => void;
  onRetake: () => void;
}) => {
  const { lang, tr } = useI18n();
  const fragment = localizeFragment(getFragment(fragmentId), lang);
  const s = useMemo(
    () => palierScore(store, fragmentId, threshold),
    [store, fragmentId, threshold],
  );
  const sealMastered = s.total > 0 && s.answered >= s.total;

  return (
    <section className="px-6 py-12 max-w-md mx-auto text-center">
      <p className="font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
        {sealMastered ? tr(copy.sealMastered) : tr(copy.palierDone)}
      </p>
      <h1 className="mt-2 font-serif-rituel text-4xl leading-none">{fragment?.name}</h1>
      <p className="mt-1 font-mono-eclat text-[10px] uppercase tracking-rituel text-voile-dim">
        {tr(levelLabel(threshold))}
      </p>

      <Ornement className="mx-auto my-8 max-w-[10rem]" />

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border/50 bg-card/20 p-5">
          <p className="font-serif-rituel text-4xl leading-none text-laiton">
            {s.correct}/{s.total}
          </p>
          <p className="mt-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
            {tr(levelLabel(threshold))}
          </p>
        </div>
        <div className="border border-border/50 bg-card/20 p-5">
          <p className="font-serif-rituel text-4xl leading-none">
            {masteredCount}/{totalFragments}
          </p>
          <p className="mt-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
            {tr(copy.mastered)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button variant="rituel" size="lg" onClick={onAnother} className="min-h-12">
          <BookOpen className="h-4 w-4" strokeWidth={1.25} />
          {tr(copy.another)}
        </Button>
        <Button variant="pierre" size="lg" onClick={onRetake} className="min-h-12">
          <RotateCcw className="h-4 w-4" strokeWidth={1.25} />
          {tr(copy.retake)}
        </Button>
      </div>
    </section>
  );
};
