using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Leclat.AR
{
    public sealed class LeclatTrackedImageWingsController : MonoBehaviour
    {
        [SerializeField] private string referenceImageName = ""; // vide = tous les marqueurs acceptés
        [SerializeField] private float positionSmooth = 18f;
        [SerializeField] private float rotationSmooth = 16f;
        [SerializeField] private float lostTimeoutSeconds = 0.45f;
        [Tooltip("G2 : au-delà de ce délai SANS retrouver la cible, on masque. Entre lostTimeout " +
                 "et giveUp, on TIENT la dernière pose ancrée monde (anti-« cassé », façon Arntreal).")]
        [SerializeField] private float giveUpSeconds = 6f;
        [SerializeField] private bool hideWhenTrackingIsLost = true;
        [Tooltip("Si true, applique un filtre médian + EMA sur la pose brute pour absorber le jitter (marche).")]
        [SerializeField] private bool useAntiJitterSmoother = true;
        [Tooltip("Taille du tshirt porté — impacte l'échelle des ailes.")]
        [SerializeField] private TshirtSize tshirtSize = TshirtSize.M;
        [Tooltip("Charge le bon modèle 3D (aile) depuis StreamingAssets selon le fragment détecté.")]
        [SerializeField] private bool autoLoadWingsFromRegistry = true;

        [Header("Optimisation")]
        [Tooltip("Précharge en silence le GLB du fragment possédé au démarrage → affichage instantané au 1er scan, sans latence de chargement.")]
        [SerializeField] private bool preloadOwnedFragment = true;

        private Transform anchorRoot;
        private Transform contentRoot;
        private Transform preloadHolder;
        private FragmentModelEntry currentEntry;
        private Vector3 targetPosition;
        private Quaternion targetRotation = Quaternion.identity;
        private float lastTrackedTime = -999f;
        private bool hasPose;
        private LeclatContactShadow contactShadow;

        // Cache modèles 3D chargés par fragmentId
        private readonly Dictionary<string, GameObject> spawnedWings = new();
        private string loadedFragmentId;
        private bool loadInProgress;

        // Anti-jitter
        private readonly LeclatPoseSmoother poseSmoother = new LeclatPoseSmoother();

        public string ReferenceImageName => referenceImageName;
        public Transform ContentRoot => contentRoot;
        public bool HasFreshTracking => hasPose && Time.unscaledTime - lastTrackedTime <= lostTimeoutSeconds;

        private void Awake()
        {
            anchorRoot = new GameObject("LECLAT_AR_WingsAnchor").transform;
            anchorRoot.SetParent(transform, false);
            anchorRoot.gameObject.SetActive(false);

            contentRoot = new GameObject("LECLAT_AR_ModelContent").transform;
            contentRoot.SetParent(anchorRoot, false);

            // Conteneur isolé pour le préchargement (masqué, hors de contentRoot) :
            // un GLB préchargé n'affecte ni les bounds ni la normalisation tant
            // qu'il n'est pas réellement affiché.
            preloadHolder = new GameObject("LECLAT_AR_Preload").transform;
            preloadHolder.SetParent(transform, false);
            preloadHolder.gameObject.SetActive(false);

            poseSmoother.Reset();
        }

        private void OnDestroy()
        {
            // Les enfants sont détruits avec ce transform ; on ne garde pas de
            // références vers des GameObjects morts (la Task en vol est déjà
            // couverte par le guard `this == null` post-await).
            spawnedWings.Clear();
            loadedFragmentId = null;
        }

        private void Start()
        {
            if (!preloadOwnedFragment || !autoLoadWingsFromRegistry)
            {
                return;
            }
            var owned = LeclatOwnedFragments.GetAll();
            if (owned.Count > 0)
            {
                _ = PreloadFragmentAsync(owned[0]);
            }
        }

        // Charge le GLB du fragment possédé EN SILENCE (masqué) au démarrage : au
        // premier scan AR, LoadWingsForFragmentAsync trouve le cache et l'affiche
        // instantanément — plus de latence de chargement au moment rituel.
        private async System.Threading.Tasks.Task PreloadFragmentAsync(string fragmentId)
        {
            if (string.IsNullOrEmpty(fragmentId) || spawnedWings.ContainsKey(fragmentId))
            {
                return;
            }
            if (!LeclatFragmentRegistry.TryGetByFragmentId(fragmentId, out var def))
            {
                return;
            }
            var absolutePath = Path.Combine(
                UnityEngine.Application.streamingAssetsPath, "LECLAT", "Models", def.ModelPath);
            if (!absolutePath.Contains("://") && !File.Exists(absolutePath))
            {
                return;
            }
            try
            {
                var loader = GetComponent<LeclatGltfastLoader>() ?? gameObject.AddComponent<LeclatGltfastLoader>();
                var go = await loader.LoadIntoAsync(absolutePath, preloadHolder);
                if (this == null || preloadHolder == null || go == null)
                {
                    return;
                }
                if (spawnedWings.ContainsKey(fragmentId)) // un vrai scan a chargé entre-temps
                {
                    Destroy(go);
                    return;
                }
                go.transform.localPosition = Vector3.zero;
                go.transform.localRotation = Quaternion.identity;
                go.transform.localScale = Vector3.one * (def.Scale * LeclatTshirtAnchor.SizeMultiplier(tshirtSize));
                spawnedWings[fragmentId] = go; // reste dans preloadHolder (masqué) jusqu'au 1er affichage
            }
            catch (System.Exception)
            {
                // Préchargement best-effort : un échec est silencieux, le chemin
                // normal rechargera au scan.
            }
        }

        private void Update()
        {
            if (!hasPose)
            {
                return;
            }

            var dt = Mathf.Max(Time.unscaledDeltaTime, 0.0001f);
            var sinceTracked = Time.unscaledTime - lastTrackedTime;
            var fresh = sinceTracked <= lostTimeoutSeconds;

            // G2 « SNAP puis FLOTTE » : suivi vif quand la cible est fraîche, lissage
            // plus mou en mode tenue (le tracking MONDE de la session garde le point
            // fixe pendant que la cible est perdue → ancrage stable, jamais cassé).
            var posSmooth = fresh ? positionSmooth : positionSmooth * 0.35f;
            var rotSmooth = fresh ? rotationSmooth : rotationSmooth * 0.35f;
            var positionAlpha = 1f - Mathf.Exp(-posSmooth * dt);
            var rotationAlpha = 1f - Mathf.Exp(-rotSmooth * dt);

            anchorRoot.position = Vector3.Lerp(anchorRoot.position, targetPosition, positionAlpha);
            anchorRoot.rotation = Quaternion.Slerp(anchorRoot.rotation, targetRotation, rotationAlpha);

            // On ne masque qu'après giveUp (et plus au moindre lostTimeout) → fallback gracieux.
            if (hideWhenTrackingIsLost && sinceTracked > giveUpSeconds)
            {
                anchorRoot.gameObject.SetActive(false);
            }
        }

        public void SelectFragment(FragmentModelEntry entry)
        {
            currentEntry = entry;
            ResetContentTransform();
        }

        public void ClearContent()
        {
            if (contentRoot == null)
            {
                return;
            }

            for (var i = contentRoot.childCount - 1; i >= 0; i--)
            {
                Destroy(contentRoot.GetChild(i).gameObject);
            }

            // Le cache pointait vers ces enfants détruits → on le vide pour qu'un
            // re-scan du MÊME fragment recharge bien l'aile.
            spawnedWings.Clear();
            loadedFragmentId = null;
            ResetContentTransform();
        }

        public void ReportTrackedPose(
            string imageName,
            Vector3 position,
            Quaternion rotation,
            Vector2 detectedSizeMeters,
            string trackingState)
        {
            if (!string.IsNullOrWhiteSpace(referenceImageName) && imageName != referenceImageName)
            {
                return;
            }

            // Keep the model anchored during brief "Limited" tracking instead of
            // hiding it immediately; only the lost-timeout (handled in Update) hides it.
            if (!string.Equals(trackingState, "Tracking", System.StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(trackingState, "Limited", System.StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            // 1. Calcule l'ancre "ailes" au-dessus du tshirt (cf. LeclatTshirtAnchor)
            var rawAnchor = LeclatTshirtAnchor.Compute(position, rotation, detectedSizeMeters, tshirtSize);

            // 2. Offset par fragment. imageName est DÉJÀ le fragmentId résolu (id minuscule)
            // transmis par le poller → pas de Replace/ToLower par frame (zéro alloc).
            var fragmentId = imageName;
            rawAnchor.Position += rawAnchor.Rotation * LeclatTshirtAnchor.FragmentAnchorOffset(fragmentId);

            // 3. Lissage anti-jitter (filtre médian + EMA)
            Vector3 finalPos = rawAnchor.Position;
            Quaternion finalRot = rawAnchor.Rotation;
            if (useAntiJitterSmoother)
            {
                var smoothed = poseSmoother.Update(new SmoothedPose
                {
                    Position = rawAnchor.Position,
                    Rotation = rawAnchor.Rotation,
                    Scale = Vector3.one,
                });
                finalPos = smoothed.Position;
                finalRot = smoothed.Rotation;
            }

            // 4. Combine avec le placement legacy si défini (currentEntry.placement)
            var legacyOffset = ReadVector(currentEntry?.placement?.localOffsetMeters, new Vector3(0f, 0f, 0f));
            var legacyEuler = ReadVector(currentEntry?.placement?.localEulerDegrees, new Vector3(0f, 0f, 0f));
            finalPos += rotation * legacyOffset;
            finalRot = finalRot * Quaternion.Euler(legacyEuler);

            targetPosition = finalPos;
            targetRotation = finalRot;
            lastTrackedTime = Time.unscaledTime;

            if (!hasPose)
            {
                anchorRoot.position = targetPosition;
                anchorRoot.rotation = targetRotation;
                hasPose = true;
            }

            anchorRoot.gameObject.SetActive(true);

            // Charge le bon modèle 3D (aile) si pas déjà chargé
            if (autoLoadWingsFromRegistry && !loadInProgress && loadedFragmentId != fragmentId)
            {
                loadedFragmentId = fragmentId;
                _ = LoadWingsForFragmentAsync(fragmentId);
            }
        }

        private async System.Threading.Tasks.Task LoadWingsForFragmentAsync(string fragmentId)
        {
            if (spawnedWings.TryGetValue(fragmentId, out var existing) && existing != null)
            {
                // Migre depuis le conteneur de préchargement vers l'ancre visible.
                if (existing.transform.parent != contentRoot)
                {
                    existing.transform.SetParent(contentRoot, false);
                    existing.transform.localPosition = Vector3.zero;
                    existing.transform.localRotation = Quaternion.identity;
                }
                SetOnlyFragmentVisible(fragmentId);
                existing.SetActive(true);
                loadInProgress = false;
                return;
            }

            if (!LeclatFragmentRegistry.TryGetByFragmentId(fragmentId, out var def) &&
                !LeclatFragmentRegistry.TryGetByMarkerName(fragmentId, out def))
            {
                Debug.LogWarning($"[WingsCtrl] Fragment inconnu: {fragmentId}");
                loadInProgress = false;
                return;
            }

            loadInProgress = true;
            var absolutePath = Path.Combine(
                UnityEngine.Application.streamingAssetsPath,
                "LECLAT", "Models", def.ModelPath);

            // Sur Android, StreamingAssets est une URL jar: dans l'APK — File.Exists
            // y répond toujours false ; le loader (UnityWebRequest) tranche.
            if (!absolutePath.Contains("://") && !File.Exists(absolutePath))
            {
                Debug.LogError($"[WingsCtrl] Model not found: {absolutePath}");
                loadedFragmentId = null;
                loadInProgress = false;
                return;
            }

            try
            {
                var loader = GetComponent<LeclatGltfastLoader>();
                if (loader == null) loader = gameObject.AddComponent<LeclatGltfastLoader>();
                var go = await loader.LoadIntoAsync(absolutePath, contentRoot);
                // Le composant/scène a pu être détruit pendant l'await → on annule proprement.
                if (this == null || contentRoot == null || go == null)
                {
                    loadInProgress = false;
                    return;
                }
                SetOnlyFragmentVisible(fragmentId);
                go.transform.localPosition = Vector3.zero;
                go.transform.localRotation = Quaternion.identity;
                go.transform.localScale = Vector3.one * (def.Scale * LeclatTshirtAnchor.SizeMultiplier(tshirtSize));
                spawnedWings[fragmentId] = go;
                Debug.Log($"[WingsCtrl] ✓ Ailes chargées pour {fragmentId} ({def.ModelPath})");
            }
            catch (System.Exception e)
            {
                loadedFragmentId = null;
                Debug.LogError($"[WingsCtrl] Echec load {fragmentId}: {e.Message}");
            }
            finally
            {
                loadInProgress = false;
            }
        }

        private void SetOnlyFragmentVisible(string fragmentId)
        {
            foreach (var item in spawnedWings)
            {
                if (item.Value != null)
                {
                    item.Value.SetActive(item.Key == fragmentId);
                }
            }
        }

        public void NormalizeLoadedContent()
        {
            ResetContentTransform();

            var targetSize = Mathf.Max(0.01f, currentEntry?.placement?.targetSizeMeters ?? 1.4f);
            var bounds = CalculateContentBounds();
            if (!bounds.HasValue)
            {
                return;
            }

            var center = contentRoot.InverseTransformPoint(bounds.Value.center);
            for (var i = 0; i < contentRoot.childCount; i++)
            {
                contentRoot.GetChild(i).localPosition -= center;
            }

            bounds = CalculateContentBounds();
            if (!bounds.HasValue)
            {
                return;
            }

            var size = bounds.Value.size;
            EnsureContactShadow(size);
            var largestAxis = Mathf.Max(size.x, Mathf.Max(size.y, size.z));
            if (largestAxis > 0.0001f)
            {
                contentRoot.localScale = Vector3.one * (targetSize / largestAxis);
            }
        }

        private void EnsureContactShadow(Vector3 localSize)
        {
            if (contactShadow == null)
            {
                var shadowObject = new GameObject("LECLAT_ContactShadow");
                shadowObject.transform.SetParent(contentRoot, false);
                contactShadow = shadowObject.AddComponent<LeclatContactShadow>();
            }

            var footprint = Mathf.Max(localSize.x, localSize.z);
            contactShadow.Fit(footprint, -localSize.y * 0.5f);
        }

        private void ResetContentTransform()
        {
            if (contentRoot == null)
            {
                return;
            }

            contentRoot.localPosition = Vector3.zero;
            contentRoot.localRotation = Quaternion.identity;
            contentRoot.localScale = Vector3.one;
        }

        private Bounds? CalculateContentBounds()
        {
            var renderers = contentRoot.GetComponentsInChildren<Renderer>(true);
            if (renderers.Length == 0)
            {
                return null;
            }

            var bounds = renderers[0].bounds;
            for (var i = 1; i < renderers.Length; i++)
            {
                bounds.Encapsulate(renderers[i].bounds);
            }

            return bounds;
        }

        private static Vector3 ReadVector(Vector3Dto dto, Vector3 fallback)
        {
            return dto == null ? fallback : new Vector3(dto.x, dto.y, dto.z);
        }
    }
}
