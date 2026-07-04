import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { EASE_SEUIL } from "@/lib/motion";

type Props = {
  value: number;
  format?: Intl.NumberFormat;
  className?: string;
  duration?: number;
  suffix?: string;
  prefix?: string;
};

/**
 * Compteur animé qui s'incrémente de 0 à `value` à l'entrée dans le viewport.
 * Respecte `useReducedMotion()` (affiche la valeur finale directement).
 */
export function NumberTick({
  value,
  format,
  className,
  duration = 1.4,
  suffix = "",
  prefix = "",
}: Props) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    format ? format.format(Math.round(v)) : String(Math.round(v)),
  );
  const initialText = format ? format.format(0) : "0";
  const [text, setText] = useState<string>(initialText);

  useEffect(() => {
    if (reduce) {
      const final = format ? format.format(value) : String(value);
      setText(prefix + final + suffix);
      return;
    }
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: EASE_SEUIL });
    const unsub = display.on("change", (s) => setText(prefix + s + suffix));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, value, format, duration, reduce, mv, display, prefix, suffix]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
