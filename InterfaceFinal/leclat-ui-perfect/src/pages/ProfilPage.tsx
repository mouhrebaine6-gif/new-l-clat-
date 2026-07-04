import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Coins,
  KeyRound,
  Mail,
  ScanLine,
  ShieldCheck,
  Shirt,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LanguageModule } from "@/components/LanguageModule";
import { BackendStatusModule } from "@/components/BackendStatusModule";
import { useAccountProgression } from "@/hooks/useAccountProgression";
import { GARMENT_CATALOG, MISSIONS, STORY_REWARDS } from "@/lib/progression";
import { toRoman } from "@/lib/porteur";
import { gradeForLevel } from "@/lib/grades";
import { text, useI18n, type Localized } from "@/lib/i18n";
import { NumberTick } from "@/components/motion/NumberTick";
import { Sceau } from "@/components/Logo";

const SEAL_RING = 2 * Math.PI * 68; // anneau de progression du sceau (r = 68)

const copy = {
  // Section hero
  profileLabel: text("Profil porteur", "Bearer profile", "ملف الحامل"),
  pseudo: text("Pseudo", "Pseudo", "الاسم المستعار"),
  guestMode: text("Mode invité local", "Local guest mode", "وضع الضيف المحلي"),
  // Stats
  level: text("Niveau", "Level", "المستوى"),
  xp: text("XP", "XP", "نقاط الخبرة"),
  coins: text("Coins", "Coins", "قطع نقدية"),
  progressToNext: text(
    (n: number) => `${n}% vers niveau ${n + 1}`,
    (n: number) => `${n}% to level ${n + 1}`,
    (n: number) => `٪${n} نحو المستوى ${n + 1}`,
  ),
  xpFmt: text(
    (xp: number, target: number) => `${xp}/${target} XP`,
    (xp: number, target: number) => `${xp}/${target} XP`,
    (xp: number, target: number) => `${xp}/${target} نقطة`,
  ),
  // Compte
  account: text("Compte", "Account", "الحساب"),
  accountSignedIn: text("Compte connecté", "Signed in", "متّصل"),
  accountLoading: text("Vérification", "Checking", "تحقّق"),
  accountDisabled: text("Mode invité", "Guest mode", "وضع الضيف"),
  accountGuest: text("Invité", "Guest", "ضيف"),
  remoteStatusLabel: text("Progression : ", "Progress: ", "التقدّم : "),
  remoteHint: text(
    "Invité = progression gardée sur ce téléphone. Compte connecté = progression synchronisée et séparée pour chaque porteur.",
    "Guest = progress kept on this phone. Signed-in account = synced progress separated for each bearer.",
    "الضيف = تقدّم محفوظ على هذا الهاتف. الحساب المتصل = تقدّم متزامن ومنفصل لكل حامل.",
  ),
  linkSent: text("Lien envoyé", "Link sent", "تم إرسال الرابط"),
  checkEmail: text("Vérifiez votre email.", "Check your email.", "تحقّق من بريدك."),
  signInFailed: text("Connexion impossible", "Sign-in failed", "تعذّر الاتصال"),
  codeRefused: text("Code refusé", "Code refused", "تم رفض الرمز"),
  codeAccepted: text("Compte connecté", "Account linked", "تم ربط الحساب"),
  codeAcceptedDesc: text(
    "Progression chargée pour ce compte.",
    "Progress loaded for this account.",
    "تم تحميل التقدّم لهذا الحساب.",
  ),
  linkBtn: text("Lien", "Link", "الرابط"),
  out: text("Sortir", "Sign out", "خروج"),
  verify: text("Vérifier", "Verify", "تحقّق"),
  supabaseNotConfigured: text(
    "Le mode invité reste disponible. Pour garder les XP et coins officiels, connectez un compte.",
    "Guest mode remains available. Connect an account to keep official XP and coins.",
    "يبقى وضع الضيف متاحًا. اربط حسابًا لحفظ XP والعملات الرسمية.",
  ),
  sessionClosed: text("Session fermée", "Session closed", "تم إغلاق الجلسة"),
  sessionClosedDesc: text(
    "Le mode invité reprend sa progression séparée.",
    "Guest mode keeps its separate progress.",
    "وضع الضيف يستأنف تقدّمه المنفصل.",
  ),
  // Cartes récap
  dressing: text("Dressing", "Dressing", "الخزانة"),
  dressingFmt: text(
    (own: number, total: number) => `${own}/${total}`,
    (own: number, total: number) => `${own}/${total}`,
    (own: number, total: number) => `${own}/${total}`,
  ),
  noGarment: text("Aucun vêtement lié", "No linked garment", "لا قطعة مرتبطة"),
  activeSkin: text("Skin actif", "Active skin", "اللباس النشط"),
  missions: text("Missions", "Missions", "المهمات"),
  missionsDesc: text(
    "XP et coins validés côté serveur",
    "XP and coins validated server-side",
    "تم التحقق من XP والعملات من الخادم",
  ),
  lore: text("Lore", "Lore", "السّرد"),
  complete: text("Complet", "Complete", "مكتمل"),
  allRead: text("Toutes les histoires lues", "All stories read", "كل القصص قُرئت"),
  nextStoryFmt: text(
    (n: number) => `Niv. ${n}`,
    (n: number) => `Lvl ${n}`,
    (n: number) => `المستوى ${n}`,
  ),
  // Identité AR
  arIdentity: text("Identité AR", "AR identity", "هوية الواقع المعزز"),
  arIdentityTitle: text("Ce compte dans l'app", "This account in the app", "هذا الحساب في التطبيق"),
  active: text("Actif", "Active", "نشِط"),
  // Link cards
  linkDressing: text("Dressing", "Dressing", "الخزانة"),
  linkDressingDesc: text(
    "Compte, missions, skins",
    "Account, missions, skins",
    "الحساب والمهمات والجلود",
  ),
  linkScan: text("Scan", "Scan", "مسح"),
  linkScanDesc: text("Caméra et modèle AR", "Camera and AR model", "الكاميرا ونموذج الواقع المعزز"),
  linkQuiz: text("Quiz", "Quiz", "اختبار"),
  linkQuizDesc: text("Progression canon", "Canon progression", "تقدّم معتمد"),
  // Réglages
  settings: text("Réglages", "Settings", "الإعدادات"),
} as {
  // Section hero
  profileLabel: Localized<string>;
  pseudo: Localized<string>;
  guestMode: Localized<string>;
  // Stats
  level: Localized<string>;
  xp: Localized<string>;
  coins: Localized<string>;
  progressToNext: Localized<(n: number) => string>;
  xpFmt: Localized<(xp: number, target: number) => string>;
  // Compte
  account: Localized<string>;
  accountSignedIn: Localized<string>;
  accountLoading: Localized<string>;
  accountDisabled: Localized<string>;
  accountGuest: Localized<string>;
  remoteStatusLabel: Localized<string>;
  remoteHint: Localized<string>;
  linkSent: Localized<string>;
  checkEmail: Localized<string>;
  signInFailed: Localized<string>;
  codeRefused: Localized<string>;
  codeAccepted: Localized<string>;
  codeAcceptedDesc: Localized<string>;
  linkBtn: Localized<string>;
  out: Localized<string>;
  verify: Localized<string>;
  supabaseNotConfigured: Localized<string>;
  sessionClosed: Localized<string>;
  sessionClosedDesc: Localized<string>;
  // Cartes récap
  dressing: Localized<string>;
  dressingFmt: Localized<(own: number, total: number) => string>;
  noGarment: Localized<string>;
  activeSkin: Localized<string>;
  missions: Localized<string>;
  missionsDesc: Localized<string>;
  lore: Localized<string>;
  complete: Localized<string>;
  allRead: Localized<string>;
  nextStoryFmt: Localized<(n: number) => string>;
  // Identité AR
  arIdentity: Localized<string>;
  arIdentityTitle: Localized<string>;
  active: Localized<string>;
  // Link cards
  linkDressing: Localized<string>;
  linkDressingDesc: Localized<string>;
  linkScan: Localized<string>;
  linkScanDesc: Localized<string>;
  linkQuiz: Localized<string>;
  linkQuizDesc: Localized<string>;
  // Réglages
  settings: Localized<string>;
};

export default function ProfilPage() {
  const { lang, tr } = useI18n();
  const reduce = useReducedMotion() ?? false;
  const { auth, level, refreshRemoteProgression, remoteError, remoteStatus, state } =
    useAccountProgression(lang);
  const grade = gradeForLevel(state.profile.level);
  const [email, setEmail] = useState(auth.user?.email || "");
  const [otp, setOtp] = useState("");

  const ownedGarments = useMemo(
    () => GARMENT_CATALOG.filter((garment) => state.ownedGarmentIds.includes(garment.id)),
    [state.ownedGarmentIds],
  );
  const completedMissions = useMemo(
    () => MISSIONS.filter((mission) => state.missions[mission.id]?.completedAt),
    [state.missions],
  );
  const nextStory = STORY_REWARDS.find((story) => !state.storiesRead.includes(story.id));

  const intlLocale = lang === "en" ? "en-US" : lang === "ar" ? "ar-DZ" : "fr-FR";

  const requestLogin = async () => {
    const result = await auth.sendMagicLink(email.trim());
    toast(result.ok ? tr(copy.linkSent) : tr(copy.signInFailed), {
      description: result.ok ? tr(copy.checkEmail) : result.error,
    });
  };

  const verifyLogin = async () => {
    const result = await auth.verifyEmailOtp(email.trim(), otp.trim());
    toast(result.ok ? tr(copy.codeAccepted) : tr(copy.codeRefused), {
      description: result.ok ? tr(copy.codeAcceptedDesc) : result.error,
    });
    if (result.ok) void refreshRemoteProgression();
  };

  const signOut = async () => {
    await auth.signOut();
    toast(tr(copy.sessionClosed), { description: tr(copy.sessionClosedDesc) });
  };

  return (
    <div className="pb-12">
      <section className="relative overflow-hidden px-6 pt-10 pb-9">
        <div className="absolute inset-0 voile-dust opacity-30 pointer-events-none" />
        <div className="relative">
          {/* Sceau du porteur + anneau de progression (tête premium) */}
          <p className="text-center font-mono text-[10px] uppercase tracking-rituel text-laiton-300">
            {tr(copy.profileLabel)}
          </p>
          <div className="relative mx-auto mt-4 h-[150px] w-[150px]">
            <div
              aria-hidden="true"
              className="absolute inset-[-8px] rounded-full anim-respire"
              style={{
                background: "radial-gradient(circle, rgba(184,137,58,.28), transparent 65%)",
              }}
            />
            <svg
              width="150"
              height="150"
              viewBox="0 0 150 150"
              className="absolute inset-0"
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx="75"
                cy="75"
                r="68"
                fill="none"
                stroke="rgba(228,220,204,.1)"
                strokeWidth="2.5"
              />
              <motion.circle
                cx="75"
                cy="75"
                r="68"
                fill="none"
                stroke="url(#sealGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={SEAL_RING}
                initial={{ strokeDashoffset: SEAL_RING }}
                animate={{ strokeDashoffset: SEAL_RING * (1 - level.percent / 100) }}
                transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="sealGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#b8893a" />
                  <stop offset="1" stopColor="#f4d79e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sceau width={104} className="drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
          <h1 className="mt-3 text-center font-display text-4xl leading-none">
            {state.profile.pseudo}
          </h1>
          <p className="mt-2 text-center font-serif-rituel text-2xl italic text-laiton-300">
            {tr(grade.name)}
          </p>
          <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-rituel text-voile-dim">
            {tr(copy.level)} {toRoman(state.profile.level)} · {tr(grade.aura)}
          </p>
          <p className="mt-2 text-center font-serif italic text-sm text-voile-dim">
            {auth.user?.email || tr(copy.guestMode)}
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2.5">
            <Stat icon={Award} label={tr(copy.level)} value={String(state.profile.level)} />
            <Stat
              icon={Sparkles}
              label={tr(copy.xp)}
              value={
                <NumberTick
                  value={state.profile.xpTotal}
                  format={new Intl.NumberFormat(intlLocale)}
                />
              }
            />
            <Stat
              icon={Coins}
              label={tr(copy.coins)}
              value={
                <NumberTick
                  value={state.profile.coins}
                  format={new Intl.NumberFormat(intlLocale)}
                />
              }
            />
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[9px] uppercase tracking-rituel text-voile-dim">
                {tr(copy.progressToNext)(level.percent)}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-rituel text-laiton-300">
                {tr(copy.xpFmt)(state.profile.xpTotal, level.nextLevelXp)}
              </p>
            </div>
            <div className="mt-3 h-px bg-border">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${level.percent}%` }}
                viewport={{ once: true }}
                transition={{ duration: reduce ? 0 : 1.6, ease: [0.16, 1, 0.3, 1] }}
                className="h-px bg-gradient-to-r from-laiton-900 via-laiton-500 to-laiton-100"
                style={{ boxShadow: "0 0 12px hsl(36 60% 70% / 0.5)" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/30 px-6 py-10">
        <SectionTitle
          icon={ShieldCheck}
          eyebrow={tr(copy.account)}
          title={accountTitle(auth.status, copy, tr)}
        />
        <div className="mt-4 border-y border-laiton/15 py-4">
          <p className="font-mono text-[9px] uppercase tracking-rituel text-voile-dim">
            {tr(copy.remoteStatusLabel)}
            {remoteStatus}
            {remoteError ? ` - ${remoteError}` : ""}
          </p>
          <p className="mt-2 font-serif italic text-sm leading-snug text-voile-dim">
            {tr(copy.remoteHint)}
          </p>
        </div>

        {auth.configured ? (
          <div className="mt-5 grid gap-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@domaine.com"
              className="min-h-12 border border-border bg-background/60 px-4 font-mono text-[11px] tracking-rituel outline-none focus:border-laiton"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="voile" onClick={requestLogin} className="min-h-12">
                <Mail className="h-4 w-4" strokeWidth={1.25} />
                {tr(copy.linkBtn)}
              </Button>
              <Button variant="pierre" onClick={signOut} className="min-h-12">
                <KeyRound className="h-4 w-4" strokeWidth={1.25} />
                {tr(copy.out)}
              </Button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="123456"
                className="min-h-12 border border-border bg-background/60 px-4 font-mono text-[11px] tracking-rituel outline-none focus:border-laiton"
              />
              <Button variant="rituel" onClick={verifyLogin}>
                {tr(copy.verify)}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-5 font-serif italic text-voile-dim">{tr(copy.supabaseNotConfigured)}</p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 border-t border-border/30 px-6 py-10">
        <SummaryCard
          icon={Shirt}
          label={tr(copy.dressing)}
          value={tr(copy.dressingFmt)(ownedGarments.length, GARMENT_CATALOG.length)}
          detail={ownedGarments[0]?.name || tr(copy.noGarment)}
        />
        <SummaryCard
          icon={CheckCircle2}
          label={tr(copy.missions)}
          value={tr(copy.dressingFmt)(completedMissions.length, MISSIONS.length)}
          detail={tr(copy.missionsDesc)}
        />
        <SummaryCard
          icon={BookOpen}
          label={tr(copy.lore)}
          value={nextStory ? tr(copy.nextStoryFmt)(nextStory.levelRequired) : tr(copy.complete)}
          detail={nextStory?.title || tr(copy.allRead)}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 border-t border-border/30 px-6 py-10 sm:grid-cols-3">
        <LinkCard
          to="/dressing"
          icon={Shirt}
          title={tr(copy.linkDressing)}
          detail={tr(copy.linkDressingDesc)}
        />
        <LinkCard
          to="/scan"
          icon={ScanLine}
          title={tr(copy.linkScan)}
          detail={tr(copy.linkScanDesc)}
        />
        <LinkCard
          to="/quiz"
          icon={BookOpen}
          title={tr(copy.linkQuiz)}
          detail={tr(copy.linkQuizDesc)}
        />
      </section>

      <section className="border-t border-border/20 px-6 pt-4 pb-2">
        <p className="mb-4 text-center font-mono text-[9px] uppercase tracking-rituel text-voile-dim/60">
          {tr(copy.settings)}
        </p>
        <LanguageModule />
        <BackendStatusModule />
      </section>
    </div>
  );
}

const accountTitle = (
  status: string,
  c: typeof copy,
  tr: <T>(value: Localized<T>) => T,
): string => {
  if (status === "signed-in") return tr(c.accountSignedIn);
  if (status === "loading") return tr(c.accountLoading);
  if (status === "disabled") return tr(c.accountDisabled);
  return tr(c.accountGuest);
};

const SectionTitle = ({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  eyebrow: string;
  title: string;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="font-mono text-[10px] uppercase tracking-rituel text-laiton-300">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl leading-tight">{title}</h2>
    </div>
    <Icon className="h-5 w-5 shrink-0 text-laiton-300" strokeWidth={1.25} />
  </div>
);

type StatValue = string | number | React.ReactNode;

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  label: string;
  value: StatValue;
}) => (
  <div className="rounded-[14px] border border-border/60 bg-noir-profond/45 px-3 py-4 text-center">
    <Icon className="mx-auto h-4 w-4 text-laiton-300" strokeWidth={1.25} />
    <p className="mt-2 font-mono text-[8px] uppercase tracking-rituel text-voile-dim">{label}</p>
    <p
      className="mt-1 font-display text-3xl leading-none"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {value}
    </p>
  </div>
);

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  label: string;
  value: string;
  detail: string;
}) => (
  <div className="min-h-36 border-t border-laiton/20 bg-card/20 px-4 py-4">
    <Icon className="h-4 w-4 text-laiton-300" strokeWidth={1.25} />
    <p className="mt-4 font-mono text-[8px] uppercase tracking-rituel text-voile-dim">{label}</p>
    <p className="mt-2 break-words font-display text-2xl leading-tight">{value}</p>
    <p className="mt-2 break-words font-serif text-sm italic leading-snug text-voile-dim">
      {detail}
    </p>
  </div>
);

const LinkCard = ({
  to,
  icon: Icon,
  title,
  detail,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  title: string;
  detail: string;
}) => (
  <Link
    to={to}
    className="border-t border-laiton/20 bg-gradient-to-b from-card/30 to-transparent p-5 transition hover:from-card/50"
  >
    <Icon className="mb-2 h-4 w-4 text-laiton-300" strokeWidth={1.25} />
    <p className="font-display text-xl">{title}</p>
    <p className="mt-1 font-mono text-[9px] uppercase tracking-rituel text-voile-dim">{detail}</p>
  </Link>
);
