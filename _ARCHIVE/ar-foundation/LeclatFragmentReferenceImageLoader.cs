// LeclatFragmentReferenceImageLoader.cs
// Charge les 10 marqueurs JPG depuis Resources/LECLAT/FRAGMENT_*_MARKER.jpg
// dans un MutableRuntimeReferenceImageLibrary, et les attache à
// l'ARTrackedImageManager. Les 10 marqueurs peuvent alors être trackés
// simultanément (ARCore limite = 20).
//
// Score minimum ARCore = 75 (cf. recherche Google AR).
// Spec physique du marqueur : 10 cm de large (cf. LeclatTshirtAnchor).

using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

namespace Leclat.AR
{
    [RequireComponent(typeof(ARTrackedImageManager))]
    public sealed class LeclatFragmentReferenceImageLoader : MonoBehaviour
    {
        [Tooltip("Chemin Resources où sont les JPG (sans le .jpg). Ex: 'LECLAT/FRAGMENT_EVEIL_MARKER'")]
        [SerializeField] private string[] markerResourceNames = new[]
        {
            "LECLAT/FRAGMENT_EVEIL_MARKER",
            "LECLAT/FRAGMENT_SOUFFLE_MARKER",
            "LECLAT/FRAGMENT_FORGE_MARKER",
            "LECLAT/FRAGMENT_PRISME_MARKER",
            "LECLAT/FRAGMENT_ATOME_MARKER",
            "LECLAT/FRAGMENT_ECLIPSE_MARKER",
            "LECLAT/FRAGMENT_HORIZON_MARKER",
            "LECLAT/FRAGMENT_RESONANCE_MARKER",
            "LECLAT/FRAGMENT_ASCENSION_MARKER",
            "LECLAT/FRAGMENT_ORIGINE_MARKER",
        };

        [Tooltip("Taille physique de chaque marqueur imprimé (mètres). 10 cm recommandé.")]
        [SerializeField] private float markerPhysicalWidthM = 0.10f;

        private ARTrackedImageManager trackedImageManager;
        private readonly List<string> failedMarkers = new List<string>();

        private void Awake()
        {
            trackedImageManager = GetComponent<ARTrackedImageManager>();
        }

        private void Start()
        {
            StartCoroutine(LoadMarkersCoroutine());
        }

        private System.Collections.IEnumerator LoadMarkersCoroutine()
        {
            // 1. Crée un MutableRuntimeReferenceImageLibrary (mutable, add at runtime)
            var runtimeLib = trackedImageManager.CreateRuntimeLibrary() as MutableRuntimeReferenceImageLibrary;
            if (runtimeLib == null)
            {
                Debug.LogError("[LeclatFragmentReferenceImageLoader] Runtime library non mutable. Vérifie AR Foundation 6.x+.");
                yield break;
            }

            // 2. Pour chaque marqueur, charge la texture depuis Resources, l'ajoute à la library
            foreach (var resourceName in markerResourceNames)
            {
                var tex = Resources.Load<Texture2D>(resourceName);
                if (tex == null)
                {
                    Debug.LogError($"[LeclatFragmentReferenceImageLoader] Marker manquant dans Resources: {resourceName}");
                    failedMarkers.Add(resourceName);
                    continue;
                }

                // Vérif : taille min 300x300 (cf. recherche Google AR)
                if (tex.width < 300 || tex.height < 300)
                {
                    Debug.LogWarning(
                        $"[LeclatFragmentReferenceImageLoader] {resourceName} : " +
                        $"taille {tex.width}x{tex.height} < 300x300 recommandé");
                }

                // Ajout à la library (asynchrone)
                var addJob = runtimeLib.ScheduleAddImageWithValidationJob(
                    tex,
                    resourceName,             // nom = utilisé par LeclatFragmentRegistry
                    markerPhysicalWidthM);    // taille physique (m)

                // Attend la fin du job (30 ms / image d'après Google)
                while (!addJob.jobHandle.IsCompleted)
                {
                    yield return null;
                }

                addJob.jobHandle.Complete();

                if (addJob.status.IsError())
                {
                    Debug.LogError(
                        $"[LeclatFragmentReferenceImageLoader] Echec ajout {resourceName}: " +
                        $"{addJob.status}. Score ARCore insuffisant (< 75) ?");
                    failedMarkers.Add(resourceName);
                }
                else
                {
                    Debug.Log($"[LeclatFragmentReferenceImageLoader] ✓ {resourceName} ajouté à la library");
                }
            }

            // 3. Attache la library au manager
            trackedImageManager.referenceLibrary = runtimeLib;

            if (failedMarkers.Count > 0)
            {
                Debug.LogWarning(
                    $"[LeclatFragmentReferenceImageLoader] {failedMarkers.Count} marqueurs " +
                    $"échoués : {string.Join(", ", failedMarkers)}");
            }
        }
    }
}
