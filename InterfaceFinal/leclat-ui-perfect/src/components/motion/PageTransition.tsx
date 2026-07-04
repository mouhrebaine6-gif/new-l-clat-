import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { EASE_SEUIL } from "@/lib/motion";

type Props = {
  children: ReactNode;
};

/**
 * Transition d'écran type application : glissement horizontal (slide iOS),
 * pas de défilement de page, rapide (<400ms). Respecte `useReducedMotion()`.
 * Le contenu entre depuis la droite et sort vers la gauche — sensation
 * « j'avance dans l'app ». L'overflow-x du body est masqué (cf. styles.css)
 * pour éviter toute barre horizontale pendant le glissement.
 */
export function PageTransition({ children }: Props) {
  const location = useLocation();
  const reduce = useReducedMotion() ?? false;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="relative"
        initial={reduce ? false : { opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? undefined : { opacity: 0, x: -20 }}
        transition={{ duration: reduce ? 0 : 0.34, ease: EASE_SEUIL }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
