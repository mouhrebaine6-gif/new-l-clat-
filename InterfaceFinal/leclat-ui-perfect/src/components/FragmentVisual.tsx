import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FragmentIcon } from "@/components/FragmentIcon";

type Props = {
  id: string;
  alt?: string;
  className?: string;
  /** Compact mode: just the sigil, no orbit/aura. */
  iconOnly?: boolean;
  /** Aura halo behind the visual. */
  withAura?: boolean;
  /** Accepted for API compat (ex-img loading). Ignored. */
  loading?: "eager" | "lazy";
  sizes?: string;
};

/**
 * FragmentVisual — média animé du fragment (boucle vidéo) serti dans la DA
 * "rituel laiton" : anneaux pointillés contre-rotatifs, aura respirante,
 * particules orbitales. La vidéo vit dans /public/fragments/<id>.mp4 avec un
 * poster figé <id>.jpg (utilisé uniquement en reduced-motion).
 * Le mode `iconOnly` conserve le sigil SVG vectoriel pour les petits contextes.
 */
export const FragmentVisual = ({
  id,
  alt,
  className = "",
  iconOnly = false,
  withAura = false,
}: Props) => {
  const reduce = useReducedMotion();
  const animateDetail = !reduce;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoActive, setVideoActive] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  // Chemin RELATIF à la base de l'app (import.meta.env.BASE_URL). Indispensable
  // dans la WebView Unity (file://) : un chemin absolu "/fragments/…" y pointe
  // vers la racine du système de fichiers → média introuvable, cercle vide.
  const base = import.meta.env.BASE_URL || "/";
  const videoSrc = `${base}fragments/${id}.mp4`;
  const poster = `${base}fragments/${id}.jpg`;

  useEffect(() => {
    if (!animateDetail) {
      setVideoActive(false);
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setVideoActive(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVideoActive(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "80px 0px",
        threshold: 0.15,
      },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [animateDetail, id]);

  useEffect(() => {
    if (!animateDetail) return;
    const video = videoRef.current;
    if (!video) return;

    const syncPlayback = () => {
      if (document.hidden || !videoActive) {
        video.pause();
        return;
      }

      if (video.readyState === 0) video.load();
      video.play().catch(() => undefined);
    };

    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [animateDetail, videoActive, id]);

  const activeMotion = animateDetail && videoActive;

  if (iconOnly) {
    return (
      <div
        className={`relative flex items-center justify-center text-laiton ${className}`}
        role="img"
        aria-label={alt ?? `Fragment ${id}`}
      >
        <FragmentIcon id={id} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} role="img" aria-label={alt ?? `Fragment ${id}`}>
      {withAura && (
        <motion.div
          aria-hidden
          className="absolute inset-0 -m-6 pointer-events-none rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, hsl(var(--laiton) / 0.28), transparent 65%)",
          }}
          animate={activeMotion ? { opacity: [0.5, 0.95, 0.5], scale: [0.96, 1.05, 0.96] } : {}}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Média du fragment — vidéo en boucle (ou poster figé) serti dans le cercle */}
      <div
        className="absolute inset-[6%] rounded-full overflow-hidden border border-laiton/25"
        style={{
          boxShadow:
            "0 0 32px -8px hsl(var(--laiton) / 0.4), inset 0 0 26px hsl(var(--noir-profond) / 0.65)",
        }}
      >
        {/* Repli TOUJOURS présent derrière le média : sigil vectoriel du
            fragment. Si la vidéo/poster échoue (WebView, réseau), le fragment
            garde son symbole au lieu d'un cercle noir vide. */}
        <FragmentIcon
          id={id}
          className="pointer-events-none absolute inset-[22%] text-laiton/45"
        />
        {!mediaFailed &&
          (animateDetail ? (
            <video
              ref={videoRef}
              key={id}
              className="relative w-full h-full object-cover"
              src={videoSrc}
              poster={poster}
              autoPlay
              loop
              muted
              playsInline
              preload={videoActive ? "auto" : "metadata"}
              data-fragment-video="1"
              onError={() => setMediaFailed(true)}
            />
          ) : (
            <img
              src={poster}
              alt={alt ?? `Fragment ${id}`}
              className="relative w-full h-full object-cover"
              loading="lazy"
              onError={() => setMediaFailed(true)}
            />
          ))}
      </div>

      {/* Anneau extérieur — rotation lente (cadre laiton par-dessus le média) */}
      <motion.svg
        aria-hidden
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-laiton pointer-events-none"
        animate={activeMotion ? { rotate: 360 } : {}}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          strokeDasharray="2 6"
          opacity="0.6"
        />
        {[0, 90, 180, 270].map((a) => (
          <line
            key={a}
            x1="50"
            y1="1.5"
            x2="50"
            y2="5"
            stroke="currentColor"
            strokeWidth="0.6"
            transform={`rotate(${a} 50 50)`}
          />
        ))}
      </motion.svg>

      {/* Anneau intérieur — contre-rotation */}
      <motion.svg
        aria-hidden
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-laiton/70 pointer-events-none"
        animate={activeMotion ? { rotate: -360 } : {}}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          strokeDasharray="0.5 4"
        />
      </motion.svg>

      {/* Particules orbitales */}
      {activeMotion && (
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none text-laiton"
        >
          {[0, 1, 2].map((i) => (
            <circle key={i} r="0.9" fill="currentColor" cx="50" cy="3.5">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`${i * 120} 50 50`}
                to={`${360 + i * 120} 50 50`}
                dur={`${14 + i * 2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      )}
    </div>
  );
};
