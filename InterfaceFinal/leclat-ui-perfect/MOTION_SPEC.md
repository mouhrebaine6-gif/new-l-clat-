# L'ÉCLAT — MOTION SPEC (les 12 animations signature)

Chaque animation : **nom · déclencheur · durée · courbe · propriétés · code prêt à coller · usage**. Toutes respectent `prefers-reduced-motion` (les hooks Framer Motion le font nativement via `useReducedMotion()`).

Notation : `D` = `--d-xxx` du design system ; `E` = `--ease-xxx`.

---

## 1. `text-reveal-cinetique` — titre mot par mot

**Déclencheur :** entrée de page, h1/h2 display. **Durée :** 780ms total. **Courbe :** `EASE_CINETIQUE`. **Propriétés :** `opacity 0→1`, `y 24px→0`, `filter blur(8px)→blur(0)`, `letter-spacing 0.04em→0`.

```tsx
// src/components/TextReveal.tsx
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const wordVariants = (reduce: boolean) => ({
  hidden: { opacity: 0, y: 24, filter: reduce ? "blur(0px)" : "blur(8px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.78,
      delay: i * 0.06,
      ease: [0.22, 0.61, 0.36, 1] as const,
    },
  }),
});

export function TextReveal({
  children,
  as: Tag = "h2",
  className,
}: {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const words = children.split(" ");
  const MotionTag = motion[Tag as "h2"];
  return (
    <MotionTag className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={wordVariants(reduce)}
          initial="hidden"
          animate="show"
          className="inline-block"
          style={{ marginRight: "0.28em" }}
        >
          {w}
        </motion.span>
      ))}
    </MotionTag>
  );
}
```

**Usage :** titres de page Index, FragmentDetail, Profil. Variante `text-reveal-line` (un seul mot par ligne, pas de marge) pour les punchs display.

---

## 2. `magnetic-button` — bouton aimanté

**Déclencheur :** hover desktop / touch mobile. **Durée :** continue (spring). **Courbe :** `SPRING_TACTILE`. **Propriétés :** `x, y` selon la position du pointeur dans un rayon de 30px.

```tsx
// src/hooks/useMagnetic.ts
import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type MouseEvent } from "react";

export function useMagnetic(strength = 0.35, radius = 80) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 280, damping: 22, mass: 0.6 });

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      x.set(0); y.set(0);
      return;
    }
    x.set(dx * strength);
    y.set(dy * strength);
  };

  const onLeave = () => { x.set(0); y.set(0); };
  return { ref, sx, sy, onMove, onLeave };
}
```

```tsx
// Usage
const mag = useMagnetic(0.3, 70);
<motion.button
  ref={mag.ref}
  onMouseMove={mag.onMove}
  onMouseLeave={mag.onLeave}
  style={{ x: mag.sx, y: mag.sy }}
  className="..."
>...</motion.button>
```

**Usage :** CTA primaire (`/scan`, ajouter au panier), bouton de palier.

---

## 3. `scroll-progress-beam` — barre verticale

**Déclencheur :** scroll. **Durée :** continue (rAF). **Propriétés :** `scaleY 0→1` sur une barre fixe à gauche, couleur laiton avec glow.

```tsx
// src/components/ScrollProgress.tsx
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className="fixed top-0 start-0 z-40 w-px h-screen origin-top will-change-transform"
      style={{
        scaleY,
        background:
          "linear-gradient(to bottom, hsl(36 55% 70% / 0.6), hsl(36 38% 54% / 0.2) 60%, transparent)",
        boxShadow: "0 0 12px hsl(36 55% 70% / 0.5)",
      }}
    />
  );
}
```

**Usage :** sur les pages de lecture longue : FragmentDetail, Lore, Histoire. RTL : `start-0` flip automatiquement en `right-0`.

---

## 4. `page-transition-voile` — voile de tissu

**Déclencheur :** changement de route. **Durée :** 720ms. **Courbe :** `EASE_RITUEL`. **Propriétés :** `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)`, puis sortie en `inset(0 0 0 100%)`. Le contenu fait `y: 16→0, opacity: 0→1` une fois le voile retiré.

```tsx
// src/components/PageTransition.tsx
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} className="relative">
        {/* voile de tissu qui balaye */}
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, hsl(28 12% 8%) 0%, hsl(30 10% 12%) 60%, hsl(36 22% 38% / 0.4) 100%)",
            transformOrigin: "right center",
          }}
          initial={reduce ? { opacity: 0 } : { scaleX: 0, transformOrigin: "left center" }}
          animate={
            reduce
              ? { opacity: 0 }
              : { scaleX: [0, 1, 1, 0], transformOrigin: ["left", "left", "right", "right"] }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.72, times: [0, 0.45, 0.55, 1], ease: [0.65, 0.05, 0.36, 1] }
          }
        />
        {/* contenu de la page */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : 0.35, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Usage :** wrap dans `AppLayout` autour de `{children}` du main, à la place de l'actuel `motion.main`.

---

## 5. `scan-trace` — filament qui trace le contour

**Déclencheur :** confirmation de scan (résolution `resolved`). **Durée :** 900ms. **Propriétés :** `stroke-dashoffset` du périmètre d'un cadre SVG qui enserre la zone scannée.

```tsx
// src/components/ScanTrace.tsx
import { motion, useReducedMotion } from "framer-motion";

export function ScanTrace({ active, label }: { active: boolean; label: string }) {
  const reduce = useReducedMotion();
  const pathLength = 1000;

  return (
    <div className="relative aspect-square w-full max-w-sm mx-auto">
      {/* cadre SVG */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <motion.rect
          x="2" y="2" width="96" height="96"
          fill="none"
          stroke="hsl(36 55% 70%)"
          strokeWidth="0.5"
          strokeDasharray={pathLength}
          initial={{ strokeDashoffset: pathLength, opacity: 0 }}
          animate={
            active
              ? { strokeDashoffset: 0, opacity: [0, 1, 1] }
              : { strokeDashoffset: pathLength, opacity: 0 }
          }
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 6px hsl(36 55% 70% / 0.7))" }}
        />
        {/* les 4 coins rituels (le cadre n'est pas fermé, juste les angles) */}
        {["top-left", "top-right", "bottom-right", "bottom-left"].map((corner, i) => (
          <motion.path
            key={corner}
            d={cornerPath(corner)}
            stroke="hsl(36 80% 50%)"
            strokeWidth="1.2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 0.61, 0.36, 1] }}
          />
        ))}
      </svg>
      <p className="absolute inset-x-0 bottom-4 text-center font-mono text-[9px] tracking-[0.22em] uppercase text-[hsl(40_25%_88%/0.7)]">
        {label}
      </p>
    </div>
  );
}

function cornerPath(c: string) {
  const a = 6;
  switch (c) {
    case "top-left": return `M 0 ${a} L 0 0 L ${a} 0`;
    case "top-right": return `M ${100 - a} 0 L 100 0 L 100 ${a}`;
    case "bottom-right": return `M 100 ${100 - a} L 100 100 L ${100 - a} 100`;
    case "bottom-left": return `M ${a} 100 L 0 100 L 0 ${100 - a}`;
  }
}
```

**Usage :** page Scan, phase `resolved`. Remplace le visuel de checkmark.

---

## 6. `fragment-unlock` — cérémonie de palier

**Déclencheur :** passage d'un palier (1, 20, 40 scans). **Durée :** 2.4s. **Propriétés :** overlay plein écran avec grain, lumen blanc-ivoire centré, scale 0.6→1, opacité en cloche. Haptique : `navigator.vibrate([20, 60, 20, 60, 200])` en mobile.

```tsx
// src/components/FragmentUnlockCeremony.tsx
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { haptic } from "@/lib/haptics";

export function FragmentUnlockCeremony({
  open,
  title,
  subtitle,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (open && !reduce) haptic("success");
  }, [open, reduce]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-noir-profond/90 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* grain */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-overlay opacity-30"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.7'/></svg>\")",
            }}
          />
          {/* lumen central */}
          <motion.div
            className="relative w-72 h-72 rounded-full"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={
              reduce
                ? { scale: 1, opacity: 0.4 }
                : { scale: [0.4, 1.1, 1], opacity: [0, 1, 0.5] }
            }
            transition={{ duration: 2.2, times: [0, 0.5, 1], ease: [0.22, 0.61, 0.36, 1] }}
            style={{
              background:
                "radial-gradient(circle, hsl(40 35% 96% / 0.7) 0%, hsl(36 55% 70% / 0.3) 40%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <motion.div
            className="absolute text-center px-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-laiton mb-3">
              Le palier est franchi
            </p>
            <h2 className="font-display text-4xl text-ivoire mb-2">{title}</h2>
            <p className="font-display italic text-voile-dim">{subtitle}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Usage :** déclenché par `useAccountProgression` quand `state.palier` change.

---

## 7. `cursor-halo` — halo qui suit le pointeur

**Déclencheur :** mouvement souris (desktop uniquement, jamais touch). **Durée :** continue, easing spring 220ms. **Propriétés :** `x, y` du pointeur + `scale` selon vitesse.

```tsx
// src/components/CursorHalo.tsx
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function CursorHalo() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 220, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 28, mass: 0.4 });

  useEffect(() => {
    // désactivé sur touch et Unity
    if (reduce) return;
    if (matchMedia("(pointer: coarse)").matches) return;
    if (document.documentElement.dataset.unityWebview === "1") return;
    setEnabled(true);
    const onMove = (e: PointerEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[55] w-40 h-40 -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
        style={{ x: sx, y: sy }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(36 55% 70% / 0.18) 0%, transparent 60%)",
            filter: "blur(6px)",
          }}
        />
      </motion.div>
      {/* point de laiton */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[56] w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-laiton"
        style={{ x: sx, y: sy, boxShadow: "0 0 12px hsl(36 55% 70% / 0.7)" }}
      />
    </>
  );
}
```

**Usage :** global, monté dans `AppLayout`. Remplace ou double `CursorVoile` existant.

---

## 8. `number-tick` — compteur chiffre par chiffre

**Déclencheur :** entrée dans le viewport ou après un délai. **Durée :** 1.4s. **Propriétés :** chaque chiffre slide de `y: 40` à `y: 0` avec stagger 80ms ; l'opacity suit.

```tsx
// src/components/NumberTick.tsx
import { motion, useReducedMotion, useInView } from "framer-motion";
import { useRef } from "react";

export function NumberTick({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const chars = value.split("");

  return (
    <span ref={ref} className={`inline-flex overflow-hidden ${className ?? ""}`}>
      {chars.map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          initial={reduce ? false : { y: "100%", opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
          transition={{
            duration: 0.5,
            delay: i * 0.06,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="inline-block tabular-nums"
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}
```

**Usage :** Index compteurs (`passagesQualifies`, `fragmentsReconnus`), ProfilHeader, FragmentDetail (compteur de scans).

---

## 9. `skeleton-shimmer` — chargement style Linear

**Déclencheur :** état de chargement. **Durée :** 1.6s en boucle. **Propriétés :** `background-position` sur un gradient linéaire (CSS pur, jamais Framer).

```css
/* dans styles.css */
.skeleton {
  position: relative;
  overflow: hidden;
  background: hsl(28 12% 8%);
  border-radius: 2px;
}
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(36 22% 38% / 0.12) 40%,
    hsl(36 22% 38% / 0.22) 50%,
    hsl(36 22% 38% / 0.12) 60%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

**Usage :** remplacer les spinners de chargement de scan, de fragments, d'avatar.

---

## 10. `sticky-note-unfold` — papier qui se déplie

**Déclencheur :** révélation d'un fragment (overlay de Lore). **Durée :** 1.2s. **Propriétés :** `transform: perspective(800px) rotateX(-90deg) → rotateX(0)` ; `transform-origin: top` ; opacité en cloche.

```tsx
// src/components/StickyNoteUnfold.tsx
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function StickyNoteUnfold({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-noir-profond/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={
              reduce
                ? { opacity: 0, y: 20 }
                : { opacity: 0, rotateX: -90, y: 60 }
            }
            animate={
              reduce
                ? { opacity: 1, y: 0 }
                : { opacity: 1, rotateX: 0, y: 0 }
            }
            exit={
              reduce
                ? { opacity: 0, y: 20 }
                : { opacity: 0, rotateX: 10, y: 40 }
            }
            transition={{ duration: 1.0, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative w-full max-w-md bg-[hsl(40_30%_92%)] text-noir-profond rounded-sm shadow-2xl"
            style={{
              transformPerspective: 1200,
              transformOrigin: "top center",
              boxShadow:
                "0 30px 60px -20px hsl(30 18% 2% / 0.7), inset 0 0 0 1px hsl(36 22% 38% / 0.3)",
            }}
          >
            {/* texture papier */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-30 mix-blend-multiply pointer-events-none rounded-sm"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.7' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>\")",
              }}
            />
            <div className="relative p-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Usage :** révélation d'une citation, d'un lore, d'un souvenir. Style "papier jauni" — laiton, ivoire, ivoire grisé.

---

## 11. `card-tilt-3d` — perspective au survol

**Déclencheur :** hover desktop, orientation device mobile. **Durée :** continue. **Propriétés :** `rotateX, rotateY` (-8° à +8°) selon position curseur. CSS pur (perf).

```css
.card-tilt {
  transform-style: preserve-3d;
  transform: perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: transform;
}
```

```tsx
// usage
const onMove = (e: MouseEvent<HTMLDivElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.setProperty("--ry", `${px * 8}deg`);
  e.currentTarget.style.setProperty("--rx", `${-py * 8}deg`);
};
const onLeave = (e: MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.setProperty("--ry", "0deg");
  e.currentTarget.style.setProperty("--rx", "0deg");
};
```

**Usage :** les 3 portails de l'Index, les cartes de la grille Fragments.

---

## 12. `bottom-nav-morph` — indicateur qui se transforme

**Déclencheur :** changement d'onglet. **Durée :** spring. **Propriétés :** `layoutId` partagé sur Framer Motion entre les 5 indicateurs (un par onglet). Le composant actif porte le `layoutId="nav-indicator"`, l'indicateur glisse.

Déjà présent dans `AppLayout.tsx` ligne 209-214 — l'améliorer :

```tsx
// Remplacer le motion.span actuel par :
{isActive && (
  <motion.span
    layoutId="nav-indicator"
    className="absolute top-0 h-px w-8 bg-laiton"
    transition={{ type: "spring", stiffness: 380, damping: 30 }}
  />
)}
// et ajouter un deuxième layoutId pour l'icône, qui grossit :
{isActive && (
  <motion.span
    layoutId="nav-pill"
    className="absolute inset-x-1 inset-y-1 rounded-full bg-laiton/8"
    transition={{ type: "spring", stiffness: 380, damping: 30 }}
  />
)}
```

**Usage :** `AppLayout`, onglets Fragments / Boutique / Scan / Histoire / Profil.

---

## Annexe — séquence d'apparition de page (à composer)

```ts
// sequence d'entrée standard pour les pages
export const PAGE_ENTER = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.56, ease: EASE_CINETIQUE, staggerChildren: 0.08, delayChildren: 0.15 },
  },
};
```
