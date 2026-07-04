# Scorecard LECLAT - 2026-06-17

## Notes

| Bloc | Note | Etat |
|---|---:|---|
| Projet global | 78/100 | Coherent et solide en prototype avance, pas encore release-ready |
| App Web / WebView | 84/100 | Build, typecheck, lint et QA visuelle OK; fragments animes retablis |
| Unity / AR / Assets 3D | 72/100 | Assets runtime propres, mais validation Unity bloquee par licence et licences assets non approuvees |
| Roman | 83/100 | Version de lecture propre creee; corrections micro coherentes; reste une passe humaine integrale conseillee |

## Preuves fraiches

- Roman: `ROMAN_LECTURE.txt` existe, 0 marqueur `original -- modifie`, 50 corrections annotees conservees dans `ROMAN_SIMPLIFIE.txt`, 30 segments JSON.
- Roman: l'erreur introduite `un fil ... la raccourcit` a ete corrigee en `un fil ... le raccourcit` dans le roman, `modifications.json` et `seg_fr_simplifie/23.json`.
- Web: `npx tsc --noEmit --pretty false` termine avec exit 0.
- Web: `npm run lint` termine avec exit 0; reste 1 warning React Fast Refresh dans `src/components/motion.tsx`.
- Web: `npm audit --audit-level=moderate` annonce 0 vulnerability.
- Web: `npm run check:safe` passe.
- Web/Unity WebUI: `npm run build:unity` passe et recopie vers `Assets/StreamingAssets/LECLAT/WebUI`.
- Fragments: `npm run qa:visual` passe et verifie `focused fragment video playback`.
- Fragments sur `http://localhost:5173/#/fragments`: 10 videos detectees, 1 en lecture, 0 erreur console; en session neuve, le parcours Voile peut apparaitre avant la liste.
- WebUI build copy: 0 fichier avec extension bloquee (`.bak`, `.jsx`, `.log`, `.map`, `.meta`, `.tmp`, `.ts`, `.tsx`) dans `StreamingAssets/LECLAT/WebUI`.
- Assets 3D: 10 entrees manifest, 10 fichiers GLB, 0 manquant, 0 extra, 0 texture >512 px.
- Assets 3D: plus gros modele runtime `MODEL_0476`, 2.157 MB.
- Unity: validation batch bloquee par licence; log indique `No valid Unity Editor license found` et return code 198.

## Points forts

- Direction artistique web forte et coherente avec le roman: textile, seuil, rituel, fragments.
- Les animations de fragments sont retablies sans relancer toutes les videos en meme temps.
- Le pipeline build WebUI vers Unity filtre les fichiers inutiles.
- Les assets 3D sont coherents avec le manifest et compresses pour mobile.
- La phrase Nahil/Rezkia est maintenant comprehensible: elle ne laisse plus croire que Rezkia dit etre sa mere.

## Risques restants

- Unity ne peut pas etre declare valide tant que la licence Editor n'est pas activee sur la machine.
- Les 10 modeles 3D ont `productionApproved: false`; il faut valider les licences avant publication.
- `MODEL_0476` depasse legerement le budget 2 MB et merite une inspection visuelle avant compression supplementaire.
- La page `Histoire` produit un gros chunk (~454 kB), acceptable en prototype mais a optimiser si cible mobile/WebView faible.
- Le dressing expose encore des tokens de test (`LECLAT-EVEIL-TEST`) et l'activation officielle depend encore du backend/Supabase.
- Il reste 1 warning lint non bloquant sur Fast Refresh.

## References externes utilisees

- Android WebView native bridge security: https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges
- Unity StreamingAssets: https://docs.unity3d.com/Manual/StreamingAssets.html
- Vite build options: https://vite.dev/config/build-options.html
- Unity AR Foundation image tracking: https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@6.0/manual/features/image-tracking.html