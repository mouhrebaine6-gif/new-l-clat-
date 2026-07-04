using UnityEngine;
using UnityEngine.InputSystem;

namespace Leclat.AR
{
    /// <summary>
    /// PILIER 3 — « méthode Arntreal ».
    /// Quand Vuforia ne peut PAS tracker du tout (pas de cible visible / pas de SLAM),
    /// on garde les ailes VISIBLES devant la caméra, animées par le GYROSCOPE
    /// (parallaxe douce) → JAMAIS d'écran noir, jamais de vide.
    ///
    /// Le flux caméra reste celui de Vuforia (video background) : ce contrôleur ne
    /// touche qu'à l'overlay 3D. Il est volontairement agnostique de Vuforia pour
    /// compiler/tester seul ; le contrôleur de tracking l'activera via
    /// <see cref="SetGyroMode"/> selon le statut Vuforia.
    ///
    /// Émet l'état au web via <see cref="ModeChanged"/> ("ar" | "gyro"), que le pont
    /// relaie dans le message TRACKING (format inchangé).
    /// Zéro allocation par frame.
    /// </summary>
    public sealed class LeclatGyroFallbackController : MonoBehaviour
    {
        public enum Mode { Ar, Gyro }

        [Tooltip("Transform à piloter (l'ancre/le contenu des ailes).")]
        [SerializeField] private Transform target;
        [SerializeField] private Camera arCamera;

        [Tooltip("Distance devant la caméra où flottent les ailes en mode gyro (m).")]
        [SerializeField] private float distanceMeters = 0.9f;
        [SerializeField] private Vector3 localOffset = Vector3.zero;

        [Tooltip("Amplitude max de la parallaxe gyroscopique (degrés).")]
        [SerializeField, Range(0f, 30f)] private float parallaxDegrees = 8f;
        [SerializeField] private float positionSmooth = 10f;
        [SerializeField] private float rotationSmooth = 8f;

        /// <summary>Notifie le mode courant : "ar" (Vuforia tracke) | "gyro" (fallback).</summary>
        public System.Action<string> ModeChanged;
        public Mode Current { get; private set; } = Mode.Ar;
        public bool IsGyroActive => gyroActive;

        private bool gyroActive;
        private bool hasReference;
        private Quaternion referenceAttitude = Quaternion.identity;
        private Quaternion smoothedParallax = Quaternion.identity;

        private void Awake()
        {
            if (arCamera == null)
            {
                arCamera = Camera.main;
            }
        }

        /// <summary>Le contrôleur de tracking appelle ceci selon le statut Vuforia.</summary>
        public void SetGyroMode(bool on)
        {
            if (on == gyroActive)
            {
                return;
            }

            gyroActive = on;
            if (on)
            {
                EnableAttitudeSensor();
                hasReference = false; // ré-ancre la référence d'orientation au prochain frame
                smoothedParallax = Quaternion.identity;
                Current = Mode.Gyro;
                ModeChanged?.Invoke("gyro");
            }
            else
            {
                DisableAttitudeSensor();
                Current = Mode.Ar;
                ModeChanged?.Invoke("ar");
            }
        }

        public void SetTarget(Transform t) => target = t;
        public void SetCamera(Camera c) => arCamera = c;

        private static void EnableAttitudeSensor()
        {
            var s = AttitudeSensor.current;
            if (s != null && !s.enabled)
            {
                InputSystem.EnableDevice(s);
            }
        }

        private static void DisableAttitudeSensor()
        {
            // Le capteur d'attitude draine la batterie tant qu'il tourne : on le
            // coupe dès qu'on repasse en tracking AR (et à la désactivation).
            var s = AttitudeSensor.current;
            if (s != null && s.enabled)
            {
                InputSystem.DisableDevice(s);
            }
        }

        private void OnDisable()
        {
            DisableAttitudeSensor();
        }

        private void LateUpdate()
        {
            if (!gyroActive || target == null || arCamera == null)
            {
                return;
            }

            var dt = Mathf.Max(Time.unscaledDeltaTime, 0.0001f);
            var camT = arCamera.transform;

            // 1) Place les ailes devant la caméra → toujours dans le champ (jamais de vide).
            var desiredPos = camT.position + camT.forward * distanceMeters + camT.TransformVector(localOffset);
            target.position = Vector3.Lerp(target.position, desiredPos, 1f - Mathf.Exp(-positionSmooth * dt));

            // 2) Parallaxe : petite rotation pilotée par l'attitude (gyro), bornée et lissée.
            var parallax = Quaternion.identity;
            var sensor = AttitudeSensor.current;
            if (sensor != null)
            {
                var att = sensor.attitude.ReadValue();
                if (!hasReference)
                {
                    referenceAttitude = att;
                    hasReference = true;
                }

                var delta = Quaternion.Inverse(referenceAttitude) * att;
                delta.ToAngleAxis(out var angle, out var axis);
                if (angle > 180f)
                {
                    angle -= 360f;
                }
                var clamped = Mathf.Clamp(angle, -parallaxDegrees, parallaxDegrees);
                if (!float.IsNaN(axis.x) && axis.sqrMagnitude > 0.0001f)
                {
                    parallax = Quaternion.AngleAxis(clamped, axis);
                }
            }

            smoothedParallax = Quaternion.Slerp(smoothedParallax, parallax, 1f - Mathf.Exp(-rotationSmooth * dt));

            // Oriente face caméra + applique la parallaxe (effet "vivant", premium).
            var faceCam = Quaternion.LookRotation(target.position - camT.position, camT.up);
            target.rotation = faceCam * smoothedParallax;
        }
    }
}
