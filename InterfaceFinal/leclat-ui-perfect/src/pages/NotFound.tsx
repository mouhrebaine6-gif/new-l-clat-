import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sceau, Ornement } from "@/components/Sceau";
import { text, useI18n } from "@/lib/i18n";

const notFoundCopy = {
  seal: text("PASSAGE SCELLÉ", "SEALED PASSAGE", "عبور مختوم"),
  error: text("Erreur · IV-O-IV", "Error · IV-O-IV", "خطأ · IV-O-IV"),
  titleA: text("Ce passage est", "This passage is", "هذا العبور"),
  titleB: text("scellé", "sealed", "مختوم"),
  pathA: text("« Le chemin", "“The path", "«المسار"),
  pathB: text(
    "n'a pas été ouvert.\nLe Voile y est encore intact. »",
    "has not been opened.\nThe Veil is still intact there.”",
    "لم يُفتح بعد.\nالسِّتار هناك ما زال كاملًا.»",
  ),
  home: text("Retour au manifeste", "Back to manifesto", "رجوع إلى البيان"),
  fragments: text("Les fragments", "Fragments", "الشذرات"),
};

const NotFound = () => {
  const location = useLocation();
  const { tr } = useI18n();
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
      <div className="absolute inset-0 ciel-poussiere opacity-50 anim-drift" />
      <div className="absolute inset-0 vignette-mineral" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <Sceau
          className="w-44 h-44 mx-auto opacity-60"
          label={`${tr(notFoundCopy.seal)} · 404 · `}
        />
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mt-8 mb-3">
          {tr(notFoundCopy.error)}
        </p>
        <h1 className="font-serif-rituel text-6xl mb-4">
          {tr(notFoundCopy.titleA)}{" "}
          <em className="italic text-laiton">{tr(notFoundCopy.titleB)}</em>.
        </h1>
        <p className="font-serif-rituel italic text-base text-voile-dim max-w-md mx-auto mb-3 whitespace-pre-line">
          {tr(notFoundCopy.pathA)}{" "}
          <span className="font-mono-eclat text-xs">{location.pathname}</span>{" "}
          {tr(notFoundCopy.pathB)}
          <br />
        </p>
        <Ornement className="mt-8 max-w-xs mx-auto mb-8" />
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="px-8 py-4 border border-laiton text-laiton hover:bg-laiton hover:text-primary-foreground transition-all duration-700 font-mono-eclat text-[11px] tracking-rituel uppercase"
          >
            {tr(notFoundCopy.home)}
          </Link>
          <Link
            to="/fragments"
            className="px-8 py-4 border border-border text-voile-dim hover:text-laiton hover:border-laiton/40 transition font-mono-eclat text-[11px] tracking-rituel uppercase"
          >
            {tr(notFoundCopy.fragments)}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
