# L'ÉCLAT — DESIGN SYSTEM V2
## « Modern Dark (Cinema Mobile) » × laiton littéraire

Référence : style `Modern Dark (Cinema Mobile)` du skill `ui-ux-pro-max` (67 styles, 161 palettes, 57 pairings typo). Le `#5E6AD2` indigo a été remplacé par le laiton `#b8893a` (déjà token `hsl(36 38% 54%)` dans le projet). Le noir profond n'est jamais `#000000` pur (anti-OLED smear).

---

## 1. PALETTE — tokens HSL étendus

### 1.1 Surfaces (fondations, profondeur en 6 paliers)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--bg-deep` | `30 18% 2.5%` | `#070605` | racine hors-vue, safe-band OLED |
| `--bg-base` | `30 14% 4%` | `#0c0a08` | canvas principal de l'app |
| `--bg-elevated` | `28 12% 6.5%` | `#13110f` | cartes, drawers |
| `--bg-raised` | `30 10% 9%` | `#1a1714` | modales, sheets élevées |
| `--bg-overlay` | `30 14% 3% / 0.85` | — | voile au-dessus du contenu |

Règle : on monte en HSL `L` (+2,5% à +3,5%) entre chaque palier. Le `H` reste entre 28-32° (chaud minéral). On ne dépasse jamais `L=10%` pour ne pas casser l'immersion.

### 1.2 Laiton (signature, 8 nuances)

| Token | HSL | Hex | Rôle |
|---|---|---|---|
| `--laiton-flash` | `38 80% 78%` | `#f5dba0` | point culminant, halo intense |
| `--laiton-100` | `36 60% 70%` | `#e6c184` | hover, accent passif |
| `--laiton-300` | `36 50% 60%` | `#d6a564` | état actif |
| `--laiton-500` (default) | `36 38% 54%` | `#b8893a` | couleur de marque |
| `--laiton-700` | `36 28% 40%` | `#8a6a32` | bordures contrastées |
| `--laiton-900` | `36 18% 22%` | `#473722` | halo diffus, glow |
| `--laiton-ember` | `22 45% 38%` | `#a87034` | transition laiton → feu |
| `--ember-deep` | `10 55% 30%` | `#7a2d20` | braise, fragments sombres |

Pourquoi 8 nuances : l'iconographie « couture » a besoin d'un dégradé subtil (fil de chaîne → fil de trame) sans pour autant devenir criarde. Le `--laiton-flash` n'est utilisé qu'une fois par page, en point culminant.

### 1.3 Voile (encre, parchemin, 5 paliers)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--voile-pur` | `40 35% 94%` | `#f6efe2` | texte hero, citations |
| `--voile` | `40 25% 88%` | `#e3dacb` | corps de texte |
| `--voile-dim` | `40 18% 62%` | `#a8a08f` | légendes, métadonnées |
| `--voile-ombre` | `40 10% 38%` | `#66614f` | bordures contrastées |
| `--voile-fantome` | `40 8% 22%` | `#3a382f` | séparateurs invisibles |

### 1.4 Surfaces translucides (glassmorphism)

```css
--glass-1: hsla(40 25% 88% / 0.04);  /* header sticky */
--glass-2: hsla(30 14% 6% / 0.72);   /* drawer, bottom-nav */
--glass-3: hsla(40 25% 88% / 0.07);  /* cartes flottantes */
--glass-tint: hsla(36 38% 54% / 0.06); /* teinte laiton sur le verre */
--border-hairline: hsla(40 25% 88% / 0.08);
--border-soft:     hsla(40 25% 88% / 0.12);
--border-laiton:   hsla(36 38% 54% / 0.35);
```

### 1.5 Ombres (laiton, ember, profondeur)

```css
--shadow-1: 0 1px 0 hsla(40 25% 88% / 0.03) inset, 0 1px 2px hsla(30 14% 3% / 0.6);
--shadow-2: 0 1px 0 hsla(40 25% 88% / 0.04) inset, 0 8px 24px -12px hsla(30 14% 3% / 0.7);
--shadow-3: 0 1px 0 hsla(40 25% 88% / 0.05) inset, 0 24px 48px -24px hsla(30 14% 3% / 0.8);
--halo-laiton: 0 0 0 1px hsla(36 38% 54% / 0.4), 0 0 32px -4px hsla(36 38% 54% / 0.35);
--halo-ember:  0 0 0 1px hsla(12 55% 32% / 0.5), 0 0 28px -6px hsla(12 55% 32% / 0.4);
--couture:     0 1px 0 hsla(40 25% 88% / 0.06), 0 0 0 1px hsla(36 38% 54% / 0.12);
```

### 1.6 Sémantique (status, états)

| Token | Valeur |
|---|---|
| `--success` | `hsl(140 30% 45%)` — vert mousse sombre |
| `--warning` | `hsl(36 60% 55%)` — ambre |
| `--destructive` | `hsl(8 55% 42%)` — braise |
| `--info` | `hsl(200 25% 55%)` — encre froide (rarement) |

---

## 2. TYPOGRAPHIE — « Minimalist Monochrome Editorial »

Tri-stack : Playfair Display 900 + Source Serif 4 + JetBrains Mono. **Zéro sans-serif UI.**

### 2.1 Fonts Google (preconnect critique)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,900&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&display=swap" rel="stylesheet">
```

Note AR : ajouter `<link ... Noto Naskh Arabic>` (voir §2.6).

### 2.2 Échelle modulaire (ratio 1.25, base 16 px)

| Token | rem | px | Font | Weight | Tracking | Leading |
|---|---|---|---|---|---|---|
| `--type-hero` | 5.25 | 84 | Playfair 900 ital | 900 | `-0.04em` | 0.88 |
| `--type-display` | 3.75 | 60 | Playfair 900 | 900 | `-0.03em` | 0.92 |
| `--type-h1` | 2.5 | 40 | Playfair 700 | 700 | `-0.02em` | 1.05 |
| `--type-h2` | 1.875 | 30 | Playfair 700 | 700 | `-0.015em` | 1.15 |
| `--type-h3` | 1.375 | 22 | Playfair 700 | 700 | `-0.01em` | 1.25 |
| `--type-lead` | 1.25 | 20 | Source Serif 4 ital | 300 | `0` | 1.45 |
| `--type-body` | 1 | 16 | Source Serif 4 | 400 | `0` | 1.55 |
| `--type-small` | 0.875 | 14 | Source Serif 4 | 400 | `0.005em` | 1.5 |
| `--type-caption` | 0.75 | 12 | Source Serif 4 | 300 | `0.01em` | 1.4 |
| `--type-mono-tag` | 0.625 | 10 | JetBrains Mono 500 | 500 | `0.18em` (uppercase) | 1.3 |
| `--type-mono-num` | 1.75 | 28 | JetBrains Mono 400 | 400 | `-0.01em` | 1.1 |
| `--type-rituel` | 0.6875 | 11 | JetBrains Mono 400 | 400 | `0.12em` (uppercase) | 1.3 |

Règle : Playfair uniquement pour les titres (jamais plus de 3 niveaux consécutifs visibles), Source Serif pour les corps, JetBrains Mono pour les codes romains (I/II/III), timestamps, compteurs, métadonnées.

### 2.3 Justification littéraire

- Héros : `leading: 0.88` + `tracking: -0.04em` → les mots se touchent presque, effet « poème imprimé ».
- Italique éditorial pour les citations (Playfair italic 400, ou Source Serif ital 300 pour les longs blocs).
- Petites capitales mono pour les rituels (labels de section, code romain, dates) : `font-feature-settings: 'smcp' on` ne s'applique pas à JetBrains Mono → on simule par `text-transform: uppercase` + `letter-spacing: 0.18em`.

### 2.4 Numérotation rituelle

- Format : chiffres romains en JetBrains Mono 500, taille 10 px, opacité 0.7. Préfixe optionnel : `§` ou `·`.
- Exemple : `I. LES FRAGMENTS`, `II. PORTER`, `III. SCANNER`.

### 2.5 Punctuation solennelle

- Guillemets français « ... » (et “ ... ” en EN) en Playfair italic, taille 1.2× celle du corps.
- Tiret cadratin `—` (U+2014) plutôt que `-` dans les corps narratifs.
- Points de suspension `…` (U+2026, un seul caractère) plutôt que `...`.

### 2.6 AR (RTL)

- Source Serif 4 supporte déjà l'arabe sous le nom `Source Serif 4 Arabic` (Google). On bascule :
  ```css
  html[data-lang="ar"] {
    --font-display: "Source Serif 4", "Noto Naskh Arabic", serif;
    --font-body: "Source Serif 4", "Noto Naskh Arabic", serif;
  }
  ```
- Playfair Display 900 ital est conservé pour le hero AR, mais on lui applique `font-feature-settings: 'ss01' on` et `direction: rtl`.
- Les tailles de corps augmentent de 6 % (`font-size: calc(var(--type-body) * 1.06)`) pour préserver la lisibilité des glyphes cursifs.
- `letter-spacing: 0` partout (l'arabe n'a pas de tracking occidental).
- `line-height: 1.7` pour les corps (l'arabe demande plus d'air vertical).

### 2.7 Classes Tailwind v4 (résumé)

```css
@theme {
  --font-display: "Playfair Display", "Source Serif 4", serif;
  --font-serif: "Source Serif 4", "Noto Naskh Arabic", serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --text-hero: 5.25rem;
  --text-display: 3.75rem;
  --leading-hero: 0.88;
  --tracking-hero: -0.04em;
}
```

Tailwind v4 génère automatiquement `text-hero`, `leading-hero`, `tracking-hero` à partir de ces clés.

---

## 3. RADIUS & ESPACE

### 3.1 Radius (8 paliers)

| Token | px | Usage |
|---|---|---|
| `--r-0` | 0 | séparateurs, lignes d'ornement |
| `--r-xs` | 2 | tags mono minuscules |
| `--r-sm` | 4 | inputs, chips |
| `--r-md` | 8 | boutons, petites cartes |
| `--r-lg` | 12 | cartes moyennes |
| `--r-xl` | 16 | cartes hero, modales (Cinema Mobile default) |
| `--r-2xl` | 24 | bottom sheets, drawers |
| `--r-full` | 9999 | pills, badges ronds |

Règle : **16 px est la nouvelle default** (Cinema Mobile). On abandonne le `0.125rem` actuel qui fait « années 2010 strict ».

### 3.2 Espace (8 px grid + demi-pas)

`2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160`

Exprimé en CSS : `--space-1: 0.25rem; --space-2: 0.5rem; ...` (générés automatiquement par Tailwind via `0.5`, `1`, `1.5`, etc.).

### 3.3 Safe areas & containers

```css
--safe-top:    env(safe-area-inset-top, 0);
--safe-bottom: env(safe-area-inset-bottom, 0);
--container:   42rem;   /* max-w-2xl déjà utilisé, 672 px */
--container-pro: 56rem; /* pages riches (Histoire, Codex) */
```

---

## 4. GLASSMORPHISM — 3 niveaux

### Niveau 1 : `glass-1` (headers, top-bars)

```css
.glass-1 {
  background: var(--glass-1);
  -webkit-backdrop-filter: saturate(160%) blur(20px);
  backdrop-filter: saturate(160%) blur(20px);
  border-bottom: 1px solid var(--border-hairline);
  box-shadow: var(--shadow-1);
}
```
Performance : blur(20px) est coûteux. Désactivé dans Unity WebView via la règle existante `[data-unity-webview] .glass-1 { backdrop-filter: none; }` (déjà présente dans `styles.css`).

### Niveau 2 : `glass-2` (drawers, bottom-nav, modales)

```css
.glass-2 {
  background: var(--glass-2);
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  backdrop-filter: saturate(180%) blur(28px);
  border-top: 1px solid var(--border-hairline);
  box-shadow: var(--shadow-2);
}
```

### Niveau 3 : `glass-3` (cartes flottantes, tooltip, command-palette)

```css
.glass-3 {
  background: var(--glass-3);
  -webkit-backdrop-filter: saturate(200%) blur(36px);
  backdrop-filter: saturate(200%) blur(36px);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-3);
}
.glass-3--laiton {
  background: linear-gradient(
    180deg,
    hsla(36 38% 54% / 0.08),
    hsla(30 14% 6% / 0.55)
  );
  border: 1px solid var(--border-laiton);
  box-shadow: var(--halo-laiton);
}
```

### Accessibilité (essentielle)

Toutes les surfaces glass exigent un texte `--voile` (L*=88%) pour garantir 4.5:1 minimum sur `--bg-base` (L*=4%). Test rapide :
- `#e3dacb` sur `#0c0a08` → **ratio 13.8:1** (AAA large).
- `#a8a08f` sur `#0c0a08` → **ratio 7.1:1** (AAA).
- Laiton `#b8893a` sur `#0c0a08` → **ratio 6.4:1** (AA large, AA normal pour les titres ≥ 18 px).

---

## 5. MOTION GRAMMAR — 8 durées × 4 courbes

### 5.1 Durées (nommées par intention, pas par chiffre)

| Token | s | Usage |
|---|---|---|
| `--dur-instant` | 0.08 | feedback tap, hover |
| `--dur-quick` | 0.18 | toggles, états ON/OFF |
| `--dur-base` | 0.32 | entrées standards (cartes, items) |
| `--dur-medium` | 0.55 | reveals, montées d'ornement |
| `--dur-slow` | 0.95 | transitions de page, voile |
| `--dur-ritual` | 1.6 | splash, sceau qui s'éveille |
| `--dur-veil` | 2.4 | drapés, slow-motion narration |
| `--dur-eternal` | 12 | ambient drift (blobs, poussière) |

### 5.2 Courbes (4 easing, jamais linéaire)

```css
--ease-seuil:   cubic-bezier(0.16, 1, 0.3, 1);     /* Cinema Mobile signature : départ franc, sortie lente */
--ease-fil:     cubic-bezier(0.22, 0.61, 0.36, 1); /* easing maison actuel, plus doux à l'arrivée */
--ease-tactile: cubic-bezier(0.34, 1.56, 0.64, 1); /* léger overshoot, réservé aux ressorts < 200 ms */
--ease-couture: cubic-bezier(0.65, 0, 0.35, 1);   /* S-curve symétrique, idéal pour les déplacements latéraux */
```

`--ease-seuil` devient le **défaut** (c'est la courbe Cinema Mobile canonique). L'ancienne `--ease-fil` reste pour les éléments qui doivent s'évanouir (splash, citations).

### 5.3 Spring tokens (Framer Motion)

```ts
export const SPRING = {
  tactile:  { type: "spring", stiffness: 420, damping: 26 },  // bouton
  doux:     { type: "spring", stiffness: 180, damping: 24 },  // bottom-nav indicator
  lourd:    { type: "spring", stiffness: 90,  damping: 20 },  // modal sheet
  aimant:   { type: "spring", stiffness: 150, damping: 18, mass: 0.6 },  // magnetic
} as const;
```

### 5.4 Naming convention

`<durée>-<courbe>-<élément>` : `base-seuil-card`, `slow-veil-page`, `medium-couture-drawer`. Permet de grep dans la base de code.

---

## 6. 5 EFFETS SIGNATURE (recettes CSS)

### 6.1 `halo-laiton` (bouton primaire, fragment actif)

Glow radial qui respire (3 s).
```css
.halo-laiton {
  position: relative;
  isolation: isolate;
}
.halo-laiton::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: radial-gradient(
    circle at 50% 50%,
    hsla(36 60% 70% / 0.45),
    hsla(36 38% 54% / 0.15) 40%,
    transparent 70%
  );
  filter: blur(14px);
  z-index: -1;
  animation: halo-respire 3.6s var(--ease-seuil) infinite;
}
@keyframes halo-respire {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.08); }
}
@media (prefers-reduced-motion: reduce) {
  .halo-laiton::before { animation: none; opacity: 0.85; }
}
```

### 6.2 `voile-dust` (particules de poussière dans le hero)

Trois couches de `radial-gradient` + `feTurbulence` SVG inline (déjà partiellement dans `body::before` du `styles.css` actuel — on l'enrichit).

```css
.voile-dust {
  position: absolute; inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 20% 30%, hsla(40 25% 88% / 0.04) 0, transparent 40%),
    radial-gradient(circle at 80% 70%, hsla(36 38% 54% / 0.05) 0, transparent 45%),
    radial-gradient(circle at 60% 20%, hsla(40 25% 88% / 0.03) 0, transparent 35%);
  mix-blend-mode: screen;
  animation: dust-drift 18s linear infinite;
}
@keyframes dust-drift {
  0%   { transform: translate3d(0, 0, 0)    scale(1.0); }
  50%  { transform: translate3d(-2%, 1%, 0) scale(1.05); }
  100% { transform: translate3d(0, 0, 0)    scale(1.0); }
}
```

### 6.3 `filament` (fil de lumière qui traverse un élément)

Effet scan-line subtil : un dégradé linéaire animé en `background-position`.
```css
.filament {
  position: relative; overflow: hidden;
  isolation: isolate;
}
.filament::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(
    100deg,
    transparent 30%,
    hsla(36 60% 70% / 0.18) 50%,
    transparent 70%
  );
  background-size: 250% 100%;
  background-position: 150% 0;
  animation: filament-scan 4.2s var(--ease-seuil) infinite;
  mix-blend-mode: screen;
}
@keyframes filament-scan {
  0%   { background-position: 150% 0; }
  100% { background-position: -100% 0; }
}
```

### 6.4 `couture-ombre` (bordure pointillée façon piqûre de fil)

Bordure 1 px en `border-image` SVG inline, pas de dash CSS (perf + rendu mobile).

```css
.couture {
  border: 0;
  background:
    linear-gradient(var(--bg-elevated), var(--bg-elevated)) padding-box,
    repeating-linear-gradient(
      90deg,
      hsla(36 38% 54% / 0.5) 0 4px,
      transparent 4px 8px
    ) border-box;
  border: 1px dashed transparent;
  border-radius: var(--r-lg);
}
```

Variante `couture-tight` (points serrés) : `0 2px` au lieu de `0 4px`.

### 6.5 `lumen` (point lumineux qui glisse le long d'un tracé SVG)

Pour les scan traces : un cercle suit un `<path>` avec `motion-path` (Motion) ou un simple `stroke-dashoffset` animé.

```css
.lumen {
  filter: drop-shadow(0 0 6px hsla(36 60% 70% / 0.7))
          drop-shadow(0 0 16px hsla(36 38% 54% / 0.4));
}
```

Le composant `ScanTrace` (voir `CODE_DROP.md`) combine `lumen` + `filament` + `couture` pour le résultat final.

---

## 7. `@theme` COMPLET (Tailwind v4)

À coller dans `src/styles.css`, à la place du bloc `@theme` actuel (lignes 14-51). Les anciens tokens (hsl bruts `--laiton`, `--voile`, etc.) sont **conservés** dans `:root` pour la rétrocompatibilité legacy.

```css
@theme {
  /* === Radius === */
  --radius: 1rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;

  /* === Fondations === */
  --color-bg-deep:     hsl(30 18% 2.5%);
  --color-bg-base:     hsl(30 14% 4%);
  --color-bg-elevated: hsl(28 12% 6.5%);
  --color-bg-raised:   hsl(30 10% 9%);

  /* === Texte / Voile === */
  --color-voile-pur:    hsl(40 35% 94%);
  --color-voile:        hsl(40 25% 88%);
  --color-voile-dim:    hsl(40 18% 62%);
  --color-voile-ombre:  hsl(40 10% 38%);
  --color-voile-fantome:hsl(40 8% 22%);

  /* === Laiton (8 nuances) === */
  --color-laiton-flash: hsl(38 80% 78%);
  --color-laiton-100:   hsl(36 60% 70%);
  --color-laiton-300:   hsl(36 50% 60%);
  --color-laiton-500:   hsl(36 38% 54%);
  --color-laiton-700:   hsl(36 28% 40%);
  --color-laiton-900:   hsl(36 18% 22%);
  --color-laiton-ember: hsl(22 45% 38%);
  --color-ember-deep:   hsl(10 55% 30%);

  /* === Alias sémantiques shadcn-like === */
  --color-background: var(--color-bg-base);
  --color-foreground: var(--color-voile);
  --color-card: var(--color-bg-elevated);
  --color-card-foreground: var(--color-voile);
  --color-popover: var(--color-bg-raised);
  --color-popover-foreground: var(--color-voile);
  --color-primary: var(--color-laiton-500);
  --color-primary-foreground: var(--color-bg-deep);
  --color-secondary: hsl(30 8% 14%);
  --color-secondary-foreground: var(--color-voile);
  --color-muted: hsl(30 6% 12%);
  --color-muted-foreground: var(--color-voile-dim);
  --color-accent: var(--color-laiton-500);
  --color-accent-foreground: var(--color-bg-deep);
  --color-destructive: hsl(8 55% 42%);
  --color-destructive-foreground: var(--color-voile-pur);
  --color-border: hsl(36 12% 18%);
  --color-input: hsl(36 12% 18%);
  --color-ring: var(--color-laiton-500);

  /* === Sémantique status === */
  --color-success: hsl(140 30% 45%);
  --color-warning: hsl(36 60% 55%);
  --color-info:    hsl(200 25% 55%);

  /* === Typo === */
  --font-display: "Playfair Display", "Source Serif 4", serif;
  --font-serif:   "Source Serif 4", "Noto Naskh Arabic", serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  /* === Échelle === */
  --text-hero:     5.25rem;
  --text-display:  3.75rem;
  --text-h1:       2.5rem;
  --text-h2:       1.875rem;
  --text-h3:       1.375rem;
  --text-lead:     1.25rem;
  --text-body:     1rem;
  --text-small:    0.875rem;
  --text-caption:  0.75rem;
  --text-mono-tag: 0.625rem;
  --text-mono-num: 1.75rem;

  --leading-hero: 0.88;
  --leading-display: 0.92;
  --leading-tight: 1.15;
  --leading-snug: 1.3;
  --leading-normal: 1.55;

  --tracking-hero: -0.04em;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-rituel: 0.18em;
}

:root {
  /* Compat legacy (hsl(var(--laiton) / 0.4)) */
  --laiton: 36 38% 54%;
  --laiton-dim: 36 22% 38%;
  --voile: 40 25% 88%;
  --voile-dim: 40 18% 62%;
  --ember: 12 55% 32%;
  --noir-profond: 30 14% 3%;
  --background: 30 14% 4%;
  --foreground: 40 25% 88%;
  --border: 36 12% 18%;

  /* Easing signatures */
  --ease-seuil:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-fil:     cubic-bezier(0.22, 0.61, 0.36, 1);
  --ease-tactile: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-couture: cubic-bezier(0.65, 0, 0.35, 1);

  /* Durées */
  --dur-instant: 0.08s;
  --dur-quick:   0.18s;
  --dur-base:    0.32s;
  --dur-medium:  0.55s;
  --dur-slow:    0.95s;
  --dur-ritual:  1.6s;
  --dur-veil:    2.4s;
  --dur-eternal: 12s;

  /* Safe areas */
  --safe-top:    env(safe-area-inset-top, 0);
  --safe-bottom: env(safe-area-inset-bottom, 0);
}
```

---

## 8. RÈGLES D'USAGE (à crier sur l'équipe)

1. **Pas de `#000000` pur** — utiliser `--bg-deep` ou plus chaud. Anti-OLED smear.
2. **Pas de `border-radius: 0.125rem`**, c'est la valeur legacy à remplacer par `--r-md` (8 px) minimum.
3. **Tout texte de corps** ≥ 16 px en Source Serif 4, jamais en system-ui.
4. **Tout titre rituel** (label section, code romain, tag) en JetBrains Mono UPPERCASE `tracking-rituel`.
5. **Tout `transition`** utilise l'un des 4 `--ease-*`. Pas de `linear`, pas de `ease-in-out`.
6. **Tout `prefers-reduced-motion: reduce`** désactive les keyframes `halo-respire`, `dust-drift`, `filament-scan`. Tester chaque animation.
7. **Glassmorphism** toujours avec contenu contrasté dessous (jamais de carte glass sur fond blanc — il n'y en a pas, mais règle pour le futur).
8. **RTL** : tester chaque page en `data-lang="ar"` — la direction flip doit propager aux `linear-gradient`, aux `translateX` et aux `motion` props (Framer Motion : `x: 20` devient automatiquement `-20` si on utilise des pourcentages logiques `inset-inline-start`).
