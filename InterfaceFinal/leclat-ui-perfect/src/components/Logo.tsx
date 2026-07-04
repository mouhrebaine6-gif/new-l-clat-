import sceauSrc from "@/assets/brand/leclat-sceau.webp";

type MarkProps = {
  /** Côté du carré en px. */
  size?: number;
  className?: string;
  /** Trace la faille diagonale lumineuse (par défaut true). */
  faille?: boolean;
  title?: string;
};

/**
 * Signe L'Éclat — le kanji 光 (lumière) stylisé, traversé par la faille.
 * SVG pur, sans raster. Le glyphe hérite de la couleur du texte (`currentColor`),
 * la faille prend le voile clair. À utiliser dans le header, le splash, les seuils.
 */
export const EclatMark = ({ size = 28, className = "", faille = true, title }: MarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    role={title ? "img" : "presentation"}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    className={className}
    style={{ display: "block", overflow: "visible" }}
  >
    {title ? <title>{title}</title> : null}
    <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 27 V16 Q15 12 19 12 H29 Q33 12 33 16 V27" />
      <path d="M14 27 H34" />
      <path d="M20 15.5 V20.5" />
      <path d="M24 14.5 V20.5" />
      <path d="M28 15.5 V20.5" />
      <path d="M22 27 L15 40" />
      <path d="M26 27 L31 37 q1.8 1.4 3.4 0.2" />
    </g>
    {faille && (
      <path
        d="M37.5 8.5 L13.5 41.5"
        stroke="hsl(var(--voile))"
        strokeWidth={1.9}
        strokeLinecap="round"
        opacity={0.95}
      />
    )}
  </svg>
);

type WordmarkProps = {
  className?: string;
  /** Hauteur en px du texte. */
  size?: number;
  showTagline?: boolean;
  /** Afficher le signe 光 à gauche du mot (par défaut true). */
  mark?: boolean;
  as?: "h1" | "div" | "span";
};

/**
 * Wordmark L'Éclat — signe 光 + mot, alignés optiquement.
 * S'intègre vraiment dans l'interface (couleur, kerning, ombrage discret).
 */
export const Wordmark = ({
  className = "",
  size = 22,
  showTagline = false,
  mark = true,
  as: Tag = "div",
}: WordmarkProps) => (
  <Tag
    className={`inline-flex items-center select-none ${className}`}
    aria-label="L'Éclat"
    style={{ fontSize: size, gap: size * 0.42 }}
  >
    {mark && <EclatMark size={Math.round(size * 1.32)} className="text-laiton shrink-0" />}
    <span className="inline-flex flex-col leading-none">
      <span
        className="font-serif-rituel text-laiton tracking-mineral"
        style={{
          fontSize: size,
          fontWeight: 400,
          letterSpacing: "0.2em",
          textShadow: "0 0 24px hsl(var(--laiton) / 0.18)",
        }}
      >
        L<span style={{ opacity: 0.55, margin: "0 0.04em" }}>’</span>
        <em className="not-italic">É</em>CLAT
      </span>
      {showTagline && (
        <span
          className="font-mono-eclat text-voile-dim/60 uppercase"
          style={{
            fontSize: Math.round(size * 0.3),
            letterSpacing: "0.34em",
            marginTop: size * 0.22,
          }}
        >
          le seuil
        </span>
      )}
    </span>
  </Tag>
);

type SceauProps = {
  className?: string;
  width?: number;
  alt?: string;
  loading?: "eager" | "lazy";
  /** Décodage prioritaire pour splash. */
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Sceau brodé L'Éclat — image raster (broderie réelle).
 * Réservé aux moments cérémoniels : splash, onboarding, sceau de profil.
 */
export const Sceau = ({
  className = "",
  width = 200,
  alt = "Sceau brodé L'Éclat",
  loading = "eager",
  fetchPriority = "auto",
}: SceauProps) => (
  <img
    src={sceauSrc}
    alt={alt}
    width={width}
    height={width}
    loading={loading}
    decoding="async"
    fetchPriority={fetchPriority}
    draggable={false}
    className={`select-none object-contain ${className}`}
    style={{ width, height: "auto" }}
  />
);

/** Compat : ancien <Logo /> = Wordmark par défaut (mot + signe). */
export const Logo = (props: WordmarkProps) => <Wordmark {...props} />;
