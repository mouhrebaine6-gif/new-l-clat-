import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Lock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { fragments as rawFragments, localizeFragment, type Fragment } from "@/data/fragments";
import { REVEAL_DATES, getRevealLabel, getCountdown, isInVeille } from "@/lib/voile";
import { FragmentIcon } from "@/components/FragmentIcon";
import { Sceau, Ornement } from "@/components/Sceau";
import { text, useI18n, type Lang } from "@/lib/i18n";
import { isUnityWebViewRuntime } from "@/lib/runtimeFlags";

const copy = {
  eyebrow: text("Calendrier d'ouverture", "Opening calendar", "رزنامة الانفتاح"),
  title: text("Les Ouvertures", "Openings", "الفتحات"),
  intro: text(
    "« Cinq fragments dorment encore sous le Voile. Chacun s'ouvrira à son moment juste. »",
    "“Five fragments still sleep beneath the Veil. Each will open at its right moment.”",
    "«خمس شذرات ما زالت نائمة تحت السِّتار. كل واحدة ستنفتح في وقتها.»",
  ),
  fragment: text("Fragment", "Fragment", "الشذرة"),
  watch: text("Veille active", "Watching", "قيد الانتظار"),
  approach: text("Approcher le voile", "Approach the Veil", "اقترب من السِّتار"),
  seal: text(
    "CINQ DROPS · CINQ OUVERTURES · ",
    "FIVE DROPS · FIVE OPENINGS · ",
    "خمسة إصدارات · خمس فتحات · ",
  ),
};

export default function RevelationsPage() {
  const [, tick] = useState(0);
  const { lang, tr } = useI18n();
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), isUnityWebViewRuntime() ? 15000 : 1000);
    return () => clearInterval(t);
  }, []);

  const voiles = rawFragments.filter((f) => !f.unlocked);
  // Trier par date
  voiles.sort(
    (a, b) => new Date(REVEAL_DATES[a.id]).getTime() - new Date(REVEAL_DATES[b.id]).getTime(),
  );

  return (
    <div className="pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 px-6 pt-12 pb-12 text-center">
        <div className="absolute inset-0 ciel-poussiere opacity-50 anim-drift pointer-events-none" />
        <div className="absolute -top-10 -right-10 opacity-15 pointer-events-none">
          <Sceau className="w-72 h-72" label={tr(copy.seal)} />
        </div>
        <div className="relative">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
            {tr(copy.eyebrow)}
          </p>
          <h1 className="font-serif-rituel text-6xl leading-none">{tr(copy.title)}</h1>
          <p className="font-serif-rituel italic text-base text-voile-dim mt-4 max-w-md mx-auto leading-snug">
            {tr(copy.intro)}
          </p>
          <Ornement className="mt-6 max-w-xs mx-auto" />
        </div>
      </section>

      {/* Timeline cosmique */}
      <section className="px-6 py-12 relative">
        <ol className="relative max-w-xl mx-auto">
          <span className="absolute left-6 top-4 bottom-4 w-px bg-border" aria-hidden />
          {voiles.map((f, i) => (
            <RevelationItem key={f.id} f={localizeFragment(f, lang)} index={i} lang={lang} />
          ))}
        </ol>
      </section>
    </div>
  );
}

function RevelationItem({ f, index, lang }: { f: Fragment; index: number; lang: Lang }) {
  const { tr } = useI18n();
  const cd = getCountdown(REVEAL_DATES[f.id]);
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar-DZ" : "fr-FR";
  const date = new Date(REVEAL_DATES[f.id]).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const veille = isInVeille(f.id);
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.8 }}
      className="relative pl-16 pb-12 last:pb-0"
    >
      <span
        className="absolute left-3 top-2 w-7 h-7 rounded-full border border-laiton/60 bg-noir-profond flex items-center justify-center anim-respire"
        aria-hidden
      >
        <FragmentIcon id={f.id} className="w-3.5 h-3.5 text-laiton" />
      </span>

      <Link
        to={`/fragments/voile/${f.id}`}
        className="block group border border-border/60 bg-card/40 p-5 hover:border-laiton/40 transition tap focus-visible:outline-none focus-visible:border-laiton"
      >
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(copy.fragment)} {f.number}
          </p>
          {veille && (
            <span className="font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton flex items-center gap-1">
              <Bell className="w-3 h-3" /> {tr(copy.watch)}
            </span>
          )}
        </div>
        <h2 className="font-serif-rituel text-3xl text-foreground/90">{f.name}</h2>
        <p className="font-serif-rituel italic text-voile-dim text-sm mt-1 leading-snug">
          « {f.preview} »
        </p>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/60">
          <Lock className="w-3 h-3 text-laiton/60" strokeWidth={1.25} aria-hidden />
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
            {getRevealLabel(f.id, lang)} · {date}
          </p>
        </div>

        {cd && !cd.ended && (
          <div
            className="grid grid-cols-4 gap-2 mt-3"
            aria-label={`Compte à rebours : ${cd.d} jours, ${cd.h} heures, ${cd.m} minutes`}
          >
            {[
              { v: cd.d, l: tr(text("j", "d", "ي")) },
              { v: cd.h, l: tr(text("h", "h", "س")) },
              { v: cd.m, l: tr(text("m", "m", "د")) },
              { v: cd.s, l: tr(text("s", "s", "ث")) },
            ].map((b, k) => (
              <div key={k} className="text-center border border-border/60 py-1.5">
                <p className="font-serif-rituel text-laiton text-lg leading-none tabular-nums">
                  {String(b.v).padStart(2, "0")}
                </p>
                <p className="font-mono-eclat text-[8px] tracking-rituel uppercase text-voile-dim">
                  {b.l}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 text-laiton font-mono-eclat text-[10px] tracking-rituel uppercase opacity-60 group-hover:opacity-100 transition">
          {tr(copy.approach)} <ArrowRight className="w-3 h-3" />
        </div>
      </Link>
    </motion.li>
  );
}
