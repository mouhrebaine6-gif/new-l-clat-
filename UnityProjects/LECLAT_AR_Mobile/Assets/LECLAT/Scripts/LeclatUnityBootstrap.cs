using UnityEngine;

namespace Leclat.AR
{
    public sealed class LeclatUnityBootstrap : MonoBehaviour
    {
        [SerializeField] private LeclatWebViewHost webViewHost;
        [SerializeField] private bool runInEditor;

        private void Awake()
        {
            EnsureRuntimeStack(gameObject, runInEditor);
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void InstallAfterSceneLoad()
        {
            var bridge = Object.FindFirstObjectByType<LeclatNativeBridge>();
            var target = bridge != null ? bridge.gameObject : GameObject.Find("LECLAT_Manager");
            if (target == null)
            {
                target = new GameObject("LECLAT_Manager");
                Object.DontDestroyOnLoad(target);
            }

            EnsureRuntimeStack(target, false);
        }

        private static void EnsureRuntimeStack(GameObject target, bool runInEditor)
        {
            if (target == null)
            {
                return;
            }

            Ensure<LeclatNativeBridge>(target);
            Ensure<LeclatModelRegistry>(target);
            Ensure<LeclatTrackedImageWingsController>(target);
            Ensure<LeclatGltfastLoader>(target);
            Ensure<LeclatArRuntime>(target);
            Ensure<LeclatImageTrackingPoller>(target);
            Ensure<LeclatGyroFallbackController>(target);
            Ensure<LeclatProfilerOverlay>(target);
            Ensure<LeclatVuforiaBootstrap>(target);

            var qr = Ensure<LeclatQRFirstScan>(target);
            if (Application.isEditor && !runInEditor)
            {
                qr.ApplyStoredFragmentIfValid();
            }

            if (Object.FindFirstObjectByType<LeclatWebViewHost>() == null)
            {
                Ensure<LeclatWebViewHost>(target);
            }
        }

        private static T Ensure<T>(GameObject target) where T : Component
        {
            return target.GetComponent<T>() ?? target.AddComponent<T>();
        }
    }
}
