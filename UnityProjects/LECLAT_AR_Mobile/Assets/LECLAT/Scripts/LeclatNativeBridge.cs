using System;
using UnityEngine;

namespace Leclat.AR
{
    public sealed class LeclatNativeBridge : MonoBehaviour
    {
        public event Action<string> MessageToWeb;

        private LeclatArRuntime arRuntime;
        private LeclatModelRegistry modelRegistry;
        private LeclatTrackedImageWingsController wingsController;
        private LeclatImageTrackingPoller imageTrackingPoller;
        private LeclatGltfastLoader gltfLoader;
        private string sessionNonce = string.Empty;

        private void Awake()
        {
            arRuntime = GetComponent<LeclatArRuntime>() ?? gameObject.AddComponent<LeclatArRuntime>();
            modelRegistry = GetComponent<LeclatModelRegistry>() ?? gameObject.AddComponent<LeclatModelRegistry>();
            wingsController = GetComponent<LeclatTrackedImageWingsController>() ?? gameObject.AddComponent<LeclatTrackedImageWingsController>();
            imageTrackingPoller = GetComponent<LeclatImageTrackingPoller>() ?? gameObject.AddComponent<LeclatImageTrackingPoller>();
            gltfLoader = GetComponent<LeclatGltfastLoader>() ?? gameObject.AddComponent<LeclatGltfastLoader>();

            imageTrackingPoller.TrackingStateChanged += OnTrackingStateChanged;
            imageTrackingPoller.FragmentRecognized += OnFragmentRecognized;
        }

        private void OnDestroy()
        {
            if (imageTrackingPoller != null)
            {
                imageTrackingPoller.TrackingStateChanged -= OnTrackingStateChanged;
                imageTrackingPoller.FragmentRecognized -= OnFragmentRecognized;
            }
        }

        // Reconnaissance stable d'un fragment (logo brodé) → SCAN_RESULT.
        // C'est LE message attendu par ScanPage.tsx → resolveLeclatScan → paliers.
        // qr_token est synthétique (tracking d'image, pas de QR) mais non vide,
        // requis par isScanResultPayload côté web. Le nonce permet la validation prod.
        private void OnFragmentRecognized(LeclatImageTrackingPoller.RecognizedFragment r)
        {
            // Vrai token QR (col) deja scanne pour CE fragment -> le serveur reconnait le
            // t-shirt et tranche (compte / owner / palier reel). Sinon token synthetique non
            // vide -> apercu local (le logo seul ne compte pas, cf. Constitution des scans).
            if (!LeclatSecureScanStore.TryGetValidTokenForFragment(r.FragmentId, out var qrToken) ||
                string.IsNullOrWhiteSpace(qrToken))
            {
                qrToken = "leclat-" + r.FragmentId + "-" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            }
            SendToWeb(
                "SCAN_RESULT",
                sessionNonce,
                "{" +
                LeclatJson.StringField("qr_token", qrToken) + "," +
                LeclatJson.StringField("fragment_hint", r.FragmentId) + "," +
                LeclatJson.StringField("marker_id", r.MarkerName) + "," +
                LeclatJson.NumberField("pose_quality", r.PoseQuality) + "," +
                LeclatJson.IntField("stability_ms", r.StabilityMs) + "," +
                LeclatJson.IntField("timestamp", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()) +
                "}"
            );
        }

        // Additive to the bridge contract: pushes "tracking" | "limited" | "none" to the
        // WebUI on marker tracking transitions. Existing events are unchanged.
        private void OnTrackingStateChanged(string state)
        {
            SendToWeb("TRACKING", sessionNonce, "{" + LeclatJson.StringField("state", state) + "}");
        }

        public void ReceiveFromWeb(string json)
        {
            var eventName = LeclatJson.ReadString(json, "type");
            if (string.IsNullOrEmpty(eventName))
            {
                eventName = LeclatJson.ReadString(json, "event");
            }

            var nonce = LeclatJson.ReadString(json, "nonce");
            if (string.IsNullOrEmpty(nonce))
            {
                nonce = sessionNonce;
            }

            switch (eventName)
            {
                case "WEB_READY":
                    HandleWebReady(json, nonce);
                    break;
                case "NAV_STATE":
                case "HAPTIC_REQUEST":
                case "NAV_BACK":
                    break;
                case "SCAN_REQUEST":
                    HandleScanRequest(nonce);
                    break;
                case "SCAN_CANCEL":
                    SendToWeb("SCAN_CANCEL", nonce, "{" + LeclatJson.StringField("status", "cancelled") + "}");
                    break;
                case "AR_LAUNCH":
                    HandleArLaunch(json, nonce);
                    break;
                default:
                    SendError(nonce, "UNKNOWN_EVENT", "Unsupported WebUI event: " + eventName);
                    break;
            }
        }

        private void HandleWebReady(string json, string nonce)
        {
            var webNonce = LeclatJson.ReadStringInPayload(json, "sessionNonce");
            sessionNonce = string.IsNullOrEmpty(webNonce) ? nonce : webNonce;

            SendToWeb(
                "DEVICE_INFO",
                sessionNonce,
                "{" +
                LeclatJson.StringField("platform", Application.platform.ToString().ToLowerInvariant()) + "," +
                LeclatJson.StringField("appVersion", Application.version) +
                "}"
            );
        }

        private void HandleScanRequest(string nonce)
        {
            if (!arRuntime.BeginScan(out var reason))
            {
                SendError(nonce, "AR_RUNTIME_UNAVAILABLE", reason);
                return;
            }

            SendToWeb(
                "SCAN_READY",
                nonce,
                "{" +
                LeclatJson.BoolField("camera_ready", true) + "," +
                LeclatJson.StringField("camera_facing_mode", "environment") + "," +
                LeclatJson.StringField("tracking_reference", wingsController.ReferenceImageName) +
                "}"
            );
        }

        private async void HandleArLaunch(string json, string nonce)
        {
            var fragmentId = LeclatJson.ReadStringInPayload(json, "fragment_id");
            if (string.IsNullOrEmpty(fragmentId))
            {
                fragmentId = LeclatJson.ReadStringInPayload(json, "selected_fragment_id");
            }
            if (string.IsNullOrEmpty(fragmentId))
            {
                fragmentId = LeclatJson.ReadStringInPayload(json, "fragmentId");
            }

            if (!modelRegistry.TryResolve(fragmentId, out var entry, out var absolutePath, out var reason))
            {
                SendError(nonce, "MODEL_NOT_FOUND", reason);
                return;
            }

            if (!arRuntime.BeginScan(out reason))
            {
                SendError(nonce, "AR_RUNTIME_UNAVAILABLE", reason);
                return;
            }

            wingsController.SelectFragment(entry);
            wingsController.ClearContent();

            if (!gltfLoader.IsAvailable)
            {
                SendError(nonce, "GLTFAST_UNAVAILABLE", "com.unity.cloud.gltfast is not resolved yet. Open Unity once or let Package Manager resolve dependencies.");
                return;
            }

            try
            {
                await gltfLoader.LoadIntoAsync(absolutePath, wingsController.ContentRoot);
                // Le composant a pu etre detruit pendant l'await (teardown AR, double AR_LAUNCH)
                // -> on annule avant de toucher un wingsController potentiellement detruit.
                if (this == null || wingsController == null)
                {
                    return;
                }
                wingsController.NormalizeLoadedContent();
            }
            catch (Exception ex)
            {
                SendError(nonce, "GLB_LOAD_FAILED", ex.Message);
                return;
            }

            SendToWeb(
                "AR_RESULT",
                nonce,
                "{" +
                LeclatJson.StringField("fragment_id", entry.fragmentId) + "," +
                LeclatJson.StringField("model_id", entry.modelId) + "," +
                LeclatJson.StringField("model_path", absolutePath.Replace("\\", "/")) + "," +
                LeclatJson.StringField("tracking_reference", wingsController.ReferenceImageName) + "," +
                LeclatJson.BoolField("model_loaded", true) + "," +
                LeclatJson.BoolField("tracking_ready", wingsController.HasFreshTracking) + "," +
                LeclatJson.StringField("license_policy", entry.licensePolicy) +
                "}"
            );
        }

        private void SendError(string nonce, string code, string message)
        {
            SendToWeb(
                "ERROR",
                nonce,
                "{" +
                LeclatJson.StringField("code", code) + "," +
                LeclatJson.StringField("message", message) +
                "}"
            );
        }

        private void SendToWeb(string eventName, string nonce, string payloadJson)
        {
            var message = LeclatJson.EventEnvelope(eventName, nonce, payloadJson);
            MessageToWeb?.Invoke(message);
            Debug.Log("[LECLAT_BRIDGE_OUT] " + message);
        }
    }
}


