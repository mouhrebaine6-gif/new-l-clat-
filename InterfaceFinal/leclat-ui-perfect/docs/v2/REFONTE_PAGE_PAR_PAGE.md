# L'ÉCLAT — REFONTE PAGE PAR PAGE

Layouts ASCII + composants + animations + snippets clés pour 6 pages canoniques. Suit la nouvelle spec V2 (DESIGN_SYSTEM_V2.md + MOTION_SPEC.md). Toutes les valeurs respectent la palette laiton `#b8893a` du projet.

Conventions ASCII :
- `█` = bloc plein · `▒` = surface élevée · `░` = fond profond · `║` `═` `╔` `╗` `╚` `╝` = bordures · `◆` = point laiton · `·` = micro-texte mono · `~` = voile/dust

---

## 1. `Index.tsx` — Manifeste

### Layout (mobile, scroll continu)

```
┌─────────────────────────────────────────────────┐
│ ░  HEADER glass-1  L'ÉCLAT   ✦ 🛍 ⊕  Ⅴ·pseudo ░ │  ← sticky 56 px
├─────────────────────────────────────────────────┤
│                                                 │
│  HERO plein écran (100dvh)                      │
│  ┌─────────────────────────────────────────┐    │
│  │  image hero-canyon opacity 0.55 + dust │    │
│  │                          ┌───────────┐  │    │
│  │  ─── MANIFESTE · MMXXVI  │           │  │    │
│  │                          │   SCEAU   │  │    │
│  │  Porter                  │  filigrane│  │    │
│  │  *le fragment.*          │  opacity  │  │    │
│  │  Réveiller               │   0.20    │  │    │
│  │  *L'Éclat.*              │           │  │    │
│  │                          └───────────┘  │    │
│  │                                         │    │
│  │  « Vous pouvez le porter sans rien      │    │
│  │     demander. »                         │    │
│  │                                         │    │
│  │  · ↓ Descendez. Le rituel s'éveille.    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  TRIADE DES PASSAGES · Ⅷ                        │
│  ╔═══════════╗ ╔═══════════╗ ╔═══════════╗      │
│  ║  I        ║ ║  II       ║ ║  III      ║      │
│  ║  Layers   ║ ║  Bag      ║ ║  Scan     ║      │
│  ║ Fragments ║ ║ Boutique  ║ ║ Scanner   ║      │
│  ║ →        ║ ║ →         ║ ║ →         ║      │
│  ╚═══════════╝ ╚═══════════╝ ╚═══════════╝      │
│                                                 │
│  ┌──── COMPTEURS LIVE ────────────────────┐     │
│  │  1 234     │  7 / 10    │  01        │     │
│  │ passages   │ fragments  │ drop       │     │
│  │ qualifiés  │ reconnus   │            │     │
│  └────────────────────────────────────────┘     │
│                                                 │
│  IMAGE FULL-BLEED + CITATION (80dvh)            │
│  « Vous pouvez le porter…                       │
│     si cela ne vous suffit pas,                 │
│     l'histoire commence là. »                   │
│                                                 │
│  SCEAU DU PORTEUR                               │
│  Cérès                                         │
│  ~Niveau Ⅲ~                                    │
│  [ Consulter votre sceau ] [ Ouvertures ]       │
│                                                 │
│  ━━━━━ L'ÉCLAT · DROP 01 · MMXXVI ━━━━━         │
└─────────────────────────────────────────────────┘
       ╔════ BOTTOM NAV ════╗
       ║  Frag Boutique Scan ║
       ║  Hist  Profil       ║
       ╚═════════════════════╝
```

### Composants utilisés (V2)

| Zone | Composant | Notes |
|---|---|---|
| Header | `glass-1` (nouveau) | remplace `backdrop-blur-md bg-background/70` |
| Hero image | `<motion.img>` + `<div className="voile-dust">` | parallax préservé via `heroRef` |
| Hero overlay | `bg-gradient-to-b from-bg-deep/85 via-bg-base/55 to-bg-base` | nouvelle palette |
| Titre H1 | `<TextReveal>` (MOTION_SPEC §1) | mot-par-mot, sweep up |
| Citation tournante | `<motion.p key={citIdx}>` ×5 + `AnimatePresence` | durée 5.5 s, easing seuil |
| Scroll indicator | `<ScrollBeam>` (MOTION_SPEC §3) | barre 2 px laiton, top:0, fixe |
| Sceau filigrane | `<Sceau className="opacity-20">` | `mix-blend-luminosity` |
| Triade | 3× `<TiltCard>` (MOTION_SPEC §11) | remplace les `<motion.div>` fade simple |
| Compteurs | 3× `<NumberTick>` (MOTION_SPEC §8) | countup depuis 0 |
| Image citation | `<motion.img>` + `bg-gradient` | 80dvh |
| CTA `<Magnetic>` | `<Magnetic strength={0.4}>` (MOTION_SPEC §2) | 2 boutons : consulter, ouvertures |
| Ornement | `<Ornement />` (existant) | trait SVG fin |
| Bottom nav | `<BottomNav>` (MOTION_SPEC §12) | `layoutId="nav-rule" + "nav-aura"` |
| Halo global | `<CursorHalo>` (MOTION_SPEC §7) | remplace `CursorVoile` |

### Animations déclenchées

| Élément | Trigger | Animation | Durée |
|---|---|---|---|
| Header | mount | `glass-1` fade-in | 0.4 s |
| Hero H1 | mount | `TextReveal` stagger 0.045 s/mot | 0.9 s + 5 mots = ~1.1 s |
| Citation | mount + interval | fade + y 12→0 cyclique | 1.0 s par transition |
| Triade cartes | `whileInView` | `TiltCard` parallax | continu |
| Compteurs | `whileInView amount:0.4` | countup 0 → value | 1.4 s |
| CTA | `pointermove` | magnétique ±16 px | ressort 150/18 |
| Page transition | pathname change | voile descendant | 0.95 s |

### Snippet clé — Hero refondu

```tsx
<section className="relative h-[100dvh] w-full overflow-hidden" aria-label={tr(copy.manifesto)}>
  <div ref={heroRef} className="absolute inset-0 will-change-transform" style={{ transform: "translate3d(0,0,0) scale(1.1)" }}>
    <img src={heroCanyon} alt="" aria-hidden="true" fetchPriority="high" decoding="async"
         className="absolute inset-0 w-full h-full object-cover opacity-55" />
  </div>
  {/* Overlays empilés */}
  <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/85 via-bg-base/55 to-bg-base" />
  <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-noir-profond/40 to-transparent" />
  <div className="absolute inset-0 vignette-mineral" />
  <div className="absolute inset-0 voile-dust opacity-50 anim-drift" />

  {/* Halo laiton d'ambiance (signature) */}
  <div className="halo-laiton absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full pointer-events-none" aria-hidden="true" />

  {/* Sceau filigrane */}
  <div className="absolute -top-20 -right-20 opacity-20 mix-blend-luminosity pointer-events-none">
    <Sceau className="w-[460px] h-[460px]" label={tr(copy.sealRing)} />
  </div>

  {/* Contenu */}
  <div className="relative h-full flex flex-col justify-between max-w-2xl mx-auto px-6 pt-24 pb-20">
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="h-px w-10 bg-laiton-300" />
        <p className="font-mono text-[10px] tracking-rituel uppercase text-laiton-300">
          {tr(copy.manifesto)}
        </p>
      </div>
      <h1 className="font-display text-[3.25rem] sm:text-[5rem] leading-hero tracking-hero">
        <TextReveal>{tr(copy.h1a)}</TextReveal><br />
        <em className="italic"><TextReveal delay={0.1}>{tr(copy.h1b)}</TextReveal></em><br />
        <TextReveal delay={0.2}>{tr(copy.h1c)}</TextReveal><br />
        <em className="italic text-laiton-300"><TextReveal delay={0.3}>L'Éclat.</TextReveal></em>
      </h1>
    </div>

    {/* Citation tournante */}
    <div className="space-y-4">
      <div className="h-20 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p key={citIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 1, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-0 font-serif italic text-xl text-voile-dim leading-snug">
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
```

---

## 2. `ScanPage.tsx` — Scanner

### Layout

```
┌─────────────────────────────────────────────────┐
│ ░ HEADER glass-1                                │
├─────────────────────────────────────────────────┤
│                                                 │
│         ⅲ · LE SCAN · MMXXVI                    │
│                                                 │
│      ┌─ ScanTrace SVG (200 px) ─┐               │
│      │  ·····●·····●·····●······│  ← lumen     │
│      │  ╱╲    ╱╲    ╱╲    ╱╲    │              │
│      │ ╱  ╲  ╱  ╲  ╱  ╲  ╱  ╲   │              │
│      │ ╲   ╲╱    ╲╱    ╲╱    ╲  │              │
│      │  ╲___╳_____╳______╳___╱  │              │
│      └──────────────────────────┘               │
│                                                 │
│         Visez la marque brodée                  │
│                                                 │
│      ┌──────────────────────────┐               │
│      │                          │               │
│      │    ⬤  Lancer le scan     │  ← Magnetic   │
│      │       (96×96 halo)       │               │
│      │                          │               │
│      └──────────────────────────┘               │
│                                                 │
│  · phase : awaiting                             │
│  · réseau : en ligne                            │
│  · statut : prêt                                │
│                                                 │
│  ─────────  Ornement  ─────────                 │
│  « Le fragment répondra. »                      │
│  « Quelqu'un est passé avant vous. »            │
└─────────────────────────────────────────────────┘
```

### Composants

| Zone | V2 | Notes |
|---|---|---|
| Titre | `font-mono` eyebrow + `TextReveal` titre | ⅲ · LE SCAN · MMXXVI |
| Visualisation | `<ScanTrace>` (MOTION_SPEC §5) | SVG 200×200 |
| Bouton | `<Magnetic>` (MOTION_SPEC §2) | halo laiton 96 px |
| Status pills | 3 chips mono | réseau, phase, statut |
| Citations | `<AnimatePresence>` crossfade | déjà présent, on garde |

### Snippet clé — Section scan

```tsx
<section className="relative max-w-2xl mx-auto px-6 pt-10 pb-16 text-center">
  <p className="font-mono text-[10px] tracking-rituel uppercase text-laiton-300 mb-3">
    ⅲ · {tr(copy.scanLabel)}
  </p>
  <h1 className="font-display text-5xl leading-display tracking-tight mb-8">
    <TextReveal>{tr(copy.scanTitle)}</TextReveal>
  </h1>

  <div className="my-10 mx-auto max-w-md">
    <ScanTrace />
  </div>

  <p className="font-serif italic text-voile-dim text-lg mb-10">
    {tr(copy.scanHint)}
  </p>

  <div className="flex justify-center">
    <Magnetic
      onClick={handleScan}
      className="relative w-24 h-24 rounded-full bg-bg-elevated border border-laiton/40
                 flex items-center justify-center halo-laiton"
      aria-label={tr(copy.scanTrigger)}
    >
      <ScanLine className="w-7 h-7 text-laiton-300" strokeWidth={1.25} />
    </Magnetic>
  </div>
</section>
```

---

## 3. `FragmentDetailPage.tsx` — Détail fragment

### Layout

```
┌─────────────────────────────────────────────────┐
│ ░ HEADER glass-1                                │
├─────────────────────────────────────────────────┤
│  ← Retour                                       │
│                                                 │
│  ┌── HERO IMAGE t-shirt porté (4:5) ──┐        │
│  │                                    │        │
│  │     [TiltCard]                     │        │
│  │                                    │        │
│  │  ┌─ Couture border laiton ─┐       │        │
│  │  │  fragment visuel        │       │        │
│  │  └─────────────────────────┘       │        │
│  └────────────────────────────────────┘        │
│                                                 │
│  · Ⅶ · FRAGMENT                                 │
│  Le seuil traversé                              │
│  ~Aperçu reconnu~                               │
│                                                 │
│  ╔═ LOI DU PASSAGE (couture border) ══╗         │
│  ║ « Cette couche s'ouvre seulement  ║         │
│  ║   après un lien confirmé. »       ║         │
│  ╚════════════════════════════════════╝         │
│                                                 │
│  ▒ MOTIF VISUEL                                  │
│  Texte narratif Source Serif 4 400              │
│  leading 1.55 ...                               │
│                                                 │
│  ▒ AU PORT (carte 3D tilt)                       │
│  ┌──── image porté + badge laiton ────┐         │
│  └────────────────────────────────────┘         │
│                                                 │
│  [ Voir la pièce textile ]  [ Ouvrir en AR ]    │
│                                                 │
│  · statut : reconnu                              │
│  · date : 17.VI.MMXXVI                           │
└─────────────────────────────────────────────────┘
```

### Composants

| Zone | V2 | Notes |
|---|---|---|
| Hero image | `<TiltCard>` sur `<motion.img>` | rotation ±5° au doigt |
| Border | `<div className="couture">` | 1 px dash laiton |
| Eyebrow | `font-mono text-[10px] tracking-rituel` Ⅶ | num romain |
| Titre | `<TextReveal>` `font-display text-5xl` | sweep up |
| Citation | bloc `border-l border-laiton-300 pl-4` | `font-serif italic` |
| Motif visuel | section `bg-elevated/60 border border-border/40 rounded-xl` | padding 24 |
| Au port | `<TiltCard>` + `halo-laiton` au hover | |
| CTAs | 2× `<Magnetic>` | Voir pièce + AR |
| Meta footer | 2 lignes mono 9 px `tracking-rituel` | date + statut |

### Snippet clé — Header fragment

```tsx
<Link to="/fragments" className="inline-flex items-center gap-2 px-6 pt-6
   text-voile-dim hover:text-laiton-300 transition-colors text-xs
   font-mono tracking-rituel uppercase">
  <ArrowLeft className="w-3 h-3" /> {tr(copy.back)}
</Link>

<div className="px-6 mt-2">
  <TiltCard max={5} className="relative aspect-[4/5] overflow-hidden
                                couture bg-bg-elevated">
    <img src={f.images!.worn} alt={`${f.name} porté`}
         fetchPriority="high" decoding="async"
         className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/70 to-transparent" />
    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
      <span className="font-mono text-[10px] tracking-rituel uppercase text-laiton-300">
        Ⅶ · {tr(copy.fragment)}
      </span>
      <span className="font-display italic text-2xl text-voile">{f.name}</span>
    </div>
  </TiltCard>
</div>
```

---

## 4. `FragmentsPage.tsx` — Index des dix passages

### Layout

```
┌─────────────────────────────────────────────────┐
│ ░ HEADER glass-1                                │
├─────────────────────────────────────────────────┤
│  HERO ÉDITORIAL 64dvh                           │
│  ┌─────────────────────────────────────────┐    │
│  │  bg hero-silhouette opacity 0.45        │    │
│  │  ╱╲  grand I romain italique 120 px     │    │
│  │  ·· PROGRESSION · 10 FRAGMENTS          │    │
│  │  Dix passages                           │    │
│  │  *à approcher*                          │    │
│  │  ── Ornement ──                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Index des passages (grille 2 col mobile)       │
│  ┌────────┐ ┌────────┐                          │
│  │  ⅰ.1   │ │  ⅰ.2   │                          │
│  │ ✦      │ │ ░voilé │                          │
│  │ Nom    │ │ Voilé  │                          │
│  │ →      │ │        │                          │
│  └────────┘ └────────┘                          │
│  ┌────────┐ ┌────────┐                          │
│  │  ⅰ.3   │ │  ⅰ.4   │  ...                     │
│                                                 │
│  · 5 éveillés · 5 voilés · reconnu              │
└─────────────────────────────────────────────────┘
```

### Composants

| Zone | V2 |
|---|---|
| Hero | `<Sceau>` filigrane, `voile-dust anim-drift`, `<TextReveal>` titre |
| Index | grille 2 col, chaque carte `<StickyNoteUnfold>` pour preview/détail |
| Carte éveillée | `<TiltCard>` + `halo-laiton` + check icon |
| Carte voilée | surface `--bg-elevated` opacity 0.4, cadenas, pas d'interaction |
| Footer compteur | 3 chips mono inline |

### Snippet clé — Carte fragment

```tsx
{fragments.map((f, i) => {
  const unlocked = f.unlocked;
  return (
    <motion.div
      key={f.id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {unlocked ? (
        <TiltCard max={4} className="relative aspect-[3/4] overflow-hidden rounded-xl
                                       border border-laiton-700/40 bg-bg-elevated halo-laiton">
          <Link to={`/fragments/${f.id}`} className="block h-full">
            <img src={f.images?.worn} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/90 to-transparent" />
            <span className="absolute top-3 left-3 font-mono text-[9px] tracking-rituel uppercase text-laiton-300">
              ⅰ.{i + 1}
            </span>
            <span className="absolute bottom-3 left-3 right-3">
              <p className="font-display text-xl text-voile leading-tight">{f.name}</p>
              <p className="font-mono text-[9px] tracking-rituel uppercase text-voile-dim mt-1">
                {tr(copy.recognized)}
              </p>
            </span>
          </Link>
        </TiltCard>
      ) : (
        <div className="relative aspect-[3/4] rounded-xl border border-border/40 bg-bg-elevated/40
                        flex flex-col items-center justify-center gap-3">
          <Lock className="w-6 h-6 text-voile-fantome" strokeWidth={1.25} />
          <span className="font-mono text-[9px] tracking-rituel uppercase text-voile-ombre">
            {tr(copy.veiledLabel)}
          </span>
        </div>
      )}
    </motion.div>
  );
})}
```

---

## 5. `ProfilPage.tsx` — Sceau du porteur

### Layout

```
┌─────────────────────────────────────────────────┐
│ ░ HEADER glass-1                                │
├─────────────────────────────────────────────────┤
│  · PROFIL PORTEUR                               │
│  ┌──── SCEAU central (240 px) ────┐             │
│  │                                │             │
│  │       ◆ halo laiton respire     │             │
│  │       [Sceau SVG animé]        │             │
│  │                                │             │
│  └────────────────────────────────┘             │
│                                                 │
│  Cérès                                          │
│  ~Niveau Ⅲ~                                    │
│                                                 │
│  ┌── STATS grille 3 col ──────────┐             │
│  │ passages | fragments | skins │              │
│  │   12    |   7 / 10   |  4/12  │              │
│  └────────────────────────────────┘             │
│                                                 │
│  ╔═ PROGRESSION (couture border) ══╗             │
│  ║ ▰▰▰▰▰▰▱▱▱▱  60 %               ║             │
│  ╚════════════════════════════════╝             │
│                                                 │
│  ▒ PROCHAINE HISTOIRE (StickyNoteUnfold)        │
│  [▸ Lire l'aperçu]                             │
│                                                 │
│  ▒ MES PIÈCES (liste)                           │
│  · Canyon T-01 (reconnu)                        │
│  · Silhouette T-02 (à venir)                    │
│                                                 │
│  [ Se déconnecter ]   [ Synchroniser ]          │
└─────────────────────────────────────────────────┘
```

### Composants

| Zone | V2 |
|---|---|
| Sceau | `<Sceau>` + `<div className="halo-laiton">` + animation `anim-respire` |
| Stats | 3× `<NumberTick>` (countup) |
| Barre progression | `<div className="couture">` contenant une `bg-gradient-to-r from-laiton-900 to-laiton-300` |
| Histoire | `<StickyNoteUnfold>` avec preview `font-serif italic` |
| Pièces | liste `<motion.li>` avec `whileInView` stagger |
| Actions | 2× `<Magnetic>` ou `<TapButton>` (motion.tsx) |

### Snippet clé — Sceau central + progression

```tsx
<section className="relative overflow-hidden px-6 pt-14 pb-10 text-center">
  <div className="absolute inset-0 voile-dust opacity-30 pointer-events-none" />
  <div className="relative">
    <p className="font-mono text-[10px] uppercase tracking-rituel text-laiton-300 mb-6">
      {tr(copy.profileLabel)}
    </p>

    <div className="relative w-60 h-60 mx-auto mb-6">
      <div className="halo-laiton absolute inset-0 rounded-full" aria-hidden="true" />
      <motion.div
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        className="relative w-full h-full"
      >
        <Sceau className="w-full h-full drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]" />
      </motion.div>
    </div>

    <h1 className="font-display text-5xl mb-1">{state.name}</h1>
    <p className="font-serif italic text-laiton-300 mb-8">
      {tr(copy.level)} {toRoman(level)}
    </p>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-4 mb-8">
      <Stat label={tr(copy.attempts)}>
        <NumberTick value={state.qualifiedProgressPoints}
                    format={new Intl.NumberFormat(lang)} />
      </Stat>
      <Stat label={tr(copy.fragments)}>
        <NumberTick value={state.collected.length} /> <span className="text-voile-dim">/ 10</span>
      </Stat>
      <Stat label={tr(copy.skins)}>
        <NumberTick value={visibleSkins.length} /> <span className="text-voile-dim">/ {AR_SKINS.length}</span>
      </Stat>
    </div>

    {/* Progression couture */}
    <div className="couture p-4 mb-6">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-rituel uppercase text-voile-dim mb-2">
        <span>{tr(copy.progression)}</span>
        <span>{state.qualifiedProgressPoints} / X</span>
      </div>
      <div className="h-2 rounded-full bg-bg-deep overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${(state.qualifiedProgressPoints / target) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-gradient-to-r from-laiton-900 via-laiton-500 to-laiton-100
                     shadow-[0_0_12px_hsl(36_60%_70%/0.5)]"
        />
      </div>
    </div>
  </div>
</section>
```

---

## 6. `AppLayout.tsx` — Shell

### Layout

```
┌─────────────────────────────────────────────────┐
│ ░ glass-1 sticky top                            │  ← 56 px + safe-top
│  Wordmark  · ·  LangSwitch  Bag  Pseudo         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Halo d'ambiance (fixed inset-0 z-0)            │  ← voile-dust opacity 30
│  <CursorHalo />  <ScrollBeam />                 │
│  <CartDrawer />  <BridgeDebugPanel />           │
│                                                 │
│  <motion.main> ← page content                   │
│  key={pathname}                                 │
│  PageTransition : voile descendant              │
│                                                 │
│  Footer (sauf /scan)                            │
│                                                 │
├─────────────────────────────────────────────────┤
│ ░ glass-2 BottomNav fixed bottom 60 px          │  ← layoutId morph
│  Frag Boutique Scan Histoire Profil             │
└─────────────────────────────────────────────────┘
```

### Composants

| Zone | V2 |
|---|---|
| Halo | `<div className="voile-dust opacity-30" />` (existant `ciel-poussiere` conservé en alias) |
| Cursor | `<CursorHalo />` (remplace `CursorVoile`) |
| Scroll | `<ScrollBeam />` |
| Header | `glass-1` (nouveau) au lieu de `backdrop-blur-md bg-background/70` |
| Cart | `<CartDrawer />` (existant) |
| Main | wrap dans `<PageTransition>` |
| Footer | `<Footer />` (existant) |
| Nav | `<BottomNav />` (nouveau, MOTION_SPEC §12) |

### Snippet clé — AppLayout refondu

```tsx
return (
  <div className="relative min-h-[100dvh] flex flex-col">
    <OfflineBanner />
    <UnityWebViewStatus />
    <Onboarding />

    {/* Halo d'ambiance + outils globaux */}
    <div className="pointer-events-none fixed inset-0 z-0 voile-dust opacity-30 anim-drift" />
    {!insideUnityHost && <CursorHalo />}
    {!insideUnityHost && <ScrollBeam />}
    <CartDrawer />
    <BridgeDebugPanel />

    {/* Header glass-1 */}
    <header className="sticky top-0 z-30 glass-1"
            style={{ paddingTop: "var(--safe-top)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 group tap" aria-label="L'Éclat">
          <Wordmark size={18} className="transition group-hover:[text-shadow:0_0_28px_hsl(36_38%_54%/0.4)]" />
          <span className="font-mono text-[8px] tracking-rituel text-voile-dim/50 uppercase hidden sm:block border-l border-border/60 pl-3">
            Drop 01
          </span>
        </NavLink>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <LanguageSwitch compact />
          <button onClick={() => setOpen(true)}
                  className="relative tap flex items-center justify-center text-voile-dim hover:text-laiton-300 active:text-laiton-300 transition"
                  aria-label={tr(appCopy.cart)}>
            <Bag className="w-5 h-5" strokeWidth={1.25} />
            {count > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-laiton-500 text-primary-foreground font-mono text-[9px] tracking-rituel flex items-center justify-center rounded-full">
                {count}
              </span>
            )}
          </button>
          <NavLink to="/profil"
                   className="tap flex max-w-[88px] items-center gap-1.5 px-1 font-mono text-[9px] uppercase tracking-normal text-voile-dim transition hover:text-laiton-300 sm:max-w-[150px] sm:gap-2 sm:px-2 sm:text-[10px] sm:tracking-rituel">
            <span className="w-1.5 h-1.5 rounded-full bg-laiton-500 anim-respire shrink-0" />
            <span className="truncate">{state.profile.pseudo} · {toRoman(state.profile.level)}</span>
          </NavLink>
        </div>
      </div>
    </header>

    {/* Page transition wrapper */}
    <PageTransition>
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto pb-nav">
        {children}
        {!scanRoute && <Footer />}
      </main>
    </PageTransition>

    <BottomNav />
  </div>
);
```

---

## 7. Mapping transitions animations → pages

| Page | Mount | Scroll | Pointer | Success |
|---|---|---|---|---|
| Index | TextReveal (H1), voile-dust démarre, citation cycle | TiltCard parallax, NumberTick countup, progress bar | Magnetic CTAs | page transition voile descendant |
| Scan | ScanTrace draw 2.4 s, halo-respire sur bouton | parallax léger | Magnetic ±16 px, haptic Light | modal fragment unlock |
| FragmentDetail | TiltCard image, TextReveal titre, fade overlays | sticky couture bar | Tilt parallax image | retour voile ascendant |
| Fragments | Sceau filigrane, stagger grille (0.07 s/item) | stagger on scroll | TiltCard carte, hover halo | page transition voile |
| Profil | Sceau rotatif 90 s (decoratif), halo-respire, NumberTick stagger 0.15 s | sticky couture bar progression | StickyNoteUnfold histoire | modale sync out |
| AppLayout | splash voile 1.4 s, glass-1 fade | ScrollBeam continu, CursorHalo follow | BottomNav layoutId morph | — |

---

## 8. Check-list QA par page

- [ ] Tester `prefers-reduced-motion: reduce` → toutes les keyframes CSS désactivées, les `whileInView` deviennent du mount instantané.
- [ ] Tester `data-lang="ar"` → direction `rtl`, `font-family` switch, citations alignées à droite, `<ArrowLeft>` flip en `<ArrowRight>`.
- [ ] Tester dans Unity WebView (`data-unity-webview="1"`) → `backdrop-filter` désactivé, animations CPU-only, scanne les perfs avec 30 fragments en grille.
- [ ] Lighthouse mobile : viser 90+ perf, 95+ accessibilité, 100 best practices.
- [ ] Contraste : tous les textes `--voile` sur `--bg-base` = 13.8:1 (AAA) ; `--voile-dim` = 7.1:1 (AAA) ; `--laiton-500` = 6.4:1 (AA large, AA normal si ≥ 18 px).
- [ ] Touch targets ≥ 44×44 px sur tous les boutons (vérifier `BottomNav` icônes 18 px → padding parent ≥ 22 px chacun côté).
- [ ] Safe areas iOS : `env(safe-area-inset-*)` pris en compte dans header + bottom-nav.
- [ ] Fallback fonts : si Google Fonts KO, on retombe sur `Georgia` (display) + `serif` (body) — déjà déclaré dans le stack.
