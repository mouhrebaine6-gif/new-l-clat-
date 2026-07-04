using System;
using System.Collections;
using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// Identifie le FRAGMENT du t-shirt pointé d'après la COULEUR DU TISSU autour du
    /// logo (jamais le logo lui-même). C'est le t-shirt SCANNÉ qui décide des ailes —
    /// jamais le téléphone scanneur.
    ///
    /// Méthode : à la demande, on lit les pixels du FRAME RENDU (le fond caméra
    /// Vuforia) dans une couronne (anneau) autour du centre du logo, on moyenne
    /// 40-60 échantillons, on convertit en HSV et on classe par seuils. Retourne
    /// (fragmentId, confiance 0..1). Confiance &lt; seuil → fragmentId vide (l'appelant
    /// affiche un message sobre, JAMAIS d'erreur technique ni « fragment inconnu »).
    ///
    /// ⚠️ Pendant l'AR, Vuforia possède la caméra (WebCamTexture arrêtée) → on
    /// n'ouvre PAS de caméra rivale : on échantillonne le rendu via ReadPixels en
    /// fin de frame. Appel ponctuel (à l'acquisition), pas par frame.
    /// </summary>
    public sealed class LeclatFabricColorDetector : MonoBehaviour
    {
        [SerializeField, Range(0f, 1f)] private float minConfidence = 0.6f;
        [SerializeField] private int sampleCount = 56;
        [Tooltip("Rayon interne de la couronne, en multiple du demi-logo (>1 = hors logo).")]
        [SerializeField] private float innerRadiusFactor = 1.15f;
        [Tooltip("Rayon externe de la couronne, en multiple du demi-logo.")]
        [SerializeField] private float outerRadiusFactor = 1.9f;

        public struct Result
        {
            public string FragmentId; // "" si indétectable (fallback)
            public float Confidence;  // 0..1
            public bool Found => !string.IsNullOrEmpty(FragmentId);
        }

        private Texture2D readBuffer;
        private bool detecting;

        public bool IsBusy => detecting;

        // Calibration (consommée par l'overlay debug, dev only) — dernière mesure.
        public bool DebugValid { get; private set; }
        public float DebugH { get; private set; }
        public float DebugS { get; private set; }
        public float DebugV { get; private set; }
        public float DebugConfidence { get; private set; }
        public string DebugFragment { get; private set; } = string.Empty;

        /// <summary>Lance une détection (asynchrone, fin de frame). callback(result).</summary>
        public void Detect(Camera cam, Transform logo, float logoSizeMeters, Action<Result> callback)
        {
            if (detecting || cam == null || logo == null)
            {
                callback?.Invoke(default);
                return;
            }
            StartCoroutine(DetectRoutine(cam, logo, logoSizeMeters, callback));
        }

        private IEnumerator DetectRoutine(Camera cam, Transform logo, float logoSizeMeters, Action<Result> callback)
        {
            detecting = true;
            yield return new WaitForEndOfFrame(); // ReadPixels lit le frame rendu

            Result result = default;
            try
            {
                result = Sample(cam, logo, logoSizeMeters);
            }
            catch (Exception e)
            {
                Debug.LogWarning("[FabricColor] " + e.Message);
                result = default;
            }

            detecting = false;
            callback?.Invoke(result);
        }

        private void OnDisable()
        {
            // Si le composant est désactivé pendant WaitForEndOfFrame, Unity tue la
            // coroutine sans repasser par detecting=false → le détecteur resterait
            // bloqué (IsBusy éternel, plus aucune détection). On réarme ici.
            detecting = false;
        }

        private Result Sample(Camera cam, Transform logo, float logoSizeMeters)
        {
            var center = cam.WorldToScreenPoint(logo.position);
            if (center.z <= 0f)
            {
                return default; // logo derrière la caméra
            }

            // Rayon écran du logo (projette un point au bord).
            var edge = cam.WorldToScreenPoint(logo.position + logo.right * (logoSizeMeters * 0.5f));
            var logoRadiusPx = Mathf.Max(8f,
                Vector2.Distance(new Vector2(center.x, center.y), new Vector2(edge.x, edge.y)));
            var inner = logoRadiusPx * innerRadiusFactor;
            var outer = logoRadiusPx * outerRadiusFactor;

            // Région écran à lire (clampée à l'écran).
            var minX = Mathf.Clamp(Mathf.FloorToInt(center.x - outer), 0, Screen.width - 1);
            var minY = Mathf.Clamp(Mathf.FloorToInt(center.y - outer), 0, Screen.height - 1);
            var w = Mathf.Clamp(Mathf.CeilToInt(outer * 2f), 4, Screen.width - minX);
            var h = Mathf.Clamp(Mathf.CeilToInt(outer * 2f), 4, Screen.height - minY);

            EnsureBuffer(w, h);
            readBuffer.ReadPixels(new Rect(minX, minY, w, h), 0, 0, false);
            readBuffer.Apply(false);
            // Une seule lecture du buffer au lieu de 56 appels GetPixel (coût d'API).
            var raw = readBuffer.GetPixels32();

            // Échantillonne la couronne (2 rayons pour robustesse).
            float sumSin = 0f, sumCos = 0f, sumS = 0f, sumV = 0f, sumV2 = 0f;
            var n = 0;
            for (var i = 0; i < sampleCount; i++)
            {
                var ang = (i / (float)sampleCount) * Mathf.PI * 2f;
                var r = Mathf.Lerp(inner, outer, (i % 2 == 0) ? 0.35f : 0.75f);
                var px = Mathf.RoundToInt(center.x + Mathf.Cos(ang) * r - minX);
                var py = Mathf.RoundToInt(center.y + Mathf.Sin(ang) * r - minY);
                if (px < 0 || py < 0 || px >= w || py >= h)
                {
                    continue;
                }

                Color.RGBToHSV(raw[py * w + px], out var hh, out var ss, out var vv);
                // Ignore quasi-blanc/argenté (logo, reflets spéculaires).
                if (vv > 0.92f && ss < 0.12f)
                {
                    continue;
                }

                var hr = hh * Mathf.PI * 2f;
                sumSin += Mathf.Sin(hr);
                sumCos += Mathf.Cos(hr);
                sumS += ss;
                sumV += vv;
                sumV2 += vv * vv;
                n++;
            }

            if (n < 8)
            {
                return default; // pas assez de tissu lisible
            }

            var hMean = Mathf.Atan2(sumSin / n, sumCos / n);
            if (hMean < 0f)
            {
                hMean += Mathf.PI * 2f;
            }
            var hueDeg = hMean / (Mathf.PI * 2f) * 360f;
            var s = sumS / n;
            var v = sumV / n;
            var vVar = Mathf.Max(0f, sumV2 / n - v * v);
            var consistency = Mathf.Clamp01(1f - Mathf.Sqrt(vVar) * 2.2f); // tissu uni = consistant

            var detected = Classify(hueDeg, s, v, consistency);
            DebugValid = true;
            DebugH = hueDeg;
            DebugS = s;
            DebugV = v;
            DebugConfidence = detected.Confidence;
            DebugFragment = detected.Found ? detected.FragmentId : "(aucun)";
            return detected;
        }

        // Seuils HSV → fragment (règles métier). Le hue est circulaire (Mathf.DeltaAngle).
        private Result Classify(float h, float s, float v, float consistency)
        {
            string id = null;
            var fit = 0f;
            float f;

            // ÉVEIL : très sombre (noir) → plus c'est sombre, mieux c'est.
            if (v < 0.15f)
            {
                f = Mathf.Clamp01((0.15f - v) / 0.15f);
                if (f > fit) { fit = f; id = "eveil"; }
            }
            // SOUFFLE : violet
            if (s > 0.50f && v >= 0.15f && v <= 0.50f)
            {
                f = HueFit(h, 275f, 15f);
                if (f > fit) { fit = f; id = "souffle"; }
            }
            // FORGE : rouge brique
            if (s > 0.55f && v > 0.35f)
            {
                f = HueFit(h, 15f, 10f);
                if (f > fit) { fit = f; id = "forge"; }
            }
            // PRISME : vert forêt
            if (s > 0.25f && v >= 0.20f && v <= 0.42f)
            {
                f = HueFit(h, 140f, 20f);
                if (f > fit) { fit = f; id = "prisme"; }
            }
            // ATOME : rose poudré (autour de 0°, wrap 340..15)
            if (s >= 0.20f && s <= 0.45f && v > 0.55f)
            {
                f = HueFit(h, -2.5f, 17.5f);
                if (f > fit) { fit = f; id = "atome"; }
            }

            var confidence = Mathf.Clamp01(fit * consistency);
            if (id == null || confidence < minConfidence)
            {
                return new Result { FragmentId = string.Empty, Confidence = confidence };
            }
            return new Result { FragmentId = id, Confidence = confidence };
        }

        private static float HueFit(float h, float center, float halfWidth)
        {
            var d = Mathf.Abs(Mathf.DeltaAngle(h, center)); // circulaire, gère le wrap
            return Mathf.Clamp01(1f - d / halfWidth);
        }

        private void EnsureBuffer(int w, int h)
        {
            if (readBuffer == null || readBuffer.width != w || readBuffer.height != h)
            {
                if (readBuffer != null)
                {
                    Destroy(readBuffer);
                }
                readBuffer = new Texture2D(w, h, TextureFormat.RGB24, false);
            }
        }

        private void OnDestroy()
        {
            if (readBuffer != null)
            {
                Destroy(readBuffer);
            }
        }
    }
}
