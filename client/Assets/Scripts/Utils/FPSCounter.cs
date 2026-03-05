using UnityEngine;
using TMPro;

namespace Sparkaph.Utils
{
    public class FPSCounter : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI fpsText;
        [SerializeField] private float updateInterval = 0.5f;

        private float deltaTime = 0f;
        private float timer = 0f;
        private int frameCount = 0;
        private float fps = 0f;

        private void Start()
        {
            if (fpsText == null)
            {
                fpsText = GetComponent<TextMeshProUGUI>();
            }

            // Check if FPS display is enabled
            bool showFPS = PlayerPrefs.GetInt("ShowFPS", 0) == 1;
            gameObject.SetActive(showFPS);
        }

        private void Update()
        {
            deltaTime += Time.unscaledDeltaTime;
            timer += Time.unscaledDeltaTime;
            frameCount++;

            if (timer >= updateInterval)
            {
                fps = frameCount / timer;
                frameCount = 0;
                timer = 0f;

                UpdateDisplay();
            }
        }

        private void UpdateDisplay()
        {
            if (fpsText == null) return;

            fpsText.text = $"FPS: {Mathf.RoundToInt(fps)}";

            // Color code based on performance
            if (fps >= 55)
                fpsText.color = Color.green;
            else if (fps >= 30)
                fpsText.color = Color.yellow;
            else
                fpsText.color = Color.red;
        }

        public void Toggle(bool show)
        {
            gameObject.SetActive(show);
            PlayerPrefs.SetInt("ShowFPS", show ? 1 : 0);
        }
    }
}
