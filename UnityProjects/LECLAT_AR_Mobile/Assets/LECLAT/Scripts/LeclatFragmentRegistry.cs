// LeclatFragmentRegistry.cs
// Registre des 10 fragments narratifs LECLAT → marker AR + model 3D (aile).
// Synchronisé avec src/lib/eclatBridgeContract.ts (FRAGMENT_AR_MAPPING).
// À utiliser dans LeclatImageTrackingPoller + LeclatTrackedImageWingsController.
using UnityEngine;

namespace Leclat.AR
{
    public enum FragmentAnimation { Idle, Breathe, Flare, Spiral }

    [System.Serializable]
    public struct FragmentDefinition
    {
        public string FragmentId;        // "eveil" | "souffle" | "forge" | ...
        public string MarkerResourceName; // "FRAGMENT_EVEIL_MARKER" (Resources/LECLAT/...)
        public string ModelPath;          // chemin relatif StreamingAssets/LECLAT/Models/back_wings/...
        public float Scale;               // taille du modèle 3D en mètres
        public Vector3 Anchor;            // offset au-dessus du marqueur
        public FragmentAnimation Animation;
    }

    public static class LeclatFragmentRegistry
    {
        public const string StreamingAssetsBase = "LECLAT/Models/";
        public const string MarkersResourceBase = "LECLAT/";

        public static readonly FragmentDefinition[] All = new[]
        {
            new FragmentDefinition
            {
                FragmentId = "eveil",
                MarkerResourceName = "FRAGMENT_EVEIL_MARKER",
                ModelPath = "back_wings/FRAGMENT_EVEIL.glb",
                Scale = 0.18f,
                Anchor = new Vector3(0f, 0.04f, 0f),
                Animation = FragmentAnimation.Breathe,
            },
            new FragmentDefinition
            {
                FragmentId = "souffle",
                MarkerResourceName = "FRAGMENT_SOUFFLE_MARKER",
                ModelPath = "back_wings/FRAGMENT_SOUFFLE.glb",
                Scale = 0.20f,
                Anchor = new Vector3(0f, 0.05f, 0f),
                Animation = FragmentAnimation.Idle,
            },
            new FragmentDefinition
            {
                FragmentId = "forge",
                MarkerResourceName = "FRAGMENT_FORGE_MARKER",
                ModelPath = "back_wings/FRAGMENT_FORGE.glb",
                Scale = 0.22f,
                Anchor = new Vector3(0f, 0.05f, 0f),
                Animation = FragmentAnimation.Flare,
            },
            new FragmentDefinition
            {
                FragmentId = "prisme",
                MarkerResourceName = "FRAGMENT_PRISME_MARKER",
                ModelPath = "back_wings/FRAGMENT_PRISME.glb",
                Scale = 0.16f,
                Anchor = new Vector3(0f, 0.04f, 0f),
                Animation = FragmentAnimation.Spiral,
            },
            new FragmentDefinition
            {
                FragmentId = "atome",
                MarkerResourceName = "FRAGMENT_ATOME_MARKER",
                ModelPath = "back_wings/FRAGMENT_ATOME/scene.gltf",
                Scale = 0.14f,
                Anchor = new Vector3(0f, 0.03f, 0f),
                Animation = FragmentAnimation.Breathe,
            },
            new FragmentDefinition
            {
                FragmentId = "eclipse",
                MarkerResourceName = "FRAGMENT_ECLIPSE_MARKER",
                ModelPath = "back_wings/FRAGMENT_ECLIPSE.glb",
                Scale = 0.20f,
                Anchor = new Vector3(0f, 0.05f, 0f),
                Animation = FragmentAnimation.Flare,
            },
            new FragmentDefinition
            {
                FragmentId = "horizon",
                MarkerResourceName = "FRAGMENT_HORIZON_MARKER",
                ModelPath = "back_wings/FRAGMENT_HORIZON.glb",
                Scale = 0.24f,
                Anchor = new Vector3(0f, 0.06f, 0f),
                Animation = FragmentAnimation.Idle,
            },
            new FragmentDefinition
            {
                FragmentId = "resonance",
                MarkerResourceName = "FRAGMENT_RESONANCE_MARKER",
                ModelPath = "back_wings/FRAGMENT_RESONANCE.glb",
                Scale = 0.18f,
                Anchor = new Vector3(0f, 0.04f, 0f),
                Animation = FragmentAnimation.Breathe,
            },
            new FragmentDefinition
            {
                FragmentId = "ascension",
                MarkerResourceName = "FRAGMENT_ASCENSION_MARKER",
                ModelPath = "back_wings/FRAGMENT_ASCENSION.glb",
                Scale = 0.22f,
                Anchor = new Vector3(0f, 0.06f, 0f),
                Animation = FragmentAnimation.Spiral,
            },
            new FragmentDefinition
            {
                FragmentId = "origine",
                MarkerResourceName = "FRAGMENT_ORIGINE_MARKER",
                ModelPath = "back_wings/FRAGMENT_ORIGINE.glb",
                Scale = 0.20f,
                Anchor = new Vector3(0f, 0.05f, 0f),
                Animation = FragmentAnimation.Breathe,
            },
        };

        public static bool TryGetByMarkerName(string markerName, out FragmentDefinition def)
        {
            for (int i = 0; i < All.Length; i++)
            {
                if (All[i].MarkerResourceName == markerName)
                {
                    def = All[i];
                    return true;
                }
            }
            def = default;
            return false;
        }

        public static bool TryGetByFragmentId(string fragmentId, out FragmentDefinition def)
        {
            for (int i = 0; i < All.Length; i++)
            {
                if (All[i].FragmentId == fragmentId)
                {
                    def = All[i];
                    return true;
                }
            }
            def = default;
            return false;
        }
    }
}
