# L'ECLAT - PLAN.md

Date: 2026-06-17
Branche: codex/audit-ameliorations

## Etat de mission

Objectif utilisateur: analyser tout le projet L'ECLAT sur D:, avec les angles Superpowers, Build Web Apps, Build Web Data Visualization, Codex Security, Game Studio et Documents.

Phase actuelle: Phase 1 terminee, audit produit dans AUDIT.md. En attente de validation utilisateur avant Phase 2/3 de corrections.

## Ce qui a ete fait

- Projet resolu: D:\LECLAT.
- Deux chantiers detectes:
  - Unity: D:\LECLAT\UnityProjects\LECLAT_AR_Mobile.
  - WebUI: D:\LECLAT\InterfaceFinal\leclat-ui-perfect.
- Branche creee: codex/audit-ameliorations.
- Skills demandes installes: security-best-practices, security-threat-model, gh-fix-ci, playwright-interactive, screenshot.
- unity-mcp-cli installe et configure dans le projet Unity.
- AUDIT.md cree a la racine.
- AGENTS.md cree a la racine pour les conventions de reprise.

## Validations actuelles

WebUI:

- npm run check:safe: OK.
- npm run build: OK, avec warnings gros chunks.
- npm audit --audit-level=moderate: ECHEC.
- npx tsc --noEmit: ECHEC.
- npm run lint: ECHEC.

Unity:

- unity-mcp-cli install-plugin .: OK.
- Unity batchmode LeclatValidate.Run: ECHEC, licence Unity headless absente.
- Unity batchmode LeclatModelAudit.Run: ECHEC, licence Unity headless absente.

## Decisions

- Ne pas modifier le code applicatif pendant Phase 1.
- Ne pas lancer la passe Codex Security exhaustive sans autorisation explicite de sous-agents.
- Ne pas lancer npm audit fix avant validation utilisateur, car cela modifie package-lock et potentiellement les versions.
- Garder le build:unity pour une phase de correction/verif separee, car il supprime et recopie la WebUI dans StreamingAssets.

## Prochaines etapes si validation recue

Lot 1 - Hygiene depot:

- Ajouter/valider .gitignore racine.
- Decider ce qui doit etre versionne entre sources, builds, caches et archives.
- Commit initial propre.

Lot 2 - Securite dependances:

- npm audit fix.
- Reviser package-lock.
- Relancer audit/build/check.

Lot 3 - TypeScript et lint:

- Corriger TapButton, Magnetic, TextReveal, VoilePage.
- Appliquer Prettier aux fichiers signales.
- Relancer lint et tsc.

Lot 4 - Bridge Unity/Web:

- Gerer WEB_READY cote Unity.
- Lire les payloads imbriques de BridgeEnvelope.
- Ajouter tests/fixtures de contrat JSON.

Lot 5 - Unity validation:

- Activer licence Unity batchmode ou ouvrir Unity Editor.
- Regenerer packages-lock apres ajout MCP.
- Relancer LeclatValidate.Run et LeclatModelAudit.Run.

Lot 6 - Release readiness:

- Gate productionApproved pour GLB.
- Revue licences assets.
- Optimisation gros chunks WebView.

## Points ouverts

- Autoriser ou non les sous-agents pour un scan Codex Security exhaustif.
- Garder ou retirer com.ivanmurzak.unity.mcp du manifest avant publication.
- Choisir strategie Git: monorepo racine ou depots separes Unity/WebUI.
