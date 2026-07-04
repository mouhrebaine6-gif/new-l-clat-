using UnityEditor;
using UnityEditor.XR.Management;
using UnityEditor.XR.Management.Metadata;
using UnityEngine;
using UnityEngine.XR.Management;

namespace Leclat.AR.Editor
{
    /// <summary>
    /// Enables an XR loader (ARCore / ARKit) for a build target group through
    /// XR Plug-in Management, creating the settings assets if needed.
    /// </summary>
    public static class LeclatXrLoaderSetup
    {
        public static bool TryEnable(string loaderTypeName, BuildTargetGroup group)
        {
            var perBuildTarget = GetOrCreatePerBuildTargetSettings();
            if (perBuildTarget == null)
                return false;

            if (!perBuildTarget.HasManagerSettingsForBuildTarget(group))
                perBuildTarget.CreateDefaultManagerSettingsForBuildTarget(group);

            var general = perBuildTarget.SettingsForBuildTarget(group);
            if (general == null)
                return false;

            if (general.Manager == null)
            {
                var manager = ScriptableObject.CreateInstance<XRManagerSettings>();
                manager.name = "XRManagerSettings " + group;
                AssetDatabase.AddObjectToAsset(manager, perBuildTarget);
                general.Manager = manager;
                EditorUtility.SetDirty(general);
            }

            var assigned = XRPackageMetadataStore.AssignLoader(general.Manager, loaderTypeName, group);
            EditorUtility.SetDirty(general.Manager);
            AssetDatabase.SaveAssets();
            return assigned;
        }

        private static XRGeneralSettingsPerBuildTarget GetOrCreatePerBuildTargetSettings()
        {
            EditorBuildSettings.TryGetConfigObject(XRGeneralSettings.k_SettingsKey,
                out XRGeneralSettingsPerBuildTarget perBuildTarget);

            if (perBuildTarget != null)
                return perBuildTarget;

            if (!AssetDatabase.IsValidFolder("Assets/XR"))
                AssetDatabase.CreateFolder("Assets", "XR");

            perBuildTarget = ScriptableObject.CreateInstance<XRGeneralSettingsPerBuildTarget>();
            AssetDatabase.CreateAsset(perBuildTarget, "Assets/XR/XRGeneralSettingsPerBuildTarget.asset");
            EditorBuildSettings.AddConfigObject(XRGeneralSettings.k_SettingsKey, perBuildTarget, true);
            return perBuildTarget;
        }
    }
}
