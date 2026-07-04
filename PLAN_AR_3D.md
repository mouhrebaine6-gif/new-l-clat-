# Plan AR 3D — LECLAT (10 fragments × AR + 3D)
**Date** : 2026-06-18
**Statut** : ✅ Tous les marqueurs + ailes générés, bridge mappé des 2 côtés.

---

## 1. Vue d'ensemble

Le projet a maintenant **10 marqueurs AR** (1 par fragment narratif) et **10 ailes 3D** (modèles glTF/glb optimisés mobile) mappés dans :
- le bridge React (`eclatBridgeContract.ts`)
- un registry Unity (`LeclatFragmentRegistry.cs`)
- un script de tracking AR (`LeclatImageTrackingPoller.cs` étendu)

---

## 2. 10 marqueurs AR

### Source
Photos de fragments buildés : `D:/LECLAT/InterfaceFinal/leclat-ui-perfect/public/fragments/<fragment>.jpg`

### Traitement appliqué
- Recadrage carré 512×512 px (fit cover, position center)
- Sharpen (sigma 1.2) → augmente les features AR
- Normalize histogramme → max de contraste
- Saturation +10% → couleurs plus riches
- JPG qualité 90 mozjpeg
- Profil sRGB

### Destination
- `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/StreamingAssets/LECLAT/Markers/FRAGMENT_<NAME>_MARKER.jpg`
- `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/Resources/LECLAT/FRAGMENT_<NAME>_MARKER.jpg` (chargement runtime possible)

### Fichiers générés (10)
```
FRAGMENT_ASCENSION_MARKER.jpg  15 055 octets
FRAGMENT_ATOME_MARKER.jpg      26 223
FRAGMENT_ECLIPSE_MARKER.jpg    16 815
FRAGMENT_EVEIL_MARKER.jpg      30 724
FRAGMENT_FORGE_MARKER.jpg      35 244
FRAGMENT_HORIZON_MARKER.jpg    17 166
FRAGMENT_ORIGINE_MARKER.jpg    18 719
FRAGMENT_PRISME_MARKER.jpg     32 645
FRAGMENT_RESONANCE_MARKER.jpg  24 386
FRAGMENT_SOUFFLE_MARKER.jpg     9 157
```

### Script de régénération
`D:/LECLAT/_gen_markers.js` — relancer après chaque modif de visuel.

---

## 3. 10 ailes 3D

### Source
`D:/LECLAT/ModelLibrary_Curated/AR_READY_SELECTION_20260515/01_WINGS_BACK_ATTACHMENT/`

### Critères de sélection
- style_score ≥ 3 (éditorial sobre, pas fantasy)
- mobile_score ≥ 4 (déjà optimisé mobile)
- ar_score ≥ 4 (déjà optimisé AR)
- license = TEST_OK (pas IP-risky)
- Taille raisonnable

### Priorité copie
1. `MOBILE_OPTIMIZED/` (équilibre qualité/perf)
2. `MOBILE_LITE/` (perf max)
3. `RAW_COPY/` (qualité max)

### Mapping final

| Fragment | Modèle source | Type | Taille | Justification |
|---|---|---|---|---|
| eveil | MODEL_0188_angel_wings | .glb | 348 Ko | sobres, parfaites prologue (Fosse/Ishiguro) |
| souffle | MODEL_0500_wing_379 | .glb | 568 Ko | légères, aériennes |
| forge | MODEL_0312_dragon_wings_blue | .glb | 310 Ko | puissantes, parfaites pour la Forge |
| prisme | MODEL_0215 (Textured) | .glb | 1.1 Mo | géométriques, à facettes |
| atome | MODEL_0324_scene | .gltf+bin | ~5 Ko | structure atomique, petites particules |
| eclipse | MODEL_0240_angel_wings_1 | .glb | 2.2 Mo | sombres, parfaites pour éclipse |
| horizon | MODEL_0135_scene | .gltf+bin | ~5 Ko | vaste, atmosphérique |
| resonance | MODEL_0188_angel_wings (fallback) | .glb | 348 Ko | sobre, harmonique |
| ascension | MODEL_0252_angel-wings | .glb | 3.4 Mo | verticales, parfaites pour ascension |
| origine | MODEL_0225_wings | .glb | 2.0 Mo | originelles, simples |

**Note** : eclipse (2.2 Mo), ascension (3.4 Mo), origine (2.0 Mo) sont au-dessus du seuil "mobile" recommandé (1 Mo). À optimiser avec `gltf-transform optimize` ou un script Node + `gltf-pipeline` si tu vois des chutes de FPS. Les autres sont OK.

### Destination
- 8 fichiers : `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/StreamingAssets/LECLAT/Models/back_wings/FRAGMENT_<NAME>.glb`
- 2 dossiers (atome, horizon) : `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/StreamingAssets/LECLAT/Models/back_wings/FRAGMENT_<NAME>/scene.gltf` + `scene.bin`

### Script de régénération
`D:/LECLAT/_gen_wings.js` — relancer si tu changes d'ailes.

---

## 4. Mapping bridge React → Unity

### Côté React : `src/lib/eclatBridgeContract.ts`
Ajout de :
- `FragmentArMapping` (type)
- `FRAGMENT_AR_MAPPING` (constante avec 10 entrées)
- `FRAGMENT_AR_IDS` (array des clés)

Chaque entrée contient :
- `fragmentId`, `markerName`, `modelPath`
- `scale` (0.14-0.24 m, taille des ailes au-dessus du marqueur)
- `anchor` (Vector3 offset en mètres, axe Y = hauteur)
- `animation` : "idle" | "breathe" | "flare" | "spiral"

### Côté Unity : `Assets/LECLAT/Scripts/LeclatFragmentRegistry.cs` (nouveau)
- `FragmentDefinition` (struct)
- `FragmentAnimation` (enum)
- `LeclatFragmentRegistry.All` (array 10 entrées synchronisées)
- `TryGetByMarkerName()`, `TryGetByFragmentId()` (lookups)

### Côté Unity : `Assets/LECLAT/Scripts/LeclatImageTrackingPoller.cs` (modifié)
- `Forward()` utilise maintenant `LeclatFragmentRegistry.TryGetByMarkerName` pour résoudre le `fragmentId` à partir du `markerName`
- Le `fragmentId` est passé à `wingsController.ReportTrackedPose()` au lieu du nom brut du marker

---

## 5. Optimisations à faire plus tard (backlog)

1. **Compresser les 3 grosses ailes** (eclipse 2.2 Mo, ascension 3.4 Mo, origine 2.0 Mo) avec `gltf-transform optimize --texture-compress webp`
2. **Réduire les polygones** des ailes > 5000 triangles : `gltf-transform simplify` (à tester)
3. **Textures atlas** : 1 atlas partagé pour les 10 ailes → 1 draw call au lieu de 10
4. **Convertir les .gltf + .bin** en .glb unique (plus simple à charger)
5. **Self-host les marqueurs** : les JPG sont déjà dans `Assets/Resources/LECLAT/` pour runtime, mais c'est ~250 Ko total, rien de critique

---

## 6. Build & QA

### Build React
```bash
cd "D:/LECLAT/InterfaceFinal/leclat-ui-perfect"
npx vite build  # ✓ 10.47s, 0 erreur TS
```

### Régénération marqueurs
```bash
cd "D:/LECLAT" && node _gen_markers.js
```

### Régénération ailes
```bash
cd "D:/LECLAT" && node _gen_wings.js
```

### QA mobile (à faire avec un device Android + Unity)
1. Build Unity : `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/` (besoin de Unity Editor 2022.3+ avec AR Foundation 6.4)
2. Les 10 JPG doivent être ajoutés au `MutableRuntimeReferenceImageLibrary` d'AR Foundation (ou comme `XRReferenceImageLibrary` static au build)
3. Tester chaque fragment sur un t-shirt réel
4. Vérifier que les ailes s'orientent correctement (pivot au centre du marqueur)

---

## 7. Photos du t-shirt

Si tu m'envoies une photo du t-shirt physique que tu veux faire tracker :
1. Je peux ajuster le marqueur pour qu'il colle mieux au rendu physique (impression, broderie, lumière)
2. Je peux choisir une autre photo source (par exemple la photo `.webp` au lieu de `.jpg` du fragment concerné)
3. Je peux ajouter du preprocessing (redresser, débruiter) avant le sharpen

---

## 8. Résumé en 2 phrases

**Tout est en place** : 10 marqueurs JPG 512×512 (légers, 9-35 Ko chacun), 10 ailes 3D optimisées mobile (2 dossiers gltf + 8 .glb), et le bridge React↔Unity est mappé des 2 côtés via une source de vérité unique (`FRAGMENT_AR_MAPPING` côté React, `LeclatFragmentRegistry` côté Unity).

**Pour passer en prod mobile** : (1) ouvrir le projet Unity, ajouter les 10 marqueurs JPG à un `XRReferenceImageLibrary`, (2) éventuellement optimiser les 3 grosses ailes (eclipse, ascension, origine), (3) tester sur device Android avec un t-shirt physique.
