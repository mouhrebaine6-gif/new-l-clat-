# L'ECLAT - Interface Fix Plan

## Regles de correction

- Ne supprimer aucune animation existante.
- Ne pas renommer les events Unity sans adapter le contrat.
- Ne pas ecrire dans l'ancien projet Unity.
- Corriger les faux boutons publics; garder les simulations uniquement dans `VITE_SHOW_TECH=1`.
- Garder la palette sombre: noir, ivoire, laiton, ardoise.

## Priorite 0 - Publication bloquees

1. Fait: corriger les textes arabes corrompus de `src/pages/DressingPage.tsx`.
2. Fait: corriger les libelles trop dev du Dressing: `ARNTREAL layer`, `Ownership`, `Suivi non branche`, `Lore rewards`.
3. Fait: corriger les textes francais sans accents dans les toasts/actions visibles.
4. Documenter que l'AR natif doit etre valide dans le projet Unity source, absent de ce dossier.

## Priorite 1 - Polish premium

1. Fait: ajouter une micro-animation tactile globale a `.tap`: appui en `scale(0.985)`, easing doux, sans changer les animations existantes.
2. Fait: harmoniser les textes du Dressing avec le style rituel/pierre/voile deja present.
3. Garder les etats loading/erreur visibles et sobres.
4. Rendre les messages preview plus propres: pas de vocabulaire de chantier visible en public.

## Priorite 2 - Technique

1. Fait: executer `npm audit fix` et re-verifier `npm audit`.
2. Re-verifier `npm run lint`, `npx tsc --noEmit`, `npm run check:safe`, `npm run build`.
3. Fait cote securite: corriger `scripts/copy-unity-build.mjs` pour utiliser une cible Unity valide: variables env explicites d'abord, detection Unity Hub `LECLAT_AR_Mobile` ensuite, puis validation `ProjectSettings/ProjectVersion.txt` avant copie.
4. Decouper le bundle principal dans une passe separee si le temps de chargement WebView devient visible.

## Priorite 3 - Unity externe

1. Fait: restaurer le dossier Unity attendu a `D:\LECLAT\UnityProjects\LECLAT_AR_Mobile`.
2. Dans le projet Unity actif, verifier sur appareil que `SCAN_REQUEST` lance bien `ARSession` + camera arriere.
3. Verifier que Unity renvoie `SCAN_READY`, puis `SCAN_RESULT` avec `nonce`.
4. Verifier que `AR_LAUNCH` charge le GLB associe a `fragment_id` / `selected_fragment_id`.
5. Verifier les animations natives AR sans supprimer celles de la WebUI.

## Definition de fini

- `npm audit` sans faille moderee ou superieure.
- `lint`, `tsc`, `check:safe`, `build` OK.
- Aucun mojibake dans les fichiers texte source.
- Pas d'overflow horizontal sur mobile 390 px.
- Tous les boutons publics ont une action reelle.
- Les simulations ne sont visibles qu'en mode debug.
- Rapport final avec fichiers modifies, resultats de build, bugs restants et notes /10.
