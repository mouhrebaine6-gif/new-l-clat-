# Unity Android AAB Preflight - 2026-06-17

## Objectif

Preparer LECLAT pour une validation Unity batch puis un build Android App Bundle (`.aab`) compatible Google Play.

## Sources officielles consultees

- Google Play target API: https://developer.android.com/google/play/requirements/target-sdk
- Unity Google Play delivery requirements: https://docs.unity3d.com/6000.3/Documentation/Manual/android-distribution-google-play.html
- Unity Android target API setup: https://docs.unity3d.com/6000.4/Documentation/Manual/android-setup-target-api.html
- Unity Android requirements: https://docs.unity3d.com/6000.4/Documentation/Manual/android-requirements-and-compatibility.html
- Unity Android build process: https://docs.unity3d.com/Manual/android-BuildProcess.html

## Changements appliques avant lancement Unity

- `Assets/LECLAT/Editor/LeclatBuild.cs`
  - Ajout de `LeclatBuild.AndroidAab` et `LeclatBuild.AndroidReleaseAab`.
  - Build AAB par defaut vers `D:/LECLAT/Builds/Android/LECLAT_AR.aab`.
  - Release non-development pour AAB.
  - Force Android App Bundle, IL2CPP, ARM64, min SDK 25, target API 35 par defaut.
  - Support optionnel `-targetApi 36`.
  - Support de signature via `LECLAT_KEYSTORE_PATH`, `LECLAT_KEYSTORE_PASS`, `LECLAT_KEY_ALIAS`, `LECLAT_KEY_PASS`.
- `Assets/LECLAT/Editor/LeclatProjectSetup.cs`
  - Min SDK aligne sur 25.
  - Target API aligne sur 35.
- `ProjectSettings/ProjectSettings.asset`
  - `companyName: LECLAT`.
  - `productName: LECLAT`.
  - `AndroidTargetSdkVersion: 35`.
  - `AndroidIsGame: 0` pour classer l'app comme app AR/fashion, pas jeu.
- `Assets/LECLAT/README.md`
  - Commande AAB ajoutee.
  - Documentation validation corrigee: `LeclatValidate.Run` attend `19/19 PASS`.

## Preflight locale sans lancement Unity

- Unity Editor detecte: `C:/Program Files/Unity/Hub/Editor/6000.4.5f1/Editor/Unity.exe`.
- Android Build Support present.
- Android SDK present.
- Android NDK present.
- OpenJDK present.
- SDK platforms installees: `android-34`, `android-35`, `android-36`.
- Unity enum detectee dans `UnityEditor.dll`: `AndroidApiLevel35`, `AndroidApiLevel36`, `AndroidApiLevelAuto`.
- Scene build existe: `Assets/LECLAT/Scenes/Main.unity`.
- Scene active dans `EditorBuildSettings.asset`.
- Packages: AR Foundation 6.4.3, ARCore 6.4.3, glTFast 6.19.0.
- WebUI embarquee existe: `Assets/StreamingAssets/LECLAT/WebUI/index.html`.
- WebUI: 0 extension bloquee (`.bak`, `.jsx`, `.log`, `.map`, `.meta`, `.tmp`, `.ts`, `.tsx`).
- Model manifest: 10 entrees, 10 GLB, 0 manquant, 0 extra, 0 texture >512 px.

## Points non resolus avant build pro

- Les variables de signature `LECLAT_KEYSTORE_*` sont toutes absentes. Un AAB peut etre tente, mais il ne sera pas upload-ready Google Play sans vraie cle d'upload.
- Les 10 modeles 3D restent `productionApproved: false`; validation licence necessaire avant publication.
- Le dernier log Unity indiquait encore un blocage licence: `No valid Unity Editor license found`, return code 198. La prochaine commande confirmera si c'est encore vrai.

## Commandes prevues ensuite

```bat
"C:\Program Files\Unity\Hub\Editor\6000.4.5f1\Editor\Unity.exe" -batchmode -quit -projectPath D:\LECLAT\UnityProjects\LECLAT_AR_Mobile -executeMethod Leclat.AR.Editor.LeclatValidate.Run -logFile D:\LECLAT\UnityProjects\LECLAT_AR_Mobile\validate-aab-preflight.log
```

```bat
"C:\Program Files\Unity\Hub\Editor\6000.4.5f1\Editor\Unity.exe" -batchmode -quit -projectPath D:\LECLAT\UnityProjects\LECLAT_AR_Mobile -buildTarget Android -executeMethod Leclat.AR.Editor.LeclatBuild.AndroidAab -targetApi 35 -logFile D:\LECLAT\UnityProjects\LECLAT_AR_Mobile\build-aab.log
```
## Resultat validation batch apres preflight

Commande lancee:

```bat
"C:\Program Files\Unity\Hub\Editor\6000.4.5f1\Editor\Unity.exe" -batchmode -quit -projectPath D:\LECLAT\UnityProjects\LECLAT_AR_Mobile -executeMethod Leclat.AR.Editor.LeclatValidate.Run -logFile D:\LECLAT\UnityProjects\LECLAT_AR_Mobile\validate-aab-preflight.log
```

Resultat: bloque avant compilation/validation par licence Unity.

Preuve log:

```text
No valid Unity Editor license found. Please activate your license.
Exiting without the bug reporter. Application will terminate with return code 198
```

Le log ne contient pas `LECLAT_VALIDATE_RESULT`, donc la scene n'a pas encore ete validee par Unity.

## Activation licence a faire dans Unity Hub

Unity Hub est installe ici:

```text
C:/Program Files/Unity Hub/Unity Hub.exe
```

D'apres la documentation officielle Unity:

- Pour Unity Personal, il faut se connecter dans Unity Hub pour activer la licence.
- Pour une licence seat/named user, l'organisation doit attribuer un seat, puis la connexion Unity Hub active la licence.
- Pour une licence serial Plus/Pro, l'activation CLI est possible avec `-serial`, `-username`, `-password`, mais ce n'est pas adapte a Unity Personal.

Etapes recommandees:

1. Ouvrir Unity Hub.
2. Se connecter au compte Unity.
3. Aller dans Licenses / Manage licenses.
4. Ajouter ou rafraichir une licence Unity Personal, Pro, Enterprise ou seat attribue.
5. Relancer ensuite la validation batch.

## Commandes a relancer apres activation

```bat
"C:\Program Files\Unity\Hub\Editor\6000.4.5f1\Editor\Unity.exe" -batchmode -quit -projectPath D:\LECLAT\UnityProjects\LECLAT_AR_Mobile -executeMethod Leclat.AR.Editor.LeclatValidate.Run -logFile D:\LECLAT\UnityProjects\LECLAT_AR_Mobile\validate-aab-preflight.log
```

Puis, seulement si `LECLAT_VALIDATE_RESULT 19/19 PASS` apparait:

```bat
"C:\Program Files\Unity\Hub\Editor\6000.4.5f1\Editor\Unity.exe" -batchmode -quit -projectPath D:\LECLAT\UnityProjects\LECLAT_AR_Mobile -buildTarget Android -executeMethod Leclat.AR.Editor.LeclatBuild.AndroidAab -targetApi 35 -logFile D:\LECLAT\UnityProjects\LECLAT_AR_Mobile\build-aab.log
```