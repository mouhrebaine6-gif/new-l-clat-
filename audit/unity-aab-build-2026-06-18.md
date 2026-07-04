# LECLAT Unity Android AAB build report - 2026-06-18

## Scope
- Project: `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile`
- Output: `D:/LECLAT/Builds/Android/LECLAT_AR.aab`
- Unity: `6000.4.5f1`
- Build target: Android App Bundle, target API 35, ARM64, IL2CPP

## Official references checked
- Google Play target API requirement: https://developer.android.com/google/play/requirements/target-sdk
- Unity Android App Bundle build flow: https://docs.unity3d.com/6000.4/Documentation/Manual/android-BuildProcess.html
- Unity Android target API setup: https://docs.unity3d.com/6000.4/Documentation/Manual/android-setup-target-api.html
- Unity Burst AOT settings: https://docs.unity3d.com/Packages/com.unity.burst%401.8/manual/building-aot-settings.html

## Root cause found
The Unity license issue is no longer the active blocker. After license activation, scene validation passed.

The first Android AAB build failed during Android/Bee native postprocessing after Burst AOT work:
- Log: `D:/LECLAT/UnityProjects/LECLAT_AR_Mobile/build-aab.log`
- Evidence: three failed native object outputs under `Library/Bee/artifacts/Android/.../*.o`
- Final result: `LECLAT_BUILD ... result=Failed errors=3`
- No final `.aab` was produced.

This pointed to the Burst AOT Android player-build layer, not to missing AR scene wiring.

## Fix applied
Changed `Assets/LECLAT/Editor/LeclatBuild.cs`:
- Added `AndroidAabNoBurst()`.
- Added `-disableBurstAot true` / `LECLAT_DISABLE_BURST_AOT=1` support.
- Uses Unity's Burst editor settings type by reflection to write the Android Burst AOT setting.

Unity generated/kept these supporting project files:
- `ProjectSettings/BurstAotSettings_Android.json`
  - `EnableBurstCompilation:false`
- `Assets/XR/Resources/ARCoreRuntimeSettings.asset`
  - ARCore runtime settings created by Unity during ARCore manifest postprocessing.

## Verification performed
Scene validation:
- Command log: `validate-after-burstbuildpatch.log`
- Result: `LECLAT_VALIDATE_RESULT 19/19 PASS`

AAB build:
```bat
Unity.exe -batchmode -quit -projectPath D:\LECLAT\UnityProjects\LECLAT_AR_Mobile -buildTarget Android -executeMethod Leclat.AR.Editor.LeclatBuild.AndroidAabNoBurst -targetApi 35 -logFile D:\LECLAT\UnityProjects\LECLAT_AR_Mobile\build-aab-noburst.log
```

Build proof:
- Gradle: `BUILD SUCCESSFUL in 43m`
- Unity: `LECLAT_BUILD appBundle=True development=False targetSdk=AndroidApiLevel35 arch=ARM64 result=Succeeded errors=0 path=D:/LECLAT/Builds/Android/LECLAT_AR.aab`
- Final file size on disk: `48,268,091` bytes

AAB content verification:
- Entries: `553`
- `base/manifest/AndroidManifest.xml`: present
- `base/lib/arm64-v8a/libil2cpp.so`: present
- GLB assets: `10`
- Fragment MP4 files: `13`
- WebUI JS bundles: `31`
- `DoNotShip` debug entries: `0`

Output folder cleanup:
- Removed stale failed-build folder `D:/LECLAT/Builds/Android/LECLAT_BurstDebugInformation_DoNotShip`
- Final output folder now contains only `LECLAT_AR.aab`

## Important remaining blockers
1. Google Play upload signing is not final.
   - Current log says `signing=editor-default`.
   - For a Play upload-ready release, set:
     - `LECLAT_KEYSTORE_PATH`
     - `LECLAT_KEYSTORE_PASS`
     - `LECLAT_KEY_ALIAS`
     - `LECLAT_KEY_PASS`

2. Burst AOT is disabled for Android builds.
   - This unblocks the AAB.
   - Test on a real Android device for AR performance.
   - Later optimization path: re-enable Burst after testing Unity/Burst update or isolating the package job that triggers the native object failure.

3. Real-device AR validation still required.
   - Camera permission.
   - ARCore availability.
   - Marker detection.
   - WebView-to-Unity bridge.
   - Model placement and lighting.

4. Gradle reported future deprecations.
   - The build succeeds on Unity's Gradle 9.1 toolchain.
   - Gradle log warns about incompatibility with Gradle 10; treat this as a future Unity/toolchain migration item.

5. Asset/licence production review remains required for GLBs marked `productionApproved:false` in prior audits.

## Current status
Unity Android release-candidate AAB: buildable and verified locally.

Not yet Google Play upload-ready until custom upload signing and device validation are completed.
