using System.IO;
using System;
using System.Reflection;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using UnityEngine.Rendering;

namespace Leclat.AR.Editor
{
    /// <summary>
    /// Headless Android builds. Run with:
    ///   Unity -batchmode -quit -projectPath . -buildTarget Android
    ///     -executeMethod Leclat.AR.Editor.LeclatBuild.Android -logFile build.log
    ///
    /// Google Play AAB:
    ///   Unity -batchmode -quit -projectPath . -buildTarget Android
    ///     -executeMethod Leclat.AR.Editor.LeclatBuild.AndroidAab -targetApi 35 -logFile build-aab.log
    ///
    /// If Burst AOT fails during Android native postprocessing:
    ///   Unity -batchmode -quit -projectPath . -buildTarget Android
    ///     -executeMethod Leclat.AR.Editor.LeclatBuild.AndroidAabNoBurst -targetApi 35 -logFile build-aab-noburst.log
    /// </summary>
    public static class LeclatBuild
    {
        private const string DefaultOutDir = "D:/LECLAT/Builds/Android";
        private const string ScenePath = "Assets/LECLAT/Scenes/Main.unity";
        private const string BundleId = "com.leclat.armobile";

        public static void Android()
        {
            BuildAndroid(appBundle: false, development: true, defaultFileName: "LECLAT_AR.apk");
        }

        public static void AndroidAab()
        {
            BuildAndroid(appBundle: true, development: false, defaultFileName: "LECLAT_AR.aab");
        }

        public static void AndroidReleaseAab()
        {
            AndroidAab();
        }

        public static void AndroidAabNoBurst()
        {
            BuildAndroid(appBundle: true, development: false, defaultFileName: "LECLAT_AR.aab", disableBurstAot: true);
        }

        /// <summary>
        /// APK de DÉMONSTRATION (validation sur téléphone). IL2CPP + universel
        /// (ARM64 | ARMv7) → s'installe sur TOUT appareil Android, 32 ou 64 bits.
        /// Build « release » signé (keystore fourni via env) + codegen taille +
        /// stripping High pour tenir sur une machine 8 Go. Sortie par défaut :
        /// le Bureau (LECLAT_AR_DEMO_MAX.apk). Le contenu MAX (histoire complète,
        /// fragments et modèles 3D déverrouillés) est porté par la WebUI embarquée.
        ///   Unity -batchmode -quit -projectPath . -buildTarget Android
        ///     -executeMethod Leclat.AR.Editor.LeclatBuild.Demo
        ///     -arch universal -output "<Bureau>/LECLAT_AR_DEMO_MAX.apk" -logFile build-demo.log
        /// </summary>
        public static void Demo()
        {
            BuildAndroid(
                appBundle: false,
                development: false,
                defaultFileName: "LECLAT_AR_DEMO_MAX.apk",
                arch: ParseArch(GetArg("-arch") ?? Environment.GetEnvironmentVariable("LECLAT_ARCH") ?? "universal"),
                sizeOptimized: true);
        }

        private static void BuildAndroid(bool appBundle, bool development, string defaultFileName, bool disableBurstAot = false, AndroidArchitecture? arch = null, bool sizeOptimized = false)
        {
            Directory.CreateDirectory(DefaultOutDir);
            ConfigureAndroidPlayerSettings(arch, sizeOptimized);
            ConfigureSigningFromArgsOrEnvironment();

            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
            EditorUserBuildSettings.buildAppBundle = appBundle;
            EditorUserBuildSettings.exportAsGoogleAndroidProject = false;
            ConfigureBurstAotForAndroid(disableBurstAot || IsTruthy(GetArg("-disableBurstAot")) || IsTruthy(Environment.GetEnvironmentVariable("LECLAT_DISABLE_BURST_AOT")));

            var output = GetArg("-output") ?? Path.Combine(DefaultOutDir, defaultFileName).Replace("\\", "/");
            if (appBundle && !output.EndsWith(".aab", StringComparison.OrdinalIgnoreCase))
                output = Path.ChangeExtension(output, ".aab").Replace("\\", "/");
            if (!appBundle && !output.EndsWith(".apk", StringComparison.OrdinalIgnoreCase))
                output = Path.ChangeExtension(output, ".apk").Replace("\\", "/");

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = output,
                target = BuildTarget.Android,
                targetGroup = BuildTargetGroup.Android,
                options = development ? BuildOptions.Development : BuildOptions.None,
            };

            var report = BuildPipeline.BuildPlayer(options);
            var s = report.summary;
            Debug.Log(
                $"LECLAT_BUILD appBundle={appBundle} development={development} " +
                $"targetSdk={PlayerSettings.Android.targetSdkVersion} arch={PlayerSettings.Android.targetArchitectures} " +
                $"result={s.result} errors={s.totalErrors} sizeMB={s.totalSize / (1024f * 1024f):0.0} path={s.outputPath}");

            if (Application.isBatchMode)
                EditorApplication.Exit(s.result == BuildResult.Succeeded ? 0 : 3);
        }

        private static void ConfigureBurstAotForAndroid(bool disableBurstAot)
        {
            if (!disableBurstAot)
                return;

            var settingsType = FindEditorType("Unity.Burst.Editor.BurstPlatformAotSettings");
            if (settingsType == null)
            {
                Debug.LogWarning("LECLAT_BUILD burstAot=unchanged reason=BurstPlatformAotSettings-not-found");
                return;
            }

            var getOrCreateSettings = settingsType.GetMethod("GetOrCreateSettings", BindingFlags.NonPublic | BindingFlags.Static);
            var save = settingsType.GetMethod("Save", BindingFlags.NonPublic | BindingFlags.Instance);
            var enableBurstCompilation = settingsType.GetField("EnableBurstCompilation", BindingFlags.NonPublic | BindingFlags.Instance);

            if (getOrCreateSettings == null || save == null || enableBurstCompilation == null)
            {
                Debug.LogWarning("LECLAT_BUILD burstAot=unchanged reason=Burst-AOT-reflection-missing-member");
                return;
            }

            var target = (BuildTarget?)BuildTarget.Android;
            var settings = getOrCreateSettings.Invoke(null, new object[] { target });
            enableBurstCompilation.SetValue(settings, false);
            save.Invoke(settings, new object[] { target });
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("LECLAT_BUILD burstAot=disabled target=Android");
        }

        private static Type FindEditorType(string fullName)
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                var type = assembly.GetType(fullName, throwOnError: false);
                if (type != null)
                    return type;
            }

            return null;
        }

        private static void ConfigureAndroidPlayerSettings(AndroidArchitecture? archOverride = null, bool sizeOptimized = false)
        {
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, BundleId);
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = archOverride ?? AndroidArchitecture.ARM64;
            // Vuforia Engine 11.x impose Android 10.0 (API 29) au minimum.
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel29;
            PlayerSettings.Android.targetSdkVersion = ParseTargetApi(GetArg("-targetApi") ?? "35");
            PlayerSettings.SetGraphicsAPIs(BuildTarget.Android, new[] { GraphicsDeviceType.OpenGLES3 });
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android, false);
            if (sizeOptimized)
            {
                // 8 Go de RAM : réduire le volume de C++ généré par IL2CPP (pic mémoire clang)
                // et le poids de l'APK. OptimizeSize est un choix de CODEGEN (code plus compact,
                // à peine plus lent) — il NE supprime PAS de types managés, donc la réflexion
                // (décodage QR ZXing, chargement glTF) reste intacte. On NE force PAS le managed
                // stripping (on garde le défaut projet connu-bon) pour ne rien casser au runtime.
                PlayerSettings.SetIl2CppCodeGeneration(NamedBuildTarget.Android, UnityEditor.Build.Il2CppCodeGeneration.OptimizeSize);
            }

            var versionName = GetArg("-versionName");
            if (!string.IsNullOrWhiteSpace(versionName))
                PlayerSettings.bundleVersion = versionName;

            var versionCode = GetArg("-versionCode");
            if (int.TryParse(versionCode, out var parsedVersionCode) && parsedVersionCode > 0)
                PlayerSettings.Android.bundleVersionCode = parsedVersionCode;
        }

        private static AndroidArchitecture ParseArch(string value)
        {
            switch ((value ?? "").Trim().ToLowerInvariant())
            {
                case "universal":
                case "all":
                case "both":
                    return AndroidArchitecture.ARM64 | AndroidArchitecture.ARMv7;
                case "armv7":
                case "arm32":
                    return AndroidArchitecture.ARMv7;
                default:
                    return AndroidArchitecture.ARM64;
            }
        }

        private static AndroidSdkVersions ParseTargetApi(string value)
        {
            return value switch
            {
                "36" => AndroidSdkVersions.AndroidApiLevel36,
                "35" => AndroidSdkVersions.AndroidApiLevel35,
                "auto" => AndroidSdkVersions.AndroidApiLevelAuto,
                "Auto" => AndroidSdkVersions.AndroidApiLevelAuto,
                _ => AndroidSdkVersions.AndroidApiLevel35
            };
        }

        private static void ConfigureSigningFromArgsOrEnvironment()
        {
            var keystoreName = GetArg("-keystoreName") ?? Environment.GetEnvironmentVariable("LECLAT_KEYSTORE_NAME") ?? Environment.GetEnvironmentVariable("LECLAT_KEYSTORE_PATH");
            var keystorePass = GetArg("-keystorePass") ?? Environment.GetEnvironmentVariable("LECLAT_KEYSTORE_PASS");
            var keyAliasName = GetArg("-keyaliasName") ?? Environment.GetEnvironmentVariable("LECLAT_KEY_ALIAS");
            var keyAliasPass = GetArg("-keyaliasPass") ?? Environment.GetEnvironmentVariable("LECLAT_KEY_PASS");

            var hasSigning =
                !string.IsNullOrWhiteSpace(keystoreName) &&
                !string.IsNullOrWhiteSpace(keystorePass) &&
                !string.IsNullOrWhiteSpace(keyAliasName) &&
                !string.IsNullOrWhiteSpace(keyAliasPass);

            PlayerSettings.Android.useCustomKeystore = hasSigning;
            if (hasSigning)
            {
                PlayerSettings.Android.keystoreName = keystoreName;
                PlayerSettings.Android.keystorePass = keystorePass;
                PlayerSettings.Android.keyaliasName = keyAliasName;
                PlayerSettings.Android.keyaliasPass = keyAliasPass;
                Debug.Log("LECLAT_BUILD signing=custom-keystore");
                return;
            }

            Debug.LogWarning("LECLAT_BUILD signing=editor-default; configure LECLAT_KEYSTORE_* env vars for a Play upload-ready release.");
        }

        private static string GetArg(string name)
        {
            var args = Environment.GetCommandLineArgs();
            for (var i = 0; i < args.Length - 1; i++)
            {
                if (args[i].Equals(name, StringComparison.OrdinalIgnoreCase))
                    return args[i + 1];
            }
            return null;
        }

        private static bool IsTruthy(string value)
        {
            return value != null &&
                   (value.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                    value.Equals("true", StringComparison.OrdinalIgnoreCase) ||
                    value.Equals("yes", StringComparison.OrdinalIgnoreCase) ||
                    value.Equals("on", StringComparison.OrdinalIgnoreCase));
        }
    }
}
