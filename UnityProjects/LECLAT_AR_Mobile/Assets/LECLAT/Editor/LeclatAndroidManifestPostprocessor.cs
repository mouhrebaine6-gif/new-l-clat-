using System.IO;
using System.Xml;
using UnityEditor.Android;
using UnityEngine;

namespace Leclat.AR.Editor
{
    /// <summary>
    /// Keeps Android install compatibility broad: AR/camera features are optional
    /// so non-ARCore phones can still run the WebUI and non-AR fallback flows.
    /// </summary>
    public sealed class LeclatAndroidManifestPostprocessor : IPostGenerateGradleAndroidProject
    {
        private const string AndroidNamespace = "http://schemas.android.com/apk/res/android";

        public int callbackOrder => 10000;

        public void OnPostGenerateGradleAndroidProject(string path)
        {
            var manifestPath = Path.Combine(path, "src", "main", "AndroidManifest.xml");
            if (!File.Exists(manifestPath))
            {
                Debug.LogWarning($"LECLAT_MANIFEST manifest=missing path={manifestPath}");
                return;
            }

            var doc = new XmlDocument { PreserveWhitespace = true };
            doc.Load(manifestPath);

            var manifest = doc.DocumentElement;
            if (manifest == null)
                return;

            SetFeatureRequired(doc, manifest, "android.hardware.camera", false);
            SetFeatureRequired(doc, manifest, "android.hardware.camera.autofocus", false);
            SetFeatureRequired(doc, manifest, "android.hardware.camera.ar", false);
            SetFeatureRequired(doc, manifest, "com.google.ar.core.depth", false);

            var application = manifest.SelectSingleNode("application") as XmlElement;
            if (application != null)
                SetMetaDataValue(doc, application, "com.google.ar.core", "optional");

            doc.Save(manifestPath);
            Debug.Log("LECLAT_MANIFEST arcore=optional camera=optional depth=optional");
        }

        private static void SetFeatureRequired(XmlDocument doc, XmlElement manifest, string featureName, bool required)
        {
            var feature = FindElementByAndroidName(manifest, "uses-feature", featureName);
            if (feature == null)
            {
                feature = doc.CreateElement("uses-feature");
                feature.SetAttribute("name", AndroidNamespace, featureName);
                manifest.AppendChild(feature);
            }

            feature.SetAttribute("required", AndroidNamespace, required ? "true" : "false");
        }

        private static void SetMetaDataValue(XmlDocument doc, XmlElement application, string name, string value)
        {
            var metaData = FindElementByAndroidName(application, "meta-data", name);
            if (metaData == null)
            {
                metaData = doc.CreateElement("meta-data");
                metaData.SetAttribute("name", AndroidNamespace, name);
                application.AppendChild(metaData);
            }

            metaData.SetAttribute("value", AndroidNamespace, value);
        }

        private static XmlElement FindElementByAndroidName(XmlElement parent, string tagName, string name)
        {
            foreach (XmlNode node in parent.GetElementsByTagName(tagName))
            {
                if (node is XmlElement element &&
                    element.GetAttribute("name", AndroidNamespace) == name)
                {
                    return element;
                }
            }

            return null;
        }
    }
}
