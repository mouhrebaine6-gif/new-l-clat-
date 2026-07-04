using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// Overlay debug HSV — VISIBLE UNIQUEMENT en development build / éditeur, JAMAIS
    /// en build prod (release). Affiche la teinte/saturation/valeur mesurées sur le
    /// tissu + le fragment détecté + la confiance.
    ///
    /// Indispensable pour CALIBRER les seuils HSV sur le vrai tissu, au vrai éclairage,
    /// avec le téléphone : on lit H/S/V réels et on ajuste les bornes dans
    /// <see cref="LeclatFabricColorDetector"/>.
    ///
    /// Tout le corps est sous #if DEVELOPMENT_BUILD || UNITY_EDITOR → en release la
    /// classe est inerte et l'overlay n'est même pas instancié.
    /// </summary>
    public sealed class LeclatHsvDebugOverlay : MonoBehaviour
    {
#if DEVELOPMENT_BUILD || UNITY_EDITOR
        private LeclatFabricColorDetector detector;
        private GUIStyle style;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Install()
        {
            if (GameObject.Find("LECLAT_HsvDebug") == null)
            {
                new GameObject("LECLAT_HsvDebug").AddComponent<LeclatHsvDebugOverlay>();
            }
        }

        private void EnsureDetector()
        {
            if (detector == null)
            {
                detector = FindAnyObjectByType<LeclatFabricColorDetector>(FindObjectsInactive.Include);
            }
        }

        private void OnGUI()
        {
            EnsureDetector();
            if (detector == null || !detector.DebugValid)
            {
                return;
            }

            if (style == null)
            {
                style = new GUIStyle(GUI.skin.box)
                {
                    fontSize = 22,
                    alignment = TextAnchor.MiddleLeft,
                };
            }

            var txt =
                $" TISSU   H={detector.DebugH:0}°   S={detector.DebugS:0.00}   V={detector.DebugV:0.00}\n" +
                $" Fragment: {detector.DebugFragment}   (confiance {detector.DebugConfidence:0.00})";
            GUI.Box(new Rect(16f, 16f, 580f, 96f), txt, style);
        }
#endif
    }
}
