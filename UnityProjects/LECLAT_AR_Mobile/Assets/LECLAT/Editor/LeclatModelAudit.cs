using System.IO;
using UnityEditor;
using UnityEngine;

namespace Leclat.AR.Editor
{
    /// <summary>
    /// Headless mobile-AR budget audit of the GLB manifest. Run with:
    ///   Unity -batchmode -quit -projectPath . -executeMethod Leclat.AR.Editor.LeclatModelAudit.Run
    /// Flags models over budget (triangles, texture size, file size).
    /// </summary>
    public static class LeclatModelAudit
    {
        private const int MaxTriangles = 5000;
        private const int MaxTexture = 1024;
        private const float MaxSizeMb = 2.0f;

        public static void Run()
        {
            var path = Path.Combine(Application.streamingAssetsPath, "LECLAT/Models/manifest.json");
            if (!File.Exists(path))
            {
                Debug.LogError("[AUDIT] manifest.json missing at " + path);
                if (Application.isBatchMode) EditorApplication.Exit(2);
                return;
            }

            var manifest = JsonUtility.FromJson<LeclatModelManifest>(File.ReadAllText(path));
            if (manifest?.fragments == null)
            {
                Debug.LogError("[AUDIT] manifest is invalid");
                if (Application.isBatchMode) EditorApplication.Exit(2);
                return;
            }

            int over = 0;
            Debug.Log($"[AUDIT] Budgets: tris<={MaxTriangles}, texture<={MaxTexture}px, size<={MaxSizeMb}MB");
            foreach (var f in manifest.fragments)
            {
                var s = f.stats;
                bool overBudget = s != null &&
                                  (s.triangles > MaxTriangles || s.maxTexture > MaxTexture || s.sizeMB > MaxSizeMb);
                if (overBudget) over++;

                Debug.Log($"[AUDIT] {f.appFragmentId,-10} {f.modelId,-10} " +
                          $"tris={(s != null ? s.triangles : 0),-6} tex={(s != null ? s.maxTexture : 0),-5} " +
                          $"sizeMB={(s != null ? s.sizeMB : 0f):0.00} approved={f.productionApproved} " +
                          (overBudget ? "  <<< OVER BUDGET" : "  ok"));
            }

            Debug.Log($"[AUDIT] LECLAT_AUDIT_RESULT {manifest.fragments.Length} models, {over} over budget");
            if (Application.isBatchMode) EditorApplication.Exit(0);
        }
    }
}
