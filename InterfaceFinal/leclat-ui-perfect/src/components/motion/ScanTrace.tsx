import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE_SEUIL } from "@/lib/motion";

const PATH = "M 40 100 Q 100 20 200 100 T 360 100";

/**
 * Tracé SVG animé — un chemin de fond pointillé + tracé lumineux
 * qui se dessine + lumen qui glisse le long du path.
 * Respecte `useReducedMotion()`.
 */
export function ScanTrace() {
  const reduce = useReducedMotion() ?? false;

  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 2.4, ease: EASE_SEUIL },
    },
  };

  return (
    <svg viewBox="0 0 400 200" width="100%" height="200" role="img" aria-label="Trace de scan">
      <defs>
        <linearGradient id="scan-trace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(36 38% 54%)" stopOpacity="0.2" />
          <stop offset="50%" stopColor="hsl(38 80% 78%)" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(36 38% 54%)" stopOpacity="0.2" />
        </linearGradient>
        <filter id="scan-lumen-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* chemin de fond (couture pointillée) */}
      <path
        d={PATH}
        fill="none"
        stroke="hsl(40 25% 88% / 0.12)"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {!reduce && (
        <motion.path
          d={PATH}
          fill="none"
          stroke="url(#scan-trace)"
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={draw}
          initial="hidden"
          animate="show"
        />
      )}

      {!reduce && (
        <motion.circle
          r="3.5"
          fill="hsl(38 80% 78%)"
          filter="url(#scan-lumen-glow)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path("${PATH}")` }}
        />
      )}
    </svg>
  );
}
