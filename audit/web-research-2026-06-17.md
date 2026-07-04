# Recherche web officielle - LECLAT

Date: 2026-06-17

## Sources utilisees

- Android Developers - WebView native bridges:
  https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges
- Unity Manual - StreamingAssets:
  https://docs.unity3d.com/Manual/StreamingAssets.html
- Unity AR Foundation - AR Tracked Image Manager:
  https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@6.0/manual/features/image-tracking.html
- Vite - Build options:
  https://vite.dev/config/build-options.html

## Conclusions appliquees

- Le pont WebView est une frontiere de securite: le handshake `WEB_READY` doit etre traite par Unity et les messages sensibles doivent conserver un nonce de session.
- `StreamingAssets` est copie tel quel dans le build Unity: les backups GLB ont ete sortis de `Assets/StreamingAssets` et le script de copie WebUI bloque maintenant les extensions non-runtime.
- AR Foundation detecte uniquement les images presentes dans la reference image library: le controle reste centre sur le marqueur declare et la validation Unity doit etre relancee quand la licence Editor sera active.
- Vite 8 utilise les options de build actuelles et signale les tailles de chunks sur la base de la taille JS non compressee: le projet a ete migre, l'audit npm est passe a 0 vulnerabilite, et les chunks principaux ont baisse.

## Risques restants

- Unity batch ne peut pas valider tant qu'aucune licence Editor valide n'est activee.
- Toutes les entrees GLB du manifeste restent `productionApproved:false`; la revue licence reste bloquante avant production.
- `MODEL_0476` reste legerement au-dessus du budget mobile de 2 MB.
