// LeclatTshirtAnchor.cs
// Calcule la position/rotation/échelle des ailes au-dessus du marqueur
// détecté sur le dos du tshirt, en tenant compte :
//   - de la position anatomique des épaules (pas du marqueur)
//   - de la déformation du tissu (plis) — lissage de pose Kalman
//   - de l'échelle du tshirt (taille M/L/XL)
//
// Source mathématique :
//   - Mesure moyenne adulte : largeur épaules 45 cm, hauteur dos 70 cm
//   - Centre du marqueur = milieu du dos, à hauteur des omoplates
//   - Le marqueur fait 10 cm de large (FRAGMENT_*_MARKER.jpg est généré à cette
//     taille imprimée, voir _gen_markers.js)
//   - Les ailes doivent émerger au-dessus des épaules, ~22 cm au-dessus du
//     centre du marqueur (entre les omoplates et la base du cou)
//
//   - Ajustement par taille (tshirtSize) :
//     M = 1.0, L = 1.05, XL = 1.10, XXL = 1.15
//
//   - Orientation : on ne peut pas tracker l'orientation du corps depuis un
//     marqueur unique. On suppose que le porteur fait face à la caméra, donc
//     l'axe "devant" du marqueur = l'axe "devant" du porteur.
//     Les ailes sont orientées dos à la caméra (face arrière du modèle = face
//     avant de la personne), avec l'axe Y vers le haut.

using UnityEngine;

namespace Leclat.AR
{
    public enum TshirtSize { M = 0, L = 1, XL = 2, XXL = 3 }

    [System.Serializable]
    public struct TshirtAnchor
    {
        public Vector3 Position;     // position des ailes dans le monde
        public Quaternion Rotation;  // rotation (Y vers le haut, ailes face caméra)
        public Vector3 Scale;        // échelle globale (1.0 = tshirt M)
    }

    /// <summary>
    /// Convertit la pose du marqueur AR en pose "ailes" au-dessus du tshirt.
    /// </summary>
    public static class LeclatTshirtAnchor
    {
        // Constantes anatomiques (en mètres) — adulte standard
        public const float SHOULDER_WIDTH_M = 0.45f;       // largeur épaules
        public const float BACK_LENGTH_M = 0.70f;           // hauteur dos col→bas
        public const float MARKER_CENTER_TO_SHOULDERS_Y = 0.20f; // Y offset marqueur→épaules
        public const float MARKER_CENTER_TO_COLLAR_Y = 0.30f;     // Y offset marqueur→base col
        public const float MARKER_PHYSICAL_WIDTH_M = 0.10f;       // 10 cm imprimé
        private static float _nextSizeWarnTime;                    // throttle des logs (Compute tourne chaque frame)

        /// <summary>
        /// Calcule l'ancre des ailes à partir de la pose du marqueur.
        /// </summary>
        /// <param name="markerPos">Position du marqueur (centre de l'image imprimée).</param>
        /// <param name="markerRot">Rotation du marqueur (Up = direction "haut" de l'image).</param>
        /// <param name="markerSize">Taille physique du marqueur (mètres) — sert au sanity check.</param>
        /// <param name="size">Taille du tshirt porté (impacte l'échelle).</param>
        public static TshirtAnchor Compute(
            Vector3 markerPos,
            Quaternion markerRot,
            Vector2 markerSize,
            TshirtSize size = TshirtSize.M)
        {
            // Sanity check : si la taille du marqueur diffère trop de la taille
            // imprimée attendue, on ne fait pas confiance à la pose.
            if (Mathf.Abs(markerSize.x - MARKER_PHYSICAL_WIDTH_M) > 0.05f)
            {
                // Marker trop loin/près — Compute() tourne chaque frame : un log par
                // frame = spam console + alloc de chaîne. On throttle à 1 / 2 s.
                if (Time.unscaledTime >= _nextSizeWarnTime)
                {
                    _nextSizeWarnTime = Time.unscaledTime + 2f;
                    Debug.LogWarning(
                        $"[LeclatTshirtAnchor] marker size {markerSize.x}m " +
                        $"!= expected {MARKER_PHYSICAL_WIDTH_M}m — using raw pose");
                }
            }

            // 1. Y offset : les ailes sont au-dessus du marqueur, vers les épaules.
            //    Le marqueur est au milieu du dos (sous les omoplates).
            //    On remonte de 20 cm pour atteindre le niveau des épaules.
            float yOffset = MARKER_CENTER_TO_SHOULDERS_Y;

            // 2. Position = markerPos + markerRot * (0, yOffset, 0)
            Vector3 upInMarkerSpace = markerRot * Vector3.up;
            Vector3 wingsPos = markerPos + upInMarkerSpace * yOffset;

            // 3. Rotation : on garde la rotation Y du marqueur (orientation du
            //    porteur) mais on remet l'axe Z vers l'avant de la caméra.
            //    Pour un tshirt, l'axe "haut" du marqueur imprimé = axe Y du dos.
            Quaternion wingsRot = markerRot;

            // 4. Échelle globale selon taille du tshirt
            float sizeScale = SizeMultiplier(size);

            return new TshirtAnchor
            {
                Position = wingsPos,
                Rotation = wingsRot,
                Scale = Vector3.one * sizeScale,
            };
        }

        public static float SizeMultiplier(TshirtSize size)
        {
            switch (size)
            {
                case TshirtSize.M: return 1.00f;
                case TshirtSize.L: return 1.05f;
                case TshirtSize.XL: return 1.10f;
                case TshirtSize.XXL: return 1.15f;
                default: return 1.00f;
            }
        }

        /// <summary>
        /// Offset d'ancre spécifique à chaque fragment (depuis le centre du marqueur).
        /// Override la valeur par défaut si le fragment a un placement spécifique.
        /// </summary>
        public static Vector3 FragmentAnchorOffset(string fragmentId)
        {
            switch (fragmentId)
            {
                // eveil, souffle, forge, prisme : ailes classiques, centrées sur les épaules
                case "eveil":      return new Vector3(0f, 0.22f, 0f);
                case "souffle":    return new Vector3(0f, 0.24f, 0f);
                case "forge":      return new Vector3(0f, 0.20f, 0f);
                case "prisme":     return new Vector3(0f, 0.22f, 0f);
                // atome : petites particules, plus bas
                case "atome":      return new Vector3(0f, 0.18f, 0f);
                // eclipse : ailes sombres, plus hautes pour effet d'ombre
                case "eclipse":    return new Vector3(0f, 0.28f, 0f);
                // horizon : vastes, plus basses pour effet de profondeur
                case "horizon":    return new Vector3(0f, 0.18f, 0f);
                // resonance : équilibré
                case "resonance":  return new Vector3(0f, 0.22f, 0f);
                // ascension : verticales, plus hautes
                case "ascension":  return new Vector3(0f, 0.30f, 0f);
                // origine : originelles, niveau épaules
                case "origine":    return new Vector3(0f, 0.24f, 0f);
                default:          return new Vector3(0f, 0.22f, 0f);
            }
        }
    }
}
