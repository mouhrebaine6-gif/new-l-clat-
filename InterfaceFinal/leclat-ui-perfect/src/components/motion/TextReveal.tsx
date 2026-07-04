import { motion, useReducedMotion, type Variants } from "framer-motion";
import { createElement } from "react";
import { EASE_SEUIL } from "@/lib/motion";

type Tag = "span" | "h1" | "h2" | "h3" | "p" | "div";

type Props = {
  children: string;
  className?: string;
  delay?: number;
  once?: boolean;
  as?: Tag;
};

/**
 * Révèle un texte mot par mot avec un sweep vertical (clipPath inset).
 * Respecte `useReducedMotion()`.
 */
export function TextReveal({ children, className, delay = 0, once = true, as = "span" }: Props) {
  const reduce = useReducedMotion() ?? false;
  // Découpage en mots (RTL-safe : le navigateur gère l'ordre, on split sur espace).
  const words = children.split(/(\s+)/);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { opacity: 0, y: "0.4em", clipPath: "inset(0 0 100% 0)" },
    show: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0 0 0% 0)",
      transition: { duration: 0.9, ease: EASE_SEUIL },
    },
  };

  if (reduce) {
    return createElement(as, { className }, children);
  }

  const MotionTag = motion[as] as typeof motion.span;

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.3 }}
      aria-label={children}
      style={{ display: "inline-block" }}
    >
      {words.map((w, i) =>
        /\s+/.test(w) ? (
          <span key={i} aria-hidden="true">
            {w}
          </span>
        ) : (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
            aria-hidden="true"
          >
            <motion.span variants={child} style={{ display: "inline-block" }}>
              {w}
            </motion.span>
          </span>
        ),
      )}
    </MotionTag>
  );
}

/* helper exposé pour tree-shaking safe dans d'autres composants */
export type { Props as TextRevealProps };
