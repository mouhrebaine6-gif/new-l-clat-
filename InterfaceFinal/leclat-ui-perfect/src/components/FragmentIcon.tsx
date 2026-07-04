import { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { id: string };

// Icônes inspirées des concepts: Éveil(cristal), Souffle(vent), Forge(flamme),
// Prisme(pyramide), Atome(atome), Éclipse(disque), Horizon(ligne+soleil),
// Résonance(ondes), Ascension(cristal vertical), Origine(losange double).
export const FragmentIcon = ({ id, ...props }: Props) => {
  const common = {
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };

  switch (id) {
    case "eveil":
      return (
        <svg {...common}>
          <path d="M32 6 L44 22 L32 58 L20 22 Z" />
          <path d="M20 22 L44 22" />
          <path d="M32 6 L32 58" opacity={0.5} />
          <path d="M26 30 L32 24 L38 30" opacity={0.7} />
        </svg>
      );
    case "souffle":
      return (
        <svg {...common}>
          <path d="M10 24 C 22 24, 26 16, 36 16 C 44 16, 46 22, 42 26 C 40 28, 34 26, 34 22" />
          <path d="M8 34 C 24 34, 32 30, 46 30 C 54 30, 56 38, 50 40 C 46 41, 42 38, 44 34" />
          <path d="M12 44 C 26 44, 32 40, 40 40" opacity={0.6} />
        </svg>
      );
    case "forge":
      return (
        <svg {...common}>
          <path d="M32 8 C 36 18, 44 22, 44 34 C 44 46, 36 54, 32 54 C 28 54, 20 46, 20 34 C 20 26, 26 22, 28 16 C 30 22, 32 24, 32 8 Z" />
          <path
            d="M32 30 C 34 36, 38 38, 38 44 C 38 50, 34 52, 32 52 C 30 52, 26 50, 26 44 C 26 40, 30 38, 30 32"
            opacity={0.6}
          />
        </svg>
      );
    case "prisme":
      return (
        <svg {...common}>
          <path d="M32 6 L52 54 L12 54 Z" />
          <path d="M32 6 L32 54" opacity={0.5} />
          <path d="M22 30 L42 30" opacity={0.4} />
          <circle cx="32" cy="38" r="3" opacity={0.7} />
        </svg>
      );
    case "atome":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="4" />
          <ellipse cx="32" cy="32" rx="22" ry="9" />
          <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)" />
          <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(120 32 32)" />
        </svg>
      );
    case "eclipse":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="20" />
          <circle cx="32" cy="32" r="14" fill="currentColor" stroke="none" />
          <circle cx="32" cy="32" r="24" opacity={0.4} />
        </svg>
      );
    case "horizon":
      return (
        <svg {...common}>
          <path d="M6 40 L58 40" />
          <path d="M14 32 a18 18 0 0 1 36 0" />
          <circle cx="32" cy="40" r="6" opacity={0.7} />
          <path d="M6 46 L58 46" opacity={0.4} />
        </svg>
      );
    case "resonance":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
          <circle cx="32" cy="32" r="9" opacity={0.8} />
          <circle cx="32" cy="32" r="16" opacity={0.5} />
          <circle cx="32" cy="32" r="23" opacity={0.3} />
        </svg>
      );
    case "ascension":
      return (
        <svg {...common}>
          <path d="M32 4 L40 20 L36 56 L28 56 L24 20 Z" />
          <path d="M24 20 L40 20" />
          <path d="M32 4 L32 56" opacity={0.5} />
        </svg>
      );
    case "origine":
      return (
        <svg {...common}>
          <path d="M32 6 L50 32 L32 58 L14 32 Z" />
          <path d="M32 16 L42 32 L32 48 L22 32 Z" opacity={0.7} />
          <circle cx="32" cy="32" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
};
