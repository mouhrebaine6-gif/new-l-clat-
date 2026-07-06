using UnityEngine;
using Vuforia;

namespace Leclat.AR
{
    /// <summary>
    /// Vuforia lifecycle entry point. Public API is kept stable for LeclatNativeBridge.
    /// </summary>
    public sealed class LeclatArRuntime : MonoBehaviour
    {
        [SerializeField] private VuforiaBehaviour vuforiaBehaviour;

        public bool BeginScan(out string reason)
        {
            // Android 6+ : la caméra est INUTILISABLE tant que l'autorisation n'est pas
            // accordée à l'exécution. On la demande ici (non bloquant) ; si l'utilisateur
            // vient de l'accorder, Vuforia ouvrira la caméra au scan suivant.
#if UNITY_ANDROID && !UNITY_EDITOR
            if (!UnityEngine.Android.Permission.HasUserAuthorizedPermission(UnityEngine.Android.Permission.Camera))
            {
                UnityEngine.Android.Permission.RequestUserPermission(UnityEngine.Android.Permission.Camera);
            }
#endif

            if (vuforiaBehaviour == null)
            {
                vuforiaBehaviour = FindAnyObjectByType<VuforiaBehaviour>(FindObjectsInactive.Include);
            }

            if (vuforiaBehaviour == null)
            {
                vuforiaBehaviour = CreateRuntimeVuforiaCamera();
            }

            vuforiaBehaviour.enabled = true;
            ApplyMobilePerformanceProfile();
            EnsureArLighting();
            // Autofocus continu : garde le logo NET quand le t-shirt bouge (tissu déformable).
            EnableContinuousAutofocus();
            reason = "Vuforia runtime ready.";
            return true;
        }

        private static VuforiaBehaviour CreateRuntimeVuforiaCamera()
        {
            var go = GameObject.Find("Leclat_AR_Camera") ?? new GameObject("Leclat_AR_Camera");
            var cam = go.GetComponent<Camera>() ?? go.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Color.black;
            cam.nearClipPlane = 0.01f;
            cam.farClipPlane = 100f;
            if (go.GetComponent<AudioListener>() == null)
            {
                go.AddComponent<AudioListener>();
            }
            go.tag = "MainCamera";
            return go.GetComponent<VuforiaBehaviour>() ?? go.AddComponent<VuforiaBehaviour>();
        }

        // S'arme sur OnVuforiaStarted (idempotent) pour activer l'autofocus continu
        // dès que la caméra Vuforia tourne. C'est l'optimisation #1 du tracking sur
        // une cible imprimée/brodée portée (le tissu se déforme et bouge).
        private void EnableContinuousAutofocus()
        {
            if (VuforiaApplication.Instance == null)
            {
                return;
            }

            VuforiaApplication.Instance.OnVuforiaStarted -= ApplyContinuousAutofocus;
            VuforiaApplication.Instance.OnVuforiaStarted += ApplyContinuousAutofocus;
            if (VuforiaApplication.Instance.IsRunning)
            {
                ApplyContinuousAutofocus();
            }
        }

        private static void ApplyContinuousAutofocus()
        {
            var vb = VuforiaBehaviour.Instance;
            if (vb != null && vb.CameraDevice != null &&
                vb.CameraDevice.IsFocusModeSupported(FocusMode.FOCUS_MODE_CONTINUOUSAUTO))
            {
                vb.CameraDevice.SetFocusMode(FocusMode.FOCUS_MODE_CONTINUOUSAUTO);
            }
        }

        private void OnDestroy()
        {
            if (VuforiaApplication.Instance != null)
            {
                VuforiaApplication.Instance.OnVuforiaStarted -= ApplyContinuousAutofocus;
            }
        }

        private static void ApplyMobilePerformanceProfile()
        {
            QualitySettings.vSyncCount = 0;
            Application.targetFrameRate = 60;
            QualitySettings.antiAliasing = 0;
            QualitySettings.shadowDistance = 12f;
            QualitySettings.shadowCascades = 0;
            QualitySettings.softParticles = false;
            QualitySettings.realtimeReflectionProbes = false;
            QualitySettings.billboardsFaceCameraPosition = false;
            QualitySettings.skinWeights = SkinWeights.TwoBones;
        }

        // Rendu des ailes (glTFast → URP Lit) : sans lumière de scène dédiée, elles
        // seraient plates ou trop sombres sur le flux caméra. On installe UNE key
        // light directionnelle (3/4 haut, très légèrement chaude) + un ambient doux
        // qui débouche les ombres. Une seule fois, sans ombres portées (coût mobile).
        private static void EnsureArLighting()
        {
            if (GameObject.Find("LECLAT_AR_KeyLight") != null)
            {
                return;
            }

            var go = new GameObject("LECLAT_AR_KeyLight");
            var light = go.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.color = new Color(1f, 0.97f, 0.9f);
            light.shadows = LightShadows.None;
            go.transform.rotation = Quaternion.Euler(52f, -28f, 0f);
            DontDestroyOnLoad(go);

            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.32f, 0.34f, 0.40f);
        }
    }
}
