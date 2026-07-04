using System;
using System.IO;
using System.Threading.Tasks;
using GLTFast;
using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// Loads a runtime GLB from StreamingAssets into a parent transform using
    /// glTFast 6.x typed API (meshopt / Draco / KTX2 supported by the package).
    /// </summary>
    public sealed class LeclatGltfastLoader : MonoBehaviour
    {
        public bool IsAvailable => true;

        public async Task<GameObject> LoadIntoAsync(string absolutePath, Transform parent)
        {
            if (string.IsNullOrWhiteSpace(absolutePath))
                throw new FileNotFoundException("GLB path is empty.", absolutePath);

            // Sur Android, StreamingAssets vit DANS l'APK (URL jar:) : System.IO ne
            // peut pas le voir — glTFast charge alors via UnityWebRequest.
            var isUrl = absolutePath.Contains("://");
            if (!isUrl && !File.Exists(absolutePath))
                throw new FileNotFoundException("GLB file does not exist.", absolutePath);

            var root = new GameObject(Path.GetFileNameWithoutExtension(absolutePath));
            root.transform.SetParent(parent, false);

            using var gltf = new GltfImport();
            var uri = isUrl ? absolutePath : new Uri(absolutePath).AbsoluteUri;

            var loaded = await gltf.Load(uri);
            if (!loaded)
            {
                Destroy(root);
                throw new InvalidOperationException("glTFast failed to load: " + absolutePath);
            }

            var instantiated = await gltf.InstantiateMainSceneAsync(root.transform);
            if (!instantiated)
            {
                Destroy(root);
                throw new InvalidOperationException("glTFast failed to instantiate: " + absolutePath);
            }

            return root;
        }
    }
}
