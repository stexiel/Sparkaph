using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Sparkaph.Audio;

namespace Sparkaph.UI
{
    public class SettingsPanel : MonoBehaviour
    {
        [Header("Audio Settings")]
        [SerializeField] private Slider masterVolumeSlider;
        [SerializeField] private Slider musicVolumeSlider;
        [SerializeField] private Slider sfxVolumeSlider;
        [SerializeField] private Toggle musicToggle;
        [SerializeField] private Toggle sfxToggle;

        [Header("Graphics Settings")]
        [SerializeField] private TMP_Dropdown qualityDropdown;
        [SerializeField] private Toggle vsyncToggle;
        [SerializeField] private TMP_Dropdown fpsLimitDropdown;

        [Header("Gameplay Settings")]
        [SerializeField] private Slider sensitivitySlider;
        [SerializeField] private Toggle showFPSToggle;
        [SerializeField] private Toggle vibrationToggle;

        [Header("Network Settings")]
        [SerializeField] private TMP_InputField serverUrlInput;
        [SerializeField] private Toggle autoReconnectToggle;

        [Header("Buttons")]
        [SerializeField] private Button applyButton;
        [SerializeField] private Button resetButton;
        [SerializeField] private Button closeButton;

        private void Start()
        {
            LoadSettings();
            SetupListeners();
        }

        private void LoadSettings()
        {
            // Audio
            if (AudioManager.Instance != null)
            {
                if (masterVolumeSlider != null)
                    masterVolumeSlider.value = AudioManager.Instance.GetMasterVolume();

                if (musicVolumeSlider != null)
                    musicVolumeSlider.value = AudioManager.Instance.GetMusicVolume();

                if (sfxVolumeSlider != null)
                    sfxVolumeSlider.value = AudioManager.Instance.GetSFXVolume();

                if (musicToggle != null)
                    musicToggle.isOn = AudioManager.Instance.IsMusicEnabled();

                if (sfxToggle != null)
                    sfxToggle.isOn = AudioManager.Instance.IsSFXEnabled();
            }

            // Graphics
            if (qualityDropdown != null)
                qualityDropdown.value = QualitySettings.GetQualityLevel();

            if (vsyncToggle != null)
                vsyncToggle.isOn = QualitySettings.vSyncCount > 0;

            if (fpsLimitDropdown != null)
            {
                int targetFPS = Application.targetFrameRate;
                fpsLimitDropdown.value = targetFPS == 30 ? 0 : targetFPS == 60 ? 1 : 2;
            }

            // Gameplay
            if (sensitivitySlider != null)
                sensitivitySlider.value = PlayerPrefs.GetFloat("Sensitivity", 1f);

            if (showFPSToggle != null)
                showFPSToggle.isOn = PlayerPrefs.GetInt("ShowFPS", 0) == 1;

            if (vibrationToggle != null)
                vibrationToggle.isOn = PlayerPrefs.GetInt("Vibration", 1) == 1;

            // Network
            if (serverUrlInput != null)
                serverUrlInput.text = PlayerPrefs.GetString("ServerURL", "ws://localhost:8080/ws");

            if (autoReconnectToggle != null)
                autoReconnectToggle.isOn = PlayerPrefs.GetInt("AutoReconnect", 1) == 1;
        }

        private void SetupListeners()
        {
            // Audio
            if (masterVolumeSlider != null)
                masterVolumeSlider.onValueChanged.AddListener(OnMasterVolumeChanged);

            if (musicVolumeSlider != null)
                musicVolumeSlider.onValueChanged.AddListener(OnMusicVolumeChanged);

            if (sfxVolumeSlider != null)
                sfxVolumeSlider.onValueChanged.AddListener(OnSFXVolumeChanged);

            if (musicToggle != null)
                musicToggle.onValueChanged.AddListener(OnMusicToggleChanged);

            if (sfxToggle != null)
                sfxToggle.onValueChanged.AddListener(OnSFXToggleChanged);

            // Graphics
            if (qualityDropdown != null)
                qualityDropdown.onValueChanged.AddListener(OnQualityChanged);

            if (vsyncToggle != null)
                vsyncToggle.onValueChanged.AddListener(OnVSyncChanged);

            if (fpsLimitDropdown != null)
                fpsLimitDropdown.onValueChanged.AddListener(OnFPSLimitChanged);

            // Gameplay
            if (sensitivitySlider != null)
                sensitivitySlider.onValueChanged.AddListener(OnSensitivityChanged);

            if (showFPSToggle != null)
                showFPSToggle.onValueChanged.AddListener(OnShowFPSChanged);

            if (vibrationToggle != null)
                vibrationToggle.onValueChanged.AddListener(OnVibrationChanged);

            // Buttons
            if (applyButton != null)
                applyButton.onClick.AddListener(OnApplyClicked);

            if (resetButton != null)
                resetButton.onClick.AddListener(OnResetClicked);

            if (closeButton != null)
                closeButton.onClick.AddListener(OnCloseClicked);
        }

        // Audio callbacks

        private void OnMasterVolumeChanged(float value)
        {
            AudioManager.Instance?.SetMasterVolume(value);
        }

        private void OnMusicVolumeChanged(float value)
        {
            AudioManager.Instance?.SetMusicVolume(value);
        }

        private void OnSFXVolumeChanged(float value)
        {
            AudioManager.Instance?.SetSFXVolume(value);
        }

        private void OnMusicToggleChanged(bool value)
        {
            AudioManager.Instance?.SetMusicEnabled(value);
        }

        private void OnSFXToggleChanged(bool value)
        {
            AudioManager.Instance?.SetSFXEnabled(value);
        }

        // Graphics callbacks

        private void OnQualityChanged(int value)
        {
            QualitySettings.SetQualityLevel(value);
            PlayerPrefs.SetInt("QualityLevel", value);
        }

        private void OnVSyncChanged(bool value)
        {
            QualitySettings.vSyncCount = value ? 1 : 0;
            PlayerPrefs.SetInt("VSync", value ? 1 : 0);
        }

        private void OnFPSLimitChanged(int value)
        {
            int targetFPS = value == 0 ? 30 : value == 1 ? 60 : -1;
            Application.targetFrameRate = targetFPS;
            PlayerPrefs.SetInt("TargetFPS", targetFPS);
        }

        // Gameplay callbacks

        private void OnSensitivityChanged(float value)
        {
            PlayerPrefs.SetFloat("Sensitivity", value);
        }

        private void OnShowFPSChanged(bool value)
        {
            PlayerPrefs.SetInt("ShowFPS", value ? 1 : 0);
        }

        private void OnVibrationChanged(bool value)
        {
            PlayerPrefs.SetInt("Vibration", value ? 1 : 0);
        }

        // Button callbacks

        private void OnApplyClicked()
        {
            PlayerPrefs.Save();
            AudioManager.Instance?.PlayButtonClick();
            Debug.Log("[Settings] Settings applied");
        }

        private void OnResetClicked()
        {
            PlayerPrefs.DeleteAll();
            LoadSettings();
            AudioManager.Instance?.PlayButtonClick();
            Debug.Log("[Settings] Settings reset to defaults");
        }

        private void OnCloseClicked()
        {
            AudioManager.Instance?.PlayButtonClick();
            gameObject.SetActive(false);
        }
    }
}
