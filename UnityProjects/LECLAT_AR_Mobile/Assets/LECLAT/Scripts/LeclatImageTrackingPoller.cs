using System;
using System.Collections.Generic;
using UnityEngine;
using Vuforia;

namespace Leclat.AR
{
    /// <summary>
    /// Suivi d'image Vuforia + IDENTIFICATION PAR COULEUR DU TISSU.
    ///
    /// Vuforia ancre le logo (même logo sur TOUS les t-shirts). C'est la COULEUR DU
    /// TISSU autour du logo (<see cref="LeclatFabricColorDetector"/>) qui identifie le
    /// fragment du t-shirt POINTÉ → on affiche les ailes de CE t-shirt, jamais celles
    /// du téléphone scanneur. Le scanneur ne voit jamais ses propres ailes.
    ///
    /// Flux : logo tracké stable → détection couleur (1 fois / acquisition) →
    /// detectedFragmentId → ancre + charge SES ailes → SCAN_RESULT(detectedFragmentId).
    /// Couleur indétectable → message sobre (jamais d'erreur / « fragment inconnu »).
    /// Cible perdue → pilier 3 gyroscope (jamais d'écran noir).
    ///
    /// API publique inchangée (pont intact) : <see cref="TrackingStateChanged"/>,
    /// <see cref="FragmentRecognized"/>, <see cref="RecognizedFragment"/>.
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

        [SerializeField] private LeclatTrackedImageWingsController wingsController;
        [SerializeField] private LeclatGyroFallbackController gyroFallback;
        [SerializeField] private LeclatFabricColorDetector colorDetector;

        [Tooltip("Pose stable (TRACKED) requise avant de tenter la détection couleur.")]
        [SerializeField] private float requiredStableSeconds = 0.5f;
        [Tooltip("Délai sans aucune cible avant le fallback gyroscope (pilier 3).")]
        [SerializeField] private float gyroFallbackDelay = 1.0f;
        [Tooltip("Intervalle de re-tentative de détection couleur tant qu'elle échoue.")]
        [SerializeField] private float redetectInterval = 0.8f;
        [Tooltip("Fragment de repli en ÉDITEUR seulement (pas de vrai tissu à scanner).")]
        [SerializeField] private string editorFallbackFragmentId = "eveil";

        /// <summary>"tracking" | "limited" | "none" | "gyro".</summary>
        public event Action<string> TrackingStateChanged;
        /// <summary>Émis une fois, après détection couleur réussie + pose stable.</summary>
        public event Action<RecognizedFragment> FragmentRecognized;
        /// <summary>Indice UI SOBRE si la couleur est indétectable (jamais d'erreur technique).</summary>
        public event Action<string> DetectionHint;

        private readonly List<ObserverBehaviour> observers = new();
        private string lastState = string.Empty;
        private float lastTrackedTime = -999f;
        private float nextObserverRefreshTime;
        private bool gyroOn;

        private ObserverBehaviour activeObserver;
        private Status lastStatus = Status.NO_POSE;

        // Détection couleur — 1 résolution par acquisition.
        private string detectedFragmentId = string.Empty;
        private bool detectionDone;
        private bool detectionPending;
        private float stableSince = -1f;
        private float nextDetectAttempt;
        private bool recognizedEmitted;

        private void Awake()
        {
            if (wingsController == null)
            {
                wingsController = GetComponent<LeclatTrackedImageWingsController>();
            }
            if (gyroFallback == null)
            {
                gyroFallback = GetComponent<LeclatGyroFallbackController>();
            }
            if (colorDetector == null)
            {
                colorDetector = GetComponent<LeclatFabricColorDetector>();
                if (colorDetector == null)
                {
                    colorDetector = gameObject.AddComponent<LeclatFabricColorDetector>();
                }
            }
            WireGyroFallback();
        }

        private void Start()
        {
            WireGyroFallback();
            RefreshObservers();
        }

        private void WireGyroFallback()
        {
            if (gyroFallback != null && wingsController != null)
            {
                gyroFallback.SetTarget(wingsController.ContentRoot);
                gyroFallback.SetCamera(Camera.main);
            }
        }

        private void OnEnable()
        {
            RefreshObservers();
        }

        private void OnDisable()
        {
            UnregisterObservers();
            observers.Clear();
        }

        public void RefreshObservers()
        {
            UnregisterObservers();
            observers.Clear();
            observers.AddRange(FindObjectsByType<ObserverBehaviour>(FindObjectsInactive.Include));
            for (var i = 0; i < observers.Count; i++)
            {
                if (observers[i] != null)
                {
                    observers[i].OnTargetStatusChanged += OnTargetStatusChanged;
                }
            }
        }

        private void UnregisterObservers()
        {
            for (var i = 0; i < observers.Count; i++)
            {
                if (observers[i] != null)
                {
                    observers[i].OnTargetStatusChanged -= OnTargetStatusChanged;
                }
            }
        }

        // Vuforia ne notifie le statut que sur TRANSITION → on gère l'état ici, mais la
        // pose (qui bouge chaque frame) est lue dans Update pour un ancrage fluide.
        private void OnTargetStatusChanged(ObserverBehaviour observer, TargetStatus targetStatus)
        {
            lastStatus = targetStatus.Status;
            var tracked = lastStatus == Status.TRACKED || lastStatus == Status.EXTENDED_TRACKED;
            var limited = lastStatus == Status.LIMITED;

            if (tracked || limited)
            {
                activeObserver = observer;
                lastTrackedTime = Time.unscaledTime;
                if (gyroOn)
                {
                    SetGyro(false); // Vuforia a repris la main (piliers 1+2)
                }
                ReportState(tracked ? "tracking" : "limited");
            }
            else // NO_POSE : cible perdue → on réarme pour la prochaine acquisition.
            {
                ResetAcquisition();
                ReportState("none");
            }
        }

        private void Update()
        {
            if (observers.Count == 0 && Time.unscaledTime >= nextObserverRefreshTime)
            {
                nextObserverRefreshTime = Time.unscaledTime + 0.5f;
                RefreshObservers();
            }

            var tracked = lastStatus == Status.TRACKED || lastStatus == Status.EXTENDED_TRACKED;
            var limited = lastStatus == Status.LIMITED;

            if ((tracked || limited) && activeObserver != null)
            {
                lastTrackedTime = Time.unscaledTime;

                if (tracked)
                {
                    TryDetectColor(activeObserver);
                }

                if (detectionDone && !string.IsNullOrEmpty(detectedFragmentId) && wingsController != null)
                {
                    wingsController.ReportTrackedPose(
                        detectedFragmentId,
                        activeObserver.transform.position,
                        activeObserver.transform.rotation,
                        GetSizeMeters(activeObserver),
                        tracked ? "Tracking" : "Limited");

                    MaybeEmitRecognized(activeObserver.TargetName);
                }
            }

            // Pilier 3 : aucune cible depuis trop longtemps → fallback gyroscope.
            if (!gyroOn && gyroFallback != null && Time.unscaledTime - lastTrackedTime > gyroFallbackDelay)
            {
                SetGyro(true);
            }
        }

        // Identifie le fragment par la couleur du tissu (1 fois / acquisition, après pose stable).
        private void TryDetectColor(ObserverBehaviour observer)
        {
            if (detectionDone || detectionPending || colorDetector == null)
            {
                return;
            }

            if (stableSince <= 0f)
            {
                stableSince = Time.unscaledTime;
            }
            if (Time.unscaledTime - stableSince < requiredStableSeconds)
            {
                return; // garde-fou G1 : pose stable d'abord
            }
            if (Time.unscaledTime < nextDetectAttempt)
            {
                return;
            }

            detectionPending = true;
            nextDetectAttempt = Time.unscaledTime + redetectInterval;
            var size = GetSizeMeters(observer);
            colorDetector.Detect(Camera.main, observer.transform, Mathf.Max(size.x, 0.05f), OnColorDetected);
        }

        private void OnColorDetected(LeclatFabricColorDetector.Result result)
        {
            detectionPending = false;

            if (result.Found)
            {
                detectedFragmentId = result.FragmentId;
                detectionDone = true;
                var isOwner = LeclatOwnedFragments.IsOwned(detectedFragmentId);
                Debug.Log($"[LECLAT] T-shirt détecté: {detectedFragmentId} (conf {result.Confidence:0.00}) — {(isOwner ? "OWNER" : "VISITOR")}");
                return;
            }

            // Repli ÉDITEUR : pas de vrai tissu → on affiche un fragment pour tester.
            if (Application.isEditor && !string.IsNullOrEmpty(editorFallbackFragmentId))
            {
                detectedFragmentId = editorFallbackFragmentId;
                detectionDone = true;
                return;
            }

            // Fallback PROD sobre : jamais d'erreur technique, jamais « fragment inconnu ».
            DetectionHint?.Invoke("Recule légèrement ou améliore l'éclairage");
        }

        private void MaybeEmitRecognized(string targetName)
        {
            if (recognizedEmitted)
            {
                return;
            }
            recognizedEmitted = true;
            FragmentRecognized?.Invoke(new RecognizedFragment
            {
                FragmentId = detectedFragmentId,
                MarkerName = targetName,
                PoseQuality = 1f,
                StabilityMs = Mathf.RoundToInt(Mathf.Max(0f, Time.unscaledTime - stableSince) * 1000f),
            });
        }

        private void ResetAcquisition()
        {
            stableSince = -1f;
            detectionDone = false;
            detectionPending = false;
            detectedFragmentId = string.Empty;
            recognizedEmitted = false;
            nextDetectAttempt = 0f;
            activeObserver = null;
        }

        private void SetGyro(bool on)
        {
            if (on == gyroOn)
            {
                return;
            }
            gyroOn = on;
            if (gyroFallback != null)
            {
                gyroFallback.SetGyroMode(on);
            }
            if (on)
            {
                ReportState("gyro"); // mode envoyé au web (additif, format TRACKING inchangé)
            }
        }

        private void ReportState(string state)
        {
            if (state == lastState)
            {
                return;
            }
            lastState = state;
            TrackingStateChanged?.Invoke(state);
        }

        private static Vector2 GetSizeMeters(ObserverBehaviour observer)
        {
            if (observer is ImageTargetBehaviour imageTarget)
            {
                var size = imageTarget.GetSize();
                return new Vector2(size.x, size.y);
            }
            return new Vector2(0.1f, 0.1f);
        }
    }
}
