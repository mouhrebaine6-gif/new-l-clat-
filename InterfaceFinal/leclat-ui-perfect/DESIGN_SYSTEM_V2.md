# L'ÉCLAT — DESIGN SYSTEM V2

Spec utilisable, pas une dissertation. Tous les tokens sont à coller dans `src/styles.css` sous `@theme {}` puis exposés en CSS variables `:root {}` pour les composants legacy qui utilisent `hsl(var(--x) / α)`.

---

## 1. TOKENS — palette

### 1.1 Neutres profonds (la "fosse")

Pas de noir pur. On creuse vers le brun chaud pour rappeler la fibre brûlée.

| Token              | HSL             | Hex      | Usage                                |
| ------------------ | --------------- | -------- | ------------------------------------ |
| `--noir-profond`   | `30 18% 2%`     | `#07050   3` | Fond ultime, splash, modales         |
| `--noir-veine`     | `28 14% 5%`     | `#0d0a08` | Fond app, body                       |
| `--noir-tissu`     | `28 12% 8%`     | `#14110e` | Cartes au repos                      |
| `--noir-pli`       | `30 10% 12%`    | `#1d1916` | Cartes hover, surfaces élevées       |
| `--gris-fibre`     | `32 8% 18%`     | `#2b2622` | Bordures, séparateurs                |
| `--gris-cendres`   | `32 6% 28%`     | `#443e38` | Texte désactivé                      |
| `--voile-dim`      | `40 18% 62%`    | `#a89c8b` | Texte secondaire, légendes           |
| `--voile`          | `40 25% 88%`    | `#e4dccc` | Texte courant                        |
| `--ivoire`         | `40 35% 96%`    | `#f7f1e3` | Titres display, moments sacrés        |

### 1.2 Accents

| Token              | HSL             | Hex      | Usage                                |
| ------------------ | --------------- | -------- | ------------------------------------ |
| `--laiton`         | `36 38% 54%`    | `#b8893a` | L'identité — hover, focus, indicateurs |
| `--laiton-clair`   | `38 55% 70%`    | `#e0b46b` | Halo, glow, surbrillance douce       |
| `--laiton-saturé`  | `34 80% 50%`    | `#e8941a` | CTA primaire, bouton d'action        |
| `--laiton-dim`     | `36 22% 38%`    | `#6d5a3b` | Laiton terni, états désactivés       |
| `--ember`          | `12 55% 32%`    | `#8a3a1e` | Erreur, rupture, alerte rituelle     |
| `--ember-clair`    | `14 70% 50%`    | `#e36436` | Uniquement les scans validés         |
| `--cendre-bleue`   | `210 18% 32%`   | `#3e4a55` | Lointain, jamais seul — accompagne laiton |
| `--mauve-livide`   | `290 12% 28%`   | `#473a4b` | Reflet dans l'ombre, scan nocturne   |

### 1.3 Sémantiques (mapping Tailwind v4)

```css
@theme {
  --color-background: hsl(28 14% 5%);
  --color-foreground: hsl(40 25% 88%);
  --color-card: hsl(28 12% 8%);
  --color-card-foreground: hsl(40 25% 88%);
  --color-popover: hsl(28 12% 8%);
  --color-popover-foreground: hsl(40 25% 88%);
  --color-primary: hsl(36 38% 54%);
  --color-primary-foreground: hsl(28 14% 5%);
  --color-secondary: hsl(30 10% 12%);
  --color-secondary-foreground: hsl(40 25% 88%);
  --color-muted: hsl(30 6% 12%);
  --color-muted-foreground: hsl(40 10% 58%);
  --color-accent: hsl(34 80% 50%);
  --color-accent-foreground: hsl(28 14% 5%);
  --color-destructive: hsl(12 55% 32%);
  --color-destructive-foreground: hsl(40 25% 88%);
  --color-border: hsl(32 8% 18%);
  --color-input: hsl(32 8% 18%);
  --color-ring: hsl(36 38% 54%);
  --color-ember: hsl(12 55% 32%);
  --color-ember-clair: hsl(14 70% 50%);
  --color-voile: hsl(40 25% 88%);
  --color-voile-dim: hsl(40 18% 62%);
  --color-laiton: hsl(36 38% 54%);
  --color-laiton-clair: hsl(38 55% 70%);
  --color-laiton-sature: hsl(34 80% 50%);
  --color-laiton-dim: hsl(36 22% 38%);
  --color-ivoire: hsl(40 35% 96%);
  --color-noir-profond: hsl(30 18% 2%);
  --color-noir-veine: hsl(28 14% 5%);
  --color-noir-tissu: hsl(28 12% 8%);
  --color-noir-pli: hsl(30 10% 12%);
}
```

L'app reste **dark-first**. Pas de thème clair : ce serait trahir la fosse.

---

## 2. TYPOGRAPHIE — la tierce

### 2.1 Recommandation

| Rôle          | Famille                   | Google Fonts          | Tailwind token         |
| ------------- | ------------------------- | --------------------- | ---------------------- |
| **Display**   | Cormorant Garamond        | `Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500` | `--font-display`  |
| **Corps**     | Inter                     | `Inter:wght@300;400;500;600;700`        | `--font-sans`     |
| **Mono**      | JetBrains Mono            | `JetBrains+Mono:wght@300;400;500`       | `--font-mono`     |

**Pourquoi :** Cormorant porte l'italique éditorial (Ishiguro, Han Kang — la phrase longue qui s'enroule), Inter est neutre et rend le système lisible, JetBrains pour les compteurs, les ID fragments, les codes romains — la donnée qui scelle.

### 2.2 Échelle (mobile-first, base 16px)

| Niveau         | `font-size` | `line-height` | `letter-spacing` | `font-feature-settings`                            |
| -------------- | ----------- | ------------- | ---------------- | -------------------------------------------------- |
| `display-xl`   | 3.25rem     | 0.92          | -0.02em          | `"smcp", "lnum"` (small caps, lining)              |
| `display-lg`   | 2.5rem      | 1.02          | -0.015em         | `"lnum"`                                           |
| `display-md`   | 1.875rem    | 1.1           | -0.01em          | `"lnum"`                                           |
| `h1`           | 1.5rem      | 1.2           | 0                | `"smcp", "lnum"`                                   |
| `h2`           | 1.25rem     | 1.3           | 0                |                                                    |
| `body`         | 1rem        | 1.6           | 0                |                                                    |
| `small`        | 0.875rem    | 1.55          | 0.005em          |                                                    |
| `caption`      | 0.75rem     | 1.4           | 0.01em           |                                                    |
| `micro-mono`   | 0.625rem    | 1.3           | 0.18em (upper)   | `"tnum", "lnum"` (tabular pour compteurs)          |
| `overline`     | 0.6875rem   | 1.3           | 0.22em (upper)   | `"tnum"`                                           |

**Note** : `smcp` transforme les capitales en petites capitales, ce qui donne au display ce ton éditorial sans avoir à composer en majuscules.

### 2.3 Implémentation

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap"
  rel="stylesheet"
/>
```

```css
@theme {
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

body { font-family: var(--font-sans); }
.font-display { font-family: var(--font-display); }
.font-mono { font-family: var(--font-mono); }
```

---

## 3. SURFACES — verre rituel

Trois niveaux. Le verre n'est jamais seul : il porte toujours un tint chaud (laiton) ou froid (cendre) selon le contexte.

### 3.1 Niveau 1 — `glass-voile` (cartes au repos)

```css
.glass-voile {
  background: hsl(28 12% 8% / 0.72);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid hsl(36 22% 38% / 0.18);
  box-shadow:
    inset 0 1px 0 0 hsl(40 35% 96% / 0.04),   /* cout. d'ombre haute */
    inset 0 -1px 0 0 hsl(30 18% 2% / 0.5),     /* cout. d'ombre basse */
    0 30px 60px -30px hsl(30 18% 2% / 0.7);
}
```

### 3.2 Niveau 2 — `glass-tisse` (cartes hover, nav)

```css
.glass-tisse {
  background: hsl(30 10% 12% / 0.78);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid hsl(36 38% 54% / 0.22);
  box-shadow:
    inset 0 1px 0 0 hsl(40 35% 96% / 0.06),
    0 0 0 1px hsl(36 38% 54% / 0.08),
    0 24px 48px -24px hsl(30 18% 2% / 0.6);
}
```

### 3.3 Niveau 3 — `glass-lumen` (modales, fragments révélés)

```css
.glass-lumen {
  background: hsl(40 35% 96% / 0.04);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid hsl(36 38% 54% / 0.32);
  box-shadow:
    inset 0 1px 0 0 hsl(40 35% 96% / 0.12),
    inset 0 0 80px -20px hsl(36 38% 54% / 0.08),
    0 32px 64px -20px hsl(30 18% 2% / 0.8);
}
```

### 3.4 Variante `glass-actif` (pulse rituel)

```css
@keyframes pulse-rituel {
  0%, 100% {
    box-shadow:
      inset 0 1px 0 0 hsl(40 35% 96% / 0.06),
      0 0 0 0 hsl(36 38% 54% / 0);
  }
  50% {
    box-shadow:
      inset 0 1px 0 0 hsl(40 35% 96% / 0.12),
      0 0 0 6px hsl(36 38% 54% / 0.12);
  }
}
.glass-actif { animation: pulse-rituel 3.2s ease-in-out infinite; }
```

### 3.5 Réduction WebView Unity

Conserver le comportement actuel : dans `html[data-unity-webview="1"]`, neutraliser les `backdrop-filter` (le runtime Unity ne les supporte pas tous).

---

## 4. EFFETS DE LUMIÈRE — les 5 signature

### 4.1 Halo laiton (focus / cursor)

Un radial gradient qui suit le pointeur. Utiliser sur tout élément interactif focusé.

```css
.halo-laiton {
  position: relative;
  isolation: isolate;
}
.halo-laiton::before {
  content: "";
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    circle at var(--mx, 50%) var(--my, 50%),
    hsl(36 55% 70% / 0.22),
    transparent 55%
  );
  opacity: 0;
  transition: opacity 600ms cubic-bezier(0.22, 0.61, 0.36, 1);
  pointer-events: none;
  z-index: -1;
  filter: blur(20px);
}
.halo-laiton:hover::before,
.halo-laiton:focus-visible::before {
  opacity: 1;
}
```

JS associé : un petit `mousemove` met à jour `--mx` / `--my` sur l'élément.

### 4.2 Voile dust (particules)

Pas une lib — du SVG inline + CSS keyframes. Trois couches de points qui dérivent à des vitesses différentes.

```css
.dust-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='3'/></filter><circle cx='40' cy='60' r='0.6' fill='%23e0b46b' opacity='.4'/><circle cx='120' cy='180' r='0.4' fill='%23e4dccc' opacity='.3'/><circle cx='200' cy='90' r='0.5' fill='%23b8893a' opacity='.35'/><circle cx='260' cy='220' r='0.4' fill='%23e0b46b' opacity='.3'/><circle cx='80' cy='260' r='0.3' fill='%23f7f1e3' opacity='.25'/></svg>");
  background-size: 320px 320px;
  opacity: 0.45;
  mix-blend-mode: screen;
  animation: dust-drift 60s linear infinite;
}
@keyframes dust-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-320px, -160px, 0); }
}
```

Trois instances avec `animation-duration` 60s / 90s / 120s pour un effet de profondeur.

### 4.3 Filament (le geste couture)

Une ligne fine, `1px`, qui relie deux points. Réalisé en SVG, animé par `stroke-dashoffset`.

```tsx
// Filament.tsx — voir CODE_DROP.md pour le composant complet
<svg className="filament-svg">
  <line
    x1="0" y1="0" x2="100%" y2="100%"
    stroke="hsl(var(--laiton))"
    strokeWidth="0.75"
    strokeDasharray="200"
    strokeDashoffset="200"
  >
    <animate attributeName="stroke-dashoffset" from="200" to="0" dur="0.9s" />
  </line>
</svg>
```

### 4.4 Couture d'ombre

L'effet du point sellier sur les cartes rituelles. À coller sur `.card-rituel` :

```css
.card-rituel {
  position: relative;
  background: hsl(28 12% 8%);
  border: 1px solid hsl(36 22% 38% / 0.25);
  box-shadow:
    inset 0 1px 0 0 hsl(40 35% 96% / 0.05),    /* fil clair haut */
    inset 0 -1px 0 0 hsl(30 18% 2% / 0.6),      /* ombre basse */
    inset 4px 0 8px -4px hsl(30 18% 2% / 0.4),  /* couture gauche */
    inset -4px 0 8px -4px hsl(30 18% 2% / 0.4); /* couture droite */
}
```

### 4.5 Lumen (le fragment révélé)

Un glow blanc-ivoire qui s'allume à la révélation.

```css
@keyframes lumen-on {
  from {
    box-shadow:
      0 0 0 0 hsl(40 35% 96% / 0),
      inset 0 0 0 0 hsl(40 35% 96% / 0);
  }
  30% {
    box-shadow:
      0 0 80px 10px hsl(40 35% 96% / 0.45),
      inset 0 0 40px hsl(40 35% 96% / 0.18);
  }
  to {
    box-shadow:
      0 0 120px 30px hsl(40 35% 96% / 0),
      inset 0 0 60px hsl(40 35% 96% / 0);
  }
}
.lumen-flash { animation: lumen-on 2.4s ease-out forwards; }
```

---

## 5. MOTION GRAMMAR

### 5.1 Les 8 durées canoniques

| Token           | ms     | Usage                                       |
| --------------- | ------ | ------------------------------------------- |
| `--d-instant`   | 50     | Hover state, focus ring (sub-RAF)           |
| `--d-pulse`     | 120    | Tap feedback, ripple                        |
| `--d-tactile`   | 220    | Bouton hover, micro-transitions             |
| `--d-voile`     | 380    | Apparitions standards, list items           |
| `--d-rite`      | 560    | Entrées de carte, transitions de section    |
| `--d-passe`     | 780    | Modales, drawers, page-to-page              |
| `--d-rituel`    | 1100   | Révélations, fragment unlock                |
| `--d-ceremonie` | 1600   | Splash, cérémonie de palier                 |

### 5.2 Les 4 courbes

```css
:root {
  /* Cinétique — sortie rapide, arrivée amortie. Pour le tactile. */
  --ease-cinetique: cubic-bezier(0.22, 0.61, 0.36, 1);
  /* Rituel — lent des deux côtés. Pour les cérémonies. */
  --ease-rituel: cubic-bezier(0.65, 0.05, 0.36, 1);
  /* Spring tactile — rebond court, ferme. Pour les boutons. */
  --ease-spring-tactile: cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Spring cérémoniel — rebond doux, retardé. Pour les apparitions. */
  --ease-spring-ceremonie: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Côté Framer Motion :

```ts
export const EASE_CINETIQUE = [0.22, 0.61, 0.36, 1] as const;
export const EASE_RITUEL = [0.65, 0.05, 0.36, 1] as const;
export const SPRING_TACTILE = { type: "spring", stiffness: 420, damping: 26 } as const;
export const SPRING_CEREMONIE = { type: "spring", stiffness: 110, damping: 22, mass: 0.9 } as const;
```

### 5.3 La règle des trois gestes

Toute apparition respecte trois temps : **entrée** (l'élément arrive), **présence** (il s'installe, peut pulser), **sortie** (il cède la place).

```ts
export const GESTES = {
  entree: { duration: 0.56, ease: EASE_CINETIQUE },
  presence: { duration: 1.6, ease: "easeInOut", repeat: Infinity },
  sortie: { duration: 0.38, ease: EASE_RITUEL },
};
```

Ne jamais combiner entrée + sortie en une seule transition : ce sont deux états psychologiques distincts.

---

## 6. ICOGRAPHIE

Line icons en `stroke-width: 1.25` (pas 1.5 ni 2). Jamais filled, sauf les compteurs en succès (le `Check` reste un trait). État actif : un filament de laiton se trace derrière l'icône en 240ms.

```tsx
// Lucide gère déjà le stroke 1.25. Override global :
// tailwind.config ou CSS :
.icon { stroke-width: 1.25; }
.icon-active {
  position: relative;
}
.icon-active::after {
  content: "";
  position: absolute;
  inset: -4px;
  background: radial-gradient(circle, hsl(36 38% 54% / 0.4), transparent 60%);
  opacity: 0;
  animation: icon-pulse 1.4s ease-out;
}
@keyframes icon-pulse {
  0% { opacity: 0.8; transform: scale(0.6); }
  100% { opacity: 0; transform: scale(1.4); }
}
```

---

## 7. A11Y — non négociable

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .anim-drift, .anim-respire, .glass-actif, .lumen-flash {
    animation: none !important;
  }
}
```

Tous les composants Framer Motion doivent appeler `useReducedMotion()` et basculer sur `false` pour `initial` quand l'utilisateur a désactivé les animations.
