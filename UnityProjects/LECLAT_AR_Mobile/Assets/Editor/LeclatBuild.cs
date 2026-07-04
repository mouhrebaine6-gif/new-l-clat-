using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;

/// <summary>
/// Profils de build Android L'ÉCLAT (batchmode -executeMethod).
///   • BuildAndroidDev  : Mono + ARMv7, build de dev (debug-signé) → Builds/leclat.apk.
///                        Rapide et faible RAM (évite l'OOM clang d'IL2CPP). Pour tester.
///   • BuildAndroidProd : IL2CPP + ARM64 SEULEMENT, codegen « smaller », stripping High,
///                        engine code stripping → Builds/leclat-prod.apk. Pour le Play Store.
///                        Demande plus de RAM (cf. README_BUILD.md → pagefile sur 8 Go).
///
///   Unity.exe -batchmode -quit -projectPath ... -buildTarget Android
///             -executeMethod LeclatBuild.BuildAndroidDev -logFile build.log
/// </summary>
public static class LeclatBuild
{
    public static void BuildAndroidDev() => Build("leclat.apk", prod: false);

    public static void BuildAndroidProd() => Build("leclat-prod.apk", prod: true);

    private static void Build(string apkName, bool prod)
    {
        var projectRoot = Directory.GetCurrentDirectory();
        var outDir = Path.Combine(projectRoot, "Builds");
        Directory.CreateDirectory(outDir);
        var apkPath = Path.Combine(outDir, apkName);

        var scenes = EditorBuildSettings.scenes
            .Where(s => s.enabled && !string.IsNullOrEmpty(s.path))
            .Select(s => s.path)
            .ToArray();
        if (scenes.Length == 0)
        {
            scenes = new[] { "Assets/LECLAT/Scenes/Main.unity" };
        }

        var android = NamedBuildTarget.Android;
        EditorUserBuildSettings.buildAppBundle = false; // APK
        // Compression texture mobile (poids ↓, GPU ↓) — supportée par tous les GPU AR récents.
        EditorUserBuildSettings.androidBuildSubtarget = MobileTextureSubtarget.ASTC;
        PlayerSettings.stripEngineCode = true;

        if (prod)
        {
            // PROD : IL2CPP + ARM64 SEULEMENT (1 archi = ~2× moins de RAM que ARM64+ARMv7 ;
            // Google Play exige le 64-bit de toute façon). Codegen taille + stripping agressif.
            EditorUserBuildSettings.development = false;
            PlayerSettings.SetScriptingBackend(android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.SetIl2CppCodeGeneration(android, Il2CppCodeGeneration.OptimizeSize);
            PlayerSettings.SetManagedStrippingLevel(android, ManagedStrippingLevel.High);
        }
        else
        {
            // DEV : Mono + ARMv7 → compile en minutes, faible RAM. Un device arm64 exécute
            // sans souci un APK armeabi-v7a.
            EditorUserBuildSettings.development = true;
            PlayerSettings.SetScriptingBackend(android, ScriptingImplementation.Mono2x);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARMv7;
        }

        var options = new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = apkPath,
            target = BuildTarget.Android,
            targetGroup = BuildTargetGroup.Android,
            options = prod
                ? BuildOptions.None
                : (BuildOptions.Development | BuildOptions.AllowDebugging),
        };

        Debug.Log("[LECLATBUILD] start prod=" + prod + " scenes=" + string.Join(",", scenes) +
                  " out=" + apkPath);
        var report = BuildPipeline.BuildPlayer(options);
        var s = report.summary;
        Debug.Log("[LECLATBUILD] result=" + s.result + " errors=" + s.totalErrors +
                  " sizeBytes=" + s.totalSize + " out=" + apkPath + " exists=" + File.Exists(apkPath));

        if (s.result != BuildResult.Succeeded)
        {
            EditorApplication.Exit(1);
        }
    }
}
