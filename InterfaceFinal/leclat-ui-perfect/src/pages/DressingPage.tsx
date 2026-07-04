import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Coins,
  Footprints,
  KeyRound,
  Lock,
  Mail,
  ScanLine,
  Shirt,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GARMENT_CATALOG, MISSIONS, STORY_REWARDS } from "@/lib/progression";
import { activateGarmentRemote, claimMissionRewardRemote } from "@/lib/progressionApi";
import { useAccountProgression } from "@/hooks/useAccountProgression";
import { gradeForLevel } from "@/lib/grades";
import { text, useI18n } from "@/lib/i18n";

const copy = {
  title: text("Dressing digital", "Digital dressing", "الخزانة الرقمية"),
  subtitle: text(
    "Compte, vêtements, missions et présences AR.",
    "Account, garments, missions and AR skins.",
    "حساب، قطع، مهام وحضور AR.",
  ),
  preview: text(
    "Mode invité local. La progression reste sur ce téléphone tant qu'aucun compte n'est connecté.",
    "Local guest mode. Progress stays on this phone until an account is connected.",
    "وضع ضيف محلي. يبقى التقدّم على هذا الهاتف حتى يتم ربط حساب.",
  ),
  account: text("Compte", "Account", "الحساب"),
  sendLink: text("Envoyer le lien", "Send link", "إرسال الرابط"),
  verify: text("Vérifier le code", "Verify code", "تأكيد الرمز"),
  signOut: text("Déconnexion", "Sign out", "تسجيل الخروج"),
  connected: text("Session active", "Signed in", "جلسة نشطة"),
  guest: text("Invité", "Guest", "ضيف"),
  activate: text("Activer un t-shirt", "Activate a t-shirt", "تفعيل قميص"),
  activateHelp: text(
    "Entrez le code reçu avec la pièce pour lier le vêtement au dressing.",
    "Enter the code received with the piece to link the garment to the dressing.",
    "أدخل الرمز المرفق بالقطعة لربطها بالخزانة.",
  ),
  activateButton: text("Lier au dressing", "Link to dressing", "ربط بالخزانة"),
  walk: text("Marche", "Walk", "المشي"),
  quiz: text("Quiz canon", "Canon quiz", "اختبار العالم"),
  answer: text("Répondre", "Answer", "إجابة"),
  missions: text("Missions", "Missions", "المهام"),
  claim: text("Récupérer", "Claim", "استلام"),
  claimed: text("Reçu", "Claimed", "تم"),
  skins: text("Présences AR autorisées", "Allowed AR skins", "حضور AR المسموح به"),
  select: text("Choisir", "Select", "اختيار"),
  selected: text("Actif", "Active", "نشط"),
  stories: text("Histoires canon", "Canon stories", "قصص العالم"),
  open: text("Marquer lu", "Mark read", "تعليم كمقروء"),
  locked: text("Verrouillé", "Locked", "مغلق"),
  layer: text("Dressing · AR", "Dressing · AR", "الخزانة · AR"),
  level: text("Niveau", "Level", "المستوى"),
  progression: text("Progression", "Progress", "التقدّم"),
  supabaseMissing: text(
    "Connectez un compte pour garder la progression durablement.",
    "Connect an account to keep progress permanently.",
    "اربط حسابًا لحفظ التقدّم بشكل دائم.",
  ),
  ownership: text("Pièce liée", "Linked piece", "القطعة المرتبطة"),
  walkTitle: text("Source réelle requise", "Real source required", "مصدر حقيقي مطلوب"),
  walkDesc: text(
    "Aucun bouton manuel ici. Les pas devront venir d'une vraie source téléphone ou d'un compte vérifié, sinon ils ne donnent pas d'XP ni de coins.",
    "No manual button here. Steps must come from a real phone source or a verified account, otherwise they do not grant XP or coins.",
    "لا يوجد زر يدوي هنا. يجب أن تأتي الخطوات من مصدر هاتف حقيقي أو من حساب موثّق، وإلا فلن تمنح XP أو عملات.",
  ),
  quizTitle: text("60 questions canon", "60 canon questions", "٦٠ سؤالًا من العالم"),
  quizDesc: text(
    "Le quiz complet est séparé du dressing. Son score local ne récompense rien tant que la session n'est pas validée par un compte.",
    "The full quiz is separate from the dressing. Its local score grants no reward until the session is validated by an account.",
    "الاختبار الكامل منفصل عن الخزانة. نتيجته المحلية لا تمنح أي مكافأة ما لم تُثبت الجلسة عبر حساب.",
  ),
  openQuiz: text("Ouvrir le quiz", "Open quiz", "فتح الاختبار"),
  goScan: text("Aller au Scan", "Go to Scan", "الذهاب إلى المسح"),
  storyRewards: text("Récompenses d'histoire", "Story rewards", "مكافآت القصة"),
};

export default function DressingPage() {
  const { lang, tr } = useI18n();
  const {
    activateGarment,
    auth,
    claimMission,
    level,
    markStoryRead,
    refreshRemoteProgression,
    remoteError,
    remoteStatus,
    state,
  } = useAccountProgression(lang);
  const grade = gradeForLevel(state.profile.level);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");

  const ownedGarments = useMemo(
    () =>
      GARMENT_CATALOG.map((garment) => ({
        ...garment,
        owned: state.ownedGarmentIds.includes(garment.id),
        active: state.activeGarmentId === garment.id,
      })),
    [state.activeGarmentId, state.ownedGarmentIds],
  );

  const requestLogin = async () => {
    const result = await auth.sendMagicLink(email.trim());
    toast(result.ok ? "Lien envoyé" : "Connexion impossible", {
      description: result.ok ? "Vérifiez votre email." : result.error,
    });
  };

  const verifyLogin = async () => {
    const result = await auth.verifyEmailOtp(email.trim(), otp.trim());
    toast(result.ok ? "Compte connecté" : "Code refusé", {
      description: result.ok ? "La session est maintenant gardée dans la WebView." : result.error,
    });
    if (result.ok) void refreshRemoteProgression();
  };

  const activateToken = async () => {
    const cleanToken = token.trim();
    if (!cleanToken) return state;

    if (auth.configured) {
      if (!auth.user) {
        toast.warning("Connexion requise", {
          description: "Un vêtement officiel doit être lié à un compte.",
        });
        return state;
      }
      const remote = await activateGarmentRemote(cleanToken);
      if ("skipped" in remote && remote.skipped) {
        const next = activateGarment(cleanToken);
        toast.warning("Progression officielle indisponible", {
          description: "Le vetement reste lie en apercu local.",
        });
        return next;
      }
      if (!remote.ok) {
        toast.error("Activation refusée", {
          description:
            "error" in remote && remote.error
              ? remote.error.message
              : "Service de progression indisponible.",
        });
        return state;
      }
      const next = activateGarment(cleanToken);
      await refreshRemoteProgression();
      toast.success("Vêtement lié au compte");
      return next;
    }

    const next = activateGarment(cleanToken);
    toast.success("Vêtement lié en aperçu local");
    return next;
  };

  const claim = async (missionId: string) => {
    if (!auth.configured || !auth.user) {
      toast.warning("Compte requis", {
        description: "Les XP et les coins officiels demandent un compte connecté.",
      });
      return state;
    }
    const remote = await claimMissionRewardRemote(missionId);
    if ("skipped" in remote && remote.skipped) {
      const next = claimMission(missionId);
      toast.warning("Progression officielle indisponible", {
        description: "La recompense reste locale pour l'instant.",
      });
      return next;
    }
    if (!remote.ok) {
      toast.error("Récompense refusée", {
        description:
          "error" in remote && remote.error
            ? remote.error.message
            : "Service de progression indisponible.",
      });
      return state;
    }
    const alreadyClaimed =
      typeof remote.data === "object" &&
      remote.data !== null &&
      "already_claimed" in remote.data &&
      Boolean((remote.data as { already_claimed?: boolean }).already_claimed);
    const next = alreadyClaimed ? state : claimMission(missionId);
    await refreshRemoteProgression();
    toast.success(alreadyClaimed ? "Récompense déjà reçue" : "Récompense récupérée");
    return next;
  };

  const levelProgressLabel =
    lang === "ar"
      ? `${level.percent}% نحو المستوى ${level.nextLevel}`
      : lang === "en"
        ? `${level.percent}% to level ${level.nextLevel}`
        : `${level.percent}% vers niveau ${level.nextLevel}`;

  return (
    <div className="pb-12">
      <section className="relative overflow-hidden px-6 pt-14 pb-10 text-center">
        <div className="absolute inset-0 ciel-poussiere opacity-35" />
        <div className="relative">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(copy.layer)}
          </p>
          <h1 className="mt-2 font-serif-rituel text-5xl leading-none">{tr(copy.title)}</h1>
          <p className="mx-auto mt-4 max-w-sm font-serif-rituel italic text-voile-dim">
            {tr(copy.subtitle)}
          </p>
          {!auth.configured && (
            <p className="mx-auto mt-5 max-w-sm border-y border-laiton/20 py-3 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
              {tr(copy.preview)}
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 px-6 pb-8">
        <Stat icon={Award} label={tr(copy.level)} value={String(state.profile.level)} />
        <Stat icon={Sparkles} label="XP" value={String(state.profile.xpTotal)} />
        <Stat icon={Coins} label="Coins" value={String(state.profile.coins)} />
      </section>

      <section className="px-6 pb-10">
        <p className="mb-3 text-center font-serif-rituel text-xl italic text-laiton-300">
          {tr(grade.name)}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="h-px flex-1 bg-border" />
          <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
            {levelProgressLabel}
          </p>
        </div>
        <div
          className="mt-3 h-[3px] overflow-hidden rounded-full"
          style={{ background: "rgba(228,220,204,.1)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${level.percent}%`,
              background: "linear-gradient(90deg,#b8893a,#f4d79e)",
            }}
          />
        </div>
      </section>

      <section className="border-t border-border/30 px-6 py-10">
        <SectionTitle
          icon={UserRound}
          eyebrow={tr(copy.account)}
          title={auth.user?.email || tr(copy.guest)}
        />
        {auth.configured ? (
          <div className="mt-5 grid gap-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@domaine.com"
              className="min-h-12 border border-border bg-background/60 px-4 font-mono-eclat text-[11px] tracking-rituel outline-none focus:border-laiton"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="voile" onClick={requestLogin} className="min-h-12">
                <Mail className="h-4 w-4" strokeWidth={1.25} />
                {tr(copy.sendLink)}
              </Button>
              <Button variant="pierre" onClick={auth.signOut} className="min-h-12">
                <KeyRound className="h-4 w-4" strokeWidth={1.25} />
                {tr(copy.signOut)}
              </Button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="123456"
                className="min-h-12 border border-border bg-background/60 px-4 font-mono-eclat text-[11px] tracking-rituel outline-none focus:border-laiton"
              />
              <Button variant="rituel" onClick={verifyLogin}>
                {tr(copy.verify)}
              </Button>
            </div>
            <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
              {auth.status === "signed-in" ? tr(copy.connected) : auth.status}
            </p>
            <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
              {tr(copy.progression)} : {remoteStatus}
              {remoteError ? ` - ${remoteError}` : ""}
            </p>
          </div>
        ) : (
          <p className="mt-4 font-serif-rituel italic text-voile-dim">{tr(copy.supabaseMissing)}</p>
        )}
      </section>

      <section className="border-t border-border/30 px-6 py-10">
        <SectionTitle icon={Shirt} eyebrow={tr(copy.activate)} title={tr(copy.ownership)} />
        <div className="mt-5 grid gap-3">
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            className="min-h-12 border border-border bg-background/60 px-4 font-mono-eclat text-[11px] tracking-rituel outline-none focus:border-laiton"
          />
          <Button variant="rituel" onClick={activateToken} className="min-h-12">
            <Shirt className="h-4 w-4" strokeWidth={1.25} />
            {tr(copy.activateButton)}
          </Button>
          <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
            {tr(copy.activateHelp)}
          </p>
        </div>
      </section>

      <section className="border-t border-border/30 px-6 py-10">
        <SectionTitle icon={Footprints} eyebrow={tr(copy.walk)} title={tr(copy.walkTitle)} />
        <p className="mt-4 font-serif-rituel italic text-base leading-snug text-voile-dim">
          {tr(copy.walkDesc)}
        </p>
      </section>

      <section className="border-t border-border/30 px-6 py-10">
        <SectionTitle icon={BookOpen} eyebrow={tr(copy.quiz)} title={tr(copy.quizTitle)} />
        <p className="mt-4 font-serif-rituel italic text-base leading-snug text-voile-dim">
          {tr(copy.quizDesc)}
        </p>
        <Link
          to="/quiz"
          className="mt-5 flex min-h-12 items-center justify-center gap-2 border border-laiton text-laiton transition hover:bg-laiton hover:text-primary-foreground font-mono-eclat text-[10px] uppercase tracking-rituel"
        >
          <BookOpen className="h-4 w-4" strokeWidth={1.25} />
          {tr(copy.openQuiz)}
        </Link>
      </section>

      <section className="border-t border-border/30 px-6 py-10">
        <SectionTitle icon={ScanLine} eyebrow={tr(copy.missions)} title="XP / coins" />
        <div className="mt-5 space-y-3">
          {MISSIONS.map((mission) => {
            const userMission = state.missions[mission.id];
            const progress = Math.min(mission.target, userMission?.progress || 0);
            const completed = Boolean(userMission?.completedAt);
            const claimed = Boolean(userMission?.claimedAt);
            return (
              <div key={mission.id} className="border-t border-laiton/15 bg-card/20 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif-rituel text-xl leading-tight">{mission.title}</p>
                    <p className="mt-1 font-serif-rituel italic text-sm text-voile-dim">
                      {mission.description}
                    </p>
                  </div>
                  {claimed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-laiton" strokeWidth={1.25} />
                  ) : completed ? (
                    <Button variant="rituel" size="sm" onClick={() => claim(mission.id)}>
                      {tr(copy.claim)}
                    </Button>
                  ) : (
                    <Lock className="h-5 w-5 shrink-0 text-voile-dim" strokeWidth={1.25} />
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border">
                    <div
                      className="h-px bg-laiton"
                      style={{ width: `${Math.round((progress / mission.target) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
                    {claimed ? tr(copy.claimed) : `${progress}/${mission.target}`}
                  </span>
                </div>
                <p className="mt-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton/80">
                  +{mission.rewardXp} XP · +{mission.rewardCoins} coins
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/30 px-6 py-10">
        <SectionTitle icon={Award} eyebrow={tr(copy.stories)} title={tr(copy.storyRewards)} />
        <div className="mt-5 space-y-3">
          {STORY_REWARDS.map((story) => {
            const unlocked = state.profile.level >= story.levelRequired;
            const read = state.storiesRead.includes(story.id);
            return (
              <div key={story.id} className="border-t border-laiton/15 bg-card/20 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif-rituel text-xl leading-tight">{story.title}</p>
                    <p className="mt-1 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
                      Niveau {story.levelRequired} · {story.sourceFile}
                    </p>
                    <p className="mt-2 font-serif-rituel italic text-sm text-voile-dim">
                      {story.summary}
                    </p>
                  </div>
                  {unlocked ? (
                    <Button
                      variant={read ? "pierre" : "voile"}
                      size="sm"
                      onClick={() => markStoryRead(story.id)}
                    >
                      {read ? tr(copy.claimed) : tr(copy.open)}
                    </Button>
                  ) : (
                    <span className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
                      {tr(copy.locked)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

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
      <p className="font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">{eyebrow}</p>
      <h2 className="mt-1 font-serif-rituel text-3xl leading-tight">{title}</h2>
    </div>
    <Icon className="h-5 w-5 shrink-0 text-laiton" strokeWidth={1.25} />
  </div>
);

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  label: string;
  value: string;
}) => (
  <div className="border-t border-laiton/20 bg-card/20 px-3 py-4 text-center">
    <Icon className="mx-auto mb-2 h-4 w-4 text-laiton" strokeWidth={1.25} />
    <p className="font-mono-eclat text-[8px] uppercase tracking-rituel text-voile-dim">{label}</p>
    <p className="mt-1 font-serif-rituel text-2xl leading-none">{value}</p>
  </div>
);
