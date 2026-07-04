/**
 * PassageVideo — Vidéo de fond muette, autoplay en boucle.
 * - `prefers-reduced-motion` : non rendu (le parent gère déjà l'alternative)
 * - Hors écran : pause (économie CPU/batterie)
 * - Tab caché : pause
 * - iOS : autoplay autorisé car muted + playsInline
 */

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
};

export function PassageVideo({ src, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Lecture initiale (autoplay peut être bloquée iOS sans muted, mais on est muted)
    el.play().catch(() => {
      /* iOS peut bloquer au mount, l'attribut playsInline aide */
    });

    // Pause si onglet caché
    const onVisibility = () => {
      if (document.hidden) el.pause();
      else el.play().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pause si hors écran (perf mobile)
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) el.play().catch(() => undefined);
          else el.pause();
        },
        { threshold: 0.1 },
      );
      io.observe(el);
      return () => {
        io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${className}`}
    />
  );
}
