import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, ShoppingBag, User, Scan as ScanIcon, ChevronRight } from "lucide-react";
import { usePorteur, toRoman } from "@/lib/porteur";
import { useAccountProgression } from "@/hooks/useAccountProgression";
import { gradeForLevel } from "@/lib/grades";
import { getFragment, localizeFragment } from "@/data/fragments";
import { text, useI18n } from "@/lib/i18n";
import { EASE_SEUIL } from "@/lib/motion";

/**
 * Accueil « Le Voile » — tableau de bord app premium (porté du mockup).
 * Salutation + anneau de progression + reprise lecture + fragment du jour +
 * actions rapides. La ligne manifeste iconique est préservée en clôture.
 */

const copy = {
  level: text("Niveau", "Level", "المستوى"),
  toNext: text("vers Niveau", "to Level", "نحو المستوى"),
  ritual: text(
    "Chaque scan ouvre une couture de plus.",
    "Each scan opens one more seam.",
    "كل مسح يفتح خياطة أخرى.",
  ),
  fragments: text("Fragments", "Fragments", "شذرات"),
  passages: text("Passages", "Passages", "عبور"),
  resume: text("Reprendre", "Resume", "استئناف"),
  resumeTitle: text("L'histoire", "The story", "القصة"),
  resumeSub: text("Roman vivant · Drop 01", "Living novel · Drop 01", "رواية حيّة · الإصدار 01"),
  today: text("Fragment du jour", "Today's fragment", "شذرة اليوم"),
  discover: text("Découvrir", "Discover", "اكتشف"),
  scan: text("Scan", "Scan", "مسح"),
  boutique: text("Boutique", "Boutique", "متجر"),
  sceau: text("Sceau", "Seal", "الختم"),
  recent: text(
    "Derniers fragments reconnus",
    "Last recognized fragments",
    "آخر الشذرات المتعرّف إليها",
  ),
  emptyQuote: text(
    "« Portez-le sans rien demander. Scannez-le si cela ne vous suffit pas. »",
    "“Wear it without asking anything of it. Scan it if that is not enough.”",
    "«ارتده من غير أن تطلب منه شيئًا. امسحه إن لم يكفِ ذلك.»",
  ),
  manifestoLine: text(
    "est l'histoire d'une blessure cousue dans un vêtement, puis révélée par la lumière d'une application.",
    "is the story of a wound sewn into a garment, then revealed by the light of an app.",
    "حكاية جرحٍ مخيطٍ في ثوب، يكشفه ضوءُ تطبيق.",
  ),
};

const RING = 2 * Math.PI * 54; // r = 54

export default function Index() {
  const { state } = usePorteur();
  const { lang, tr } = useI18n();
  const { level: accountLevel } = useAccountProgression(lang);
  const reduce = useReducedMotion() ?? false;

  const grade = gradeForLevel(accountLevel.level);
  const level = accountLevel.level;
  const pct = Math.max(4, Math.min(100, accountLevel.percent));
  const ringOffset = RING * (1 - pct / 100);
  const collectedCount = state.collected.length;
  const passages = state.qualifiedProgressPoints;
  const nextLevel = toRoman(accountLevel.nextLevel);

  const hour = new Date().getHours();
  const greeting =
    hour < 18
      ? text("Bonjour", "Good day", "نهارك سعيد")
      : text("Bonsoir", "Good evening", "مساء الخير");

  const daily = localizeFragment(getFragment("eveil"), lang);

  // Derniers fragments reconnus (avec visuel)
  const recent = state.collected
    .map((id) => localizeFragment(getFragment(id), lang))
    .filter((f): f is NonNullable<typeof f> => Boolean(f?.images?.worn))
    .slice(0, 4);

  const enter = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: i * 0.06, ease: EASE_SEUIL },
        };

  return (
    <div className="px-5 pb-10">
      {/* ===== Salutation ===== */}
      <motion.div {...enter(0)} className="flex items-end justify-between gap-3 pt-5 pb-5">
        <div className="min-w-0">
          <p className="mb-1 text-[13px] tracking-[0.02em] text-voile-dim">{tr(greeting)},</p>
          <h1
            className="font-serif-rituel font-semibold text-voile-pur text-balance"
            style={{ fontSize: "42px", lineHeight: 0.95, letterSpacing: "-0.01em" }}
          >
            {state.name}
            <span className="text-laiton-300">.</span>
          </h1>
        </div>
        <span className="flex-none whitespace-nowrap rounded-full border border-laiton/35 px-3.5 py-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton-300">
          {tr(copy.level)} {toRoman(level)}
        </span>
      </motion.div>

      {/* ===== Carte de progression ===== */}
      <motion.div
        {...enter(1)}
        className="relative flex items-center gap-5 overflow-hidden rounded-[20px] border border-border/70 p-5"
        style={{
          background: "linear-gradient(180deg, rgba(184,137,58,.07), rgba(20,17,14,.5))",
          boxShadow: "inset 0 1px 0 rgba(247,241,227,.05), 0 24px 40px -28px #000",
        }}
      >
        <div className="relative h-24 w-24 flex-none">
          <svg width="96" height="96" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(228,220,204,.1)"
              strokeWidth="6"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING}
              initial={{ strokeDashoffset: reduce ? ringOffset : RING }}
              animate={{ strokeDashoffset: ringOffset }}
              transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#b8893a" />
                <stop offset="1" stopColor="#f4d79e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif-rituel text-3xl font-semibold leading-none text-voile-pur">
              {toRoman(level)}
            </span>
            <span className="mt-0.5 font-mono-eclat text-[8px] uppercase tracking-rituel text-voile-dim">
              {tr(copy.level)}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton-300">
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</span> {tr(copy.toNext)}{" "}
            {nextLevel}
          </p>
          <p className="mb-3.5 font-serif-rituel text-[17px] italic leading-snug text-laiton-300 text-pretty">
            {tr(grade.name)}
          </p>
          <div className="flex gap-5">
            <span className="flex flex-col">
              <b
                className="font-serif-rituel text-[22px] font-semibold text-voile-pur"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {collectedCount}
                <span className="text-[14px] text-voile-dim/70"> / 10</span>
              </b>
              <span className="mt-0.5 font-mono-eclat text-[8px] uppercase tracking-rituel text-voile-dim">
                {tr(copy.fragments)}
              </span>
            </span>
            <span className="flex flex-col">
              <b
                className="font-serif-rituel text-[22px] font-semibold text-voile-pur"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {passages}
              </b>
              <span className="mt-0.5 font-mono-eclat text-[8px] uppercase tracking-rituel text-voile-dim">
                {tr(copy.passages)}
              </span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* ===== Reprendre la lecture ===== */}
      <motion.div {...enter(2)}>
        <Link
          to="/histoire"
          onClick={() => navigator.vibrate?.(8)}
          style={{ touchAction: "manipulation" }}
          className="mt-3.5 flex items-center gap-3.5 rounded-2xl border border-border/55 bg-noir-profond/50 px-4 py-3.5 transition-transform active:scale-[0.985]"
        >
          <span
            className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-laiton/30"
            style={{
              background: "radial-gradient(circle at 50% 35%, rgba(184,137,58,.3), rgba(7,5,3,.9))",
            }}
          >
            <BookOpen className="h-5 w-5 text-laiton-300" strokeWidth={1.25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-0.5 block font-mono-eclat text-[8px] uppercase tracking-rituel text-laiton-300">
              {tr(copy.resume)}
            </span>
            <span className="block font-serif-rituel text-[17px] leading-tight text-voile-pur">
              {tr(copy.resumeTitle)}
            </span>
            <span className="mt-0.5 block text-[11px] text-voile-dim">{tr(copy.resumeSub)}</span>
          </span>
          <ChevronRight
            className="h-4 w-4 flex-none text-voile-dim rtl:rotate-180"
            strokeWidth={1.5}
          />
        </Link>
      </motion.div>

      {/* ===== Fragment du jour ===== */}
      {daily?.images?.worn && (
        <motion.div {...enter(3)}>
          <p className="mb-2.5 mt-6 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
            {tr(copy.today)}
          </p>
          <Link
            to={`/fragments/${daily.id}`}
            onClick={() => navigator.vibrate?.(8)}
            style={{ touchAction: "manipulation" }}
            className="group relative block aspect-[16/10] overflow-hidden rounded-[20px] border border-border/70 bg-black transition-transform active:scale-[0.985]"
          >
            <img
              src={daily.images.worn}
              alt={daily.name}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-[1200ms] group-hover:scale-[1.04]"
              style={{ objectPosition: "50% 32%" }}
            />
            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(7,5,3,.15), rgba(7,5,3,.4) 55%, rgba(7,5,3,.95))",
              }}
            />
            <span className="absolute inset-x-[18px] bottom-4 text-start">
              <span className="mb-1.5 block font-mono-eclat text-[8px] uppercase tracking-rituel text-laiton-flash">
                {tr(copy.fragments)} {daily.number} · {daily.symbole}
              </span>
              <span className="flex items-end justify-between gap-3">
                <span className="font-serif-rituel text-[30px] font-semibold leading-[0.95] text-voile-pur">
                  {daily.name}
                </span>
                <span className="whitespace-nowrap rounded-full border border-voile/30 px-3 py-1.5 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile">
                  {tr(copy.discover)}
                </span>
              </span>
            </span>
          </Link>
        </motion.div>
      )}

      {/* ===== Actions rapides ===== */}
      <motion.div {...enter(4)} className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          { to: "/scan", icon: ScanIcon, label: tr(copy.scan) },
          { to: "/boutique", icon: ShoppingBag, label: tr(copy.boutique) },
          { to: "/profil", icon: User, label: tr(copy.sceau) },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            onClick={() => navigator.vibrate?.(8)}
            style={{ touchAction: "manipulation" }}
            className="flex flex-col items-center gap-2.5 rounded-[15px] border border-border/55 bg-noir-profond/45 px-2 py-4 transition-transform active:scale-[0.96]"
          >
            <a.icon className="h-[22px] w-[22px] text-laiton-300" strokeWidth={1.25} />
            <span className="font-mono-eclat text-[8px] uppercase tracking-rituel text-voile">
              {a.label}
            </span>
          </Link>
        ))}
      </motion.div>

      {/* ===== Derniers fragments / vide ===== */}
      <div className="mb-2.5 mt-7 flex items-center justify-between">
        <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
          {tr(copy.recent)}
        </p>
        <span
          className="font-mono-eclat text-[9px] tracking-rituel text-voile-dim/60"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {collectedCount} / 10
        </span>
      </div>

      {recent.length > 0 ? (
        <div className="grid grid-cols-4 gap-2.5">
          {recent.map((f) => (
            <Link
              key={f.id}
              to={`/fragments/${f.id}`}
              style={{ touchAction: "manipulation" }}
              className="group relative aspect-square overflow-hidden rounded-[12px] border border-laiton/40 bg-black"
            >
              <img
                src={f.images!.worn}
                alt={f.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-105"
              />
              <span
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 42%, rgba(7,5,3,.9))" }}
              />
              <span className="absolute inset-x-0 bottom-1 text-center font-mono-eclat text-[8px] tracking-rituel text-laiton-300">
                {f.number}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[14px] border border-dashed border-border p-[18px] text-center">
          <p className="font-serif-rituel text-[15px] italic leading-relaxed text-voile-dim">
            {tr(copy.emptyQuote)}
          </p>
        </div>
      )}

      {/* ===== Manifeste (ligne iconique préservée) ===== */}
      <div className="mt-8 border-t border-border/40 pt-7 text-center">
        <p className="font-serif-rituel text-[19px] leading-snug text-voile text-pretty">
          <em className="not-italic text-laiton-flash">L'ÉCLAT</em> {tr(copy.manifestoLine)}
        </p>
      </div>
    </div>
  );
}
