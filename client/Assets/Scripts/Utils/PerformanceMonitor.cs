using UnityEngine;
using UnityEngine.Profiling;

namespace Sparkaph.Utils
{
    public class PerformanceMonitor : MonoBehaviour
    {
        public static PerformanceMonitor Instance { get; private set; }

        [Header("Performance Metrics")]
        public float CurrentFPS { get; private set; }
        public long TotalMemoryMB { get; private set; }
        public long UsedMemoryMB { get; private set; }
        public int DrawCalls { get; private set; }
        public int Triangles { get; private set; }
        public int Vertices { get; private set; }

        [Header("Settings")]
        [SerializeField] private bool enableMonitoring = true;
        [SerializeField] private float updateInterval = 1f;

        private float timer = 0f;
        private int frameCount = 0;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Update()
        {
            if (!enableMonitoring) return;

            timer += Time.unscaledDeltaTime;
            frameCount++;

            if (timer >= updateInterval)
            {
                UpdateMetrics();
                timer = 0f;
                frameCount = 0;
            }
        }

        private void UpdateMetrics()
        {
            // FPS
            CurrentFPS = frameCount / updateInterval;

            // Memory
            TotalMemoryMB = Profiler.GetTotalReservedMemoryLong() / (1024 * 1024);
            UsedMemoryMB = Profiler.GetTotalAllocatedMemoryLong() / (1024 * 1024);

            // Rendering stats (only in editor or development builds)
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            UnityEngine.Rendering.FrameTimingManager.CaptureFrameTimings();
#endif
        }

        public PerformanceReport GetReport()
        {
            return new PerformanceReport
            {
                FPS = CurrentFPS,
                TotalMemoryMB = TotalMemoryMB,
                UsedMemoryMB = UsedMemoryMB,
                DrawCalls = DrawCalls,
                Triangles = Triangles,
                Vertices = Vertices
            };
        }

        public bool IsPerformanceGood()
        {
            return CurrentFPS >= 30 && UsedMemoryMB < 500;
        }

        public void EnableMonitoring(bool enable)
        {
            enableMonitoring = enable;
        }
    }

    [System.Serializable]
    public struct PerformanceReport
    {
        public float FPS;
        public long TotalMemoryMB;
        public long UsedMemoryMB;
        public int DrawCalls;
        public int Triangles;
        public int Vertices;

        public override string ToString()
        {
            return $"FPS: {FPS:F1} | Memory: {UsedMemoryMB}/{TotalMemoryMB} MB | DrawCalls: {DrawCalls}";
        }
    }
}
