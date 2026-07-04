import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type Props = {
  preview: ReactNode;
  full: ReactNode;
  className?: string;
};

/**
 * Note qui se déplie — preview toujours visible, full au tap.
 * Animation `height` + `rotateX` (effet papier).
 * Respecte `useReducedMotion()`.
 */
export function StickyNoteUnfold({ preview, full, className }: Props) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion() ?? false;

  return (
    <div className={`relative ${className ?? ""}`}>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        className="w-full text-left"
        aria-expanded={open}
      >
        {preview}
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0, rotateX: -8 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1, rotateX: 0 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0, rotateX: -8 }}
            transition={{
              height: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
              opacity: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
              rotateX: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
            }}
            style={{ overflow: "hidden", transformOrigin: "50% 0%", perspective: 800 }}
          >
            <div className="pt-4">{full}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
