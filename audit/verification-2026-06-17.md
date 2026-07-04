# Verification LECLAT - 2026-06-17

## Web / WebView

- `npm audit --audit-level=moderate`: OK, 0 vulnerability.
- `npm run check:safe`: OK.
- `npx tsc --noEmit`: OK.
- `npm run lint`: OK with 1 warning in `src/components/motion.tsx` for React Fast Refresh export shape.
- `npm run build`: OK with Vite 8.0.16.
- `npm run build:unity`: OK; Unity WebUI copied to `Assets/StreamingAssets/LECLAT/WebUI`.
- `dist` vs Unity WebUI: 77 dist files, 78 WebUI files including intentional `build-info.json`; 0 missing, 0 unexpected extra, 0 blocked extension.

Remaining non-blocking web warnings:

- `vite-tsconfig-paths` can likely be replaced later by native Vite `resolve.tsconfigPaths`.
- `src/lib/progressionApi.ts` is dynamically imported while also statically imported, so that dynamic import does not split a chunk.

## Browser QA

Preview server used: `http://127.0.0.1:4180/`.

Browser plugin DOM check:

- URL: `http://127.0.0.1:4180/#/`.
- Title: `L'ÉCLAT - Scanner le vêtement`.
- Meaningful content: yes.
- Framework overlay: no.
- Console warnings/errors: none.

Fallback Playwright visual checks were used because the in-app Browser screenshot command timed out.

- Desktop home: content rendered, no console issues, no 4xx/5xx.
- Mobile home: content rendered, no console issues, no 4xx/5xx.
- Mobile scan interaction: `window.__eclat__.receive` present, nonce present, scan result changed page state, no console issues, no 4xx/5xx.

Fragment video regression check added after the Fragments UI issue:

- File changed: `D:/LECLAT/InterfaceFinal/leclat-ui-perfect/src/components/FragmentVisual.tsx`.
- The Unity WebView static-poster lock was removed.
- Fragment videos now play again, but playback is focused: exactly one fragment video is active at a time.
- Non-active fragment videos are paused, avoiding the previous heavy state where many fragment videos could run together.
- `scripts/visual-smoke.mjs` now verifies this behavior at the top of `/#/fragments` and after scrolling.
- Fresh checks: `npx tsc --noEmit`, `npm run lint`, `npm run build:unity`, and `npm run qa:visual` all completed successfully. Lint still has the existing non-blocking Fast Refresh warning in `src/components/motion.tsx`.

Screenshots:

- `C:/Users/mouhr/AppData/Local/Temp/leclat-qa/desktop-home.png`
- `C:/Users/mouhr/AppData/Local/Temp/leclat-qa/mobile-home.png`
- `C:/Users/mouhr/AppData/Local/Temp/leclat-qa/mobile-scan-reveal.png`

## Unity / 3D Assets

- GLB files in runtime models: 10.
- Manifest entries: 10.
- Missing GLB referenced by manifest: 0.
- Extra GLB outside manifest: 0.
- Runtime backups inside `StreamingAssets`: 0.
- Manifest textures over 512px: 0.
- Largest runtime GLB: `back_wings/MODEL_0476_back_wings_AR_READY_unity_ready.glb`, 2.157 MB.
- License review still required before production for all 10 manifest entries.

Unity batch validation was attempted with:

`Unity.exe -batchmode -quit -projectPath D:\LECLAT\UnityProjects\LECLAT_AR_Mobile -executeMethod Leclat.AR.Editor.LeclatValidate.Run`

Result: blocked before validation by Unity licensing.

- Log: `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/validate-fresh.log`.
- Evidence: `No valid Unity Editor license found. Please activate your license.`
- Unity returned code 198 in the log.

## Roman

Output folder: `C:/Users/mouhr/Desktop/m/simplification_b1b2`.

- `frictions.csv`: 70 friction rows.
- `modifications.json`: 50 retained modifications.
- `ROMAN_SIMPLIFIE.txt`: 50 changed lines marked as `original -- modified`.
- `seg_fr_simplifie`: 30 JSON segment files.
- Word delta after applying modifications: -0.141%.
- Inviolable phrases check: no phrase present in source was removed; two brand/app phrases were absent from the source roman.
- Nahil/Rezkia line fixed from the confusing mother sentence to: `Je connaissais votre mère depuis longtemps.`
