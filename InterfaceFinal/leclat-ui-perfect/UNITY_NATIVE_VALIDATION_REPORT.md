# L'ECLAT - Unity Native Validation Report

## Verdict

La WebUI est prete a envoyer les bons messages Unity. Unity Hub reference bien un projet `LECLAT_AR_Mobile`, et le dossier physique a ete restaure a `D:\LECLAT\UnityProjects\LECLAT_AR_Mobile`. Le projet original n'a pas ete retrouve; il s'agit donc d'une reconstruction propre du dossier Unity attendu avec WebUI, manifest modeles et scripts natifs de pont.

## Recherche effectuee

Emplacements inspectes:

- `D:\LECLAT`
- `C:\Users\mouhr\Documents`
- `C:\Users\mouhr\Desktop`

Constat initial:

- Aucun `ProjectSettings/ProjectVersion.txt` trouve.
- Aucun fichier `.unity`, `.prefab`, `.cs` trouve dans les emplacements probables.
- `D:\LECLAT` contient `Cache`, `InterfaceFinal`, `ModelLibrary_Curated`, mais pas de projet Unity actif.
- Unity Hub contient une entree `LECLAT_AR_Mobile` vers `D:\LECLAT\UnityProjects\LECLAT_AR_Mobile`.
- `D:\LECLAT\UnityProjects\LECLAT_AR_Mobile` n'existe pas actuellement; `D:\LECLAT\UnityProjects` n'existe pas non plus.

Etat apres restauration:

- Projet cree a `D:\LECLAT\UnityProjects\LECLAT_AR_Mobile`.
- WebUI copiee dans `Assets\StreamingAssets\LECLAT\WebUI`.
- Manifest de 10 modeles GLB cree dans `Assets\StreamingAssets\LECLAT\Models\manifest.json`.
- Scripts natifs ajoutes dans `Assets\LECLAT\Scripts`.
- Rapport de restauration ajoute: `D:\LECLAT\UnityProjects\LECLAT_AR_Mobile\LECLAT_UNITY_RESTORE_REPORT.md`.

## WebUI bridge valide cote React

Messages sortants disponibles:

- `WEB_READY`
- `SCAN_REQUEST`
- `SCAN_CANCEL`
- `AR_LAUNCH`
- `HAPTIC_REQUEST`
- `NAV_BACK`
- `NAV_STATE`

Messages entrants acceptes:

- `DEVICE_INFO`
- `SCAN_READY`
- `SCAN_RESULT`
- `SCAN_CANCEL`
- `NAV_TO_PAGE`
- `NAV_BACK_REQUEST`
- `ERROR`

Protection:

- `SCAN_RESULT` exige un `qr_token`.
- En production, `SCAN_RESULT` doit renvoyer le `nonce` de session.

## build:unity

Ancien etat:

- Le script copiait par defaut vers `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/StreamingAssets/LECLAT/WebUI`.
- Ce chemin pouvait recreer un ancien projet fantome si le dossier Unity reel avait ete deplace ou supprime.

Nouvel etat:

- Le script utilise `LECLAT_UNITY_PROJECT_DIR` ou `LECLAT_UNITY_WEBUI_DIR` si ces variables sont definies.
- Sinon, il detecte automatiquement dans Unity Hub le projet `LECLAT_AR_Mobile`.
- Il verifie `ProjectSettings/ProjectVersion.txt`.
- Il refuse toute copie hors `Assets/StreamingAssets`.
- Si Unity Hub pointe vers un dossier absent ou invalide, il echoue avec un message explicite au lieu de copier ailleurs.
- Test negatif avant restauration: ECHEC attendu, dossier Unity absent/invalide.
- Test positif apres restauration: `npm run build:unity` OK, copie WebUI OK.

## Ce qui doit etre valide dans Unity

1. Ouvrir le projet restaure dans Unity Hub et laisser Unity finir l'import complet.
2. Unity doit demarrer `ARSession`.
3. Unity doit activer `ARCameraManager` avec camera arriere.
4. Unity doit renvoyer `SCAN_READY` quand la camera est vraiment ouverte.
5. Unity doit renvoyer `SCAN_RESULT` avec `nonce`, `qr_token`, `fragment_hint`, `pose_quality` si disponible.
6. `AR_LAUNCH` doit charger le modele correspondant a `fragment_id`.
7. Le modele doit venir d'un manifest/registry, pas d'un prefab de test hardcode.
8. Les GLB choisis doivent etre legalement utilisables; la librairie actuelle contient beaucoup d'assets en licence inconnue.

## Commande correcte quand le projet Unity actif existe

PowerShell:

```powershell
$env:LECLAT_UNITY_PROJECT_DIR = "D:\chemin\vers\ProjetUnityActif"
npm run build:unity
```

Ou:

```powershell
$env:LECLAT_UNITY_WEBUI_DIR = "D:\chemin\vers\ProjetUnityActif\Assets\StreamingAssets\LECLAT\WebUI"
npm run build:unity
```
