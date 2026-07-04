# L'ECLAT - Interface Audit Report

## Verdict brutal

L'interface active est solide techniquement: React/Vite compile, TypeScript passe, le routing mobile fonctionne, le bridge Unity existe et les animations principales sont en place. La passe corrective a supprime les textes arabes corrompus du Dressing, corrige les libelles trop "dev/preview", ajoute une micro-animation tactile globale et corrige la vulnerabilite npm moderee. Le dossier Unity attendu par Unity Hub a maintenant ete restaure a `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile`.

Point de limite important: aucun fichier Unity `.cs`, `.unity`, `.prefab`, `.anim` n'est present dans `D:\LECLAT\InterfaceFinal`. Cette passe audite et corrige la WebUI/WebView; elle ne peut pas verifier directement `ARSession` ou `ARCameraManager` cote Unity depuis ce dossier.

## Cible analysee

- Dossier demande: `Web_Interface`.
- Dossier exact trouve: aucun.
- Dossier utilise comme interface active: `D:\LECLAT\InterfaceFinal\leclat-ui-perfect`.
- Framework: Vite + React 19 + TypeScript.
- UI: Tailwind CSS v4, Radix UI, Framer Motion, lucide-react.
- Backend/remote: Supabase client present, progression remote via `progressionApi`.
- Bridge Unity: `src/lib/unityBridge.ts`, `src/lib/eclatBridgeContract.ts`, `src/lib/deeplink.ts`.

## Scripts et dependances

- `npm run lint`: OK apres correction.
- `npx tsc --noEmit`: OK.
- `npm run check:safe`: OK apres correction.
- `npm run build`: OK apres correction.
- `npm audit --audit-level=moderate`: OK apres `npm audit fix`.
- `npm run dev`: un serveur repond deja sur `http://127.0.0.1:4188`; `4177` n'est pas actif.
- `npm run build:unity`: maintenant securise. Le script utilise `LECLAT_UNITY_PROJECT_DIR` ou `LECLAT_UNITY_WEBUI_DIR` si fournis, sinon il detecte Unity Hub `LECLAT_AR_Mobile`. Apres restauration du projet Unity, la copie WebUI vers `Assets/StreamingAssets/LECLAT/WebUI` passe correctement.

## Ecrans presents

- `/` Accueil / manifeste.
- `/fragments` Liste des fragments.
- `/fragments/:id` Detail fragment + bouton AR.
- `/fragments/voile/:id` Couche Voile.
- `/boutique` Boutique.
- `/boutique/:id` Produit textile.
- `/scan` Scanner WebView / AR handoff.
- `/histoire` Histoire debloquee par paliers de scans 1, 20, 40.
- `/lore` Lore / univers.
- `/profil` Profil porteur.
- `/dressing` Dressing / progression / skins AR.
- `/quiz` Quiz canon.
- `/checkout` Commande.
- `/checkout/confirmation` Confirmation.
- `/commande/:ref` Suivi commande.
- `/revelations` Revelations.
- `/codex` Codex.
- `*` Erreur 404 stylisee.

## Composants UI principaux

- `AppLayout`: header, bottom navigation, splash, onboarding, footer, bridge status.
- `LanguageModule`: selecteur FR/EN/AR, deja corrige pour ne plus deborder sur mobile.
- `ScanPage`: scan, etats camera, selection modele AR, resultat fragment, debug technique optionnel.
- `ScanButton`: bouton circulaire pulse, vibration courte, micro-scale Framer Motion.
- `FragmentsPage`, `FragmentDetailPage`, `HistoirePage`, `LorePage`: lecture et progression narrative.
- `ProfilPage`, `DressingPage`: progression utilisateur, compte, missions, skins.
- `CartDrawer`, `CheckoutPage`, `ConfirmationPage`, `OrderTrackingPage`: commerce.
- `BridgeDebugPanel`: panneau dev uniquement si `VITE_SHOW_TECH=1`.

## Boutons et actions

Etat global: la majorite des boutons visibles ont un `onClick`, un `Link` ou un `NavLink` reel. Pas de bouton public detecte avec simple `Debug.Log` ou callback vide. Les simulations detectees sont confinees aux modes dev/debug.

| Zone | Action | Etat avant correction |
|---|---|---|
| Header | Logo, panier, profil, langue | Fonctionnel |
| Bottom nav | Fragments, Boutique, Scan, Histoire, Profil | Fonctionnel |
| Scan | Lancer scan | Envoie `SCAN_REQUEST` via bridge si Unity/WebView, deeplink mobile sinon |
| Scan | Annuler scan | Envoie `SCAN_CANCEL` si Unity et remet l'etat local |
| Scan | Choix modele 3D | Change `selected_fragment_id` envoye a Unity |
| Fragment detail | Ouvrir en AR | Envoie `AR_LAUNCH` si Unity; toast propre hors Unity |
| Histoire | Scanner pour debloquer | Navigation vers `/scan` |
| Dressing | Compte Supabase | Branche sur magic link / OTP si env configuree |
| Dressing | Activation t-shirt | Branche local ou Supabase selon config |
| Dressing | Missions / skins | Branche progression locale/remote |
| Checkout | Etapes livraison/paiement | Fonctionnel local |
| Order tracking | PDF/JSON/copie ref | Fonctionnel local |

## Bridge Unity

Contrat actuel:

- Web -> Unity: `WEB_READY`, `SCAN_REQUEST`, `SCAN_CANCEL`, `AR_LAUNCH`, `HAPTIC_REQUEST`, `NAV_BACK`, `NAV_STATE`.
- Unity -> Web: `DEVICE_INFO`, `SCAN_READY`, `SCAN_RESULT`, `SCAN_CANCEL`, `NAV_TO_PAGE`, `NAV_BACK_REQUEST`, `ERROR`.
- Protection: nonce de session exige pour `SCAN_RESULT` et `AR_RESULT` en production.
- Validation: `SCAN_RESULT` doit contenir un `qr_token`.
- Transport: Vuplex, GREE Unity WebView, WKWebView, `window.__eclat__` direct, MessageEvent.

Observation: `MODEL_SELECTED` n'existe pas comme event separe; l'equivalent actuel est `selected_fragment_id` + `fragment_id` dans `SCAN_REQUEST`, puis `AR_LAUNCH` pour ouvrir un fragment.

## Animations existantes

Aucune animation n'a ete supprimee pendant l'audit.

| Animation | Emplacement | Etat |
|---|---|---|
| Splash rituel | `AppLayout` | Fonctionnelle |
| Onboarding multi-etapes | `Onboarding` | Fonctionnelle |
| Page transition | `AppLayout motion.main` | Fonctionnelle |
| Nav indicator spring | Bottom nav | Fonctionnelle |
| Scan pulse / orbit | `ScanButton` | Fonctionnelle |
| Ligne de scan | `ScanPage` + `.anim-faille` | Fonctionnelle |
| Voile / poussiere / drift | CSS global + pages | Fonctionnelle |
| Fragment visuals | `FragmentVisual` | Fonctionnelle |
| Reveal scan | `ScanPage` result modal | Fonctionnelle |
| Reduced motion | CSS + `useReducedMotion` partiel | Present |

Point a ameliorer: les elements `.tap` n'ont pas tous une vraie micro-animation d'appui; seuls certains boutons ont deja `active:scale` ou `whileTap`.

## Verification navigateur mobile

Test Playwright via Microsoft Edge headless sur `390x844`, serveur `http://127.0.0.1:4188`.

Routes testees: `/`, `/fragments`, `/scan`, `/histoire`, `/lore`, `/profil`, `/dressing`, `/checkout`, route 404.

Resultat:

- Pas d'erreur console bloquante.
- Pas d'overflow horizontal detecte sur les routes principales.
- `/histoire`: progression 1/20/40 lisible avec donnees seed.
- `/scan`: controle scan visible, selection modele visible, bouton actif.
- `/checkout`: etat panier vide gere.
- `404`: ecran erreur present et coherent.

## Problemes critiques

1. Corrige: `src/pages/DressingPage.tsx` contenait des textes arabes encodes en mojibake. Le scan source retourne maintenant `NO_MOJIBAKE`, et le test navigateur arabe ne detecte plus `\u00d8/\u00d9/\u00c3/\u00c2`.
2. Corrige cote WebUI: `scripts/copy-unity-build.mjs` ne copie plus aveuglement vers `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile`. Il lit maintenant Unity Hub, accepte une cible explicite et verifie `ProjectSettings/ProjectVersion.txt` avant toute suppression/copie.

## Problemes majeurs

1. Corrige: `npm audit` ne signale plus aucune vulnerabilite moderee ou superieure.
2. Chunk principal `index` a environ `666.90 kB` minifie. Impact: chargement WebView perfectible.
3. Corrige: Dressing avait plusieurs libelles trop techniques ou non localises: `ARNTREAL layer`, `Ownership`, `Suivi non branche`, `Lore rewards`.
4. Le vrai AR Unity n'est pas verifiable ici faute de sources Unity.

## Problemes moyens

1. `BridgeDebugPanel` contient `simulateScan`, mais il est correctement cache par `VITE_SHOW_TECH=1`.
2. `offlineQueue.ts` contient un TODO futur sur validation Edge Function; pas bloquant pour UI.
3. Corrige: certains textes francais du Dressing manquaient d'accents (`vetement`, `recupere`, `deja`).
4. Corrige: le dossier Unity Hub `LECLAT_AR_Mobile` a ete restaure et `build:unity` copie bien la WebUI.

## Notes apres correction

- Design: 8.4/10.
- UX: 8/10.
- Mobile: 8.3/10.
- Coherence lore: 8/10.
- Stabilite: 8.5/10.
- Connexion Unity WebView: 7/10.
- Preparation publication: 7.4/10.

## Bugs restants a traiter

1. Ouvrir `D:\LECLAT\UnityProjects\LECLAT_AR_Mobile` dans Unity Hub et laisser Unity finir l'import complet des packages.
2. Verifier cote Unity natif que `SCAN_REQUEST` ouvre bien `ARSession` + camera arriere.
3. Verifier cote Unity que `AR_LAUNCH` charge le GLB via manifest et pas un prefab test.
4. Reduire le chunk principal dans une passe performance separee si le lancement WebView est trop lent.

## Fichiers modifies pendant la passe

- `src/pages/DressingPage.tsx`: arabe repare, textes francais corriges, libelles dev remplaces, textes multi-langues ajoutes.
- `src/legacy.css`: micro-animation tactile globale ajoutee a `.tap`.
- `scripts/copy-unity-build.mjs`: detection Unity Hub `LECLAT_AR_Mobile`, cible Unity explicite possible, validation stricte du projet Unity ajoutee.
- `package-lock.json`: correction transitive `npm audit fix`.
- `INTERFACE_AUDIT_REPORT.md`: rapport d'audit et resultats apres correction.
- `INTERFACE_FIX_PLAN.md`: plan de correction et statut des priorites.
