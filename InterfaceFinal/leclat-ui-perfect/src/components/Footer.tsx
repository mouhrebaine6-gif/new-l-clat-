import { Ornement } from "@/components/Sceau";
import { Wordmark } from "@/components/Logo";
import { text, useI18n } from "@/lib/i18n";

const footerCopy = {
  quote: text(
    "« Vous pouvez le porter sans rien demander. »",
    "“You may wear it without asking for anything.”",
    "«يمكنك أن ترتديه من غير أن تطلب شيئًا.»",
  ),
  limited: text(
    "© MMXXVI · Édition limitée 200 pièces",
    "© MMXXVI · Limited edition, 200 pieces",
    "© MMXXVI · إصدار محدود، ٢٠٠ قطعة",
  ),
};

/**
 * Signature de marque en fin de page (app, pas site) — aucune colonne de menu.
 * La navigation vit dans le BottomNav (5 pages) + le menu « Le Voile » (VoileMenu).
 */
export const Footer = () => {
  const { tr } = useI18n();

  return (
    <footer className="relative mt-12 border-t border-border/40 bg-noir-profond/60 pb-24 backdrop-blur">
      <div className="ligne-sacrée absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6 flex flex-col items-center">
          <Wordmark size={28} />
          <p className="mt-3 font-mono-eclat text-[10px] uppercase tracking-rituel text-voile-dim/60">
            Drop 01 · MMXXVI
          </p>
        </div>

        <Ornement className="mx-auto mb-6 max-w-xs" />

        <p className="mx-auto max-w-sm text-center font-serif-rituel text-sm italic leading-snug text-voile-dim/60">
          {tr(footerCopy.quote)}
        </p>
        <p className="mt-4 text-center font-mono-eclat text-[9px] uppercase tracking-rituel text-voile-dim/40">
          {tr(footerCopy.limited)}
        </p>
      </div>
    </footer>
  );
};
