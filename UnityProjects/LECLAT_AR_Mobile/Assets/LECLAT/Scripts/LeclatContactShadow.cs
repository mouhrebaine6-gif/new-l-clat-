using UnityEngine;
using UnityEngine.Rendering;

namespace Leclat.AR
{
    /// <summary>
    /// Soft contact ("blob") shadow under the loaded AR model so it reads as grounded
    /// on the real surface instead of floating. Procedural radial-gradient texture, URP
    /// Unlit transparent material — no external asset required.
    /// </summary>
    public sealed class LeclatContactShadow : MonoBehaviour
    {
        private static Texture2D sharedTexture;
        private static Mesh sharedMesh;
        private MeshRenderer meshRenderer;
        private Material instanceMaterial;

        public void Fit(float footprint, float baseY)
        {
            EnsureQuad();
            transform.localPosition = new Vector3(0f, baseY, 0f);
            var radius = Mathf.Max(0.01f, footprint * 1.1f);
            transform.localScale = new Vector3(radius, radius, 1f);
        }

        private void OnDestroy()
        {
            // Le quad (sharedMesh) et la texture (sharedTexture) sont statiques/reutilises.
            // Seul le materiau est cree par instance -> sans ce Destroy, chaque re-scan
            // (ClearContent recree l'ombre) fuyait un Material. Cf. revue C#.
            if (instanceMaterial != null)
            {
                Destroy(instanceMaterial);
                instanceMaterial = null;
            }
        }

        private void EnsureQuad()
        {
            if (meshRenderer != null)
                return;

            transform.localRotation = Quaternion.Euler(90f, 0f, 0f); // lie flat on the surface

            var meshFilter = gameObject.AddComponent<MeshFilter>();
            meshFilter.sharedMesh = BuildQuad();

            meshRenderer = gameObject.AddComponent<MeshRenderer>();
            meshRenderer.shadowCastingMode = ShadowCastingMode.Off;
            meshRenderer.receiveShadows = false;
            instanceMaterial = BuildMaterial();
            meshRenderer.material = instanceMaterial;
        }

        private static Mesh BuildQuad()
        {
            if (sharedMesh != null)
                return sharedMesh;

            sharedMesh = new Mesh
            {
                vertices = new[]
                {
                    new Vector3(-0.5f, -0.5f, 0f), new Vector3(0.5f, -0.5f, 0f),
                    new Vector3(0.5f, 0.5f, 0f), new Vector3(-0.5f, 0.5f, 0f)
                },
                uv = new[] { new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1) },
                triangles = new[] { 0, 1, 2, 0, 2, 3 }
            };
            return sharedMesh;
        }

        private static Material BuildMaterial()
        {
            var shader = Shader.Find("Universal Render Pipeline/Unlit") ?? Shader.Find("Unlit/Transparent");
            var material = new Material(shader);

            if (sharedTexture == null)
                sharedTexture = BuildRadialTexture(64);

            if (material.HasProperty("_BaseMap")) material.SetTexture("_BaseMap", sharedTexture);
            if (material.HasProperty("_MainTex")) material.SetTexture("_MainTex", sharedTexture);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", new Color(0f, 0f, 0f, 0.45f));
            if (material.HasProperty("_Surface")) material.SetFloat("_Surface", 1f);
            material.SetInt("_SrcBlend", (int)BlendMode.SrcAlpha);
            material.SetInt("_DstBlend", (int)BlendMode.OneMinusSrcAlpha);
            material.SetInt("_ZWrite", 0);
            material.SetInt("_Cull", (int)CullMode.Off);
            material.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            material.renderQueue = (int)RenderQueue.Transparent;
            return material;
        }

        private static Texture2D BuildRadialTexture(int size)
        {
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp };
            var c = (size - 1) * 0.5f;
            for (var y = 0; y < size; y++)
            {
                for (var x = 0; x < size; x++)
                {
                    var d = Mathf.Sqrt((x - c) * (x - c) + (y - c) * (y - c)) / c;
                    var a = Mathf.Clamp01(1f - d);
                    a *= a; // soft falloff
                    texture.SetPixel(x, y, new Color(1f, 1f, 1f, a));
                }
            }
            texture.Apply();
            return texture;
        }
    }
}
