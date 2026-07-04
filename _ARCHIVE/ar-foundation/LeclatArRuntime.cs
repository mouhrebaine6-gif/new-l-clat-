using UnityEngine;
using UnityEngine.XR.ARFoundation;

namespace Leclat.AR
{
    /// <summary>
    /// Owns the AR session lifecycle. The reference-image library (les 10 marqueurs
    /// fragments) est gérée par <see cref="LeclatFragmentReferenceImageLoader"/> —
    /// source UNIQUE. Ce script ne possède plus de bibliothèque rivale et ne charge
    /// plus de marqueur "sceau" depuis Resources (qui n'existait pas → crash).
    /// </summary>
    public sealed class LeclatArRuntime : MonoBehaviour
    {
        [SerializeField] private ARSession arSession;
        [SerializeField] private ARTrackedImageManager trackedImageManager;

        public ARTrackedImageManager TrackedImageManager => trackedImageManager;

        public bool BeginScan(out string reason)
        {
            if (arSession == null)
                arSession = FindAnyObjectByType<ARSession>(FindObjectsInactive.Include);
            if (trackedImageManager == null)
                trackedImageManager = FindAnyObjectByType<ARTrackedImageManager>(FindObjectsInactive.Include);

            if (arSession == null || trackedImageManager == null)
            {
                reason = "AR rig (ARSession / ARTrackedImageManager) is missing from the scene.";
                return false;
            }

            arSession.enabled = true;

            // Garantit la SEULE bibliothèque de marqueurs : le loader des 10 fragments,
            // attaché au runtime sur le GameObject de l'ARTrackedImageManager (pas besoin
            // d'édition de scène). Idempotent : jamais deux loaders.
            if (trackedImageManager.GetComponent<LeclatFragmentReferenceImageLoader>() == null)
            {
                trackedImageManager.gameObject.AddComponent<LeclatFragmentReferenceImageLoader>();
                Debug.Log("[LECLAT] LeclatFragmentReferenceImageLoader attaché (10 marqueurs).");
            }

            // CRITIQUE — suivi d'images EN MOUVEMENT : un t-shirt porté/froissé qui bouge
            // n'est PAS suivi sans ceci (ARCore traque alors la cible image par image).
            try { trackedImageManager.requestedMaxNumberOfMovingImages = 10; }
            catch (System.Exception e) { Debug.LogWarning("[LECLAT] movingImages non supporté: " + e.Message); }

            trackedImageManager.enabled = true;
            ApplyMobilePerformanceProfile();
            reason = "AR runtime ready.";
            return true;
        }

        /// <summary>
        /// Profil perf mobile « tous téléphones » appliqué au runtime (sûr, sans toucher
        /// aux assets) : 60 fps piloté par targetFrameRate, pas de MSAA, ombres proches,
        /// pas de réflexions temps réel. Sur appareil faible, AR Foundation rabattra
        /// naturellement le framerate ; le plancher reste jouable.
        /// </summary>
        private static void ApplyMobilePerformanceProfile()
        {
            QualitySettings.vSyncCount = 0;          // laisse targetFrameRate cadencer
            Application.targetFrameRate = 60;        // 60 fps visé (plancher 30 si thermal)
            QualitySettings.antiAliasing = 0;        // pas de MSAA en AR (coûteux, peu utile)
            QualitySettings.shadowDistance = 12f;    // ombres proches seulement
            QualitySettings.shadowCascades = 0;
            QualitySettings.softParticles = false;
            QualitySettings.realtimeReflectionProbes = false;
            QualitySettings.billboardsFaceCameraPosition = false;
            QualitySettings.skinWeights = SkinWeights.TwoBones;
        }
    }
}
