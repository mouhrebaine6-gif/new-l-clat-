import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fragments as rawFragments, localizeFragments } from "@/data/fragments";
import { Lock, ArrowUpRight } from "lucide-react";
import { FragmentIcon } from "@/components/FragmentIcon";
import { FragmentVisual } from "@/components/FragmentVisual";
import { Sceau, Ornement } from "@/components/Sceau";
import { usePorteur, toRoman } from "@/lib/porteur";
import heroSilhouette from "@/assets/tshirts/hero-silhouette.webp";
import { text, useI18n } from "@/lib/i18n";

const copy = {
  eyebrow: text("Progression · X fragments", "Progress · X fragments", "التقدّم · عشر شذرات"),
  titleA: text("Dix passages", "Ten passages", "عشر عتبات"),
  titleB: text("à approcher", "to approach", "تنتظر الاقتراب"),
  titleC: text("un seuil", "one threshold", "وعتبة واحدة"),
  titleD: text("à suivre", "to follow", "تُتبع"),
  intro: text(
    "Ici, on suit les indices et l'état de découverte. Les produits restent dans la Boutique.",
    "Here, you follow clues and discovery. Products stay in the Boutique.",
    "هنا تتابع الدلائل وحالة الاكتشاف. أما القطع فتبقى في المتجر.",
  ),
  carrier: text("Porteur", "Bearer", "الحامل"),
  known: text("reconnus", "known", "معروفة"),
  index: text("Index", "Index", "الفهرس"),
  passages: text("Les dix passages", "The ten passages", "العتبات العشر"),
  awake: text(
    (n: number) => `${n} éveillés`,
    (n: number) => `${n} awake`,
    (n: number) => `${n} مستيقظة`,
  ),
  veiled: text(
    (n: number) => `${n} voilés`,
    (n: number) => `${n} veiled`,
    (n: number) => `${n} مستورة`,
  ),
  recognized: text("reconnu", "known", "مُعرَفة"),
  openFragment: text(
    "Ouvrir le fragment · vêtement lié en boutique",
    "Open fragment · linked piece in boutique",
    "افتح الشذرة · القطعة المرتبطة في المتجر",
  ),
  readPreview: text("Lire l'aperçu →", "Read the preview →", "اقرأ اللمحة ←"),
  veiledLabel: text("Voilé", "Veiled", "مستور"),
};

export default function FragmentsPage() {
  const { state } = usePorteur();
  const { lang, tr } = useI18n();
  const fragments = localizeFragments(rawFragments, lang);
  const awakeCount = fragments.filter((f) => f.unlocked).length;
  const veiledCount = fragments.length - awakeCount;
  return (
    <div>
      {/* Hero éditorial */}
      <section className="relative min-h-[70vh] overflow-hidden border-b border-border/40">
        <img
          src={heroSilhouette}
          alt={tr(text("Silhouette d'un porteur", "Silhouette of a bearer", "ظلّ حامل"))}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-noir-profond/70 via-background/55 to-background" />
        <div className="absolute inset-0 vignette-mineral" />
        <div className="absolute inset-0 ciel-poussiere opacity-60 anim-drift" />

        {/* Sceau filigrane à droite */}
        <div className="absolute -right-10 top-10 opacity-20 mix-blend-luminosity pointer-events-none">
          <Sceau className="w-72 h-72" />
        </div>

        {/* Indice romain géant */}
        <div className="absolute top-6 left-6 font-serif-rituel text-laiton/40 text-[120px] leading-none italic select-none pointer-events-none">
          I
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-8 pt-24">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-laiton" />
              <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
                {tr(copy.eyebrow)}
              </p>
            </div>
            <h1 className="font-serif-rituel text-[2.5rem] md:text-7xl leading-[0.95] md:leading-[0.9] text-foreground mb-6 drop-shadow-[0_2px_18px_rgba(0,0,0,0.7)]">
              {tr(copy.titleA)} <em className="italic text-laiton">{tr(copy.titleB)}</em>,<br />
              {tr(copy.titleC)} <em className="italic">{tr(copy.titleD)}</em>.
            </h1>
            <p className="text-sm text-voile-dim max-w-md leading-relaxed mb-6">{tr(copy.intro)}</p>
            <div className="flex items-center gap-4 font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
              <span>
                {tr(copy.carrier)} · {state.name}
              </span>
              <span className="w-1 h-1 bg-laiton rounded-full" />
              <span className="text-laiton">
                {toRoman(state.collected.length)} / X {tr(copy.known)}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bordure de bas ornementale */}
        <div className="absolute bottom-0 inset-x-0 px-8 pb-2">
          <Ornement />
        </div>
      </section>

      {/* Liste fragments */}
      <section className="px-6 py-12 space-y-3">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-1">
              {tr(copy.index)}
            </p>
            <h2 className="font-serif-rituel text-3xl">{tr(copy.passages)}</h2>
          </div>
          <span className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim text-right leading-relaxed">
            {tr(copy.awake)(awakeCount)}
            <br />
            {tr(copy.veiled)(veiledCount)}
          </span>
        </div>

        {fragments.map((f, i) => {
          const isScellé = state.collected.includes(f.id);
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.04 }}
            >
              {f.unlocked ? (
                <Link
                  to={`/fragments/${f.id}`}
                  style={{ touchAction: "manipulation" }}
                  className="group block relative overflow-hidden rounded-2xl border border-border/50 hover:border-laiton/55 bg-gradient-to-r from-card/30 via-card/15 to-transparent hover:from-card/50 hover:via-card/25 transition-all duration-700 active:scale-[0.99]"
                >
                  {/* Numéro romain en filigrane */}
                  <span className="absolute right-3 top-1 font-serif-rituel italic text-laiton/10 text-6xl pointer-events-none select-none">
                    {toRoman(parseInt(f.number))}
                  </span>

                  <div className="grid grid-cols-[110px_1fr_auto] items-stretch">
                    <div className="relative overflow-hidden bg-noir-profond">
                      <FragmentVisual
                        id={f.id}
                        alt={f.name}
                        className="absolute inset-0 w-full h-full opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/40" />
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono-eclat text-[10px] tracking-rituel text-laiton">
                          {f.number}
                        </span>
                        <span className="h-px w-3 bg-laiton/60" />
                        <FragmentIcon id={f.id} className="w-4 h-4 text-laiton" />
                        {isScellé && (
                          <span className="font-mono-eclat text-[8px] tracking-rituel uppercase text-laiton border border-laiton/40 px-1.5 py-0.5">
                            {tr(copy.recognized)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif-rituel text-2xl leading-none mb-2">{f.name}</h3>
                      <p className="text-xs text-voile-dim leading-relaxed line-clamp-2">
                        {f.preview}
                      </p>
                      <span className="mt-2 font-mono-eclat text-[8px] tracking-rituel uppercase text-voile-dim/60 group-hover:text-laiton/80 transition">
                        {tr(copy.openFragment)}
                      </span>
                    </div>
                    <div className="flex items-center pr-4 text-voile-dim group-hover:text-laiton transition-colors">
                      <ArrowUpRight className="w-4 h-4" strokeWidth={1.25} />
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  to={`/fragments/voile/${f.id}`}
                  style={{ touchAction: "manipulation" }}
                  className="group block relative overflow-hidden rounded-2xl border border-border/40 hover:border-laiton/30 bg-gradient-to-r from-card/15 to-transparent transition-all duration-700 active:scale-[0.99]"
                >
                  <span className="absolute right-3 top-1 font-serif-rituel italic text-voile-dim/10 text-6xl pointer-events-none select-none">
                    {toRoman(parseInt(f.number))}
                  </span>
                  <div className="grid grid-cols-[110px_1fr_auto] items-stretch">
                    <div className="relative bg-noir-profond flex items-center justify-center filigrane overflow-hidden">
                      <FragmentVisual
                        id={f.id}
                        alt={f.name}
                        className="absolute inset-0 w-full h-full opacity-25 group-hover:opacity-40 transition-opacity duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent anim-voile" />
                      <Lock
                        className="w-3.5 h-3.5 text-voile-dim/70 relative z-10"
                        strokeWidth={1.25}
                      />
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono-eclat text-[10px] tracking-rituel text-voile-dim/60">
                          {f.number}
                        </span>
                        <span className="h-px w-3 bg-voile-dim/30" />
                        <FragmentIcon
                          id={f.id}
                          className="w-4 h-4 text-voile-dim/40 group-hover:text-laiton/70 transition"
                        />
                      </div>
                      <h3 className="font-serif-rituel text-2xl leading-none mb-2 text-voile-dim/70 group-hover:text-foreground transition">
                        {f.name}
                      </h3>
                      <p className="text-xs text-voile-dim/55 leading-relaxed line-clamp-2">
                        {f.preview}
                      </p>
                      <p className="mt-2 font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/50">
                        {tr(copy.readPreview)}
                      </p>
                    </div>
                    <div className="flex items-center pr-4">
                      <span className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/40 group-hover:text-laiton transition">
                        {tr(copy.veiledLabel)}
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          );
        })}

        <div className="pt-8">
          <Ornement />
        </div>
      </section>
    </div>
  );
}
