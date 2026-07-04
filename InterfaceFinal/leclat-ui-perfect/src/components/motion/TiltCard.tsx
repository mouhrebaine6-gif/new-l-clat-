import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

type Props = {
  children: ReactNode;
  className?: string;
  /** Rotation max en degrés (défaut 8). */
  max?: number;
} & Omit<HTMLMotionProps<"div">, "ref" | "children" | "className">;

/**
 * Carte 3D qui suit le pointeur + glare laiton.
 * Respecte `useReducedMotion()`.
 */
export function TiltCard({ children, className, max = 8, ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22 });
  const glareX = useTransform(sry, [-max, max], ["100%", "0%"]);
  const glareY = useTransform(srx, [-max, max], ["0%", "100%"]);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const unsubX = glareX.on("change", (v) => el.style.setProperty("--gx", v));
    const unsubY = glareY.on("change", (v) => el.style.setProperty("--gy", v));
    return () => {
      unsubX();
      unsubY();
    };
  }, [glareX, glareY, reduce]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    sry.set(px * max * 2);
    srx.set(-py * max * 2);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={className}
      {...rest}
    >
      {children}
      {!reduce && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), hsla(36 60% 70% / 0.18), transparent 50%)",
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}
    </motion.div>
  );
}
