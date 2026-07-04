import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Barre de progression laiton en haut de la page.
 * Suit `window.scroll`, ressort stiffness 90 / damping 20.
 * RTL-safe : `transformOrigin` s'inverse en `html[data-lang="ar"]`.
 * Respecte `useReducedMotion()`.
 */
export function ScrollBeam() {
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 20,
    restDelta: 0.001,
  });
  const [rtl, setRtl] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const sync = () => {
      setRtl(document.documentElement.dataset.lang === "ar");
    };
    sync();
    // observer léger sur l'attribut lang (le I18nProvider le change)
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang"] });
    return () => obs.disconnect();
  }, []);

  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX,
        transformOrigin: rtl ? "100% 50%" : "0% 50%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "linear-gradient(90deg, hsl(36 50% 60%), hsl(38 80% 78%))",
        boxShadow: "0 0 12px hsla(36 60% 70% / 0.5)",
        zIndex: 60,
        pointerEvents: "none",
      }}
    />
  );
}
