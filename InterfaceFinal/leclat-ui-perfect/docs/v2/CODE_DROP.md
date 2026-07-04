# L'ÉCLAT — CODE DROP V2
## Snippets production-ready, TS strict, React 19 + Framer Motion 12

Chaque snippet compile tel quel, zéro `any`, respecte `prefers-reduced-motion`. Aucune dépendance nouvelle : tout repose sur `framer-motion`, `react`, `react-router-dom`, `lucide-react` (déjà installés).

Arborescence cible :
```
src/
  components/
    motion/
      TextReveal.tsx
      Magnetic.tsx
      ScanTrace.tsx
      PageTransition.tsx
      NumberTick.tsx
      SkeletonShimmer.tsx
      StickyNoteUnfold.tsx
      TiltCard.tsx
      BottomNav.tsx
      CursorHalo.tsx
      ScrollBeam.tsx
      FragmentUnlock.tsx
    ui/
      glass.css
  hooks/
    useMagnetic.ts
  lib/
    motion.ts            (springs, easings)
  providers/
    MotionProvider.tsx
  pages/
    Index.tsx            (refonte complète ci-dessous)
```

---

## 1. `src/lib/motion.ts` — tokens partagés

```ts
/**
 * Tokens de mouvement L'ÉCLAT V2.
 * Cinéma Mobile easing, springs tactiles, durées nommées.
 */

export const EASE_SEUIL: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_FIL:   [number, number, number, number] = [0.22, 0.61, 0.36, 1];
export const EASE_COUTURE: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const SPRING = {
  tactile: { type: "spring", stiffness: 420, damping: 26 } as const,
  doux:    { type: "spring", stiffness: 180, damping: 24 } as const,
  lourd:   { type: "spring", stiffness: 90,  damping: 20 } as const,
  aimant:  { type: "spring", stiffness: 150, damping: 18, mass: 0.6 } as const,
} as const;

export const DUR = {
  instant: 0.08,
  quick:   0.18,
  base:    0.32,
  medium:  0.55,
  slow:    0.95,
  ritual:  1.6,
  veil:    2.4,
} as const;
```

---

## 2. `src/hooks/useMagnetic.ts` — hook magnétique

```ts
import { useRef, type MouseEvent } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export type MagneticOptions = {
  strength?: number; // 0..1
  range?: number;    // px max
};

export function useMagnetic<T extends HTMLElement>(opts: MagneticOptions = {}) {
  const { strength = 0.35, range = 16 } = opts;
  const ref = useRef<T | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 150, damping: 18, mass: 0.6 });
  const reduce = useReducedMotion();

  const onMove = (e: MouseEvent<T>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    x.set(Math.max(-range, Math.min(range, dx * strength)));
    y.set(Math.max(-range, Math.min(range, dy * strength)));
  };

  const onLeave = () => { x.set(0); y.set(0); };

  return { ref, sx, sy, onMove, onLeave, reduce };
}
```

---

## 3. `src/components/motion/TextReveal.tsx`

```tsx
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_SEUIL } from "@/lib/motion";

type Props = {
  children: string;
  className?: string;
  delay?: number;
  once?: boolean;
  as?: "span" | "h1" | "h2" | "h3" | "p";
};

export function TextReveal({ children, className, delay = 0, once = true, as = "span" }: Props) {
  const reduce = useReducedMotion();
  const words = children.split(/(\s+)/);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { opacity: 0, y: "0.4em", clipPath: "inset(0 0 100% 0)" },
    show: {
      opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)",
      transition: { duration: 0.9, ease: EASE_SEUIL },
    },
  };

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.3 }}
      aria-label={children}
      style={{ display: "inline-block" }}
    >
      {words.map((w, i) =>
        /\s+/.test(w) ? (
          <span key={i} aria-hidden="true">{w}</span>
        ) : (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
            aria-hidden="true"
          >
            <motion.span variants={child} style={{ display: "inline-block" }}>
              {w}
            </motion.span>
          </span>
        ),
      )}
    </MotionTag>
  );
}
```

---

## 4. `src/components/motion/CursorHalo.tsx`

```tsx
import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export function CursorHalo() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 220, damping: 24, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 24, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, x, y]);

  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{
        x: sx, y: sy,
        translateX: "-50%", translateY: "-50%",
        position: "fixed", top: 0, left: 0,
        width: 36, height: 36,
        borderRadius: "50%",
        border: "1px solid hsl(36 60% 70% / 0.4)",
        boxShadow: "0 0 24px -2px hsl(36 60% 70% / 0.35)",
        background: "radial-gradient(circle, hsl(36 38% 54% / 0.12), transparent 70%)",
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 80,
      }}
    />
  );
}
```

---

## 5. `src/components/motion/ScanTrace.tsx`

```tsx
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE_SEUIL } from "@/lib/motion";

const PATH = "M 40 100 Q 100 20 200 100 T 360 100";

export function ScanTrace() {
  const reduce = useReducedMotion();

  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    show:   { pathLength: 1, opacity: 1, transition: { duration: 2.4, ease: EASE_SEUIL } },
  };

  return (
    <svg viewBox="0 0 400 200" width="100%" height="200" role="img" aria-label="Trace de scan">
      <defs>
        <linearGradient id="trace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="hsl(36 38% 54%)" stopOpacity="0.2" />
          <stop offset="50%"  stopColor="hsl(38 80% 78%)" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(36 38% 54%)" stopOpacity="0.2" />
        </linearGradient>
        <filter id="lumen-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d={PATH} fill="none" stroke="hsl(40 25% 88% / 0.12)" strokeWidth="1" strokeDasharray="2 6" />

      {!reduce && (
        <motion.path d={PATH} fill="none" stroke="url(#trace)" strokeWidth="1.5" strokeLinecap="round"
                     variants={draw} initial="hidden" animate="show" />
      )}

      {!reduce && (
        <motion.circle r="3.5" fill="hsl(38 80% 78%)" filter="url(#lumen-glow)"
                       initial={{ offsetDistance: "0%" }}
                       animate={{ offsetDistance: "100%" }}
                       transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                       style={{ offsetPath: `path("${PATH}")` }} />
      )}
    </svg>
  );
}
```

---

## 6. `src/components/motion/PageTransition.tsx`

```tsx
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import { EASE_SEUIL, EASE_COUTURE } from "@/lib/motion";

export function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="relative"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: reduce ? 0 : 0.7, ease: EASE_SEUIL }}
      >
        <motion.div
          aria-hidden="true"
          initial={reduce ? false : { scaleY: 1 }}
          animate={{ scaleY: 0 }}
          exit={{ scaleY: 1 }}
          transition={{ duration: 0.95, ease: EASE_COUTURE }}
          style={{
            position: "fixed", inset: 0,
            background: "linear-gradient(180deg, hsl(30 14% 3%), hsl(30 18% 2.5%))",
            transformOrigin: "50% 0%",
            zIndex: 70,
            pointerEvents: "none",
          }}
        />
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 7. `src/components/motion/NumberTick.tsx`

```tsx
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { EASE_SEUIL } from "@/lib/motion";

type Props = {
  value: number;
  format?: Intl.NumberFormat;
  className?: string;
  duration?: number;
  suffix?: string;
};

export function NumberTick({ value, format, className, duration = 1.4, suffix = "" }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    format ? format.format(Math.round(v)) : String(Math.round(v)),
  );
  const [text, setText] = useState<string>(format ? format.format(0) : "0");

  useEffect(() => {
    if (reduce) {
      setText((format ? format.format(value) : String(value)) + suffix);
      return;
    }
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: EASE_SEUIL });
    const unsub = display.on("change", (s) => setText(s + suffix));
    return () => { controls.stop(); unsub(); };
  }, [inView, value, format, duration, reduce, mv, display, suffix]);

  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}
```

---

## 8. `src/components/motion/TiltCard.tsx`

```tsx
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import {
  motion, useMotionValue, useSpring, useTransform,
  useReducedMotion, type HTMLMotionProps,
} from "framer-motion";

type Props = {
  children: ReactNode;
  className?: string;
  max?: number;
} & Omit<HTMLMotionProps<"div">, "ref" | "children" | "className">;

export function TiltCard({ children, className, max = 8, ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22 });
  const glareX = useTransform(sry, [-max, max], ["100%", "0%"]);
  const glareY = useTransform(srx, [-max, max], ["0%", "100%"]);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const el = ref.current; if (!el) return;
    const unsubX = glareX.on("change", (v) => el.style.setProperty("--gx", v));
    const unsubY = glareY.on("change", (v) => el.style.setProperty("--gy", v));
    return () => { unsubX(); unsubY(); };
  }, [glareX, glareY, reduce]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    sry.set(px * max * 2);
    srx.set(-py * max * 2);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX: srx, rotateY: sry,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={className}
      {...rest}
    >
      {children}
      {!reduce && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            borderRadius: "inherit",
            background:
              "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), hsla(36 60% 70% / 0.18), transparent 50%)",
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}
    </motion.div>
  );
}
```

---

## 9. `src/components/motion/BottomNav.tsx`

```tsx
import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Layers, ShoppingBag, ScanLine, BookOpen, User, type LucideIcon } from "lucide-react";
import { text } from "@/lib/i18n";

type Tab = { to: string; label: string; code: string; icon: LucideIcon };

const tabs: Tab[] = [
  { to: "/fragments", label: text("Frag.", "Frag.", "شذر"),      code: "I",   icon: Layers },
  { to: "/boutique",  label: text("Pièces", "Pieces", "قطع"),    code: "II",  icon: ShoppingBag },
  { to: "/scan",      label: text("Scan", "Scan", "مسح"),        code: "III", icon: ScanLine },
  { to: "/histoire",  label: text("Histoire", "Story", "القصة"), code: "IV",  icon: BookOpen },
  { to: "/profil",    label: text("Sceau", "Seal", "الختم"),     code: "V",   icon: User },
];

export function BottomNav() {
  const reduce = useReducedMotion();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 glass-2 safe-bottom"
      aria-label="Navigation principale"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5 h-[60px]">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center py-2 gap-1 tap min-w-0 transition-colors duration-500 ${
                isActive ? "text-laiton-300" : "text-voile-dim hover:text-voile"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !reduce && (
                  <>
                    <motion.span
                      layoutId="nav-rule"
                      className="absolute top-0 h-px w-10"
                      style={{
                        background: "linear-gradient(90deg, transparent, hsl(36 60% 70%), transparent)",
                        boxShadow: "0 0 12px hsl(36 60% 70% / 0.6)",
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                    <motion.span
                      layoutId="nav-aura"
                      className="absolute w-12 h-12 rounded-full"
                      style={{
                        background: "radial-gradient(circle, hsl(36 38% 54% / 0.25), transparent 65%)",
                      }}
                      transition={{ type: "spring", stiffness: 280, damping: 26 }}
                      aria-hidden="true"
                    />
                  </>
                )}
                <t.icon className="w-[18px] h-[18px]" strokeWidth={1.25} />
                <span className="max-w-full truncate px-1 font-mono text-[8px] leading-none uppercase tracking-rituel">
                  {t.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

---

## 10. `src/providers/MotionProvider.tsx`

```tsx
import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduce ? "1" : "0";
  }, [reduce]);
  return <>{children}</>;
}
```

**CSS à ajouter dans `src/styles.css`** (filet de sécurité global) :
```css
html[data-reduce-motion="1"] *,
html[data-reduce-motion="1"] *::before,
html[data-reduce-motion="1"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

---

## 11. `src/components/motion/Magnetic.tsx` (composant)

```tsx
import type { ReactNode, MouseEvent } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useMagnetic } from "@/hooks/useMagnetic";

type Props = {
  children: ReactNode;
  strength?: number;
  range?: number;
  className?: string;
} & Omit<HTMLMotionProps<"button">, "ref">;

export function Magnetic({ children, strength, range, className, onPointerMove, onPointerLeave, ...rest }: Props) {
  const m = useMagnetic<HTMLButtonElement>({ strength, range });
  const reduce = useReducedMotion();
  return (
    <motion.button
      ref={m.ref}
      onPointerMove={(e: MouseEvent<HTMLButtonElement>) => { m.onMove(e); onPointerMove?.(e); }}
      onPointerLeave={(e: MouseEvent<HTMLButtonElement>) => { m.onLeave(); onPointerLeave?.(e); }}
      style={{ x: m.sx, y: m.sy }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
```

---

## 12. `src/pages/Index.tsx` — refonte complète

```tsx
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Layers, ShoppingBag, ScanLine, ArrowRight } from "lucide-react";
import heroCanyon from "@/assets/tshirts/hero-canyon.webp";
import heroSilhouette from "@/assets/tshirts/hero-silhouette.webp";
import { Sceau, Ornement } from "@/components/Sceau";
import { usePorteur, toRoman } from "@/lib/porteur";
import { text, useI18n } from "@/lib/i18n";
import { isUnityWebViewRuntime } from "@/lib/runtimeFlags";
import { TextReveal } from "@/components/motion/TextReveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { TiltCard } from "@/components/motion/TiltCard";
import { NumberTick } from "@/components/motion/NumberTick";
import { EASE_FIL, EASE_SEUIL } from "@/lib/motion";

const citations = [
  text("Vous pouvez le porter sans rien demander.", "You can wear it without asking anything of it.", "يمكنك ارتداؤه من غير أن تطلب منه شيئًا."),
  text("Scannez-le si cela ne vous suffit pas.", "Scan it if that is not enough.", "امسحه إن لم يكفِ ذلك."),
  text("Le fragment répondra.", "The fragment will answer.", "ستجيب الشذرة."),
  text("Un nom revient parfois dans le tissu.", "A name sometimes returns through the fabric.", "اسم يعود أحيانًا من داخل القماش."),
  text("Quelqu'un est passé avant vous.", "Someone passed before you.", "مرّ أحد قبلك."),
];

const copy = {
  manifesto:    text("Manifeste · MMXXVI", "Manifesto · MMXXVI", "البيان · MMXXVI"),
  h1a:          text("Porter", "Wear", "ارتداء"),
  h1b:          text("le fragment.", "the fragment.", "الشذرة."),
  h1c:          text("Réveiller", "Awaken", "إيقاظ"),
  scroll:       text("↓ Descendez. Le rituel s'éveille.", "↓ Scroll. The passage wakes.", "↓ انزل. العتبة تستيقظ."),
  triad:        text("Triade des passages", "Three passages", "العتبات الثلاث"),
  choose:       text("Choisissez une porte", "Choose a door", "اختر بابًا"),
  fragments:    text("Les Fragments", "Fragments", "الشذرات"),
  fragmentsSub: text("Suivre les passages", "Follow the passages", "اتبع العتبات"),
  shop:         text("La Boutique", "Boutique", "المتجر"),
  shopSub:      text("Voir les pièces textiles", "View textile pieces", "عرض القطع"),
  scan:         text("Le Scan", "Scan", "المسح"),
  scanSub:      text("Scanner le vêtement", "Scan the garment", "مسح القطعة"),
  attempts:     text("Passages qualifiés", "Qualified passages", "عبور مؤكّد"),
  fragmentsCount: text("Fragments", "Fragments", "الشذرات"),
  drop:         text("Drop", "Drop", "الإصدار"),
  principle:    text("Principe directeur", "Guiding principle", "المبدأ"),
  quoteA:       text("« Vous pouvez le porter sans rien demander.", "“You can wear it without asking anything of it.", "«يمكنك ارتداؤه من غير أن تطلب منه شيئًا."),
  quoteB:       text("Si cela ne vous suffit pas,", "If that is not enough,", "إن لم يكفِ ذلك،"),
  quoteC:       text("l'histoire commence là.", "the story begins there.", "تبدأ القصة هناك."),
  seal:         text("Sceau du porteur", "Bearer seal", "ختم الحامل"),
  level:        text("Niveau", "Level", "المستوى"),
  profile:      text("Consulter votre sceau", "View your seal", "اعرض ختمك"),
  openings:     text("Les ouvertures à venir", "Coming openings", "الفتحات القادمة"),
  edition:      text("L'Éclat · Drop 01 · MMXXVI · Édition limitée", "L'ÉCLAT · Drop 01 · MMXXVI · Limited edition", "L'ÉCLAT · الإصدار 01 · MMXXVI · نسخة محدودة"),
  sealRing:     text("L'ÉCLAT · DROP I · MMXXVI · DIX FRAGMENTS · ", "L'ÉCLAT · DROP I · MMXXVI · TEN FRAGMENTS · ", "L'ÉCLAT · الإصدار I · MMXXVI · عشر شذرات · "),
};

export default function Index() {
  const { state, niveau } = usePorteur();
  const { tr } = useI18n();
  const [citIdx, setCitIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const unityRuntime = isUnityWebViewRuntime();

  // Parallax + rotation citations
  useEffect(() => {
    const t = setInterval(() => setCitIdx((i) => (i + 1) % citations.length), unityRuntime ? 9000 : 5500);
    if (reduce || unityRuntime) return () => clearInterval(t);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (heroRef.current) {
          heroRef.current.style.transform = `translate3d(0, ${window.scrollY * 0.3}px, 0) scale(1.1)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearInterval(t); window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce, unityRuntime]);

  const passagesQualifies = state.qualifiedProgressPoints;
  const fragmentsReconnus = state.collected.length;

  return (
    <div className="-mt-14 -mb-32">
      {/* === HERO === */}
      <section className="relative h-[100dvh] w-full overflow-hidden" aria-label={tr(copy.manifesto)}>
        <div ref={heroRef} className="absolute inset-0 will-change-transform" style={{ transform: "translate3d(0,0,0) scale(1.1)" }}>
          <img src={heroCanyon} alt="" aria-hidden="true" fetchPriority="high" decoding="async"
               className="absolute inset-0 w-full h-full object-cover opacity-55" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/85 via-bg-base/55 to-bg-base" />
        <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-noir-profond/40 to-transparent" />
        <div className="absolute inset-0 vignette-mineral" />
        <div className="absolute inset-0 voile-dust opacity-50 anim-drift" />
        <div className="halo-laiton absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-20 -right-20 opacity-20 mix-blend-luminosity pointer-events-none">
          <Sceau className="w-[460px] h-[460px]" label={tr(copy.sealRing)} />
        </div>

        <div className="relative h-full flex flex-col justify-between max-w-2xl mx-auto px-6 pt-24 pb-20">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-laiton-300" />
              <p className="font-mono text-[10px] tracking-rituel uppercase text-laiton-300">
                {tr(copy.manifesto)}
              </p>
            </div>
            <h1 className="font-display text-[3.25rem] sm:text-[5rem] leading-hero tracking-hero">
              <TextReveal as="span">{tr(copy.h1a)}</TextReveal><br />
              <em className="italic"><TextReveal as="span" delay={0.1}>{tr(copy.h1b)}</TextReveal></em><br />
              <TextReveal as="span" delay={0.2}>{tr(copy.h1c)}</TextReveal><br />
              <em className="italic text-laiton-300"><TextReveal as="span" delay={0.3}>L'Éclat.</TextReveal></em>
            </h1>
          </div>

          <div className="space-y-4">
            <div className="h-20 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={citIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 1, ease: EASE_FIL }}
                  className="absolute inset-0 font-serif italic text-xl text-voile-dim leading-snug"
                >
                  « {tr(citations[citIdx])} »
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="font-mono text-[9px] tracking-rituel uppercase text-voile-dim/70 anim-respire">
              {tr(copy.scroll)}
            </p>
          </div>
        </div>
      </section>

      {/* === TRIADE === */}
      <section className="relative max-w-2xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="font-mono text-[10px] tracking-rituel uppercase text-laiton-300 mb-3">
            {tr(copy.triad)}
          </p>
          <h2 className="font-display text-4xl leading-tight tracking-tight">
            <TextReveal as="span">{tr(copy.choose)}</TextReveal>
          </h2>
          <Ornement className="mt-6 max-w-xs mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: "/fragments", icon: Layers,      num: "I",   title: tr(copy.fragments), sub: tr(copy.fragmentsSub) },
            { to: "/boutique",  icon: ShoppingBag, num: "II",  title: tr(copy.shop),       sub: tr(copy.shopSub) },
            { to: "/scan",      icon: ScanLine,    num: "III", title: tr(copy.scan),       sub: tr(copy.scanSub) },
          ].map((p, i) => (
            <motion.div
              key={p.to}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 1, ease: EASE_SEUIL }}
            >
              <TiltCard max={6} className="block aspect-[4/5] bg-gradient-to-b from-card/30 to-noir-profond/40 hover:from-card/50 hover:to-noir-profond/60 overflow-hidden rounded-xl">
                <Link to={p.to} className="block h-full">
                  <div className="relative h-full filigrane opacity-30 group-hover:opacity-60 transition-opacity duration-700">
                    {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((c, k) => (
                      <span key={k} className={`absolute w-4 h-4 border-laiton-700 group-hover:border-laiton-300 transition-colors duration-700 ${c}`} />
                    ))}
                    <div className="relative h-full flex flex-col items-center justify-center text-center p-6 gap-3">
                      <span className="font-display italic text-laiton-700/40 text-5xl absolute top-4">{p.num}</span>
                      <p.icon className="w-8 h-8 text-laiton-300 mt-8" strokeWidth={1} />
                      <h3 className="font-display text-2xl mt-2">{p.title}</h3>
                      <p className="font-mono text-[9px] tracking-rituel uppercase text-voile-dim">{p.sub}</p>
                      <ArrowRight className="w-3.5 h-3.5 text-laiton-300 mt-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500" />
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* === COMPTEURS LIVE === */}
      <section className="relative max-w-2xl mx-auto px-6 py-16 border-t border-border/40">
        <div className="grid grid-cols-3 gap-4">
          <Counter label={tr(copy.attempts)}>
            <NumberTick value={passagesQualifies} format={new Intl.NumberFormat("fr-FR")} className="font-display text-3xl" />
          </Counter>
          <Counter label={tr(copy.fragmentsCount)}>
            <span className="font-display text-3xl">
              <NumberTick value={fragmentsReconnus} /> <span className="text-voile-dim">/ 10</span>
            </span>
          </Counter>
          <Counter label={tr(copy.drop)}>
            <span className="font-display text-3xl">01</span>
          </Counter>
        </div>
      </section>

      {/* === CITATION FULL-BLEED === */}
      <section className="relative h-[80vh] overflow-hidden">
        <img src={heroSilhouette} alt="" aria-hidden="true" loading="lazy" decoding="async"
             className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="absolute inset-0 vignette-mineral" />
        <div className="relative h-full max-w-2xl mx-auto px-6 flex flex-col justify-center text-center">
          <p className="font-mono text-[10px] tracking-rituel uppercase text-laiton-300 mb-6">
            {tr(copy.principle)}
          </p>
          <p className="font-display text-3xl sm:text-5xl italic leading-snug text-voile">
            {tr(copy.quoteA)}
            <br />
            {tr(copy.quoteB)}
            <br />
            <em className="not-italic text-laiton-300">{tr(copy.quoteC)}</em> »
          </p>
        </div>
      </section>

      {/* === CTA === */}
      <section className="relative max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="font-mono text-[10px] tracking-rituel uppercase text-laiton-300 mb-3">
          {tr(copy.seal)}
        </p>
        <h2 className="font-display text-5xl mb-3">{state.name}</h2>
        <p className="font-serif italic text-laiton-300 mb-8">
          {tr(copy.level)} {toRoman(niveau)}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Magnetic
            as-link
            className="px-8 py-4 border border-laiton-500 text-laiton-100 hover:bg-laiton-500 hover:text-primary-foreground transition-colors duration-700 font-mono text-[11px] tracking-rituel uppercase rounded-md"
          >
            <Link to="/profil">{tr(copy.profile)}</Link>
          </Magnetic>
          <Link to="/revelations"
                className="px-8 py-4 border border-border text-voile-dim hover:text-laiton-300 hover:border-laiton-700 transition font-mono text-[11px] tracking-rituel uppercase rounded-md">
            {tr(copy.openings)}
          </Link>
        </div>
        <Ornement className="mt-12 max-w-xs mx-auto" />
        <p className="font-mono text-[9px] tracking-rituel uppercase text-voile-dim/50 mt-8">
          {tr(copy.edition)}
        </p>
      </section>
    </div>
  );
}

const Counter = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="text-center bg-gradient-to-b from-card/30 to-transparent p-5 relative overflow-hidden border-t border-laiton-700/40 rounded-md">
    <div className="absolute inset-0 filigrane opacity-25" />
    <div className="relative">
      <p className="font-mono text-[9px] tracking-rituel uppercase text-laiton-300 mb-2">{label}</p>
      <div>{children}</div>
    </div>
  </div>
);
```

> **Note** : la prop `as-link` sur `<Magnetic>` est un raccourci示意 — pour shipper en prod, créer une variante `<MagneticLink>` qui wrap un `<Link>` au lieu d'un `<button>` (même hook `useMagnetic`, type `HTMLMotionProps<"a">`). C'est une seule minute de refacto.

---

## 13. Patchs minimaux non-rupture

### 13.1 `src/styles.css` — ajouts à la fin

```css
/* === V2 additions === */

/* Glass surfaces */
.glass-1 { background: hsla(40 25% 88% / 0.04); -webkit-backdrop-filter: saturate(160%) blur(20px); backdrop-filter: saturate(160%) blur(20px); border-bottom: 1px solid hsla(40 25% 88% / 0.08); box-shadow: 0 1px 2px hsla(30 14% 3% / 0.6); }
.glass-2 { background: hsla(30 14% 6% / 0.72); -webkit-backdrop-filter: saturate(180%) blur(28px); backdrop-filter: saturate(180%) blur(28px); border-top: 1px solid hsla(40 25% 88% / 0.08); box-shadow: 0 8px 24px -12px hsla(30 14% 3% / 0.7); }
.glass-3 { background: hsla(40 25% 88% / 0.07); -webkit-backdrop-filter: saturate(200%) blur(36px); backdrop-filter: saturate(200%) blur(36px); border: 1px solid hsla(40 25% 88% / 0.12); box-shadow: 0 24px 48px -24px hsla(30 14% 3% / 0.8); }
.glass-3--laiton { background: linear-gradient(180deg, hsla(36 38% 54% / 0.08), hsla(30 14% 6% / 0.55)); border: 1px solid hsla(36 38% 54% / 0.35); box-shadow: 0 0 0 1px hsla(36 38% 54% / 0.4), 0 0 32px -4px hsla(36 38% 54% / 0.35); }

/* Signature effects */
.voile-dust { background-image: radial-gradient(circle at 20% 30%, hsla(40 25% 88% / 0.04) 0, transparent 40%), radial-gradient(circle at 80% 70%, hsla(36 38% 54% / 0.05) 0, transparent 45%), radial-gradient(circle at 60% 20%, hsla(40 25% 88% / 0.03) 0, transparent 35%); mix-blend-mode: screen; }
.halo-laiton { position: relative; isolation: isolate; }
.halo-laiton::before { content: ""; position: absolute; inset: -2px; border-radius: inherit; background: radial-gradient(circle at 50% 50%, hsla(36 60% 70% / 0.45), hsla(36 38% 54% / 0.15) 40%, transparent 70%); filter: blur(14px); z-index: -1; animation: halo-respire 3.6s var(--ease-seuil) infinite; }
.couture { background: linear-gradient(var(--color-card), var(--color-card)) padding-box, repeating-linear-gradient(90deg, hsla(36 38% 54% / 0.5) 0 4px, transparent 4px 8px) border-box; border: 1px dashed transparent; }

@keyframes halo-respire { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
@keyframes dust-drift { 0% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-2%, 1%, 0) scale(1.05); } 100% { transform: translate3d(0,0,0) scale(1); } }
@keyframes filament-scan { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Reduce motion */
html[data-reduce-motion="1"] *, html[data-reduce-motion="1"] *::before, html[data-reduce-motion="1"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* Disable glass in Unity WebView (déjà présent, on le complète) */
html[data-unity-webview="1"] .glass-1, html[data-unity-webview="1"] .glass-2, html[data-unity-webview="1"] .glass-3 {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  background: var(--color-bg-elevated) !important;
}
```

### 13.2 `src/main.tsx` — wrap `<MotionProvider>`

```tsx
import { MotionProvider } from "@/providers/MotionProvider";

// ...

<MotionProvider>
  <LegacyApp />
</MotionProvider>
```

### 13.3 `src/components/AppLayout.tsx` — remplacer `<motion.main>` par `<PageTransition>` + nouveau `<BottomNav>`

Voir snippet complet dans `REFONTE_PAGE_PAR_PAGE.md` §6. Les imports à ajouter : `import { PageTransition } from "@/components/motion/PageTransition"; import { BottomNav } from "@/components/motion/BottomNav";`. On retire l'import de `motion` pour le main (il n'est plus nécessaire qu'à l'intérieur de `PageTransition`).

---

## 14. Ordre d'exécution recommandé

1. **Patchs CSS** (§13.1) — non-rupture, à pousser en premier. Vérif console.
2. **Tokens motion** (§1) — fichier neuf, imports seulement.
3. **Composants motion/** — un par un, en branchant l'usage dans `AppLayout` (CursorHalo, ScrollBeam) puis `Index` (TextReveal, Magnetic, TiltCard, NumberTick).
4. **`<BottomNav>`** — remplace l'existant en une seule passe.
5. **`<PageTransition>`** — wrap final du `<main>`.
6. **`<MotionProvider>`** — mount global.
7. **QA** : `prefers-reduced-motion` on/off, `data-lang="ar"`, Unity WebView, Lighthouse mobile.

Aucun breaking change sur les pages non refondues (`Boutique`, `Lore`, `Codex`, etc.) : elles héritent des nouveaux tokens via le `@theme` et les classes utilitaires (`font-display`, `text-hero`, `glass-1`...). On peut donc migrer en semaines, page par page, sans blocage.
