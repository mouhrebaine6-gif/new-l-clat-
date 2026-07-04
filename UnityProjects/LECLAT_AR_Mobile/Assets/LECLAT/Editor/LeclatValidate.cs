using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using Vuforia;

namespace Leclat.AR.Editor
{
    public static class LeclatValidate
    {
        private const string ScenePath = "Assets/LECLAT/Scenes/Main.unity";
        private const string VuforiaDatabaseName = "LECLAT";

        public static void Run()
        {
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);

            var failures = new List<string>();

            Check(IsSceneInBuildSettings(ScenePath), "scene_in_build_settings", failures);
            Check(GraphicsSettings.defaultRenderPipeline != null, "urp_pipeline_active", failures);

            var bridge = Object.FindAnyObjectByType<LeclatNativeBridge>(FindObjectsInactive.Include);
            var runtime = Object.FindAnyObjectByType<LeclatArRuntime>(FindObjectsInactive.Include);
            var poller = Object.FindAnyObjectByType<LeclatImageTrackingPoller>(FindObjectsInactive.Include);
            var wings = Object.FindAnyObjectByType<LeclatTrackedImageWingsController>(FindObjectsInactive.Include);
            var gyro = Object.FindAnyObjectByType<LeclatGyroFallbackController>(FindObjectsInactive.Include);
            var loader = Object.FindAnyObjectByType<LeclatGltfastLoader>(FindObjectsInactive.Include);
            var profiler = Object.FindAnyObjectByType<LeclatProfilerOverlay>(FindObjectsInactive.Include);
            var webView = Object.FindAnyObjectByType<LeclatWebViewHost>(FindObjectsInactive.Include);
            var qr = Object.FindAnyObjectByType<LeclatQRFirstScan>(FindObjectsInactive.Include);
            var vuforia = Object.FindAnyObjectByType<VuforiaBehaviour>(FindObjectsInactive.Include);
            Object bootstrap = Object.FindAnyObjectByType<LeclatVuforiaBootstrap>(FindObjectsInactive.Include);
            if (bootstrap == null)
            {
                bootstrap = Object.FindAnyObjectByType<LeclatUnityBootstrap>(FindObjectsInactive.Include);
            }

            var hasBootstrap = bootstrap != null;
            var runtimeOk = runtime != null || hasBootstrap;
            var qrOk = qr != null || hasBootstrap;
            var vuforiaOk = vuforia != null || hasBootstrap;

            Check(bridge != null, "native_bridge", failures);
            Check(runtimeOk, "ar_runtime_or_bootstrap", failures);
            Check(poller != null, "image_tracking_poller", failures);
            Check(wings != null, "wings_controller", failures);
            Check(gyro != null, "gyro_fallback", failures);
            Check(loader != null, "gltfast_loader", failures);
            Check(profiler != null, "profiler_overlay", failures);
            Check(webView != null, "webview_host", failures);
            Check(qrOk, "qr_first_scan_or_bootstrap", failures);
            Check(vuforiaOk, "vuforia_behaviour_or_bootstrap", failures);

            Check(Directory.Exists(Path.Combine(Application.streamingAssetsPath, "LECLAT", "WebUI")), "webui_streaming_assets", failures);
            Check(Directory.Exists(Path.Combine(Application.streamingAssetsPath, "LECLAT", "Models")), "models_streaming_assets", failures);
            Check(HasVuforiaDatabase(), "vuforia_database_files", failures);
            CheckFragmentModels(failures);

            Debug.Log(
                $"LECLAT_VALIDATE bridge={bridge != null} runtimeOk={runtimeOk} runtimeScene={runtime != null} poller={poller != null} " +
                $"wings={wings != null} gyro={gyro != null} loader={loader != null} webView={webView != null} " +
                $"qrOk={qrOk} qrScene={qr != null} vuforiaOk={vuforiaOk} vuforiaScene={vuforia != null} bootstrap={hasBootstrap}");

            if (failures.Count == 0)
            {
                Debug.Log("LECLAT_VALIDATE_RESULT PASS");
            }
            else
            {
                Debug.LogError("LECLAT_VALIDATE_RESULT FAIL " + string.Join(", ", failures));
            }

            if (Application.isBatchMode)
            {
                EditorApplication.Exit(failures.Count == 0 ? 0 : 2);
            }
        }

        private static void Check(bool condition, string name, ICollection<string> failures)
        {
            if (!condition)
            {
                failures.Add(name);
            }
        }

        private static bool IsSceneInBuildSettings(string scenePath)
        {
            var scenes = EditorBuildSettings.scenes;
            for (var i = 0; i < scenes.Length; i++)
            {
                if (scenes[i].enabled && scenes[i].path == scenePath)
                {
                    return true;
                }
            }

            return false;
        }

        private static bool HasVuforiaDatabase()
        {
            var root = Application.streamingAssetsPath;
            var xml = Path.Combine(root, "Vuforia", VuforiaDatabaseName + ".xml");
            var dat = Path.Combine(root, "Vuforia", VuforiaDatabaseName + ".dat");
            return File.Exists(xml) && File.Exists(dat);
        }

        private static void CheckFragmentModels(ICollection<string> failures)
        {
            for (var i = 0; i < LeclatFragmentRegistry.All.Length; i++)
            {
                var def = LeclatFragmentRegistry.All[i];
                var path = Path.Combine(Application.streamingAssetsPath, "LECLAT", "Models", def.ModelPath);
                if (!File.Exists(path))
                {
                    failures.Add("missing_model:" + def.FragmentId);
                }
            }
        }
    }
}
