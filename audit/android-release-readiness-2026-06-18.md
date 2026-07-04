# LECLAT Android Release Readiness - 2026-06-18

## Build outputs
- Play upload bundle: `D:\LECLAT\Builds\Android\LECLAT_AR.aab`
- Sideload test APK: `D:\LECLAT\Builds\Android\LECLAT.apk`

## Verified Android package
- Package: `com.leclat.armobile`
- Version: `1.0` / versionCode `1`
- Min SDK: `25`
- Target SDK: `35`
- Native ABI: `arm64-v8a`
- Signature: APK v2/v3 valid for test APK
- AAB debug/DoNotShip artifacts: `0`

## Compatibility fix applied
- ARCore support is now optional.
- ARCore depth support is now optional.
- Camera features are declared optional, so non-ARCore phones can install and use fallback/WebUI flows.

## Store readiness notes
- Google Play: target API 35 and AAB are aligned with current Play requirement.
- Google Play upload still needs a real release keystore, not the editor/default debug signing.
- App Store: iOS build requires Xcode 26+ / iOS SDK 26+ and Apple signing on macOS.

## ADB status
- Windows detects `itel A70` and an ADB Interface.
- `adb devices -l` is still empty, so USB install cannot be automated yet.
