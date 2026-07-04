# L'ÉCLAT — Préparer le BUILD PROD (Android, Vuforia)

> **À exécuter quand tu auras un téléphone.** Aujourd'hui : NE PAS builder.
> Le projet compile VERT en éditeur ; ce doc liste ce qu'il faut régler pour
> produire un AAB qui passe le Play Store.

## 1. Player Settings — Android (obligatoire)
Edit > Project Settings > Player > Android :
- **Scripting Backend = IL2CPP** (actuellement Mono → refusé en 64-bit)
- **Target Architectures = ARM64** (décoche ARMv7) — requis Play Store + ARCore
- **Managed Stripping Level = High** (réduit la taille de l'app)
- **Minimum API Level ≥ 24** (ARCore) — actuellement 25 ✅
- **Target API Level = 35** ✅

## 2. Windows — pagefile
Le build **IL2CPP** est gourmand en RAM. Si le build échoue (mémoire) :
- Panneau de config > Système > Paramètres système avancés > Performances >
  Avancé > Mémoire virtuelle → augmenter le **pagefile** (ex. 16–32 Go).

## 3. Nettoyage build (TOUTE DERNIÈRE étape, juste avant de builder)
Ces packages sont **dev/éditeur uniquement** — à retirer pour un build propre.
⚠️ Retirer le **plugin MCP coupe la connexion à Unity** → le faire en DERNIER.
À retirer (Package Manager) :
- `com.ivanmurzak.unity.mcp` (+ les 10 extensions `*.animation/.cinemachine/.inputsystem/.navigation/.particlesystem/.probuilder/.splines/.terrain/.tilemap/.timeline`)
- `com.unity.ai.assistant` (Unity Assistant)
- 1 des 2 IDE (`com.unity.ide.rider` OU `com.unity.ide.visualstudio`)

> Après retrait : rouvrir, vérifier compil VERTE, PUIS builder.

## 4. Vuforia — déjà prêt ✅
- Licence posée dans `Assets/Resources/VuforiaConfiguration.asset` (**hors-git**, gitignore OK).
- Database **LECLAT** (cible `b4e2f9ff-628c-477e-9354-73a741278ced`, 10 cm) importée.
- ARCore = **Optional** · Track Device Pose = **ON** (Fusion gère niveaux 1+2).
- Optimisations tracking appliquées (code) : **autofocus continu** + **WorldCenterMode = DEVICE**.
- Permission caméra : gérée par `LeclatAndroidManifestPostprocessor` au build.

## 5. Étapes de build
1. File > Build Settings > Android > Switch Platform (si pas déjà).
2. Régler 1–3 ci-dessus.
3. Brancher le téléphone (USB debugging) OU Build (AAB).
4. Tester : caméra s'ouvre → scanner le logo → ailes colorées ancrées → si cible perdue, mode gyro (jamais d'écran noir).

## 6. Vérif device (checklist)
- [ ] Permission caméra demandée
- [ ] `SCAN_READY` reçu côté web
- [ ] Détection logo → ailes du bon fragment + bonne couleur
- [ ] Tracking stable quand le t-shirt bouge (autofocus)
- [ ] Cible perdue → bascule gyro (overlay visible, pas d'écran noir)
- [ ] `SCAN_RESULT` / `AR_RESULT` / `TRACKING` au format contrat (pont intact)
- [ ] FPS acceptable (≥ 30)

## 7. Repli AR Foundation
Archivé dans `D:\LECLAT\_ARCHIVE\ar-foundation\` (scripts + marqueurs + README).
Le package AR Foundation reste installé. Réactivation : voir le README de l'archive.
