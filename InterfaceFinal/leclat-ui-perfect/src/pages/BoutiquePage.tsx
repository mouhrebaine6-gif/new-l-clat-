import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { localizeFragments, unlockedFragments as rawUnlockedFragments } from "@/data/fragments";
import { text, useI18n } from "@/lib/i18n";

const copy = {
  drop: text(
    "Drop 01 · MMXXVI · Édition limitée",
    "Drop 01 · MMXXVI · Limited edition",
    "الإصدار 01 · MMXXVI · نسخة محدودة",
  ),
  titleA: text("Cinq", "Five", "خمس"),
  titleB: text("pièces", "pieces", "قطع"),
  titleC: text("à porter.", "to wear.", "تُرتدى."),
  catalogue: text("Catalogue · V pièces", "Catalogue · V pieces", "الفهرس · خمس قطع"),
  fragment: text("Fragment", "Fragment", "شذرة"),
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const SYMBOLS = ["✦", "❂", "◈", "◇", "✶", "✧", "❖", "◆", "✺", "⟡"];

export default function BoutiquePage() {
  const { lang, tr } = useI18n();
  // La Boutique ne montre QUE les pièces réellement vendables (celles qui ont
  // un visuel produit). En mode démo, tous les fragments sont « unlocked »,
  // mais les fragments 6–10 n'ont pas d'images → on les exclut ici pour ne pas
  // planter sur f.images (écran noir constaté sur téléphone).
  const unlockedFragments = localizeFragments(rawUnlockedFragments, lang).filter(
    (f) => f.images?.worn,
  );

  return (
    <div className="px-5 pb-10">
      {/* En-tête compact (mockup) */}
      <div className="pt-6 pb-1">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-px w-[26px] bg-laiton" />
          <span
            className="font-mono-eclat uppercase text-laiton-300"
            style={{ fontSize: "9px", letterSpacing: "0.2em" }}
          >
            {tr(copy.drop)}
          </span>
        </div>
        <h1
          className="font-serif-rituel font-semibold text-voile-pur"
          style={{ fontSize: "46px", lineHeight: "0.92", letterSpacing: "-0.01em" }}
        >
          {tr(copy.titleA)} <em className="not-italic text-laiton-300">{tr(copy.titleB)}</em>
          <br />
          {tr(copy.titleC)}
        </h1>
        <p
          className="mt-3.5 font-mono-eclat uppercase text-voile-dim"
          style={{ fontSize: "10px", letterSpacing: "0.14em" }}
        >
          {tr(copy.catalogue)} — <span className="text-laiton-300">3 600 DA</span>
        </p>
      </div>

      {/* Grille de cartes photos — coins arrondis, mènent vers la fiche produit */}
      <div className="mt-4 flex flex-col gap-[18px]">
        {unlockedFragments.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.04 }}
          >
            <Link
              to={`/boutique/${f.id}`}
              onClick={() => {
                try {
                  navigator.vibrate?.(8);
                } catch {
                  /* sans effet */
                }
              }}
              className="group block active:scale-[0.98] transition-transform"
              style={{ touchAction: "manipulation" }}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-border/70 bg-noir-profond">
                <img
                  src={f.images!.worn}
                  alt={f.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
                  style={{ objectPosition: "50% 28%" }}
                />
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(7,5,3,.10), rgba(7,5,3,.25) 50%, rgba(7,5,3,.92))",
                  }}
                />
                {/* Chiffre romain filigrane */}
                <span
                  className="absolute left-4 top-3.5 font-serif-rituel italic leading-none"
                  style={{ fontSize: "34px", color: "rgba(247,241,227,.22)" }}
                >
                  {ROMAN[i] ?? f.number}
                </span>
                {/* Bloc bas */}
                <div className="absolute bottom-4 left-[18px] right-[18px] text-left">
                  <p
                    className="mb-[5px] font-mono-eclat uppercase text-laiton-flash"
                    style={{ fontSize: "8px", letterSpacing: "0.2em" }}
                  >
                    {tr(copy.fragment)} {f.number} · {SYMBOLS[i] ?? "✦"}
                  </p>
                  <div className="flex items-end justify-between gap-2.5">
                    <span
                      className="font-serif-rituel font-semibold text-voile-pur"
                      style={{ fontSize: "28px", lineHeight: "0.95" }}
                    >
                      {f.name}
                    </span>
                    <span
                      className="whitespace-nowrap font-mono-eclat text-voile"
                      style={{ fontSize: "10px", letterSpacing: "0.08em" }}
                    >
                      {(f.price ?? 0).toLocaleString("fr-FR")} DA
                    </span>
                  </div>
                  <span className="mt-1 block text-[11px] text-voile-dim">{f.colorLabel}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
