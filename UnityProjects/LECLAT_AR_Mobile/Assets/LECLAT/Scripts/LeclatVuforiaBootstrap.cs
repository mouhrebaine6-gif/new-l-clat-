using System;
using System.Collections;
using UnityEngine;
using Vuforia;

namespace Leclat.AR
{
    /// <summary>
    /// Builds the Vuforia runtime rig when the scene does not already contain one.
    /// </summary>
    public sealed class LeclatVuforiaBootstrap : MonoBehaviour
    {
        [SerializeField] private string databaseName = "LECLAT";
        [SerializeField] private string targetName = "b4e2f9ff-628c-477e-9354-73a741278ced";
        [SerializeField] private bool buildRuntimeRigIfMissing = true;

        private bool imageTargetReady;

        private string DatabasePath => $"Vuforia/{databaseName}.xml";

        private void OnEnable()
        {
            if (VuforiaApplication.Instance != null)
            {
                VuforiaApplication.Instance.OnVuforiaInitialized += OnVuforiaInitialized;
            }
        }

        private void OnDisable()
        {
            if (VuforiaApplication.Instance != null)
            {
                VuforiaApplication.Instance.OnVuforiaInitialized -= OnVuforiaInitialized;
            }
        }

        private void Start()
        {
            if (FindAnyObjectByType<VuforiaBehaviour>(FindObjectsInactive.Include) != null)
            {
                EnsureManagerStack();
                TryCreateImageTarget();
                return;
            }

            if (!buildRuntimeRigIfMissing)
            {
                Debug.LogWarning("[LeclatVuforiaBootstrap] No VuforiaBehaviour in scene.");
                return;
            }

            StartCoroutine(BuildRigCoroutine());
        }

        private void OnVuforiaInitialized(VuforiaInitError error)
        {
            if (error != VuforiaInitError.NONE)
            {
                Debug.LogWarning($"[LeclatVuforiaBootstrap] Vuforia init failed: {error}");
                return;
            }

            TryCreateImageTarget();
        }

        private IEnumerator BuildRigCoroutine()
        {
            EnsureVuforiaCamera();
            EnsureManagerStack();
            yield return null;
            TryCreateImageTarget();
            Debug.Log("[LeclatVuforiaBootstrap] Vuforia rig ready.");
        }

        private static GameObject EnsureVuforiaCamera()
        {
            var arCamGo = GameObject.Find("Leclat_AR_Camera");
            Camera arCam;
            if (arCamGo == null)
            {
                arCamGo = new GameObject("Leclat_AR_Camera");
                arCam = arCamGo.AddComponent<Camera>();
                arCam.clearFlags = CameraClearFlags.SolidColor;
                arCam.backgroundColor = Color.black;
                arCam.nearClipPlane = 0.01f;
                arCam.farClipPlane = 100f;
                arCamGo.AddComponent<AudioListener>();
            }
            else
            {
                arCam = arCamGo.GetComponent<Camera>() ?? arCamGo.AddComponent<Camera>();
            }

            if (arCamGo.GetComponent<VuforiaBehaviour>() == null)
            {
                arCamGo.AddComponent<VuforiaBehaviour>();
            }

            arCamGo.tag = "MainCamera";
            return arCamGo;
        }

        private void TryCreateImageTarget()
        {
            if (GameObject.Find("Leclat_ImageTarget") != null)
            {
                imageTargetReady = true;
                RefreshPoller();
                return;
            }

            if (imageTargetReady)
            {
                RefreshPoller();
                return;
            }

            if (string.IsNullOrWhiteSpace(targetName))
            {
                Debug.LogWarning("[LeclatVuforiaBootstrap] Missing Vuforia target name.");
                return;
            }

            var vuforia = VuforiaBehaviour.Instance;
            if (vuforia == null || vuforia.ObserverFactory == null)
            {
                return;
            }

            try
            {
                var imageTarget = vuforia.ObserverFactory.CreateImageTarget(DatabasePath, targetName);
                if (imageTarget == null)
                {
                    Debug.LogWarning($"[LeclatVuforiaBootstrap] Could not create Vuforia target '{targetName}' from {DatabasePath}.");
                    return;
                }

                imageTarget.gameObject.name = "Leclat_ImageTarget";
                imageTargetReady = true;
                RefreshPoller();
                Debug.Log($"[LeclatVuforiaBootstrap] Created Vuforia target '{targetName}' from {DatabasePath}.");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[LeclatVuforiaBootstrap] Vuforia target creation failed: {ex.Message}");
            }
        }

        private static void RefreshPoller()
        {
            var poller = FindAnyObjectByType<LeclatImageTrackingPoller>(FindObjectsInactive.Include);
            if (poller != null)
            {
                poller.RefreshObservers();
            }
        }

        private static void EnsureManagerStack()
        {
            var managerGo = GameObject.Find("LECLAT_Manager") ?? new GameObject("LECLAT_Manager");
            EnsureComponent<LeclatNativeBridge>(managerGo);
            EnsureComponent<LeclatModelRegistry>(managerGo);
            EnsureComponent<LeclatTrackedImageWingsController>(managerGo);
            EnsureComponent<LeclatGltfastLoader>(managerGo);
            EnsureComponent<LeclatArRuntime>(managerGo);
            EnsureComponent<LeclatImageTrackingPoller>(managerGo);
            EnsureComponent<LeclatGyroFallbackController>(managerGo);
            EnsureComponent<LeclatProfilerOverlay>(managerGo);
            EnsureComponent<LeclatQRFirstScan>(managerGo);
        }

        private static T EnsureComponent<T>(GameObject go) where T : Component
        {
            return go.GetComponent<T>() ?? go.AddComponent<T>();
        }
    }
}
