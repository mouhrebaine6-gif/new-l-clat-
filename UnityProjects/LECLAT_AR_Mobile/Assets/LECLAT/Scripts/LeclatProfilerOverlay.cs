using System.Text;
using Unity.Profiling;
using UnityEngine;
using UnityEngine.Profiling;

namespace Leclat.AR
{
    /// <summary>
    /// Lightweight on-screen profiling overlay (fps, ms, draw calls, triangles, memory)
    /// for measuring AR performance on device. Uses ProfilerRecorder so the render stats
    /// work in development builds and the Editor. Off by default; toggle from the bridge
    /// or the Inspector.
    /// </summary>
    public sealed class LeclatProfilerOverlay : MonoBehaviour
    {
        [SerializeField] private bool show;

        private ProfilerRecorder drawCalls;
        private ProfilerRecorder triangles;
        private float smoothedDelta;
        private GUIStyle style;
        private readonly System.Text.StringBuilder sb = new System.Text.StringBuilder(128);

        public void Toggle() => show = !show;
        public void SetVisible(bool visible) => show = visible;

        private void OnEnable()
        {
            drawCalls = ProfilerRecorder.StartNew(ProfilerCategory.Render, "Draw Calls Count");
            triangles = ProfilerRecorder.StartNew(ProfilerCategory.Render, "Triangles Count");
        }

        private void OnDisable()
        {
            drawCalls.Dispose();
            triangles.Dispose();
        }

        private void Update()
        {
            smoothedDelta += (Time.unscaledDeltaTime - smoothedDelta) * 0.1f;
        }

        private void OnGUI()
        {
            if (!show)
                return;

            style ??= new GUIStyle(GUI.skin.box)
            {
                fontSize = 20,
                alignment = TextAnchor.UpperLeft,
                normal = { textColor = Color.white }
            };

            var fps = smoothedDelta > 0f ? 1f / smoothedDelta : 0f;
            sb.Clear();
            sb.AppendLine($" {fps:0} fps   {smoothedDelta * 1000f:0.0} ms");
            if (drawCalls.Valid) sb.AppendLine($" Draw calls: {drawCalls.LastValue}");
            if (triangles.Valid) sb.AppendLine($" Triangles: {triangles.LastValue:n0}");
            sb.AppendLine($" Mem: {Profiler.GetTotalAllocatedMemoryLong() / (1024 * 1024)} MB");

            GUI.Label(new Rect(12f, 12f, 360f, 140f), sb.ToString(), style);
        }
    }
}
