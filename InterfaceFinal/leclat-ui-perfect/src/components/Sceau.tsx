import { text, useI18n } from "@/lib/i18n";

type Props = { className?: string; label?: string };

// Sceau circulaire ornemental avec texte courbé
const defaultSceauLabel = text(
  "L'ÉCLAT · DIX FRAGMENTS · UN VOILE · ",
  "L'ÉCLAT · TEN FRAGMENTS · ONE VEIL · ",
  "L'ÉCLAT · عشر شذرات · ستار واحد · ",
);

export const Sceau = ({ className = "w-40 h-40", label }: Props) => {
  const { tr } = useI18n();
  const resolvedLabel = label ?? tr(defaultSceauLabel);

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <path id="sceau-circle" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
      </defs>
      {/* Anneaux */}
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke="hsl(var(--laiton) / 0.5)"
        strokeWidth="0.5"
      />
      <circle
        cx="100"
        cy="100"
        r="64"
        fill="none"
        stroke="hsl(var(--laiton) / 0.6)"
        strokeWidth="0.5"
      />
      <circle
        cx="100"
        cy="100"
        r="58"
        fill="none"
        stroke="hsl(var(--laiton) / 0.25)"
        strokeWidth="0.5"
        strokeDasharray="2 4"
      />

      {/* Texte courbé en rotation lente */}
      <g className="anim-orbit" style={{ transformOrigin: "100px 100px" }}>
        <text
          fill="hsl(var(--laiton))"
          fontSize="8.5"
          letterSpacing="3"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          textLength="420"
          lengthAdjust="spacing"
        >
          <textPath href="#sceau-circle" startOffset="50%" textAnchor="middle">
            {resolvedLabel.trim()}
          </textPath>
        </text>
      </g>

      {/* Étoiles cardinales */}
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a} 100 100)`}>
          <path d="M100 18 L102 26 L100 34 L98 26 Z" fill="hsl(var(--laiton))" opacity="0.7" />
        </g>
      ))}

      {/* Étoile centrale + L */}
      <g transform="translate(100 100)">
        <circle r="42" fill="none" stroke="hsl(var(--laiton) / 0.4)" strokeWidth="0.5" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          y="6"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="56"
          fill="hsl(var(--laiton))"
        >
          L
        </text>
        <path d="M-30 30 L30 30" stroke="hsl(var(--laiton) / 0.6)" strokeWidth="0.4" />
      </g>
    </svg>
  );
};

// Petit ornement séparateur
export const Ornement = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 12" className={`w-full h-3 ${className}`} aria-hidden>
    <line x1="0" y1="6" x2="80" y2="6" stroke="hsl(var(--laiton) / 0.5)" strokeWidth="0.5" />
    <line x1="120" y1="6" x2="200" y2="6" stroke="hsl(var(--laiton) / 0.5)" strokeWidth="0.5" />
    <g transform="translate(100 6)">
      <circle r="3" fill="none" stroke="hsl(var(--laiton))" strokeWidth="0.6" />
      <circle r="0.8" fill="hsl(var(--laiton))" />
      <path d="M-8 0 L-4 -2 L-4 2 Z" fill="hsl(var(--laiton))" />
      <path d="M8 0 L4 -2 L4 2 Z" fill="hsl(var(--laiton))" />
    </g>
  </svg>
);

// Cadre ornemental d'angle
export const CadreOrnement = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    {[
      "top-0 left-0",
      "top-0 right-0 rotate-90",
      "bottom-0 right-0 rotate-180",
      "bottom-0 left-0 -rotate-90",
    ].map((p, i) => (
      <svg key={i} viewBox="0 0 24 24" className={`absolute w-5 h-5 text-laiton ${p}`} aria-hidden>
        <path d="M2 14 L2 2 L14 2" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="2" cy="2" r="1" fill="currentColor" />
      </svg>
    ))}
    {children}
  </div>
);
