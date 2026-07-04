import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * Halo de curseur — suit le pointeur global avec un ressort doux.
 * Desktop uniquement : on no-op sur les appareils coarse pointer.
 * Respecte `useReducedMotion()`.
 */
export function CursorHalo() {
  const reduce = useReducedMotion() ?? false;
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 220, damping: 24, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 24, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, x, y]);

  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        position: "fixed",
        top: 0,
        left: 0,
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid hsl(36 60% 70% / 0.4)",
        boxShadow: "0 0 24px -2px hsl(36 60% 70% / 0.35)",
        background: "radial-gradient(circle, hsl(36 38% 54% / 0.12), transparent 70%)",
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 80,
      }}
    />
  );
}
