import { useRef, type PointerEvent } from "react";
import { useMotionValue, useSpring, useReducedMotion, type MotionValue } from "framer-motion";

/**
 * Hook magnétique L'ÉCLAT.
 * Suivi du pointeur sur l'élément référencé, capé à `range` px,
 * ressort `aimant` (stiffness 150 / damping 18 / mass 0.6).
 * Respecte `useReducedMotion()` : aucun déplacement si l'utilisateur
 * a désactivé les animations.
 */
export type MagneticOptions = {
  /** Force de l'attraction 0..1 (défaut 0.35). */
  strength?: number;
  /** Déplacement maximum en pixels (défaut 16). */
  range?: number;
};

export type MagneticReturn<T extends HTMLElement> = {
  ref: React.RefObject<T | null>;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  onMove: (e: PointerEvent<T>) => void;
  onLeave: () => void;
  reduce: boolean;
};

export function useMagnetic<T extends HTMLElement>(opts: MagneticOptions = {}): MagneticReturn<T> {
  const { strength = 0.35, range = 16 } = opts;
  const ref = useRef<T | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 150, damping: 18, mass: 0.6 });
  const reduce = useReducedMotion() ?? false;

  const onMove = (e: PointerEvent<T>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    x.set(Math.max(-range, Math.min(range, dx * strength)));
    y.set(Math.max(-range, Math.min(range, dy * strength)));
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, sx, sy, onMove, onLeave, reduce };
}
