# L'ECLAT - AR Mobile Unity

Unity project for the L'ECLAT phygital t-shirt experience.

## Runtime Model

- The embroidered logo is tracked by Vuforia on-device image targets.
- Vuforia provides pose and tracking state only.
- The hidden collar QR decides the fragment entitlement and writes the current fragment to `leclat.fragmentId`.
- `LeclatNativeBridge` and the WebView contract stay unchanged.

## Main Scene

Scene: `Assets/LECLAT/Scenes/Main.unity`

Core runtime stack:

- `LeclatUnityBootstrap` installs missing runtime components.
- `LeclatVuforiaBootstrap` creates the Vuforia camera and image target if absent.
- `LeclatQRFirstScan` performs the first local QR unlock.
- `LeclatSecureScanStore` and `LeclatDeviceIdentity` keep tamper-evident local scan data; all backend calls go through the WebView (decision 2026-07-03).
- `LeclatArRuntime` starts Vuforia through the existing bridge API.
- `LeclatImageTrackingPoller` listens to Vuforia target status events.
- `LeclatTrackedImageWingsController` anchors, smooths, loads, and colors the 3D wings.
- `LeclatGyroFallbackController` keeps a graceful gyro overlay when target tracking is unavailable.
- `LeclatWebViewHost` keeps the embedded React WebUI available.

## Assets

- Embedded WebUI: `Assets/StreamingAssets/LECLAT/WebUI`
- Runtime models: `Assets/StreamingAssets/LECLAT/Models`
- Vuforia database: `Assets/StreamingAssets/Vuforia/LECLAT.xml` and `LECLAT.dat`

## Validation

Run from the Unity project folder:

```bat
Unity.exe -batchmode -quit -projectPath . -executeMethod Leclat.AR.Editor.LeclatValidate.Run -logFile validate.log
Unity.exe -batchmode -quit -projectPath . -executeMethod Leclat.AR.Editor.LeclatModelAudit.Run -logFile audit.log
```

`LeclatValidate.Run` checks the Vuforia runtime stack, WebUI assets, model registry files, build scene, and render pipeline.

## Production Notes

- Android release should use ARM64, IL2CPP, and a Play-ready signing key.
- The client is not authoritative for scan counts or story progression.
- The backend must validate QR token ownership, nonce idempotence, rate limits, and access level.
- Do not commit private Vuforia keys, backend secrets, signing material, or generated customer QR token lists.
