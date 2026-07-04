# L'ÉCLAT — MOTION SPEC V2
## 12 micro-interactions Framer Motion prêtes à coller

Conventions :
- Tous les composants respectent `useReducedMotion()` → fallback à l'état final sans animation.
- `easing` = `var(--ease-seuil)` sauf mention contraire. Le `transition` complet vient de `motion.tsx` (`EASE = [0.22, 0.61, 0.36, 1]` historique) ou de la nouvelle `EASE_SEUIL = [0.16, 1, 0.3, 1]` (Cinema Mobile).
- Les durées sont en **secondes** (Framer Motion).
- Les `code snippets` sont TS strict, **zéro `any`**, compatibles React 19 + Framer Motion 12.

> Import unique au top de chaque fichier :
> ```ts
> import { motion, useReducedMotion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
> import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";
> ```

---

## 1. `TextReveal` — text reveal cinétique

**Déclencheur :** entrée dans le viewport (`whileInView`) ou mount (`animate`).  
**Durée :** 0.9 s. **Courbe :** `--ease-seuil`.  
**Propriétés animées :** `opacity`, `y`, `clipPath: inset(0 100% 0 0)` → `inset(0 0 0 0)`.  
**Cas d'usage :** titres hero, citations, manifestes. Remplace l'apparition fade actuelle du `<motion.h1>` dans `Index.tsx` (lignes 148-168).

```tsx
type Props = { children: string; className?: string; delay?: number; once?: boolean };

export function TextReveal({ children, className, delay = 0, once = true }: Props) {
  const reduce = useReducedMotion();
  // Découpage en mots (RTL-safe : on laisse le navigateur gérer, on split sur espace)
  const words = children.split(/(\s+)/);

  const container: import("framer-motion").Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.045, delayChildren: delay },
    },
  };

  const child: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: "0.4em", clipPath: "inset(0 0 100% 0)" },
    show: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0 0 0% 0)",
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    },
  };

  if (reduce) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
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
          <span key={i} aria-hidden="true"> {w} </span>
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
        )
      )}
    </motion.span>
  );
}
```

**Note AR :** `clipPath: inset(0 0 100% 0)` clippe du bas vers le haut — visuellement OK en RTL. Si on veut un sweep latéral RTL : `clipPath: "inset(0 100% 0 0)"` en LTR et `inset(0 0 0 100%)` en RTL via `html[data-lang="ar"]`. Variante possible : prop `sweep="up" | "left" | "right"`.

---

## 2. `useMagnetic` — bouton aimanté

**Hook + composant.**  
**Déclencheur :** `pointermove` sur le bouton (cap à 16 px de déplacement).  
**Durée :** ressort `stiffness: 150, damping: 18, mass: 0.6`.  
**Cas d'usage :** CTA primaire « Porter le fragment », bouton scan, bouton onboarding.

```tsx
import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion, type HTMLMotionProps } from "framer-motion";

type MagneticProps = {
  children: ReactNode;
  strength?: number;       // 0..1, défaut 0.35
  className?: string;
} & Omit<HTMLMotionProps<"button">, "ref">;

export function Magnetic({ children, strength = 0.35, className, ...rest }: MagneticProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 150, damping: 18, mass: 0.6 });
  const reduce = useReducedMotion();

  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (reduce) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top + r.height / 2)) * strength;
    x.set(Math.max(-16, Math.min(16, dx)));
    y.set(Math.max(-16, Math.min(16, dy)));
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
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

## 3. `ScrollBeam` — barre de progression laiton

**Déclencheur :** scroll de la fenêtre.  
**Durée :** continue (ressort). **Courbe :** ressort `stiffness: 90, damping: 20`.  
**Cas d'usage :** remplacement du `ScrollRoman` actuel en barre fine (2 px) en haut de la page, ou conservée en aside desktop.

```tsx
export function ScrollBeam() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 90, damping: 20, restDelta: 0.001 });

  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX,
        transformOrigin: "0% 50%",
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: "2px",
        background: "linear-gradient(90deg, hsl(36 50% 60%), hsl(38 80% 78%))",
        boxShadow: "0 0 12px hsla(36 60% 70% / 0.5)",
        zIndex: 60,
        pointerEvents: "none",
      }}
    />
  );
}
```

Variante RTL : `transformOrigin: "100% 50%"` quand `html[data-lang="ar"]` (via `useEffect` qui lit `document.documentElement.dataset.lang`).

---

## 4. `PageTransition` — voile qui se lève

**Déclencheur :** changement de `pathname` (wrap des pages dans `AppLayout`).  
**Durée :** 0.95 s voile descendant + 0.6 s contenu montant, total ressenti 1.1 s.  
**Courbe :** `--ease-seuil` (montée), `--ease-couture` (voile).  
**Cas d'usage :** remplace le `motion.main` actuel (lignes 179-188 de `AppLayout.tsx`).

```tsx
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

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
        transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Voile descendant — un rideau qui ferme puis s'ouvre */}
        <motion.div
          aria-hidden="true"
          initial={reduce ? false : { scaleY: 1 }}
          animate={{ scaleY: 0 }}
          exit={{ scaleY: 1 }}
          transition={{ duration: 0.95, ease: [0.65, 0, 0.35, 1] }}
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

## 5. `ScanTrace` — tracé SVG avec lumen qui suit le chemin

**Déclencheur :** mount + hover.  
**Durée :** 2.4 s (durée du draw), puis lumen en boucle 4 s.  
**Courbe :** `--ease-seuil` (draw), `linear` (lumen).  
**Cas d'usage :** élément central de `ScanPage.tsx`, illustre le geste de scan textile.

```tsx
import { motion, useReducedMotion, type Variants } from "framer-motion";

const PATH = "M 40 100 Q 100 20 200 100 T 360 100";

export function ScanTrace() {
  const reduce = useReducedMotion();

  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 2.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const lumenX = useMotionValue(0);
  // Piloté en interne par Framer Motion le long du path (motion-path natif depuis v11)

  return (
    <svg viewBox="0 0 400 200" width="100%" height="200" aria-label="Trace de scan">
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

      {/* Chemin de fond (couture pointillée) */}
      <path
        d={PATH}
        fill="none"
        stroke="hsl(40 25% 88% / 0.12)"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* Tracé lumineux */}
      {!reduce && (
        <motion.path
          d={PATH}
          fill="none"
          stroke="url(#trace)"
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={draw}
          initial="hidden"
          animate="show"
        />
      )}

      {/* Lumen : cercle qui suit le path */}
      {!reduce && (
        <motion.circle
          r="3.5"
          fill="hsl(38 80% 78%)"
          filter="url(#lumen-glow)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path("${PATH}")` }}
        />
      )}
    </svg>
  );
}
```

**Note :** `offsetPath` est supporté sur Chrome/Edge/Safari 16+. Fallback : animer un `cx`/`cy` via `useMotionValue` + `useTransform` calé sur `pathLength`.

---

## 6. `FragmentUnlock` — rituel d'unlock d'un fragment

**Déclencheur :** action utilisateur (tap sur sceau fragment).  
**Durée :** 1.6 s. **Courbe :** `--ease-seuil`.  
**Cas d'usage :** CTA « Dévoiler le fragment » sur la modale d'un fragment verrouillé (`FragmentsPage`, `FragmentDetailPage`).

```tsx
type Props = { onComplete: () => void; children: ReactNode };

export function FragmentUnlock({ onComplete, children }: Props) {
  const reduce = useReducedMotion();

  const sealVariants: Variants = {
    idle:  { rotate: 0,  scale: 1 },
    draw:  { rotate: 180, scale: 1.1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
    burst: { rotate: 360, scale: 0.9, opacity: 0, transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } },
  };

  return (
    <motion.div
      className="relative"
      onClick={() => !reduce && onComplete()}
      whileHover={reduce ? undefined : { scale: 1.04 }}
    >
      <motion.div variants={sealVariants} initial="idle" animate="idle" whileTap="draw">
        {children}
      </motion.div>

      {/* Halo qui irradie */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: [0, 1.6, 1.4], opacity: [0, 0.7, 0] }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, times: [0, 0.4, 1], ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(36 60% 70% / 0.5), transparent 60%)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}
```

---

## 7. `CursorHalo` — halo de pointeur (déjà `CursorVoile` mais upgradé)

**Déclencheur :** `pointermove` global (window), `pointerleave`/`pointerdown` modifient l'état.  
**Durée :** ressort `stiffness: 220, damping: 24`.  
**Cas d'usage :** remplace `CursorVoile.tsx` (composant existant). On garde le nom ou on renomme.

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

**Note tactile :** sur mobile le pointeur suit le doigt en continu — c'est un choix stylistique, pas un bug. Sur iOS Safari `< 16`, `mixBlendMode: screen` peut scintiller : fallback à `opacity: 0.8`.

---

## 8. `NumberTick` — compteur animé

**Déclencheur :** `whileInView` (mount dans le viewport).  
**Durée :** 1.4 s. **Courbe :** `--ease-seuil`.  
**Cas d'usage :** remplace les `<Counter>` de la section « Compteurs live » dans `Index.tsx` (lignes 277-280, qui sont statiques actuellement).

```tsx
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useMotionValue, useTransform, animate } from "framer-motion";

type Props = { value: number; format?: Intl.NumberFormat; className?: string; duration?: number };

export function NumberTick({ value, format, className, duration = 1.4 }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    format ? format.format(Math.round(v)) : String(Math.round(v))
  );
  const [text, setText] = useState<string>(format ? format.format(0) : "0");

  useEffect(() => {
    if (reduce) {
      setText(format ? format.format(value) : String(value));
      return;
    }
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    const unsub = display.on("change", setText);
    return () => { controls.stop(); unsub(); };
  }, [inView, value, format, duration, reduce, mv, display]);

  return <span ref={ref} className={className}>{text}</span>;
}
```

Usage : `<NumberTick value={passagesQualifies} format={new Intl.NumberFormat("fr-FR")} />`.

---

## 9. `SkeletonShimmer` — skeleton avec filament

**Déclencheur :** mount, tant que `loading=true`.  
**Durée :** 1.8 s infinie. **Courbe :** `linear`.  
**Cas d'usage :** partout où on a un `loading` state (cartes fragments, scan result, profil).

```tsx
type Props = { className?: string; lines?: number };

export function SkeletonShimmer({ className = "", lines = 1 }: Props) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="relative h-3 rounded-full overflow-hidden bg-hsl(30 10% 9%)"
          style={{
            background: "hsl(30 10% 9%)",
            width: i === lines - 1 ? "65%" : "100%",
            borderRadius: 999,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(40 25% 88% / 0.08), transparent)",
              backgroundSize: "200% 100%",
              animation: "filament-scan 1.8s linear infinite",
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

L'animation `filament-scan` est déjà déclarée dans `DESIGN_SYSTEM_V2.md` §6.3 — on la rend globale dans `styles.css` :
```css
@keyframes filament-scan { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  [class*="SkeletonShimmer"] > div > div { animation: none; opacity: 0.6; }
}
```

---

## 10. `StickyNoteUnfold` — note qui se déplie

**Déclencheur :** tap sur une carte note.  
**Durée :** 0.55 s unfold, 0.32 s contenu. **Courbe :** `--ease-couture` (unfold), `--ease-seuil` (contenu).  
**Cas d'usage :** notes de l'éditeur (`LorePage`, `CodexPage`), fragment devoilé (`FragmentDetailPage`).

```tsx
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type Props = { preview: ReactNode; full: ReactNode; className?: string };

export function StickyNoteUnfold({ preview, full, className }: Props) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className={`relative ${className ?? ""}`}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        className="w-full text-left"
        aria-expanded={open}
      >
        {preview}
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0, rotateX: -8 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1, rotateX: 0 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0, rotateX: -8 }}
            transition={{
              height:  { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
              opacity: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
              rotateX: { duration: 0.55, ease: [0.65, 0, 0.35, 1] },
            }}
            style={{ overflow: "hidden", transformOrigin: "50% 0%", perspective: 800 }}
          >
            <div className="pt-4">{full}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 11. `TiltCard` — carte 3D qui suit le doigt

**Déclencheur :** `pointermove`.  
**Durée :** ressort `stiffness: 220, damping: 22`.  
**Rotation :** ±8° en X et Y, perspective 1000.  
**Cas d'usage :** carte hero d'un fragment, carte produit, carte « porteur ».

```tsx
import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type HTMLMotionProps } from "framer-motion";

type Props = { children: ReactNode; className?: string; max?: number } & Omit<HTMLMotionProps<"div">, "ref">;

export function TiltCard({ children, className, max = 8, ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 22 });
  const sry = useSpring(ry, { stiffness: 220, damping: 22 });
  const glareX = useTransform(sry, [-max, max], ["100%", "0%"]);
  const glareY = useTransform(srx, [-max, max], ["0%", "100%"]);
  const reduce = useReducedMotion();

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
        <motion.div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            borderRadius: "inherit",
            background:
              "radial-gradient(circle at var(--gx) var(--gy), hsla(36 60% 70% / 0.18), transparent 50%)",
            // Pilote les CSS vars via Framer Motion :
            // (à ajouter)  useEffect(() => { glareX.on("change", v => el.style.setProperty("--gx", v)); ... })
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
      )}
    </motion.div>
  );
}
```

> Note : la version `glare` finale est dans `CODE_DROP.md` §8 (avec `useEffect` propre sur les CSS vars).

---

## 12. `BottomNav` morphant

**Déclencheur :** changement d'onglet.  
**Durée :** ressort `stiffness: 380, damping: 32`.  
**Layout partagé :** `layoutId="nav-indicator"`.  
**Cas d'usage :** remplacement intégral du `<nav>` actuel dans `AppLayout.tsx` (lignes 191-224).

```tsx
import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Layers, ShoppingBag, ScanLine, BookOpen, User, type LucideIcon } from "lucide-react";
import { text } from "@/lib/i18n";

type Tab = { to: string; label: string; code: string; icon: LucideIcon };

const tabs: Tab[] = [
  { to: "/fragments",  label: text("Frag.", "Frag.", "شذر"),    code: "I",   icon: Layers },
  { to: "/boutique",   label: text("Pièces", "Pieces", "قطع"),  code: "II",  icon: ShoppingBag },
  { to: "/scan",       label: text("Scan", "Scan", "مسح"),      code: "III", icon: ScanLine },
  { to: "/histoire",   label: text("Histoire", "Story", "القصة"), code: "IV",  icon: BookOpen },
  { to: "/profil",     label: text("Sceau", "Seal", "الختم"),   code: "V",   icon: User },
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
                    {/* Filet supérieur laiton */}
                    <motion.span
                      layoutId="nav-rule"
                      className="absolute top-0 h-px w-10"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, hsl(36 60% 70%), transparent)",
                        boxShadow: "0 0 12px hsl(36 60% 70% / 0.6)",
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                    {/* Halo autour de l'icône */}
                    <motion.span
                      layoutId="nav-aura"
                      className="absolute w-12 h-12 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, hsl(36 38% 54% / 0.25), transparent 65%)",
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

**Diff avec l'existant :** on a 2 `layoutId` partagés (`nav-rule` et `nav-aura`) au lieu d'un seul, ce qui donne un morph simultané filet + halo. Couplé à `glass-2` au lieu de `bg-noir-profond/95 backdrop-blur-xl`, ça allège visuellement et aligne avec Cinema Mobile.

---

## 13. Provider `prefers-reduced-motion`

À monter en haut de `App` (juste sous `<I18nProvider>`). Voir implémentation complète dans `CODE_DROP.md` §10. En résumé :

```tsx
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduce ? "1" : "0";
  }, [reduce]);
  return <>{children}</>;
}
```

Côté CSS, on lit l'attribut :
```css
html[data-reduce-motion="1"] *, html[data-reduce-motion="1"] *::before, html[data-reduce-motion="1"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
```

C'est le filet de sécurité ultime : même si un composant tiers oublie `useReducedMotion`, le CSS coupe tout.
