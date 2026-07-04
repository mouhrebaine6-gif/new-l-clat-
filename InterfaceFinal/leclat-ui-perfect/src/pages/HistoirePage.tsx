import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { getFragment, localizeFragment } from "@/data/fragments";
import {
  storyOpening,
  STORY_THRESHOLDS,
  TOTAL_FRAGMENTS,
  type StoryTier,
} from "@/data/storyUnlocks";
import { FragmentIcon } from "@/components/FragmentIcon";
import { Ornement, Sceau } from "@/components/Sceau";
import { useFragmentStoryUnlocks } from "@/hooks/useFragmentStoryUnlocks";
import { useStoryScanCounts } from "@/hooks/useStoryScanCounts";
import { fragmentsRemainingForLore, isStoryComplete } from "@/lib/loreAccess";
import { toRoman } from "@/lib/porteur";
import { text, useI18n } from "@/lib/i18n";

const copy = {
  eyebrow: text("Roman vivant", "Living novel", "رواية حيّة"),
  title: text("Histoire", "Story", "القصة"),
  intro: text(
    "Le roman se divise en dix fragments. Chaque fragment ouvre trois coutures : l'objet, la conséquence, puis la vérité miroir.",
    "The novel is divided into ten fragments. Each fragment opens three seams: the object, the consequence, then the mirror truth.",
    "تنقسم الرواية إلى عشر شذرات. تفتح كل شذرة ثلاث خياطات: الشيء، ثم العاقبة، ثم حقيقة المرآة.",
  ),
  progress: text("paliers ouverts", "tiers open", "عتبات مفتوحة"),
  fragmentsTotal: text("10 fragments", "10 fragments", "١٠ شذرات"),
  tiersTotal: text("30 paliers", "30 tiers", "٣٠ عتبة"),
  cadence: text("1 · 20 · 40", "1 · 20 · 40", "١ · ٢٠ · ٤٠"),
  cadenceLine: text(
    "1 scan : un signe. 20 : une conséquence. 40 : la couture miroir.",
    "1 scan: a sign. 20: a consequence. 40: the mirror seam.",
    "مسح واحد: علامة. ٢٠: عاقبة. ٤٠: خياطة المرآة.",
  ),
  scan: text("Scanner", "Scan", "امسح"),
  scanSingular: text("scan", "scan", "مسح"),
  scanPlural: text("scans", "scans", "مسح"),
  opening: text("Début de l'histoire", "Story opening", "بداية القصة"),
  fragments: text("Déblocage par fragment", "Fragment unlocks", "فتح الشذرات"),
  unlocked: text("paliers ouverts", "tiers open", "عتبات مفتوحة"),
  locked: text("Bloqué", "Locked", "مغلق"),
  need: text("Encore", "Need", "يلزم"),
  next: text("prochain palier", "next tier", "العتبة التالية"),
  complete: text("Histoire complète ouverte", "Full story open", "القصة كاملة مفتوحة"),
  syncLocal: text("Mode local", "Local mode", "وضع محلي"),
  syncLoading: text("Synchronisation", "Syncing", "مزامنة"),
  syncSynced: text("Compte synchronisé", "Account synced", "تمت مزامنة الحساب"),
  syncError: text("Synchro indisponible", "Sync unavailable", "المزامنة غير متاحة"),
  seal: text(
    "HISTOIRE DU SEUIL · SCANS 1 20 40 · ",
    "THRESHOLD STORY · SCANS 1 20 40 · ",
    "قصة العتبة · مسح ١ ٢٠ ٤٠ · ",
  ),
  companionEyebrow: text("Récompense de lecture", "Reading reward", "مكافأة القراءة"),
  companionTitle: text("Compagnon de lecture", "Reading companion", "رفيق القراءة"),
  companionOpen: text(
    "Deux analyses du roman vous attendent.",
    "Two analyses of the novel await you.",
    "تحليلان للرواية في انتظارك.",
  ),
  companionLockedBody: text(
    "Menez les dix fragments à leur palier le plus profond pour ouvrir les analyses.",
    "Bring all ten fragments to their deepest tier to open the analyses.",
    "بلّغ الشذرات العشر أعمق عتبة لها لفتح التحليلات.",
  ),
  companionSpoiler: text(
    "Révèle l'intrigue et la fin",
    "Reveals the plot and the ending",
    "يكشف الحبكة والنهاية",
  ),
  companionCta: text("Ouvrir le compagnon", "Open the companion", "افتح الرفيق"),
  companionRemaining: text("restants", "left", "متبقية"),
  storyLoading: text("Le Voile se lève…", "The Veil lifts…", "يرتفع السِّتار…"),
  storyError: text(
    "Le roman est indisponible pour l'instant.",
    "The novel is unavailable for now.",
    "الرواية غير متاحة حاليًا.",
  ),
};

export default function HistoirePage() {
  const { error, fragmentScanCounts, status } = useStoryScanCounts();
  const { stories: fragmentStoryUnlocks, status: storyStatus } = useFragmentStoryUnlocks();
  const { lang, tr } = useI18n();
  const totalTiers = TOTAL_FRAGMENTS * STORY_THRESHOLDS.length;
  const openedTiers = (fragmentStoryUnlocks ?? []).reduce((total, story) => {
    const scans = fragmentScanCounts[story.fragmentId] || 0;
    return total + story.tiers.filter((tier) => scans >= tier.threshold).length;
  }, 0);
  const companionUnlocked = isStoryComplete(fragmentScanCounts);
  const companionRemaining = fragmentsRemainingForLore(fragmentScanCounts);
  const syncLabel =
    status === "synced"
      ? copy.syncSynced
      : status === "loading"
        ? copy.syncLoading
        : status === "error"
          ? copy.syncError
          : copy.syncLocal;

  return (
    <article className="pb-28">
      <section className="relative overflow-hidden border-b border-border/40 px-6 pt-14 pb-12 text-center">
        <div className="absolute inset-0 ciel-poussiere opacity-45 anim-drift pointer-events-none" />
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-15 pointer-events-none">
          <Sceau className="h-96 w-96" label={tr(copy.seal)} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <p className="mb-3 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
            {tr(copy.eyebrow)}
          </p>
          <h1 className="font-serif-rituel text-6xl leading-none sm:text-7xl">{tr(copy.title)}</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-voile-dim">
            {tr(copy.intro)}
          </p>

          <div className="mx-auto mt-7 grid max-w-md grid-cols-3 divide-x divide-border/50 border-y border-border/50 py-3">
            {[copy.fragmentsTotal, copy.tiersTotal, copy.cadence].map((item) => (
              <span
                key={tr(item)}
                className="font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton-300"
              >
                {tr(item)}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-3 max-w-md font-mono-eclat text-[9px] uppercase tracking-rituel leading-relaxed text-voile-dim">
            {tr(copy.cadenceLine)}
          </p>

          <div className="mx-auto mt-7 max-w-sm">
            <div className="flex items-center justify-between font-mono-eclat text-[10px] uppercase tracking-rituel text-voile-dim">
              <span>
                {openedTiers}/{totalTiers}
              </span>
              <span>{tr(copy.progress)}</span>
            </div>
            <div
              className="mt-2 h-[3px] overflow-hidden rounded-full"
              style={{ background: "rgba(228,220,204,.1)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((openedTiers / totalTiers) * 100)}%`,
                  background: "linear-gradient(90deg,#b8893a,#f4d79e)",
                }}
              />
            </div>
            <p className="mt-3 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
              {tr(syncLabel)}
              {error ? ` · ${error}` : ""}
            </p>
          </div>

          <Link
            to="/scan"
            className="tap mx-auto mt-8 inline-flex items-center justify-center gap-3 rounded-full border border-laiton/40 px-6 py-3 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton transition hover:bg-laiton/10 active:scale-[0.98]"
          >
            <ScanLine className="h-3.5 w-3.5" strokeWidth={1.4} />
            {tr(copy.scan)}
          </Link>
        </motion.div>
      </section>

      <section className="border-b border-border/40 px-6 py-12">
        <p className="mb-3 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
          {tr(copy.opening)}
        </p>
        <h2 className="mb-6 font-serif-rituel text-4xl leading-tight">{tr(storyOpening.title)}</h2>
        <div className="space-y-4 font-serif-rituel text-xl leading-snug text-foreground">
          {tr(storyOpening.body).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <Ornement className="mx-auto mt-8 max-w-xs" />
      </section>

      <section className="px-5 py-12">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
              {tr(copy.fragments)}
            </p>
            <h2 className="font-serif-rituel text-4xl leading-tight">1 · 20 · 40</h2>
          </div>
          <BookOpen className="h-5 w-5 shrink-0 text-laiton" strokeWidth={1.25} />
        </div>

        {storyStatus === "loading" && (
          <p className="py-16 text-center font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton anim-respire">
            {tr(copy.storyLoading)}
          </p>
        )}
        {storyStatus === "error" && (
          <p className="py-16 text-center font-serif-rituel italic text-voile-dim">
            {tr(copy.storyError)}
          </p>
        )}
        <div className="space-y-10">
          {(fragmentStoryUnlocks ?? []).map((story, index) => {
            const fragment = localizeFragment(getFragment(story.fragmentId), lang);
            const scans = fragmentScanCounts[story.fragmentId] || 0;
            const opened = story.tiers.filter((tier) => scans >= tier.threshold).length;
            const nextTier = story.tiers.find((tier) => scans < tier.threshold);
            return (
              <motion.section
                key={story.fragmentId}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.7 }}
                className="border-t border-border/50 pt-7"
              >
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-laiton/30 bg-card/30 text-laiton">
                    <FragmentIcon id={story.fragmentId} className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2 font-mono-eclat text-[10px] uppercase tracking-rituel text-laiton">
                      <span>{toRoman(index + 1)}</span>
                      <span className="h-px w-4 bg-laiton/50" />
                      <span>{fragment?.number || String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="font-serif-rituel text-3xl leading-none">
                      {fragment?.name || story.fragmentId}
                    </h3>
                    <p className="mt-2 text-sm leading-snug text-voile-dim">{tr(story.role)}</p>
                    <p className="mt-2 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
                      {scans} {tr(scans === 1 ? copy.scanSingular : copy.scanPlural)} · {opened}/3{" "}
                      {tr(copy.unlocked)}
                    </p>
                  </div>
                </div>

                <div
                  className="mb-5 h-[3px] overflow-hidden rounded-full"
                  style={{ background: "rgba(228,220,204,.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.round((scans / 40) * 100))}%`,
                      background: "linear-gradient(90deg,#b8893a,#e0b46b)",
                    }}
                  />
                </div>

                <div className="divide-y divide-border/45 border-y border-border/45">
                  {story.tiers.map((tier) => (
                    <TierRow key={tier.threshold} tier={tier} scans={scans} />
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
                    {nextTier
                      ? `${tr(copy.need)} ${Math.max(0, nextTier.threshold - scans)} · ${tr(copy.next)}`
                      : tr(copy.complete)}
                  </p>
                  <Link
                    to="/scan"
                    aria-label={tr(copy.scan)}
                    className="tap inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-laiton/35 text-laiton transition hover:bg-laiton/10 active:scale-95"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
                  </Link>
                </div>
              </motion.section>
            );
          })}
        </div>
      </section>

      {/* Compagnon de lecture — récompense GATÉE (anti-spoiler). Le contenu vit
          dans une route lazy /compagnon ; ici on n'expose qu'une porte. */}
      <section className="px-6 pb-4 pt-2">
        {companionUnlocked ? (
          <Link
            to="/compagnon"
            className="tap group block rounded-[16px] border border-laiton/40 bg-laiton/5 p-5 transition hover:bg-laiton/10"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-laiton" strokeWidth={1.25} />
              <div className="min-w-0 flex-1">
                <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton">
                  {tr(copy.companionEyebrow)}
                </p>
                <h3 className="font-serif-rituel text-2xl leading-none">
                  {tr(copy.companionTitle)}
                </h3>
              </div>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-laiton transition group-hover:translate-x-0.5"
                strokeWidth={1.25}
              />
            </div>
            <p className="mt-3 font-serif-rituel italic text-sm leading-snug text-voile-dim">
              {tr(copy.companionOpen)}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton">
              {tr(copy.companionCta)}
            </p>
          </Link>
        ) : (
          <div
            className="block rounded-[16px] border border-border/50 bg-card/20 p-5 opacity-90"
            aria-disabled="true"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 shrink-0 text-voile-dim" strokeWidth={1.25} />
              <div className="min-w-0 flex-1">
                <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
                  {tr(copy.companionEyebrow)}
                </p>
                <h3 className="font-serif-rituel text-2xl leading-none text-voile-dim">
                  {tr(copy.companionTitle)}
                </h3>
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton/70">
              <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
              {tr(copy.companionSpoiler)}
            </p>
            <p className="mt-3 font-serif-rituel italic text-sm leading-snug text-voile-dim">
              {tr(copy.companionLockedBody)}
            </p>
            <p className="mt-3 font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
              {companionRemaining}/10 {tr(copy.companionRemaining)}
            </p>
          </div>
        )}
      </section>
    </article>
  );
}

/** Premières phrases (1–2) d'un paragraphe, pour le teaser verrouillé. */
function firstSentences(s: string, max = 2): string {
  if (!s) return "";
  const parts = s.match(/[^.!?…؟]+[.!?…؟]+/g);
  let out = parts ? parts.slice(0, max).join(" ").trim() : s;
  if (out.length > 170) out = out.slice(0, 167).trimEnd() + "…";
  return out;
}

const TierRow = ({ tier, scans }: { tier: StoryTier; scans: number }) => {
  const { tr } = useI18n();
  const open = scans >= tier.threshold;
  const isFirst = tier.threshold === STORY_THRESHOLDS[0];
  const body = tr(tier.body);
  const teaser = firstSentences(body[0] ?? "");
  const remaining = Math.max(0, tier.threshold - scans);
  return (
    <section className="relative py-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono-eclat text-[9px] uppercase tracking-rituel text-laiton">
            {tr(tier.label)}
          </p>
          <h4 className="mt-1 font-serif-rituel text-2xl leading-tight">{tr(tier.title)}</h4>
        </div>
        {open ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-laiton" strokeWidth={1.25} />
        ) : (
          <Lock className="h-4 w-4 shrink-0 text-voile-dim" strokeWidth={1.25} />
        )}
      </div>

      {open ? (
        <div className="space-y-3 font-serif-rituel text-lg leading-snug text-foreground">
          {body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <div>
          {/* Scan 1 : teaser lisible (l'appât). Scans 20/40 : flouté, court (pas de fuite de longueur). */}
          <p
            className={`font-serif-rituel text-lg leading-snug ${
              isFirst ? "text-voile-dim/85" : "select-none text-voile-dim/45 blur-[5px]"
            }`}
            aria-hidden={!isFirst}
          >
            {teaser}
            <span className="text-voile-dim/40"> …</span>
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-border/40 pt-4">
            <Lock className="h-3 w-3 shrink-0 text-laiton/70" strokeWidth={1.4} />
            <span className="font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim">
              {tr(copy.need)} {remaining}{" "}
              {tr(remaining === 1 ? copy.scanSingular : copy.scanPlural)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
