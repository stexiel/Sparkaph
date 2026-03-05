using UnityEngine;
using System.Collections.Generic;

namespace Sparkaph.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private AudioSource ambientSource;

        [Header("Music")]
        [SerializeField] private AudioClip menuMusic;
        [SerializeField] private AudioClip gameMusic;
        [SerializeField] private AudioClip victoryMusic;
        [SerializeField] private AudioClip defeatMusic;

        [Header("Sound Effects")]
        [SerializeField] private AudioClip buttonClick;
        [SerializeField] private AudioClip matchStart;
        [SerializeField] private AudioClip playerDeath;
        [SerializeField] private AudioClip playerKill;
        [SerializeField] private AudioClip territoryCapture;
        [SerializeField] private AudioClip trailSound;
        [SerializeField] private AudioClip collision;
        [SerializeField] private AudioClip countdown;

        [Header("Settings")]
        [SerializeField] private float masterVolume = 1f;
        [SerializeField] private float musicVolume = 0.7f;
        [SerializeField] private float sfxVolume = 1f;
        [SerializeField] private bool musicEnabled = true;
        [SerializeField] private bool sfxEnabled = true;

        private Dictionary<string, AudioClip> soundEffects;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeAudioSources();
            LoadSettings();
            InitializeSoundEffects();
        }

        private void InitializeAudioSources()
        {
            if (musicSource == null)
            {
                GameObject musicObj = new GameObject("MusicSource");
                musicObj.transform.SetParent(transform);
                musicSource = musicObj.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.playOnAwake = false;
            }

            if (sfxSource == null)
            {
                GameObject sfxObj = new GameObject("SFXSource");
                sfxObj.transform.SetParent(transform);
                sfxSource = sfxObj.AddComponent<AudioSource>();
                sfxSource.playOnAwake = false;
            }

            if (ambientSource == null)
            {
                GameObject ambientObj = new GameObject("AmbientSource");
                ambientObj.transform.SetParent(transform);
                ambientSource = ambientObj.AddComponent<AudioSource>();
                ambientSource.loop = true;
                ambientSource.playOnAwake = false;
            }
        }

        private void InitializeSoundEffects()
        {
            soundEffects = new Dictionary<string, AudioClip>
            {
                { "button_click", buttonClick },
                { "match_start", matchStart },
                { "player_death", playerDeath },
                { "player_kill", playerKill },
                { "territory_capture", territoryCapture },
                { "trail", trailSound },
                { "collision", collision },
                { "countdown", countdown }
            };
        }

        private void LoadSettings()
        {
            masterVolume = PlayerPrefs.GetFloat("MasterVolume", 1f);
            musicVolume = PlayerPrefs.GetFloat("MusicVolume", 0.7f);
            sfxVolume = PlayerPrefs.GetFloat("SFXVolume", 1f);
            musicEnabled = PlayerPrefs.GetInt("MusicEnabled", 1) == 1;
            sfxEnabled = PlayerPrefs.GetInt("SFXEnabled", 1) == 1;

            ApplyVolumeSettings();
        }

        private void ApplyVolumeSettings()
        {
            if (musicSource != null)
                musicSource.volume = masterVolume * musicVolume;

            if (sfxSource != null)
                sfxSource.volume = masterVolume * sfxVolume;

            if (ambientSource != null)
                ambientSource.volume = masterVolume * 0.5f;
        }

        // Music control

        public void PlayMenuMusic()
        {
            PlayMusic(menuMusic);
        }

        public void PlayGameMusic()
        {
            PlayMusic(gameMusic);
        }

        public void PlayVictoryMusic()
        {
            PlayMusic(victoryMusic);
        }

        public void PlayDefeatMusic()
        {
            PlayMusic(defeatMusic);
        }

        private void PlayMusic(AudioClip clip)
        {
            if (!musicEnabled || clip == null || musicSource == null) return;

            if (musicSource.clip == clip && musicSource.isPlaying) return;

            musicSource.clip = clip;
            musicSource.Play();
        }

        public void StopMusic()
        {
            if (musicSource != null)
                musicSource.Stop();
        }

        public void PauseMusic()
        {
            if (musicSource != null)
                musicSource.Pause();
        }

        public void ResumeMusic()
        {
            if (musicSource != null && musicEnabled)
                musicSource.UnPause();
        }

        // Sound effects

        public void PlayButtonClick()
        {
            PlaySFX("button_click");
        }

        public void PlayMatchStart()
        {
            PlaySFX("match_start");
        }

        public void PlayPlayerDeath()
        {
            PlaySFX("player_death");
        }

        public void PlayPlayerKill()
        {
            PlaySFX("player_kill");
        }

        public void PlayTerritoryCapture()
        {
            PlaySFX("territory_capture");
        }

        public void PlayTrailSound()
        {
            PlaySFX("trail", 0.3f);
        }

        public void PlayCollision()
        {
            PlaySFX("collision");
        }

        public void PlayCountdown()
        {
            PlaySFX("countdown");
        }

        public void PlaySFX(string sfxName, float volumeScale = 1f)
        {
            if (!sfxEnabled || sfxSource == null) return;

            if (soundEffects.TryGetValue(sfxName, out AudioClip clip) && clip != null)
            {
                sfxSource.PlayOneShot(clip, volumeScale);
            }
            else
            {
                Debug.LogWarning($"[AudioManager] Sound effect '{sfxName}' not found");
            }
        }

        public void PlaySFX(AudioClip clip, float volumeScale = 1f)
        {
            if (!sfxEnabled || sfxSource == null || clip == null) return;

            sfxSource.PlayOneShot(clip, volumeScale);
        }

        // Volume control

        public void SetMasterVolume(float volume)
        {
            masterVolume = Mathf.Clamp01(volume);
            PlayerPrefs.SetFloat("MasterVolume", masterVolume);
            ApplyVolumeSettings();
        }

        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            PlayerPrefs.SetFloat("MusicVolume", musicVolume);
            ApplyVolumeSettings();
        }

        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            PlayerPrefs.SetFloat("SFXVolume", sfxVolume);
            ApplyVolumeSettings();
        }

        public void SetMusicEnabled(bool enabled)
        {
            musicEnabled = enabled;
            PlayerPrefs.SetInt("MusicEnabled", enabled ? 1 : 0);

            if (!enabled)
                StopMusic();
            else if (musicSource.clip != null)
                musicSource.Play();
        }

        public void SetSFXEnabled(bool enabled)
        {
            sfxEnabled = enabled;
            PlayerPrefs.SetInt("SFXEnabled", enabled ? 1 : 0);
        }

        // Getters

        public float GetMasterVolume() => masterVolume;
        public float GetMusicVolume() => musicVolume;
        public float GetSFXVolume() => sfxVolume;
        public bool IsMusicEnabled() => musicEnabled;
        public bool IsSFXEnabled() => sfxEnabled;
    }
}
