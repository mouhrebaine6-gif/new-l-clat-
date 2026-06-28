using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using Vuforia;

#if UNITY_ANDROID
using UnityEngine.Android;
#endif

namespace Leclat.AR
{
    public sealed class LeclatQRFirstScan : MonoBehaviour
    {
        [SerializeField] private bool startOnLaunch = true;
        [SerializeField] private bool runInEditor;
        [SerializeField] private float timeoutSeconds = 30f;
        [SerializeField] private float decodeIntervalSeconds = 0.2f;
        [SerializeField] private Vector2Int requestedResolution = new Vector2Int(1280, 720);

        private WebCamTexture cameraTexture;
        private Canvas canvas;
        private RawImage preview;
        private Text title;
        private Text status;
        private Button retryButton;
        private Coroutine scanRoutine;

        public bool HasValidLocalFragment => LeclatOwnedFragments.Count > 0;

        private void Start()
        {
            if (!startOnLaunch)
            {
                return;
            }

            if (Application.isEditor && !runInEditor)
            {
                ApplyStoredFragmentIfValid();
                return;
            }

            BeginIfNeeded();
        }

        public void BeginIfNeeded()
        {
            if (ApplyStoredFragmentIfValid())
            {
                return;
            }

            if (scanRoutine == null)
            {
                scanRoutine = StartCoroutine(ScanCoroutine());
            }
        }

        public bool ApplyStoredFragmentIfValid()
        {
            // LeclatOwnedFragments = source UNIQUE de propriété.
            // True si ce téléphone possède déjà ≥1 fragment (QR déjà scanné) → on saute le scan QR.
            return LeclatOwnedFragments.Count > 0;
        }

        private IEnumerator ScanCoroutine()
        {
            SetVuforiaEnabled(false);
            EnsureUi();
            SetStatus("Place le col dans le cadre.");
            retryButton.gameObject.SetActive(false);

#if UNITY_ANDROID
            if (!Permission.HasUserAuthorizedPermission(Permission.Camera))
            {
                Permission.RequestUserPermission(Permission.Camera);
                yield return new WaitForSeconds(0.5f);
            }
#endif

            if (!Application.HasUserAuthorization(UserAuthorization.WebCam))
            {
                yield return Application.RequestUserAuthorization(UserAuthorization.WebCam);
            }

            if (!Application.HasUserAuthorization(UserAuthorization.WebCam))
            {
                SetStatus("Camera indisponible.");
                ShowRetry();
                yield break;
            }

            var deviceName = SelectBackCameraName();
            cameraTexture = string.IsNullOrEmpty(deviceName)
                ? new WebCamTexture(requestedResolution.x, requestedResolution.y, 30)
                : new WebCamTexture(deviceName, requestedResolution.x, requestedResolution.y, 30);
            preview.texture = cameraTexture;
            cameraTexture.Play();

            var pixels = default(Color32[]);
            var nextDecode = 0f;
            var startedAt = Time.unscaledTime;
            while (Time.unscaledTime - startedAt < timeoutSeconds)
            {
                if (cameraTexture.width > 32 && cameraTexture.height > 32 && Time.unscaledTime >= nextDecode)
                {
                    nextDecode = Time.unscaledTime + decodeIntervalSeconds;
                    pixels = cameraTexture.GetPixels32(pixels);
                    if (LeclatQrDecoder.TryDecode(pixels, cameraTexture.width, cameraTexture.height, out var raw) &&
                        LeclatQrPayload.TryParse(raw, out var payload, out _))
                    {
                        CompleteScan(payload);
                        yield break;
                    }
                }

                yield return null;
            }

            StopCamera();
            SetStatus("Lecture impossible.");
            ShowRetry();
        }

        private void CompleteScan(LeclatQrPayload payload)
        {
            LeclatSecureScanStore.Save(payload.FragmentId, payload.Token);
            LeclatOwnedFragments.Add(payload.FragmentId); // ce téléphone devient OWNER de ce fragment
            _ = LeclatSecureScanStore.BuildServerRequest(payload.FragmentId, payload.Token);
            StopCamera();
            DestroyUi();
            SetVuforiaEnabled(true);
            scanRoutine = null;
            Debug.Log("[LECLAT_QR] First scan accepted for fragment=" + payload.FragmentId);
        }

        private void StopCamera()
        {
            if (cameraTexture == null)
            {
                return;
            }

            if (cameraTexture.isPlaying)
            {
                cameraTexture.Stop();
            }
            cameraTexture = null;
        }

        private void ShowRetry()
        {
            StopCamera();
            retryButton.gameObject.SetActive(true);
            scanRoutine = null;
        }

        private void Retry()
        {
            if (scanRoutine != null)
            {
                StopCoroutine(scanRoutine);
            }
            StopCamera();
            scanRoutine = StartCoroutine(ScanCoroutine());
        }

        private static string SelectBackCameraName()
        {
            var devices = WebCamTexture.devices;
            for (var i = 0; i < devices.Length; i++)
            {
                if (!devices[i].isFrontFacing)
                {
                    return devices[i].name;
                }
            }
            return devices.Length > 0 ? devices[0].name : string.Empty;
        }

        private static void SetVuforiaEnabled(bool enabled)
        {
            var behaviour = FindAnyObjectByType<VuforiaBehaviour>(FindObjectsInactive.Include);
            if (behaviour != null)
            {
                behaviour.enabled = enabled;
            }
        }

        private void EnsureUi()
        {
            if (canvas != null)
            {
                return;
            }

            var canvasGo = new GameObject("LECLAT_QR_FirstScanCanvas");
            canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 2000;
            canvasGo.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGo.AddComponent<GraphicRaycaster>();

            preview = CreatePreview(canvasGo.transform);
            title = CreateText(canvasGo.transform, "Approche ton telephone de l'interieur du col", 28, new Vector2(0f, 170f));
            status = CreateText(canvasGo.transform, "Place le col dans le cadre.", 18, new Vector2(0f, -210f));
            retryButton = CreateButton(canvasGo.transform);
            retryButton.onClick.AddListener(Retry);
            retryButton.gameObject.SetActive(false);
        }

        private static RawImage CreatePreview(Transform parent)
        {
            var go = new GameObject("CameraPreview");
            go.transform.SetParent(parent, false);
            var image = go.AddComponent<RawImage>();
            image.color = Color.white;
            var rect = image.rectTransform;
            rect.anchorMin = new Vector2(0.08f, 0.18f);
            rect.anchorMax = new Vector2(0.92f, 0.82f);
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            return image;
        }

        private static Text CreateText(Transform parent, string value, int size, Vector2 anchoredPosition)
        {
            var go = new GameObject("Text");
            go.transform.SetParent(parent, false);
            var text = go.AddComponent<Text>();
            text.text = value;
            text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            text.alignment = TextAnchor.MiddleCenter;
            text.color = Color.white;
            text.fontSize = size;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Overflow;
            var rect = text.rectTransform;
            rect.anchorMin = new Vector2(0.1f, 0.5f);
            rect.anchorMax = new Vector2(0.9f, 0.5f);
            rect.sizeDelta = new Vector2(0f, 110f);
            rect.anchoredPosition = anchoredPosition;
            return text;
        }

        private static Button CreateButton(Transform parent)
        {
            var go = new GameObject("RetryButton");
            go.transform.SetParent(parent, false);
            var image = go.AddComponent<UnityEngine.UI.Image>();
            image.color = new Color(0.08f, 0.08f, 0.08f, 0.92f);
            var button = go.AddComponent<Button>();
            var rect = image.rectTransform;
            rect.anchorMin = new Vector2(0.3f, 0.08f);
            rect.anchorMax = new Vector2(0.7f, 0.18f);
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var label = CreateText(go.transform, "Reessayer", 20, Vector2.zero);
            label.rectTransform.anchorMin = Vector2.zero;
            label.rectTransform.anchorMax = Vector2.one;
            label.rectTransform.offsetMin = Vector2.zero;
            label.rectTransform.offsetMax = Vector2.zero;
            label.rectTransform.anchoredPosition = Vector2.zero;
            return button;
        }

        private void SetStatus(string value)
        {
            if (status != null)
            {
                status.text = value;
            }
        }

        private void DestroyUi()
        {
            if (canvas != null)
            {
                Destroy(canvas.gameObject);
                canvas = null;
            }
        }

        private void OnDisable()
        {
            // Si l'objet est desactive en plein scan, Unity tue la coroutine mais scanRoutine
            // resterait non-null -> BeginIfNeeded ne relancerait JAMAIS le scan, et la camera
            // resterait verrouillee (Vuforia ne pourrait plus l'ouvrir). On nettoie les deux.
            if (scanRoutine != null)
            {
                StopCoroutine(scanRoutine);
                scanRoutine = null;
            }
            StopCamera();
        }

        private void OnDestroy()
        {
            StopCamera();
        }
    }
}
