import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { usePorteur } from "@/lib/porteur";
import { Ornement } from "@/components/Sceau";
import { Sceau as SceauBrode } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageModule";
import { text, useI18n } from "@/lib/i18n";

const intentionCopies = [
  text("Pour découvrir ce qui est caché.", "To discover what's hidden.", "لأكتشف ما هو مخفي."),
  text("Pour avancer sans bruit.", "To move forward quietly.", "لأمضي بهدوء."),
  text(
    "Pour donner une forme à ce que je ressens.",
    "To give a shape to what I feel.",
    "لأعطي شكلًا لما أشعر به.",
  ),
  text("Pour repartir de zéro.", "To start over.", "لأبدأ من جديد."),
];

const onboardingCopy = {
  fallbackName: text("Porteur", "Bearer", "الحامل"),
  start: text("Commencer", "Begin", "ابدأ"),
  continue: text("Continuer", "Continue", "متابعة"),
  skip: text("Passer", "Skip", "تخطّي"),
  back: text("Retour", "Back", "رجوع"),
  step1: text("Bienvenue · 1 / 4", "Welcome · 1 / 4", "أهلاً · ١ / ٤"),
  step2: text("Ton nom · 2 / 4", "Your name · 2 / 4", "اسمك · ٢ / ٤"),
  step3: text("Pourquoi · 3 / 4", "Why · 3 / 4", "لماذا · ٣ / ٤"),
  step4: text("C'est parti · 4 / 4", "Let's go · 4 / 4", "هيا · ٤ / ٤"),
  welcomeTitleA: text("Bienvenue", "Welcome", "أهلاً بك"),
  welcomeTitleB: text("dans", "to", "في"),
  veil: text("L'ÉCLAT", "L'ÉCLAT", "L'ÉCLAT"),
  welcomeBody: text(
    "Un t-shirt avec une histoire cachée dans le col. Porte-le, scanne-le, et l'histoire s'ouvre peu à peu. Pas de compte, pas de formulaire. Juste toi.",
    "A t-shirt with a story hidden in its collar. Wear it, scan it, and the story opens little by little. No account, no form. Just you.",
    "تيشيرت يخفي قصة في ياقته. البسه، امسحه، فتنفتح القصة شيئًا فشيئًا. لا حساب، لا استمارة. أنت فقط.",
  ),
  nameTitleA: text("Ton", "Your", "ما"),
  nameTitleB: text("prénom", "name", "اسمك"),
  nameTitleC: text("ou ton pseudo ?", "or a nickname?", "أو لقبك؟"),
  nameBody: text(
    "C'est juste pour toi. Tu pourras le changer plus tard.",
    "It's just for you. You can change it later.",
    "هذا لك وحدك. يمكنك تغييره لاحقًا.",
  ),
  namePlaceholder: text("Ton prénom", "Your name", "اسمك"),
  intentionTitleA: text("Pourquoi tu es", "Why are you", "لماذا أنت"),
  intentionTitleB: text("là", "here", "هنا"),
  intentionBody: text(
    "Choisis une phrase, ou écris la tienne. Tu pourras la changer.",
    "Pick a line, or write your own. You can change it.",
    "اختر عبارة، أو اكتب عبارتك. يمكنك تغييرها.",
  ),
  intentionPlaceholder: text("Ou écris la tienne…", "Or write your own…", "أو اكتب عبارتك…"),
  oathTitleA: text("Tout est", "All", "كل شيء"),
  oathTitleB: text("prêt", "ready", "جاهز"),
  oathBody: text(
    "Porte ton t-shirt quand tu veux. Scanne le col quand ça te dit. Et laisse l'histoire venir à toi, page après page.",
    "Wear your t-shirt whenever you want. Scan the collar when you feel like it. And let the story come to you, page by page.",
    "البس تيشيرتك متى شئت. امسح الياقة حين ترغب. ودع القصة تأتيك صفحةً بعد صفحة.",
  ),
  consent: text("Je suis prêt·e", "I'm ready", "أنا جاهز"),
  seal: text("Entrer", "Enter", "ادخل"),
};

export const Onboarding = () => {
  const { state, completeOnboarding } = usePorteur();
  const { tr } = useI18n();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [intention, setIntention] = useState("");
  const [serment, setSerment] = useState(false);
  const intentions = useMemo(() => intentionCopies.map((item) => tr(item)), [tr]);

  if (state.onboarded) return null;

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const finish = () => {
    completeOnboarding({ name: name || tr(onboardingCopy.fallbackName), intention, serment: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="fixed inset-0 z-[80] bg-noir-profond overflow-y-auto overflow-x-hidden"
    >
      <div className="absolute inset-0 ciel-poussiere opacity-60 anim-drift pointer-events-none" />
      <div className="absolute inset-0 vignette-mineral pointer-events-none" />

      <div className="relative min-h-dvh max-w-xl mx-auto px-6 py-12 flex flex-col">
        <div className="absolute right-6 top-5 z-10">
          <LanguageSwitch compact />
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {[0, 1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-px transition-[width,background-color] duration-500 ease-out ${n <= step ? "bg-laiton w-10" : "bg-border w-6"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-8"
            >
              <div className="relative flex flex-col items-center gap-6">
                <div
                  className="absolute inset-0 -m-16 rounded-full anim-respire"
                  style={{
                    background: "radial-gradient(circle, hsl(var(--laiton)/0.25), transparent 60%)",
                  }}
                />
                <SceauBrode width={200} className="relative" />
              </div>
              <div>
                <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
                  {tr(onboardingCopy.step1)}
                </p>
                <h1 className="font-serif-rituel text-5xl leading-tight mb-4">
                  {tr(onboardingCopy.welcomeTitleA)}
                  <br />
                  {tr(onboardingCopy.welcomeTitleB)}{" "}
                  <em className="italic text-laiton">{tr(onboardingCopy.veil)}</em>.
                </h1>
                <p className="font-serif-rituel italic text-base text-voile-dim max-w-sm mx-auto leading-snug whitespace-pre-line">
                  {tr(onboardingCopy.welcomeBody)}
                </p>
              </div>
              <Ornement className="max-w-xs" />
              <button
                onClick={next}
                className="px-10 py-4 border border-laiton text-laiton hover:bg-laiton hover:text-primary-foreground transition-[color,background-color,border-color] duration-200 ease-out font-mono-eclat text-[11px] tracking-rituel uppercase flex items-center gap-3"
              >
                {tr(onboardingCopy.start)} <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-8"
            >
              <div>
                <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
                  {tr(onboardingCopy.step2)}
                </p>
                <h2 className="font-serif-rituel text-4xl mb-4">
                  {tr(onboardingCopy.nameTitleA)}{" "}
                  <em className="italic text-laiton">{tr(onboardingCopy.nameTitleB)}</em>
                  <br />
                  {tr(onboardingCopy.nameTitleC)}
                </h2>
                <p className="font-serif-rituel italic text-base text-voile-dim max-w-sm mx-auto leading-snug">
                  {tr(onboardingCopy.nameBody)}
                </p>
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                placeholder={tr(onboardingCopy.namePlaceholder)}
                className="w-full max-w-sm bg-transparent border-b border-laiton/40 text-center font-serif-rituel text-3xl py-3 px-2 outline-none focus:border-laiton text-foreground placeholder:text-voile-dim/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) next();
                }}
              />
              <button
                disabled={!name.trim()}
                onClick={next}
                className="px-10 py-4 border border-laiton text-laiton hover:bg-laiton hover:text-primary-foreground transition-[color,background-color,border-color] duration-200 ease-out font-mono-eclat text-[11px] tracking-rituel uppercase flex items-center gap-3 disabled:opacity-30"
              >
                {tr(onboardingCopy.continue)} <ArrowRight className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="intention"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-8"
            >
              <div>
                <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
                  {tr(onboardingCopy.step3)}
                </p>
                <h2 className="font-serif-rituel text-4xl mb-4">
                  {tr(onboardingCopy.intentionTitleA)}
                  <br />
                  <em className="italic text-laiton">{tr(onboardingCopy.intentionTitleB)}</em> ?
                </h2>
                <p className="font-serif-rituel italic text-base text-voile-dim max-w-sm mx-auto leading-snug">
                  {tr(onboardingCopy.intentionBody)}
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                {intentions.map((it) => (
                  <button
                    key={it}
                    onClick={() => setIntention(it)}
                    className={`w-full text-left p-4 border transition ${intention === it ? "border-laiton bg-laiton/5" : "border-border hover:border-laiton/40"}`}
                  >
                    <p className="font-serif-rituel italic text-base">« {it} »</p>
                  </button>
                ))}
                <input
                  value={!intentions.includes(intention) ? intention : ""}
                  onChange={(e) => setIntention(e.target.value.slice(0, 140))}
                  placeholder={tr(onboardingCopy.intentionPlaceholder)}
                  className="w-full bg-noir-profond border border-border px-4 py-3 mt-3 font-serif-rituel italic text-base text-foreground focus:border-laiton outline-none"
                />
              </div>
              <button
                onClick={next}
                className="px-10 py-4 border border-laiton text-laiton hover:bg-laiton hover:text-primary-foreground transition-[color,background-color,border-color] duration-200 ease-out font-mono-eclat text-[11px] tracking-rituel uppercase flex items-center gap-3"
              >
                {tr(onboardingCopy.continue)} <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={prev}
                className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/60 hover:text-laiton transition flex items-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" /> {tr(onboardingCopy.back)}
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="serment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-8"
            >
              <div>
                <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
                  {tr(onboardingCopy.step4)}
                </p>
                <h2 className="font-serif-rituel text-4xl mb-4">
                  {tr(onboardingCopy.oathTitleA)}{" "}
                  <em className="italic text-laiton">{tr(onboardingCopy.oathTitleB)}</em>
                </h2>
              </div>
              <div className="border border-laiton/40 p-6 max-w-md text-left space-y-4 bg-card/40 relative">
                <div className="absolute inset-0 filigrane opacity-50" />
                <div className="relative space-y-3">
                  <p className="font-serif-rituel italic text-lg leading-snug whitespace-pre-line">
                    {tr(onboardingCopy.oathBody)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSerment((s) => !s)}
                className="flex items-center gap-3 group"
              >
                <span
                  className={`w-6 h-6 border flex items-center justify-center transition ${serment ? "border-laiton bg-laiton text-primary-foreground" : "border-border"}`}
                >
                  {serment && <Check className="w-3 h-3" strokeWidth={2} />}
                </span>
                <span className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim group-hover:text-laiton transition">
                  {tr(onboardingCopy.consent)}
                </span>
              </button>
              <button
                disabled={!serment}
                onClick={finish}
                className="px-12 py-4 bg-laiton text-primary-foreground hover:bg-laiton/90 transition font-mono-eclat text-[11px] tracking-rituel uppercase disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {tr(onboardingCopy.seal)}
              </button>
              <button
                type="button"
                onClick={prev}
                className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/60 hover:text-laiton transition flex items-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" /> {tr(onboardingCopy.back)}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() =>
            completeOnboarding({ name: tr(onboardingCopy.fallbackName), serment: false })
          }
          className="mx-auto mt-10 font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/40 hover:text-laiton transition"
        >
          {tr(onboardingCopy.skip)}
        </button>
      </div>
    </motion.div>
  );
};
