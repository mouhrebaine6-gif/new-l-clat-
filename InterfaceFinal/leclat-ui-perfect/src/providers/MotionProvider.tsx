import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

type Props = { children: ReactNode };

/**
 * Provider global de motion.
 * Synchronise `useReducedMotion()` (Framer Motion) avec
 * l'attribut `data-reduce-motion` sur `<html>` — filet de sécurité
 * CSS (cf. styles.css) qui coupe toutes les animations CSS.
 */
export function MotionProvider({ children }: Props) {
  const reduce = useReducedMotion() ?? false;
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.reduceMotion = reduce ? "1" : "0";
  }, [reduce]);
  return <>{children}</>;
}
