# L'ECLAT - AUDIT.md

Date: 2026-06-17
Branche: codex/audit-ameliorations
Perimetre: depot racine D:\LECLAT, projet Unity D:\LECLAT\UnityProjects\LECLAT_AR_Mobile, WebUI D:\LECLAT\InterfaceFinal\leclat-ui-perfect.

## Phase 0 - outils

- Skills demandes installes dans C:\Users\mouhr\.codex\skills: security-best-practices, security-threat-model, gh-fix-ci, playwright-interactive, screenshot. Redemarrer Codex pour les charger automatiquement dans une prochaine session.
- Superpowers et plugins Codex demandes etaient deja disponibles dans cette session.
- unity-mcp-cli installe globalement, version 0.81.0.
- unity-mcp-cli install-plugin . execute dans le projet Unity. Il a ajoute com.ivanmurzak.unity.mcp 0.81.0 et le registry OpenUPM dans Packages/manifest.json.
- Attention: l'installation MCP est une modification de configuration Unity issue de la Phase 0, pas une correction applicative.
- Passe Codex Security exhaustive non lancee: le workflow officiel demande une autorisation explicite pour utiliser des sous-agents. Cette passe reste donc un audit manuel local, avec une recommandation de scan exhaustif ensuite.

## Synthese rapide

Le projet contient bien deux chantiers lies:

- Unity AR Mobile: Unity 6000.4.5f1, AR Foundation 6.4.3, glTFast 6.19.0, WebUI embarquee dans StreamingAssets.
- WebUI/WebView: Vite 7, React 19, TypeScript, Tailwind v4, Radix UI, Framer Motion, Supabase, Playwright.

Etat actuel:

- npm run build: OK en 2m28s.
- npm run check:safe: OK.
- npm audit --audit-level=moderate: ECHEC, 7 vulnerabilites dont 3 high.
- npx tsc --noEmit: ECHEC, 5 erreurs TypeScript.
- npm run lint: ECHEC, erreurs Prettier et un warning Fast Refresh.
- Unity batchmode validation/model audit: ECHEC avant execution des methodes a cause d'une licence Unity headless non valide, retour 198.

## Critique

### 1. Les dependances Web ont des vulnerabilites high et moderate

Preuve: npm audit --audit-level=moderate echoue avec 7 vulnerabilites: @babel/core, esbuild, js-yaml, react-router/react-router-dom. package.json declare Vite et React Router dans InterfaceFinal/leclat-ui-perfect/package.json:63 et InterfaceFinal/leclat-ui-perfect/package.json:89.

Impact: surface dev-server/build compromisee via esbuild, open redirect potentiel via React Router, dette de supply chain avant publication.

Correction proposee:

- Lancer npm audit fix dans la WebUI, puis revalider package-lock.json.
- Verifier que react-router-dom reste en version compatible v6 ou planifier migration si un major est propose.
- Relancer npm audit --audit-level=moderate, npm run build, npm run check:safe.

### 2. Le typage strict ne passe pas

Preuve: npx tsc --noEmit echoue:

- src/components/motion.tsx:90: TapButton transmet ButtonHTMLAttributes a motion.button, conflit sur onDrag.
- src/components/motion/Magnetic.tsx:36 et :40: MouseEvent passe a une API attendue en PointerEvent.
- src/components/motion/TextReveal.tsx:46: @ts-expect-error inutilise.
- src/pages/VoilePage.tsx:84: comparaison Date.now() < revealDate avec revealDate type string.

Impact: les types ne protegent plus les surfaces de mouvement et la page Voile. Le build Vite passe car il transpile sans typecheck complet, donc une erreur de production peut passer en CI si tsc n'est pas obligatoire.

Correction proposee:

- Typer TapButton avec HTMLMotionProps<"button"> ou filtrer les handlers incompatibles.
- Corriger Magnetic en vrais handlers PointerEvent.
- Retirer ou remplacer le @ts-expect-error inutile.
- Convertir revealDate en timestamp numerique avant comparaison.
- Ajouter npm run typecheck dans package.json puis l'inclure dans la validation.

### 3. La validation Unity native n'est pas prouvee dans l'environnement actuel

Preuve: les commandes Unity batchmode:

- Leclat.AR.Editor.LeclatValidate.Run
- Leclat.AR.Editor.LeclatModelAudit.Run

se terminent avant execution avec "No valid Unity Editor license found. Please activate your license." dans Logs/codex-validate-current.log:91 et Logs/codex-model-audit-current.log:89. Unity est bien detecte comme 6000.4.5f1 dans ProjectSettings/ProjectVersion.txt:1.

Impact: on ne peut pas affirmer que la scene Main, les references AR, le chargement GLB et les budgets modeles passent aujourd'hui. Les anciens rapports restent utiles, mais ne sont plus une preuve actuelle.

Correction proposee:

- Activer/licencier Unity Editor pour batchmode ou lancer la validation depuis Unity Editor interactif.
- Rejouer LeclatValidate.Run et LeclatModelAudit.Run jusqu'a obtenir des lignes LECLAT_VALIDATE_RESULT et LECLAT_AUDIT_RESULT.
- Conserver les logs de validation dans un dossier d'artefacts versionne ou ignore selon politique.

### 4. Les assets 3D ne sont pas approuves production

Preuve: Assets/StreamingAssets/LECLAT/Models/manifest.json contient productionApproved: false pour toutes les entrees visibles, avec LICENSE_REVIEW_REQUIRED_BEFORE_PRODUCTION ou INTERNAL_TEST_ONLY_LICENSE_UNKNOWN, par exemple lignes 13-14, 60-61, 107-108, 343-344.

Impact: blocant publication, meme si le runtime fonctionne. Risque legal et risque de devoir remplacer des modeles tardivement.

Correction proposee:

- Ajouter une colonne d'approbation source/licence dans le manifest ou un document assets.
- Bloquer build release si productionApproved false.
- Remplacer les GLB inconnus par assets possedes ou licences documentees.

### 5. Le pont Unity/Web ne consomme pas WEB_READY et ne valide pas le nonce cote Unity

Preuve:

- Web envoie WEB_READY dans src/lib/unityBridge.ts:251.
- Unity ReceiveFromWeb ne gere que SCAN_REQUEST, SCAN_CANCEL et AR_LAUNCH dans Assets/LECLAT/Scripts/LeclatNativeBridge.cs:53-62.
- Unity lit nonce depuis l'enveloppe a Assets/LECLAT/Scripts/LeclatNativeBridge.cs:48, mais ne stocke pas le sessionNonce du handshake pour appairer les echanges.

Impact: le Web rejette les messages sensibles si le nonce ne correspond pas en production, mais Unity ne connait pas explicitement le nonce transmis dans payload.sessionNonce. Le fait que le nonce racine soit present dans l'enveloppe actuelle peut marcher, mais le contrat documente WEB_READY comme handshake source de verite. Le bridge natif reste fragile face aux hosts WebView qui placent les donnees uniquement dans payload.

Correction proposee:

- Gerer WEB_READY cote Unity et stocker le nonce de session.
- Accepter les payloads imbriques de l'enveloppe Web: payload.fragment_id, payload.selected_fragment_id, payload.sessionNonce.
- Ajouter des tests de contrat Web <-> Unity sur exemples JSON.

## Important

### 6. Les scripts Web contredisent d'anciens rapports de qualite

Preuve: INTERFACE_AUDIT_REPORT.md affirme que lint, tsc, audit et build etaient OK. Les validations du 2026-06-17 montrent audit, tsc et lint en echec.

Impact: les rapports existants ne peuvent pas etre utilises comme gate de publication sans reexecution.

Correction proposee:

- Ajouter une section "Derniere verification" avec date/commande/hash dans RAPPORT.md apres chaque passe.
- Ne jamais marquer une correction comme OK sans commande relancee.

### 7. Le lint echoue sur formatage et Fast Refresh

Preuve: npm run lint echoue sur:

- src/components/Logo.tsx:17, 35, 87.
- src/components/motion.tsx:15, 70, 85.
- src/components/motion/ScanTrace.tsx:24.
- src/components/motion/SkeletonShimmer.tsx:19.
- src/components/motion/TextReveal.tsx:19.
- Warning react-refresh/only-export-components dans src/components/motion.tsx:100.

Impact: CI lint non fiable; bruit qui masque les vrais problemes.

Correction proposee:

- Lancer Prettier sur les fichiers concernes.
- Extraire les exports non-composants de src/components/motion.tsx dans un module dedie si Fast Refresh doit rester propre.

### 8. Le chunk principal et la page Histoire sont trop lourds pour WebView mobile

Preuve: npm run build signale:

- assets/index-*.js: 677.55 kB minifie, gzip 202.77 kB.
- assets/HistoirePage-*.js: 462.44 kB minifie, gzip 145.04 kB.
- Warning Vite "Some chunks are larger than 500 kB".

Impact: temps de chargement et memoire WebView sur mobile, surtout dans Unity/AR ou la memoire est deja contrainte.

Correction proposee:

- Charger les gros contenus narratifs par langue et route.
- Segmenter storySegments.* hors bundle initial.
- Garder Recharts/Radix inutilises hors chunks initiaux.
- Rejouer qa:visual sur mobile apres decoupage.

### 9. Le depot racine n'a pas de commit initial et contient plusieurs dossiers generes

Preuve: git status montre "No commits yet" et des dossiers racine non suivis: Cache, Builds, InterfaceFinal, UnityProjects, ModelLibrary_Curated, note.zip, note, fragments_anim. Les .gitignore existent seulement dans les sous-projets, par exemple WebUI ignore node_modules et dist dans InterfaceFinal/leclat-ui-perfect/.gitignore:10-11.

Impact: risque de commit massif accidentel, confusion entre sources, builds, caches, backups et livrables.

Correction proposee:

- Creer un .gitignore racine qui couvre Cache, Builds, archives, logs et artefacts temporaires.
- Decider si le repo racine versionne les deux projets ensemble ou si chaque projet doit avoir son propre depot.
- Faire un commit initial propre avant Phase 2.

### 10. L'installation Unity MCP modifie manifest sans packages-lock actualise prouve

Preuve: Packages/manifest.json contient com.ivanmurzak.unity.mcp a la ligne 39 et scopedRegistries a partir de la ligne 41. packages-lock.json n'a pas encore ete regenere par Unity dans une validation reussie.

Impact: l'import Unity peut diverger selon machine tant que Package Manager n'a pas resolu le lock.

Correction proposee:

- Ouvrir Unity avec licence active, laisser UPM resoudre, puis verifier Packages/packages-lock.json.
- Committer manifest + lock ensemble si le plugin MCP reste souhaite.

### 11. Les evenements de progression non-trusted peuvent faire avancer certaines missions

Preuve: api.log_app_event expose a authenticated appelle leclat_private.apply_event_progress(..., false) dans supabase/migrations/20260515000000_leclat_progression.sql:307-328. Cette fonction incremente garment_scanned, ar_launched et lore_opened meme sans p_trusted aux lignes 274-289.

Impact: un client authentifie peut spammer certains evenements et progresser sur des missions non critiques. Les missions sensibles walking_steps et quiz_completed exigent server_verified=true, et garment_activated/skin_unlocked exigent p_trusted, donc le coeur est mieux protege. Mais le compteur scan/AR/lore reste abuse-prone.

Correction proposee:

- Ajouter rate limiting/anti-abus cote Edge Function ou RPC.
- Deplacer la validation scan/AR dans une fonction serveur qui verifie token, session, contexte AR et frequence.
- Journaliser anti_abuse_flags et refuser progression au-dela d'un seuil.

### 12. Le Web accepte tout MessageEvent JSON sans verifier l'origine

Preuve: src/lib/unityBridge.ts:211 ecoute window message et dispatch tout objet parse contenant type; la protection nonce existe pour SCAN_RESULT/AR_RESULT seulement a src/lib/unityBridge.ts:148-166.

Impact: sur un contexte web non Unity, une frame ou extension peut pousser des messages non sensibles comme ERROR, NAV_TO_PAGE, DEVICE_INFO. Les messages sensibles sont mieux proteges en production, mais la surface generale du bridge reste large.

Correction proposee:

- Filtrer ev.origin quand le WebUI n'est pas dans un host Unity connu.
- Restreindre NAV_TO_PAGE a des routes internes validees.
- Exiger bridgeVersion et payload shape minimal pour tous les messages natifs.

## Confort / polish

### 13. Le projet est un produit AR narratif, pas un jeu browser classique

Observation Game Studio: pas de Phaser/Three.js browser-game; la boucle interactive principale est Unity AR + WebView. Les controles attendus sont donc validation device, FPS AR, tracking marker et assets GLB plutot qu'un playtest de jeu 2D.

Correction proposee:

- Ajouter une checklist "device playtest" Android/iOS: permission camera, SCAN_READY, marker stable, AR_RESULT, tracking state, FPS, chauffe, retour arriere.

### 14. Visualisation/data

Observation Build Web Data Visualization: le projet contient des surfaces de progression, missions, profil, scans et quelques composants chart/recharts. Il n'y a pas encore de dashboard analytique central.

Correction proposee:

- Si vous ajoutez un tableau de bord, privilegier progressions visibles sans hover, filtres URL, et petits graphiques legers. Eviter Recharts dans le bundle initial si les charts ne sont pas sur la premiere vue.

### 15. Documents et encodage

Observation: plusieurs sorties terminal affichent du mojibake pour des textes FR/AR, alors que certains fichiers contiennent bien de l'UTF-8. Les rapports anciens melangent ASCII et caracteres accentues.

Impact: risque de fausses alertes ou de texte corrompu dans docs, UI arabe et rapports.

Correction proposee:

- Fixer UTF-8 partout, verifier git config/core.autocrlf et editeurs.
- Ajouter un script de detection mojibake cible sur src/**/*.ts* et docs.

## Validation executee

Dans D:\LECLAT\InterfaceFinal\leclat-ui-perfect:

- npm run check:safe: OK.
- npm run build: OK, 2m28s, avec warnings chunk >500 kB.
- npm audit --audit-level=moderate: ECHEC, 7 vulnerabilites.
- npx tsc --noEmit: ECHEC, 5 erreurs.
- npm run lint: ECHEC, erreurs Prettier + warning Fast Refresh.

Dans D:\LECLAT\UnityProjects\LECLAT_AR_Mobile:

- unity-mcp-cli --version: 0.81.0.
- unity-mcp-cli install-plugin .: OK.
- Unity.exe -batchmode LeclatValidate.Run: ECHEC, licence Unity headless absente, retour 198.
- Unity.exe -batchmode LeclatModelAudit.Run: ECHEC, licence Unity headless absente, retour 198.

## Gate avant Phase 2

Je recommande de corriger dans cet ordre apres validation:

1. npm audit fix + validation package-lock.
2. TypeScript strict.
3. Lint/Prettier.
4. .gitignore racine + commit initial propre.
5. Contrat Web/Unity: WEB_READY, payload imbrique, tests JSON.
6. Unity license/import + LeclatValidate/LeclatModelAudit.
7. Licence assets GLB et release gate.
8. Optimisation bundle WebView.

Phase 2 doit produire un PLAN.md detaille par lots/commits a partir de cette liste.
