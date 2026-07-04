import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Lock } from "lucide-react";
import { getFragment, localizeFragment } from "@/data/fragments";
import { FragmentIcon } from "@/components/FragmentIcon";
import {
  REVEAL_DATES,
  getRevealLabel,
  getCountdown,
  joinVeille,
  isInVeille,
  validEmail,
} from "@/lib/voile";
import { Ornement } from "@/components/Sceau";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { text, useI18n } from "@/lib/i18n";

const copy = {
  back: text("Retour aux fragments", "Back to fragments", "رجوع إلى الشذرات"),
  fragment: text("Fragment", "Fragment", "الشذرة"),
  veiled: text("Voilé", "Veiled", "مستورة"),
  opening: text("Ouverture du Voile", "Veil opening", "انفتاح السِّتار"),
  days: text("jours", "days", "أيام"),
  hours: text("heures", "hours", "ساعات"),
  min: text("min", "min", "د"),
  sec: text("sec", "sec", "ث"),
  clues: text("Indices", "Clues", "دلائل"),
  law: text("Loi pressentie", "Felt law", "قانون محسوس"),
  motif: text("Motif annoncé", "Announced motif", "أثر معلن"),
  invalidEmail: text(
    "L'adresse n'a pas été reconnue par le Voile",
    "The address was not recognized by the Veil",
    "لم يتعرّف السِّتار إلى العنوان",
  ),
  joined: text(
    "Veille scellée — vous serez prévenu·e",
    "Watch sealed — you will be notified",
    "تم تثبيت الانتظار — سنخبرك",
  ),
  watching: text(
    "Vous veillez ce fragment",
    "You are watching this fragment",
    "أنت تنتظر هذه الشذرة",
  ),
  notified: text(
    "Vous serez prévenu·e à l'ouverture du Voile.",
    "You will be notified when the Veil opens.",
    "سيصلك إشعار عند انفتاح السِّتار.",
  ),
  join: text("Rejoindre la veille", "Join the watch", "انضم إلى الانتظار"),
  joinText: text(
    "Soyez averti·e dès que ce fragment sortira du Voile.",
    "Be notified when this fragment comes out of the Veil.",
    "احصل على إشعار عندما تخرج هذه الشذرة من السِّتار.",
  ),
  placeholder: text("votre.adresse@eclat", "your.address@eclat", "بريدك@eclat"),
  submit: text("Veiller ce fragment", "Watch this fragment", "انتظر هذه الشذرة"),
};

export default function VoilePage() {
  const { id } = useParams();
  const { lang, tr } = useI18n();
  const f = localizeFragment(getFragment(id || ""), lang);
  const [, tick] = useState(0);
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(() => (id ? isInVeille(id) : false));

  // Locale mémoïsée pour éviter de recréer Intl à chaque render.
  const locale = useMemo(
    () => (lang === "en" ? "en-US" : lang === "ar" ? "ar-DZ" : "fr-FR"),
    [lang],
  );

  // Date d'ouverture (constante pour ce fragment)
  const revealDate = id ? REVEAL_DATES[id] : undefined;
  const revealTime = revealDate ? new Date(revealDate).getTime() : undefined;

  // Countdown tick â€” coupÃ© dÃ¨s que la date est atteinte pour Ã©viter
  // un setInterval infini qui force des re-renders inutiles.
  useEffect(() => {
    if (!revealTime) return;
    // Ticks seulement tant que la date n'est pas atteinte.
    const stillWaiting = () => Date.now() < revealTime;
    if (!stillWaiting()) return;
    const t = setInterval(() => {
      if (!stillWaiting()) {
        clearInterval(t);
        return;
      }
      tick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [revealTime]);

  if (!f || f.unlocked) return <Navigate to="/fragments" replace />;
  const cd = getCountdown(revealDate);
  const dateLabel = revealDate
    ? new Date(revealDate).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) {
      toast.error(tr(copy.invalidEmail));
      return;
    }
    joinVeille(f.id, email);
    setJoined(true);
    toast.success(tr(copy.joined), { description: getRevealLabel(f.id, lang) });
  };

  return (
    <article className="pb-12 relative overflow-hidden">
      {/* Fond mystérieux animé */}
      <div className="absolute inset-0 ciel-poussiere opacity-40 anim-drift pointer-events-none" />
      <div className="absolute inset-0 vignette-mineral pointer-events-none" />

      <Link
        to="/fragments"
        className="relative inline-flex items-center gap-2 px-6 pt-6 text-voile-dim hover:text-laiton transition-colors text-xs font-mono-eclat tracking-rituel uppercase"
      >
        <ArrowLeft className="w-3 h-3" /> {tr(copy.back)}
      </Link>

      {/* Symbole géant animé */}
      <section className="relative px-6 pt-12 text-center">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton/60 mb-3">
          {tr(copy.fragment)} {f.number} · {tr(copy.veiled)}
        </p>
        <h1 className="font-serif-rituel text-5xl sm:text-7xl text-foreground/30 mb-2 break-words">
          {f.name}
        </h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
          animate={{ opacity: 0.4, scale: 1, rotate: 0 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="relative my-12 flex items-center justify-center"
        >
          <div
            className="absolute inset-0 anim-respire"
            style={{
              background: "radial-gradient(circle, hsl(var(--laiton)/0.12), transparent 70%)",
            }}
          />
          <FragmentIcon id={f.id} className="w-40 h-40 text-laiton/50 relative anim-drift" />
        </motion.div>

        <p className="font-serif-rituel italic text-xl text-voile-dim/70 max-w-md mx-auto leading-snug">
          « {f.preview} »
        </p>
        <Ornement className="mt-8 max-w-xs mx-auto" />
      </section>

      {/* Countdown */}
      <section className="relative px-6 py-12 border-t border-border/40 mt-12">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton text-center mb-3">
          {getRevealLabel(f.id, lang) || tr(copy.opening)}
        </p>
        <p className="font-serif-rituel italic text-base text-voile-dim text-center mb-8">
          {dateLabel}
        </p>

        {cd && (
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {[
              { v: cd.d, l: tr(copy.days) },
              { v: cd.h, l: tr(copy.hours) },
              { v: cd.m, l: tr(copy.min) },
              { v: cd.s, l: tr(copy.sec) },
            ].map((b, i) => (
              <div
                key={i}
                className="border border-border/60 bg-card/40 p-3 text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 filigrane opacity-50" />
                <div className="relative">
                  <p className="font-serif-rituel text-3xl text-laiton leading-none">
                    {String(b.v).padStart(2, "0")}
                  </p>
                  <p className="font-mono-eclat text-[8px] tracking-rituel uppercase text-voile-dim mt-1">
                    {b.l}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Indices narratifs */}
      <section className="relative px-6 py-10 border-t border-border/40 space-y-5 max-w-xl mx-auto">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
          {tr(copy.clues)}
        </p>
        <p className="font-serif-rituel text-xl text-foreground/80 leading-snug">{f.preview}</p>
        <div className="border-l border-laiton/40 pl-5 space-y-2">
          <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim">
            {tr(copy.law)}
          </p>
          <p className="font-serif-rituel text-lg text-voile-dim">{f.fonction}</p>
        </div>
        <div className="border-l border-laiton/40 pl-5 space-y-2">
          <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim">
            {tr(copy.motif)}
          </p>
          <p className="font-serif-rituel text-lg text-voile-dim">{f.motif}</p>
        </div>
      </section>

      {/* Veille */}
      <section className="relative px-6 py-10 border-t border-border/40">
        {joined ? (
          <div className="text-center border border-laiton/40 p-8 space-y-3">
            <Bell className="w-5 h-5 text-laiton mx-auto" strokeWidth={1.25} />
            <p className="font-serif-rituel text-2xl">{tr(copy.watching)}</p>
            <p className="font-serif-rituel italic text-voile-dim">{tr(copy.notified)}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="border border-border/60 bg-card/40 p-6 space-y-4">
            <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton flex items-center gap-2">
              <Lock className="w-3 h-3" /> {tr(copy.join)}
            </p>
            <p className="font-serif-rituel italic text-voile-dim text-sm">{tr(copy.joinText)}</p>
            <input
              type="email"
              placeholder={tr(copy.placeholder)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-noir-profond border border-border px-4 py-3 font-serif-rituel text-base text-foreground focus:border-laiton outline-none"
            />
            <Button type="submit" variant="rituel" size="lg" className="w-full">
              {tr(copy.submit)}
            </Button>
          </form>
        )}
      </section>
    </article>
  );
}
