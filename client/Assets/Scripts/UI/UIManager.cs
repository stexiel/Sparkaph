using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Sparkaph.Network;

namespace Sparkaph.Game
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Panels")]
        [SerializeField] private GameObject mainMenuPanel;
        [SerializeField] private GameObject matchmakingPanel;
        [SerializeField] private GameObject gameHUDPanel;
        [SerializeField] private GameObject resultsPanel;

        [Header("Main Menu")]
        [SerializeField] private TMP_InputField usernameInput;
        [SerializeField] private Button soloButton;
        [SerializeField] private Button duoButton;
        [SerializeField] private Button squadButton;
        [SerializeField] private Button settingsButton;

        [Header("Matchmaking")]
        [SerializeField] private TextMeshProUGUI queueStatusText;
        [SerializeField] private TextMeshProUGUI playersInQueueText;
        [SerializeField] private Button cancelButton;

        [Header("Game HUD")]
        [SerializeField] private TextMeshProUGUI territoryText;
        [SerializeField] private TextMeshProUGUI killsText;
        [SerializeField] private TextMeshProUGUI timeText;
        [SerializeField] private TextMeshProUGUI pingText;
        [SerializeField] private Slider territorySlider;
        [SerializeField] private GameObject leaderboardPanel;
        [SerializeField] private Transform leaderboardContent;

        [Header("Results")]
        [SerializeField] private TextMeshProUGUI resultTitleText;
        [SerializeField] private TextMeshProUGUI rankText;
        [SerializeField] private TextMeshProUGUI territoryResultText;
        [SerializeField] private TextMeshProUGUI killsResultText;
        [SerializeField] private TextMeshProUGUI ratingChangeText;
        [SerializeField] private Button playAgainButton;
        [SerializeField] private Button mainMenuButton;

        private string selectedMode = "solo";
        private float matchTime;
        private bool isMatchActive;

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

        private void Start()
        {
            SetupButtons();
            ShowMainMenu();

            // Subscribe to network events
            if (NetworkManager.Instance != null)
            {
                NetworkManager.Instance.OnConnected += OnConnected;
                NetworkManager.Instance.OnDisconnected += OnDisconnected;
                NetworkManager.Instance.OnMatchStart += OnMatchStart;
                NetworkManager.Instance.OnMatchEnd += OnMatchEnd;
                NetworkManager.Instance.OnPingReceived += OnPingReceived;
            }

            // Load saved username
            if (usernameInput != null)
            {
                string savedUsername = PlayerPrefs.GetString("Username", "");
                if (!string.IsNullOrEmpty(savedUsername))
                {
                    usernameInput.text = savedUsername;
                }
            }
        }

        private void Update()
        {
            if (isMatchActive)
            {
                UpdateGameHUD();
            }
        }

        private void SetupButtons()
        {
            if (soloButton != null)
                soloButton.onClick.AddListener(() => OnModeSelected("solo"));

            if (duoButton != null)
                duoButton.onClick.AddListener(() => OnModeSelected("duo"));

            if (squadButton != null)
                squadButton.onClick.AddListener(() => OnModeSelected("squad"));

            if (cancelButton != null)
                cancelButton.onClick.AddListener(OnCancelMatchmaking);

            if (playAgainButton != null)
                playAgainButton.onClick.AddListener(OnPlayAgain);

            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(ShowMainMenu);

            if (settingsButton != null)
                settingsButton.onClick.AddListener(ShowSettings);
        }

        private void OnModeSelected(string mode)
        {
            selectedMode = mode;

            // Save username
            if (usernameInput != null && !string.IsNullOrEmpty(usernameInput.text))
            {
                PlayerPrefs.SetString("Username", usernameInput.text);
            }

            // Connect to server if not connected
            if (NetworkManager.Instance != null && !NetworkManager.Instance.IsConnected)
            {
                NetworkManager.Instance.Connect();
            }

            ShowMatchmaking();
        }

        private void OnCancelMatchmaking()
        {
            if (NetworkManager.Instance != null)
            {
                NetworkManager.Instance.Disconnect();
            }

            ShowMainMenu();
        }

        private void OnPlayAgain()
        {
            ShowMatchmaking();

            if (NetworkManager.Instance != null && !NetworkManager.Instance.IsConnected)
            {
                NetworkManager.Instance.Connect();
            }
        }

        private void ShowSettings()
        {
            // TODO: Implement settings panel
            Debug.Log("[UI] Settings not implemented yet");
        }

        public void ShowMainMenu()
        {
            SetPanelActive(mainMenuPanel, true);
            SetPanelActive(matchmakingPanel, false);
            SetPanelActive(gameHUDPanel, false);
            SetPanelActive(resultsPanel, false);

            isMatchActive = false;
        }

        public void ShowMatchmaking()
        {
            SetPanelActive(mainMenuPanel, false);
            SetPanelActive(matchmakingPanel, true);
            SetPanelActive(gameHUDPanel, false);
            SetPanelActive(resultsPanel, false);

            if (queueStatusText != null)
            {
                queueStatusText.text = $"Searching for {selectedMode} match...";
            }
        }

        public void ShowGameHUD()
        {
            SetPanelActive(mainMenuPanel, false);
            SetPanelActive(matchmakingPanel, false);
            SetPanelActive(gameHUDPanel, true);
            SetPanelActive(resultsPanel, false);

            isMatchActive = true;
            matchTime = 0f;
        }

        public void ShowMatchResults(MatchEndMessage results)
        {
            SetPanelActive(mainMenuPanel, false);
            SetPanelActive(matchmakingPanel, false);
            SetPanelActive(gameHUDPanel, false);
            SetPanelActive(resultsPanel, true);

            isMatchActive = false;

            // Find local player result
            string localPlayerId = NetworkManager.Instance?.PlayerId;
            MatchResult localResult = null;

            foreach (var result in results.Results)
            {
                if (result.PlayerId == localPlayerId)
                {
                    localResult = result;
                    break;
                }
            }

            if (localResult != null)
            {
                // Update result UI
                if (resultTitleText != null)
                {
                    resultTitleText.text = localResult.Rank == 1 ? "VICTORY!" : "DEFEAT";
                    resultTitleText.color = localResult.Rank == 1 ? Color.green : Color.red;
                }

                if (rankText != null)
                    rankText.text = $"Rank: #{localResult.Rank}";

                if (territoryResultText != null)
                    territoryResultText.text = $"Territory: {localResult.TerritoryPercent:F1}%";

                if (killsResultText != null)
                    killsResultText.text = $"Kills: {localResult.Kills}";

                if (ratingChangeText != null)
                {
                    string sign = localResult.RatingChange >= 0 ? "+" : "";
                    ratingChangeText.text = $"Rating: {sign}{localResult.RatingChange}";
                    ratingChangeText.color = localResult.RatingChange >= 0 ? Color.green : Color.red;
                }
            }
        }

        private void UpdateGameHUD()
        {
            matchTime += Time.deltaTime;

            // Update time
            if (timeText != null)
            {
                int minutes = Mathf.FloorToInt(matchTime / 60f);
                int seconds = Mathf.FloorToInt(matchTime % 60f);
                timeText.text = $"{minutes:00}:{seconds:00}";
            }

            // Update territory and kills from local player
            var localPlayer = GameManager.Instance?.GetLocalPlayer();
            if (localPlayer != null)
            {
                // Territory percentage would come from server
                // For now, placeholder
                if (territoryText != null)
                    territoryText.text = "Territory: 0%";

                if (territorySlider != null)
                    territorySlider.value = 0f;

                if (killsText != null)
                    killsText.text = "Kills: 0";
            }
        }

        private void OnConnected()
        {
            Debug.Log("[UI] Connected to server");
            if (queueStatusText != null)
            {
                queueStatusText.text = "Connected! Searching for match...";
            }
        }

        private void OnDisconnected()
        {
            Debug.Log("[UI] Disconnected from server");
            if (matchmakingPanel != null && matchmakingPanel.activeSelf)
            {
                if (queueStatusText != null)
                {
                    queueStatusText.text = "Disconnected. Reconnecting...";
                }
            }
        }

        private void OnMatchStart(MatchStartMessage msg)
        {
            ShowGameHUD();
        }

        private void OnMatchEnd(MatchEndMessage msg)
        {
            ShowMatchResults(msg);
        }

        private void OnPingReceived(int ping)
        {
            if (pingText != null)
            {
                pingText.text = $"Ping: {ping}ms";
                pingText.color = ping < 50 ? Color.green : ping < 100 ? Color.yellow : Color.red;
            }
        }

        private void SetPanelActive(GameObject panel, bool active)
        {
            if (panel != null)
            {
                panel.SetActive(active);
            }
        }

        public void UpdateTerritoryDisplay(float percentage)
        {
            if (territoryText != null)
                territoryText.text = $"Territory: {percentage:F1}%";

            if (territorySlider != null)
                territorySlider.value = percentage / 100f;
        }

        public void UpdateKillsDisplay(int kills)
        {
            if (killsText != null)
                killsText.text = $"Kills: {kills}";
        }

        private void OnDestroy()
        {
            if (NetworkManager.Instance != null)
            {
                NetworkManager.Instance.OnConnected -= OnConnected;
                NetworkManager.Instance.OnDisconnected -= OnDisconnected;
                NetworkManager.Instance.OnMatchStart -= OnMatchStart;
                NetworkManager.Instance.OnMatchEnd -= OnMatchEnd;
                NetworkManager.Instance.OnPingReceived -= OnPingReceived;
            }
        }
    }
}
