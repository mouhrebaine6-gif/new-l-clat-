using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

namespace Leclat.AR
{
    /// <summary>
    /// Event-driven image tracking (AR Foundation 6.4 — trackablesChanged, sans reflection).
    /// Transmet la pose au contrôleur d'ailes, pousse "TRACKING" (tracking/limited/none),
    /// ET — nouveau — émet <see cref="FragmentRecognized"/> UNE FOIS qu'un fragment a tenu
    /// une pose STABLE (≥ requiredStableSeconds en état Tracking). C'est ce signal que le
    /// bridge transforme en SCAN_RESULT (garde-fou G1 : jamais de scan sur une frame fugace).
    /// </summary>
    public sealed class LeclatImageTrackingPoller : MonoBehaviour
    {
        public struct RecognizedFragment
        {
            public string FragmentId;
            public string MarkerName;
            public float PoseQuality; // 0..1
            public int StabilityMs;
        }

        [SerializeField] private ARTrackedImageManager trackedImageManager;
        [SerializeField] private LeclatTrackedImageWingsController wingsController;

        [Tooltip("Durée de pose stable (état Tracking) requise avant d'émettre SCAN_RESULT.")]
        [SerializeField] private float requiredStableSeconds = 0.5f;

        /// <summary>Fires once per state transition with "tracking" | "limited" | "none".</summary>
        public event Action<string> TrackingStateChanged;

        /// <summary>Fires once per recognition, après pose stable (garde-fou G1).</summary>
        public event Action<RecognizedFragment> FragmentRecognized;

        private string lastState = string.Empty;

        // Suivi de stabilité par marqueur : depuis quand en Tracking, et déjà émis ?
        private struct Stable
        {
            public float SinceTime; // <0 = pas en Tracking continu
            public bool Emitted;
        }

        private readonly Dictionary<string, Stable> _stable = new();

        private void Awake()
        {
            wingsController ??= GetComponent<LeclatTrackedImageWingsController>();
            if (trackedImageManager == null)
                trackedImageManager = FindAnyObjectByType<ARTrackedImageManager>(FindObjectsInactive.Include);
        }

        private void OnEnable()
        {
            if (trackedImageManager != null)
                trackedImageManager.trackablesChanged.AddListener(OnTrackablesChanged);
        }

        private void OnDisable()
        {
            if (trackedImageManager != null)
                trackedImageManager.trackablesChanged.RemoveListener(OnTrackablesChanged);
        }

        private void OnTrackablesChanged(ARTrackablesChangedEventArgs<ARTrackedImage> changes)
        {
            foreach (var image in changes.added)
                Forward(image);
            foreach (var image in changes.updated)
                Forward(image);
            foreach (var removed in changes.removed)
            {
                // AR Foundation 6.4 : `removed` = KeyValuePair<TrackableId, ARTrackedImage>.
                var image = removed.Value;
                if (image != null)
                    _stable.Remove(image.referenceImage.name);
            }
            if (changes.removed.Count > 0)
                ReportState("none");
        }

        private void Forward(ARTrackedImage image)
        {
            if (image == null)
                return;

            var trackingState = image.trackingState;
            var state = trackingState.ToString();
            var markerName = image.referenceImage.name;

            // Résout le fragment (eveil/souffle/...) depuis le nom du marqueur.
            LeclatFragmentRegistry.TryGetByMarkerName(markerName, out var fragment);
            var fragmentId = string.IsNullOrEmpty(fragment.FragmentId) ? markerName : fragment.FragmentId;

            if (wingsController != null)
            {
                wingsController.ReportTrackedPose(
                    fragmentId,
                    image.transform.position,
                    image.transform.rotation,
                    image.size,
                    state);
            }

            EvaluateStability(markerName, fragmentId, trackingState);
            ReportState(state.ToLowerInvariant());
        }

        /// <summary>Garde-fou G1 : n'émet le fragment qu'après une pose Tracking stable.</summary>
        private void EvaluateStability(string markerName, string fragmentId, TrackingState trackingState)
        {
            var now = Time.unscaledTime;
            _stable.TryGetValue(markerName, out var s);

            if (trackingState == TrackingState.Tracking)
            {
                if (s.SinceTime <= 0f)
                {
                    s.SinceTime = now;
                    s.Emitted = false;
                }

                if (!s.Emitted && now - s.SinceTime >= requiredStableSeconds)
                {
                    s.Emitted = true;
                    FragmentRecognized?.Invoke(new RecognizedFragment
                    {
                        FragmentId = fragmentId,
                        MarkerName = markerName,
                        PoseQuality = 1f,
                        StabilityMs = Mathf.RoundToInt((now - s.SinceTime) * 1000f),
                    });
                }
            }
            else
            {
                // Perte (Limited/None) → on réarme : une re-acquisition stable réémettra.
                s.SinceTime = -1f;
                s.Emitted = false;
            }

            _stable[markerName] = s;
        }

        private void ReportState(string state)
        {
            if (state == lastState)
                return;
            lastState = state;
            TrackingStateChanged?.Invoke(state);
        }
    }
}
