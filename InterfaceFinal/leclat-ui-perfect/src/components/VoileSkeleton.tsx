/**
 * Squelettes de chargement L'Éclat — remplacement des textes bruts
 * (« Le Voile se lève… ») par une matière qui respire, dans les tons de la
 * marque. Pulsation décalée ligne par ligne pour un effet d'étoffe, pas de
 * spinner. `aria-busy` est posé par le parent.
 */

const bar = "rounded-md bg-voile/[0.06] border border-voile/[0.04] animate-pulse";

/** Bloc « fragment d'histoire » : sceau + titre + lignes de prose. */
export const StorySkeleton = ({ blocks = 2 }: { blocks?: number }) => (
  <div className="space-y-10" aria-hidden>
    {Array.from({ length: blocks }).map((_, b) => (
      <div key={b} className="border-t border-border/50 pt-7">
        <div className="mb-5 flex items-start gap-4">
          <div
            className={`h-14 w-14 shrink-0 rounded-xl ${bar}`}
            style={{ animationDelay: `${b * 180}ms` }}
          />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className={`h-3 w-24 ${bar}`} style={{ animationDelay: `${b * 180 + 60}ms` }} />
            <div className={`h-6 w-40 ${bar}`} style={{ animationDelay: `${b * 180 + 120}ms` }} />
          </div>
        </div>
        <div className="space-y-3">
          {[92, 100, 78].map((w, i) => (
            <div
              key={i}
              className={`h-4 ${bar}`}
              style={{ width: `${w}%`, animationDelay: `${b * 180 + 160 + i * 70}ms` }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/** Bloc « prose longue » : lignes de lecture (Compagnon). */
export const ProseSkeleton = ({ lines = 9 }: { lines?: number }) => (
  <div className="space-y-3" aria-hidden>
    <div className={`mb-6 h-7 w-52 ${bar}`} />
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 ${bar}`}
        style={{
          width: `${[100, 96, 88, 100, 92, 74, 100, 95, 60][i % 9]}%`,
          animationDelay: `${i * 60}ms`,
        }}
      />
    ))}
  </div>
);
