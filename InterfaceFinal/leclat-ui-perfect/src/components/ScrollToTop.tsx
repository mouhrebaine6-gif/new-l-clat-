import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Réinitialise le scroll à chaque changement de route.
 * Respecte les ancres (#hash) — si une cible existe, on saute dessus.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        return;
      }
    }
    // Désactive temporairement le smooth scroll global pour un retour net
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = prev;
    });
  }, [pathname, hash]);

  return null;
};
