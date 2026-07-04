// LeclatPoseSmoother.cs
// Lissage de pose AR pour absorber le jitter quand le porteur du tshirt bouge.
// Utilise un Exponential Moving Average (EMA) + un filtre médian court pour
// les outliers (perte momentanée de tracking).
//
//   - Smoothing factor (alpha) : 0 = pas de lissage, 1 = aucun lissage.
//     0.3 = suit la pose réelle avec 70% de mémoire, bon pour la marche.
//     0.6 = suit plus vite, recommandé pour un porteur immobile.
//   - Median filter (window) : élimine les spikes de 1-2 frames.

using UnityEngine;

namespace Leclat.AR
{
    [System.Serializable]
    public struct SmoothedPose
    {
        public Vector3 Position;
        public Quaternion Rotation;
        public Vector3 Scale;
    }

    public sealed class LeclatPoseSmoother
    {
        // Paramètres réglables depuis l'Inspector
        public float PositionAlpha = 0.35f;   // 0..1 — lissage position
        public float RotationAlpha = 0.30f;   // 0..1 — lissage rotation
        public float ScaleAlpha = 0.50f;      // 0..1 — lissage scale
        public int MedianWindow = 5;          // fenêtre du filtre médian
        // Lissage ADAPTATIF (type One-Euro) : au repos on lisse fort (ailes
        // fermement accrochées, zéro micro-jitter) ; en mouvement rapide on suit
        // vif (aucune traîne, l'aile colle au marqueur). Ces seuils = la bascule.
        public float AdaptivePositionRange = 0.08f; // m  — écart au-delà duquel on suit à fond
        public float AdaptiveRotationRange = 12f;   // deg — idem pour la rotation

        // État interne
        private bool initialized;
        private SmoothedPose current;
        private Vector3[] posBuffer;
        private Quaternion[] rotBuffer;
        // Buffers de tri réutilisés (zéro alloc par frame sur le chemin chaud AR).
        private float[] mx, my, mz;
        private int bufferIdx;
        private int bufferCount;

        public SmoothedPose Current => current;

        public void Reset()
        {
            initialized = false;
            bufferIdx = 0;
            bufferCount = 0;
            if (posBuffer == null || posBuffer.Length != MedianWindow)
            {
                posBuffer = new Vector3[MedianWindow];
                rotBuffer = new Quaternion[MedianWindow];
                mx = new float[MedianWindow];
                my = new float[MedianWindow];
                mz = new float[MedianWindow];
            }
        }

        public SmoothedPose Update(SmoothedPose raw)
        {
            if (posBuffer == null || posBuffer.Length != MedianWindow) Reset();

            // Étape 1 : filtre médian (enlève les outliers)
            posBuffer[bufferIdx] = raw.Position;
            rotBuffer[bufferIdx] = raw.Rotation;
            bufferIdx = (bufferIdx + 1) % MedianWindow;
            if (bufferCount < MedianWindow) bufferCount++;

            Vector3 medianPos = MedianPos(bufferCount);
            Quaternion medianRot = Median(rotBuffer, bufferCount);

            // Étape 2 : EMA (Exponential Moving Average) sur la médiane
            if (!initialized)
            {
                current = new SmoothedPose
                {
                    Position = medianPos,
                    Rotation = medianRot,
                    Scale = raw.Scale,
                };
                initialized = true;
                return current;
            }

            // Alpha adaptatif : proche du marqueur → lissage ferme (PositionAlpha) ;
            // écart grand (mouvement) → alpha vers 1 → l'aile rattrape sans traîner.
            var posSpeed = Vector3.Distance(current.Position, medianPos);
            var rotSpeed = Quaternion.Angle(current.Rotation, medianRot);
            var posA = Mathf.Lerp(PositionAlpha, 1f, Mathf.Clamp01(posSpeed / Mathf.Max(0.0001f, AdaptivePositionRange)));
            var rotA = Mathf.Lerp(RotationAlpha, 1f, Mathf.Clamp01(rotSpeed / Mathf.Max(0.0001f, AdaptiveRotationRange)));
            current.Position = Vector3.Lerp(current.Position, medianPos, posA);
            current.Rotation = Quaternion.Slerp(current.Rotation, medianRot, rotA);
            current.Scale = Vector3.Lerp(current.Scale, raw.Scale, ScaleAlpha);

            return current;
        }

        private Vector3 MedianPos(int count)
        {
            // Médiane par axe, en réutilisant les buffers mx/my/mz (0 alloc/frame).
            for (int i = 0; i < count; i++) { mx[i] = posBuffer[i].x; my[i] = posBuffer[i].y; mz[i] = posBuffer[i].z; }
            System.Array.Sort(mx, 0, count);
            System.Array.Sort(my, 0, count);
            System.Array.Sort(mz, 0, count);
            return new Vector3(mx[count / 2], my[count / 2], mz[count / 2]);
        }

        private static Quaternion Median(Quaternion[] buffer, int count)
        {
            // Vraie médiane géométrique (approchée) : le quaternion de la fenêtre
            // dont la somme des écarts angulaires aux autres est minimale. Rejette
            // les spikes de rotation — l'ancien code renvoyait juste la dernière
            // pose, donc n'appliquait AUCUN filtre à la rotation. Fenêtre ≤ 5 →
            // coût négligeable, zéro allocation.
            if (count <= 0)
            {
                return Quaternion.identity;
            }
            var best = 0;
            var bestCost = float.MaxValue;
            for (var i = 0; i < count; i++)
            {
                var cost = 0f;
                for (var k = 0; k < count; k++)
                {
                    if (k != i)
                    {
                        cost += Quaternion.Angle(buffer[i], buffer[k]);
                    }
                }
                if (cost < bestCost)
                {
                    bestCost = cost;
                    best = i;
                }
            }
            return buffer[best];
        }
    }
}
