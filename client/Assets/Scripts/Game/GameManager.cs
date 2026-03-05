using System.Collections.Generic;
using UnityEngine;
using Sparkaph.Network;

namespace Sparkaph.Game
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Prefabs")]
        [SerializeField] private GameObject playerPrefab;
        [SerializeField] private GameObject territoryPrefab;

        [Header("Game Settings")]
        [SerializeField] private int mapSize = 1000;
        [SerializeField] private Color[] playerColors;

        [Header("Camera")]
        [SerializeField] private Camera mainCamera;
        [SerializeField] private float cameraZoom = 10f;
        [SerializeField] private float cameraFollowSpeed = 5f;

        private Dictionary<string, PlayerController> players = new Dictionary<string, PlayerController>();
        private PlayerController localPlayer;
        private TerritoryRenderer territoryRenderer;
        private string matchId;
        private bool isMatchActive;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        private void Start()
        {
            // Subscribe to network events
            if (NetworkManager.Instance != null)
            {
                NetworkManager.Instance.OnMatchStart += OnMatchStart;
                NetworkManager.Instance.OnMatchEnd += OnMatchEnd;
                NetworkManager.Instance.OnGameStateReceived += OnGameStateReceived;
                NetworkManager.Instance.OnPlayerJoined += OnPlayerJoined;
                NetworkManager.Instance.OnPlayerLeft += OnPlayerLeft;
            }

            // Initialize territory renderer
            territoryRenderer = GetComponent<TerritoryRenderer>();
            if (territoryRenderer == null)
            {
                territoryRenderer = gameObject.AddComponent<TerritoryRenderer>();
            }
            territoryRenderer.Initialize(mapSize);

            // Setup camera
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
            }
        }

        private void Update()
        {
            if (isMatchActive && localPlayer != null)
            {
                FollowLocalPlayer();
            }
        }

        private void OnMatchStart(MatchStartMessage msg)
        {
            Debug.Log($"[Game] Match started: {msg.MatchId}");
            matchId = msg.MatchId;
            isMatchActive = true;

            // Clear existing players
            ClearPlayers();

            // Spawn players
            for (int i = 0; i < msg.Players.Count; i++)
            {
                var playerInfo = msg.Players[i];
                bool isLocal = playerInfo.Id == NetworkManager.Instance.PlayerId;
                Color color = playerColors[i % playerColors.Length];

                SpawnPlayer(playerInfo.Id, playerInfo.Username, playerInfo.SpawnPos.ToVector2(), isLocal, color);
            }
        }

        private void OnMatchEnd(MatchEndMessage msg)
        {
            Debug.Log($"[Game] Match ended. Winner: {msg.Winner}");
            isMatchActive = false;

            // Show results screen
            UIManager.Instance?.ShowMatchResults(msg);
        }

        private void OnGameStateReceived(GameStateMessage msg)
        {
            if (!isMatchActive) return;

            // Update all players
            foreach (var playerState in msg.Players)
            {
                if (players.TryGetValue(playerState.Id, out PlayerController player))
                {
                    player.UpdateFromServer(playerState);

                    // Update territory
                    if (territoryRenderer != null)
                    {
                        territoryRenderer.UpdatePlayerTerritory(playerState.Id, playerState.Territory);
                    }

                    // Handle death
                    if (!playerState.IsAlive && player.gameObject.activeSelf)
                    {
                        player.OnDeath();
                    }
                }
            }
        }

        private void OnPlayerJoined(PlayerJoinedMessage msg)
        {
            Debug.Log($"[Game] Player joined: {msg.Username}");
            // Player will be spawned in OnMatchStart or next GameState
        }

        private void OnPlayerLeft(PlayerLeftMessage msg)
        {
            Debug.Log($"[Game] Player left: {msg.PlayerId}");
            RemovePlayer(msg.PlayerId);
        }

        private void SpawnPlayer(string id, string username, Vector2 position, bool isLocal, Color color)
        {
            if (players.ContainsKey(id))
            {
                Debug.LogWarning($"[Game] Player {id} already exists");
                return;
            }

            GameObject playerObj = Instantiate(playerPrefab, position, Quaternion.identity);
            playerObj.name = $"Player_{username}";

            PlayerController player = playerObj.GetComponent<PlayerController>();
            if (player == null)
            {
                player = playerObj.AddComponent<PlayerController>();
            }

            player.Initialize(id, isLocal, color);
            players[id] = player;

            if (isLocal)
            {
                localPlayer = player;
            }

            Debug.Log($"[Game] Spawned player: {username} at {position}");
        }

        private void RemovePlayer(string id)
        {
            if (players.TryGetValue(id, out PlayerController player))
            {
                Destroy(player.gameObject);
                players.Remove(id);

                if (player == localPlayer)
                {
                    localPlayer = null;
                }
            }
        }

        private void ClearPlayers()
        {
            foreach (var player in players.Values)
            {
                if (player != null)
                {
                    Destroy(player.gameObject);
                }
            }
            players.Clear();
            localPlayer = null;
        }

        private void FollowLocalPlayer()
        {
            if (localPlayer == null || mainCamera == null) return;

            Vector3 targetPosition = new Vector3(
                localPlayer.Position.x,
                localPlayer.Position.y,
                mainCamera.transform.position.z
            );

            mainCamera.transform.position = Vector3.Lerp(
                mainCamera.transform.position,
                targetPosition,
                Time.deltaTime * cameraFollowSpeed
            );

            mainCamera.orthographicSize = cameraZoom;
        }

        public PlayerController GetLocalPlayer()
        {
            return localPlayer;
        }

        public PlayerController GetPlayer(string id)
        {
            players.TryGetValue(id, out PlayerController player);
            return player;
        }

        public int GetPlayerCount()
        {
            return players.Count;
        }

        private void OnDestroy()
        {
            if (NetworkManager.Instance != null)
            {
                NetworkManager.Instance.OnMatchStart -= OnMatchStart;
                NetworkManager.Instance.OnMatchEnd -= OnMatchEnd;
                NetworkManager.Instance.OnGameStateReceived -= OnGameStateReceived;
                NetworkManager.Instance.OnPlayerJoined -= OnPlayerJoined;
                NetworkManager.Instance.OnPlayerLeft -= OnPlayerLeft;
            }
        }
    }
}
