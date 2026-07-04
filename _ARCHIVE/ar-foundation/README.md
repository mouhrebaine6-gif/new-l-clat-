# Archive — Tracking AR Foundation (remplacé par Vuforia)

Ces scripts étaient le système de **suivi d'image AR Foundation** de L'ÉCLAT,
archivés lors de la migration vers **Vuforia** (juin 2026). Ils sont **hors du
dossier `Assets/`** : ils ne compilent plus, mais restent disponibles comme repli.

## Fichiers
- `LeclatArRuntime.cs` — version AR Foundation (ARSession + ARTrackedImageManager).
  ⚠️ Une **nouvelle** version Vuforia (même nom, même `BeginScan`) vit désormais
  dans `Assets/LECLAT/Scripts/`.
- `LeclatImageTrackingPoller.cs` — version AR Foundation (`trackablesChanged`).
  ⚠️ Remplacée par une version Vuforia (mêmes events `TrackingStateChanged` +
  `FragmentRecognized`) dans `Assets/LECLAT/Scripts/`.
- `LeclatFragmentReferenceImageLoader.cs` — chargeait les 10 marqueurs dans un
  `MutableRuntimeReferenceImageLibrary`. **Obsolète** avec Vuforia (database
  on-device). Aucun remplaçant.
- `*.meta` — conservés pour préserver les GUID si réactivation.
- `markers/` — les 10 marqueurs JPG fragments (ex-`Resources/LECLAT` +
  `StreamingAssets/LECLAT/Markers`), retirés du build Vuforia (la database
  remplace les marqueurs). À recopier si réactivation AR Foundation.

## Réactiver AR Foundation (si besoin)
1. Le package `com.unity.xr.arfoundation` est **toujours installé** (non supprimé).
2. Recopier ces `.cs` (+`.meta`) dans `Assets/LECLAT/Scripts/` en écrasant les
   versions Vuforia (ou les renommer pour cohabiter).
3. Rétablir le rig AR dans la scène (`AR Session`, `XR Origin`, `ARCameraManager`,
   `ARTrackedImageManager`) — cf. `Assets/LECLAT/README.md`.
4. Retirer / désactiver les composants de tracking Vuforia.

> Contrat de pont `eclatBridgeContract.ts`, GREE WebView et `LeclatNativeBridge`
> sont restés **inchangés** pendant la migration : SCAN_RESULT / AR_RESULT /
> TRACKING gardent le même format.
