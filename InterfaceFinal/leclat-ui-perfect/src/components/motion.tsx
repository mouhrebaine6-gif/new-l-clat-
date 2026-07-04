import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Primitives de mouvement L'Éclat.
 * Easing lent et premium (jamais rebondissant), entrées sobres, et respect
 * systématique de prefers-reduced-motion. À poser sur les pages et les listes
 * pour que l'interface « vive » sans jamais distraire.
 */

// Courbe maison : départ franc, sortie douce — le « seuil » qui s'ouvre.
const EASE = [0.22, 0.61, 0.36, 1] as const;

/** Transition d'entrée de page : voile qui se lève. Remplace le <div> racine d'une page. */
export function MotionPage({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const riseChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Conteneur révélé au scroll : ses <RevealItem> apparaissent en cascade. */
export function Reveal({
  children,
  className,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/** Élément d'une cascade Reveal. */
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={riseChild}>
      {children}
    </motion.div>
  );
}

/** Bouton avec retour tactile immédiat (taste : feedback < 100 ms). */
type TapButtonProps = Omit<HTMLMotionProps<"button">, "ref">;

export function TapButton({ children, ...rest }: TapButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export { motion, AnimatePresence } from "framer-motion";
