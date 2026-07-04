# AGENTS.md - L'ECLAT

## Racine

Projet racine: D:\LECLAT.

Ce depot contient au moins deux chantiers distincts:

- Unity AR Mobile: UnityProjects\LECLAT_AR_Mobile.
- WebUI/WebView: InterfaceFinal\leclat-ui-perfect.

Ne pas melanger les corrections Unity et WebUI dans un meme commit, sauf si le changement est explicitement un contrat WebView/Unity.

## Contraintes

- Ne jamais supprimer donnees, backups, secrets, modeles GLB, builds ou fichiers de configuration sans validation explicite.
- Travailler sur une branche codex/*, pas directement sur main/master.
- Un commit = un changement logique.
- Ne pas changer de version majeure Unity, React, Vite, AR Foundation ou Supabase sans validation.
- Les fichiers Unity .unity/.prefab peuvent etre volumineux: rechercher des sections avec rg plutot que lire tout le YAML.
- Avant d'annoncer OK, relancer les commandes de verification pertinentes.

## WebUI

Chemin: InterfaceFinal\leclat-ui-perfect.

Stack:

- Vite + React 19 + TypeScript.
- Tailwind CSS v4.
- Radix UI, lucide-react, Framer Motion.
- Supabase client optionnel via VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.
- Bridge Unity/WebView dans src\lib\unityBridge.ts et src\lib\eclatBridgeContract.ts.

Commandes utiles:

- npm run dev
- npm run build
- npm run build:unity
- npm run check:safe
- npm run lint
- npx tsc --noEmit
- npm audit --audit-level=moderate
- npm run qa:visual

Notes:

- npm run build ne remplace pas npx tsc --noEmit.
- npm run build:unity supprime et recopie Assets\StreamingAssets\LECLAT\WebUI dans le projet Unity cible; ne pas le lancer comme simple smoke test si l'on veut eviter toute modification d'artefacts.
- VITE_SHOW_TECH=1 expose les panneaux/debug techniques.
- Les messages sensibles Unity -> Web doivent echo le nonce de session.

## Unity

Chemin: UnityProjects\LECLAT_AR_Mobile.

Stack:

- Unity 6000.4.5f1.
- AR Foundation 6.4.3, ARCore, ARKit, XR Management.
- URP 17.4.0.
- glTFast 6.19.0.
- Unity Test Framework 1.6.0.
- Unity MCP plugin com.ivanmurzak.unity.mcp 0.81.0 ajoute en Phase 0 de l'audit.

Commandes utiles, avec Unity.exe adapte si besoin:

- Unity.exe -batchmode -quit -projectPath . -executeMethod Leclat.AR.Editor.LeclatProjectSetup.RunAll -logFile setup.log
- Unity.exe -batchmode -quit -projectPath . -executeMethod Leclat.AR.Editor.LeclatValidate.Run -logFile validate.log
- Unity.exe -batchmode -quit -projectPath . -executeMethod Leclat.AR.Editor.LeclatModelAudit.Run -logFile audit.log

Notes:

- Le batchmode peut echouer si la licence Unity headless n'est pas active.
- La WebUI embarquee vit dans Assets\StreamingAssets\LECLAT\WebUI.
- Les modeles GLB vivent dans Assets\StreamingAssets\LECLAT\Models.
- Le manifest des modeles contient des flags productionApproved et licensePolicy; ne pas ignorer ces flags pour release.

## Verification minimale avant publication

WebUI:

- npm audit --audit-level=moderate
- npx tsc --noEmit
- npm run lint
- npm run check:safe
- npm run build

Unity:

- LeclatValidate.Run avec resultat PASS.
- LeclatModelAudit.Run avec budgets acceptes ou deferrals explicites.
- Test device Android/iOS: permission camera, SCAN_READY, detection marker, AR_RESULT, tracking stable, FPS acceptable.

Security:

- Pour un scan Codex Security exhaustif, demander explicitement l'autorisation d'utiliser des sous-agents.
