# LECLAT - app/account progression pass - 2026-05-22

## Resultat court

- WebUI coherentisee autour d'un seul hook de progression compte/preview.
- Profil remplace par un profil compte clair : niveau, XP, coins, etat Supabase, dressing, skin actif, missions et liens Scan/Dressing/Quiz.
- Progression locale desormais separee par proprietaire : `leclat_progression_v1:guest` ou `leclat_progression_v1:<supabase_user_id>`.
- Les actions sensibles du dressing sont remote-first quand Supabase est configure : activation vetement, claim XP/coins, unlock skin.
- Quiz client nettoye : contenu public/preview uniquement, plus de contenu narratif profond dans le bundle mobile.
- WebUI Unity regenere et copie dans Unity StreamingAssets.

## Fichiers principaux modifies

- `src/lib/progression.ts`
  - Ajout du scope de progression par utilisateur.
  - Migration douce de l'ancienne cle locale vers `guest`.
  - Merge d'un snapshot Supabase dans la progression locale du compte.
  - Noms des recompenses narratives profondes rendus client-safe.

- `src/lib/progressionApi.ts`
  - Ajout de `loadRemoteProgression(userId)`.
  - Lecture RLS des tables `profiles`, `user_garments`, `user_missions`, `user_skins`.

- `src/hooks/useSupabaseSession.ts`
  - Verification utilisateur avec `auth.getUser()` apres session.
  - Le hook ne se base plus seulement sur la session stockee.

- `src/hooks/useAccountProgression.ts`
  - Nouveau hook central : Auth Supabase + progression scoped + refresh remote.

- `src/pages/ProfilPage.tsx`
  - Remplacement du vieux profil local par un profil compte coherent.

- `src/pages/DressingPage.tsx`
  - Passage au hook compte.
  - Activation vetement / recompenses / skins durcis cote Supabase quand connecte.

- `src/pages/ScanPage.tsx`
  - Selection modele AR branchee sur la progression du compte courant.

- `src/pages/QuizPage.tsx`
  - Progression branchee sur le compte courant.
  - Texte corrige pour dire que le quiz embarque est public/client-safe.

- `src/data/leclatQuizQuestions.ts`
  - Remplace par 24 questions publiques, produit/scan/AR/securite, sans contenu profond.

- `src/components/AppLayout.tsx`
  - Header branche sur le profil de progression actuel.

## Verifications executees

- `npx tsc --noEmit` : OK
- `npm run lint` : OK
- `npm run check:safe` : OK
- `npm run build` : OK
- `npm run build:unity` : OK
- Copie Unity WebUI : `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/Assets/StreamingAssets/LECLAT/WebUI`
- Smoke Playwright via Chrome local sur `/profil`, `/dressing`, `/quiz`, `/scan` : OK, pas de crash console bloquant, pas de mojibake detecte dans le texte rendu.

## Limites restantes

- Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` ne sont pas presentes dans cet environnement, donc le test reel Supabase reste en mode preview local.
- Les anciennes pages `Index`, `Fragments`, `Codex` et l'onboarding utilisent encore le store historique `eclat_porteur_v1`; elles ne cassent pas le nouveau profil, mais une future passe peut les migrer aussi.
- Vite signale un gros chunk principal et un import mixte de `progressionApi.ts`. Ce n'est pas bloquant, mais il faudra optimiser le code splitting plus tard.
