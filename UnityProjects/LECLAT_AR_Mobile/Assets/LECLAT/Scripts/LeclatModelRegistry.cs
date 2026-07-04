using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Leclat.AR
{
    public sealed class LeclatModelRegistry : MonoBehaviour
    {
        [SerializeField] private string manifestRelativePath = "LECLAT/Models/manifest.json";

        private readonly Dictionary<string, FragmentModelEntry> byFragmentId = new(StringComparer.OrdinalIgnoreCase);
        private bool loaded;

        private void Awake()
        {
            // Pré-charge le manifest SANS bloquer le thread principal : sur Android
            // la lecture passe par UnityWebRequest (APK). La coroutine remplit le
            // registre avant le 1er AR_LAUNCH ; LoadIfNeeded() reste le filet
            // synchrone si une résolution arrive avant la fin du préchargement.
            StartCoroutine(PreloadRoutine());
        }

        private System.Collections.IEnumerator PreloadRoutine()
        {
            if (loaded)
            {
                yield break;
            }

            var manifestPath = Path.Combine(Application.streamingAssetsPath, manifestRelativePath);
            string manifestText = null;
            if (manifestPath.Contains("://"))
            {
                using var request = UnityEngine.Networking.UnityWebRequest.Get(manifestPath);
                yield return request.SendWebRequest();
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    manifestText = request.downloadHandler.text;
                }
            }
            else
            {
                manifestText = File.Exists(manifestPath) ? File.ReadAllText(manifestPath) : null;
            }

            BuildFromText(manifestText, manifestPath);
        }

        public bool TryResolve(string fragmentId, out FragmentModelEntry entry, out string absolutePath, out string reason)
        {
            LoadIfNeeded();

            absolutePath = string.Empty;
            if (string.IsNullOrWhiteSpace(fragmentId))
            {
                entry = null;
                reason = "AR_LAUNCH did not include a fragment_id.";
                return false;
            }

            if (!byFragmentId.TryGetValue(fragmentId, out entry))
            {
                reason = "No model registered for fragment_id: " + fragmentId;
                return false;
            }

            absolutePath = Path.Combine(Application.streamingAssetsPath, "LECLAT", "Models", entry.file);
            // Sur Android, StreamingAssets est une URL jar: dans l'APK — File.Exists
            // y répond toujours false ; l'existence est tranchée au chargement (UWR).
            if (!absolutePath.Contains("://") && !File.Exists(absolutePath))
            {
                reason = "Registered GLB file is missing: " + absolutePath;
                return false;
            }

            reason = "Model resolved.";
            return true;
        }

        private void LoadIfNeeded()
        {
            if (loaded)
            {
                return;
            }

            var manifestPath = Path.Combine(Application.streamingAssetsPath, manifestRelativePath);
            BuildFromText(ReadManifestText(manifestPath), manifestPath);
        }

        private void BuildFromText(string manifestText, string manifestPath)
        {
            if (loaded)
            {
                return; // déjà construit (préchargement ou appel synchrone concurrent)
            }
            loaded = true;
            byFragmentId.Clear();

            if (manifestText == null)
            {
                Debug.LogError("[LECLAT] Model manifest missing: " + manifestPath);
                return;
            }

            var manifest = JsonUtility.FromJson<LeclatModelManifest>(manifestText);
            if (manifest?.fragments == null)
            {
                Debug.LogError("[LECLAT] Model manifest is invalid: " + manifestPath);
                return;
            }

            foreach (var entry in manifest.fragments)
            {
                Register(entry.fragmentId, entry);
                Register(entry.modelId, entry);
                Register(entry.appFragmentId, entry);

                if (entry.aliases == null)
                {
                    continue;
                }

                foreach (var alias in entry.aliases)
                {
                    Register(alias, entry);
                }
            }
        }

        /// <summary>
        /// Lit le manifest. Sur Android, StreamingAssets est dans l'APK (URL jar:)
        /// et System.IO ne fonctionne pas : lecture via UnityWebRequest. L'attente
        /// est bornée — l'Awake pré-charge, donc ce chemin est déjà résolu bien
        /// avant le premier AR_LAUNCH en usage réel.
        /// </summary>
        private static string ReadManifestText(string manifestPath)
        {
            if (manifestPath.Contains("://"))
            {
                using var request = UnityEngine.Networking.UnityWebRequest.Get(manifestPath);
                request.SendWebRequest();
                var deadline = DateTime.UtcNow.AddSeconds(5);
                while (!request.isDone && DateTime.UtcNow < deadline)
                {
                }
                if (!request.isDone ||
                    request.result != UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    return null;
                }
                return request.downloadHandler.text;
            }

            return File.Exists(manifestPath) ? File.ReadAllText(manifestPath) : null;
        }

        private void Register(string key, FragmentModelEntry entry)
        {
            if (string.IsNullOrWhiteSpace(key))
                return;

            // Deterministic: the FIRST manifest entry for a key wins. Several entries
            // legitimately share an appFragmentId; first-wins makes the mapping stable
            // and independent of dictionary iteration order.
            if (byFragmentId.ContainsKey(key))
            {
                Debug.Log("[LECLAT] Duplicate model key '" + key + "' ignored (first manifest entry wins).");
                return;
            }

            byFragmentId[key] = entry;
        }
    }

    [Serializable]
    public sealed class LeclatModelManifest
    {
        public FragmentModelEntry[] fragments;
    }

    [Serializable]
    public sealed class FragmentModelEntry
    {
        public string fragmentId;
        public string appFragmentId;
        public string[] aliases;
        public string modelId;
        public string usage;
        public string file;
        public string licensePolicy;
        public bool productionApproved;
        public Placement placement;
        public ModelStats stats;
    }

    [Serializable]
    public sealed class Placement
    {
        public string anchor;
        public float targetSizeMeters;
        public Vector3Dto localOffsetMeters;
        public Vector3Dto localEulerDegrees;
        public string note;
    }

    [Serializable]
    public sealed class ModelStats
    {
        public int triangles;
        public int vertices;
        public int animations;
        public int maxTexture;
        public float sizeMB;
    }

    [Serializable]
    public sealed class Vector3Dto
    {
        public float x;
        public float y;
        public float z;
    }
}
