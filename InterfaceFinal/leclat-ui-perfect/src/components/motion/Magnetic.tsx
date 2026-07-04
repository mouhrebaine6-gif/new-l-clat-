import type { ReactNode, PointerEvent, CSSProperties } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useMagnetic } from "@/hooks/useMagnetic";

type Props = {
  children: ReactNode;
  strength?: number;
  range?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLMotionProps<"button">, "ref" | "children" | "className" | "style">;

/**
 * Bouton aimantÃ© â€” suit le pointeur Â±16 px, ressort aimant.
 * Variante de <Magnetic> qui wrap un <button> (utiliser un Link sÃ©parÃ©
 * pour les CTA de navigation).
 * Respecte `useReducedMotion()`.
 */
export function Magnetic({
  children,
  strength,
  range,
  className,
  onPointerMove,
  onPointerLeave,
  ...rest
}: Props) {
  const m = useMagnetic<HTMLButtonElement>({ strength, range });
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.button
      ref={m.ref}
      onPointerMove={(e: PointerEvent<HTMLButtonElement>) => {
        m.onMove(e);
        onPointerMove?.(e);
      }}
      onPointerLeave={(e: PointerEvent<HTMLButtonElement>) => {
        m.onLeave();
        onPointerLeave?.(e);
      }}
      style={{ x: m.sx, y: m.sy }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
