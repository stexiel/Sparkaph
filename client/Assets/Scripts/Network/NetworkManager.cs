using System;
using System.Collections.Generic;
using UnityEngine;
using NativeWebSocket;
using MessagePack;

namespace Sparkaph.Network
{
    public class NetworkManager : MonoBehaviour
    {
        public static NetworkManager Instance { get; private set; }

        [Header("Server Configuration")]
        [SerializeField] private string serverUrl = "ws://localhost:8080/ws";
        [SerializeField] private bool autoConnect = true;
        [SerializeField] private float reconnectDelay = 3f;

        private WebSocket websocket;
        private bool isConnecting = false;
        private bool shouldReconnect = true;
        private float reconnectTimer = 0f;

        public bool IsConnected => websocket?.State == WebSocketState.Open;
        public string PlayerId { get; private set; }
        public string SessionToken { get; private set; }

        // Events
        public event Action OnConnected;
        public event Action OnDisconnected;
        public event Action<GameStateMessage> OnGameStateReceived;
        public event Action<PlayerJoinedMessage> OnPlayerJoined;
        public event Action<PlayerLeftMessage> OnPlayerLeft;
        public event Action<MatchStartMessage> OnMatchStart;
        public event Action<MatchEndMessage> OnMatchEnd;
        public event Action<int> OnPingReceived;

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
            if (autoConnect)
            {
                Connect();
            }
        }

        private void Update()
        {
            if (websocket != null)
            {
#if !UNITY_WEBGL || UNITY_EDITOR
                websocket.DispatchMessageQueue();
#endif
            }

            // Auto-reconnect logic
            if (!IsConnected && shouldReconnect && !isConnecting)
            {
                reconnectTimer += Time.deltaTime;
                if (reconnectTimer >= reconnectDelay)
                {
                    reconnectTimer = 0f;
                    Connect();
                }
            }
        }

        public async void Connect()
        {
            if (isConnecting || IsConnected) return;

            isConnecting = true;
            Debug.Log($"[Network] Connecting to {serverUrl}...");

            websocket = new WebSocket(serverUrl);

            websocket.OnOpen += () =>
            {
                Debug.Log("[Network] Connected!");
                isConnecting = false;
                reconnectTimer = 0f;
                SendConnectMessage();
            };

            websocket.OnError += (e) =>
            {
                Debug.LogError($"[Network] Error: {e}");
                isConnecting = false;
            };

            websocket.OnClose += (e) =>
            {
                Debug.Log($"[Network] Disconnected: {e}");
                isConnecting = false;
                OnDisconnected?.Invoke();
            };

            websocket.OnMessage += (bytes) =>
            {
                HandleMessage(bytes);
            };

            await websocket.Connect();
        }

        public async void Disconnect()
        {
            shouldReconnect = false;
            if (websocket != null && IsConnected)
            {
                await websocket.Close();
            }
        }

        private void SendConnectMessage()
        {
            // Generate or load player ID
            if (string.IsNullOrEmpty(PlayerId))
            {
                PlayerId = PlayerPrefs.GetString("PlayerId", Guid.NewGuid().ToString());
                PlayerPrefs.SetString("PlayerId", PlayerId);
            }

            string username = PlayerPrefs.GetString("Username", $"Player{UnityEngine.Random.Range(1000, 9999)}");

            var connectMsg = new ConnectMessage
            {
                PlayerId = PlayerId,
                Username = username,
                DeviceId = SystemInfo.deviceUniqueIdentifier,
                Platform = Application.platform.ToString(),
                GameMode = "solo",
                QueueType = "arena"
            };

            SendMessage(MessageType.Connect, connectMsg);
        }

        public void SendInputMessage(Vector2 direction)
        {
            var inputMsg = new InputMessage
            {
                Sequence = (uint)Time.frameCount,
                Direction = new Vector2Data { X = direction.x, Y = direction.y },
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            SendMessage(MessageType.Input, inputMsg);
        }

        public void SendPing()
        {
            var pingMsg = new PingMessage
            {
                ClientTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            SendMessage(MessageType.Ping, pingMsg);
        }

        private void SendMessage<T>(byte messageType, T data)
        {
            if (!IsConnected)
            {
                Debug.LogWarning("[Network] Cannot send message - not connected");
                return;
            }

            try
            {
                var dataBytes = MessagePackSerializer.Serialize(data);
                var envelope = new MessageEnvelope
                {
                    Type = messageType,
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    Data = dataBytes
                };

                var bytes = MessagePackSerializer.Serialize(envelope);
                websocket.Send(bytes);
            }
            catch (Exception e)
            {
                Debug.LogError($"[Network] Failed to send message: {e}");
            }
        }

        private void HandleMessage(byte[] bytes)
        {
            try
            {
                var envelope = MessagePackSerializer.Deserialize<MessageEnvelope>(bytes);

                switch (envelope.Type)
                {
                    case MessageType.Welcome:
                        HandleWelcome(envelope.Data);
                        break;
                    case MessageType.GameState:
                        HandleGameState(envelope.Data);
                        break;
                    case MessageType.PlayerJoined:
                        HandlePlayerJoined(envelope.Data);
                        break;
                    case MessageType.PlayerLeft:
                        HandlePlayerLeft(envelope.Data);
                        break;
                    case MessageType.MatchStart:
                        HandleMatchStart(envelope.Data);
                        break;
                    case MessageType.MatchEnd:
                        HandleMatchEnd(envelope.Data);
                        break;
                    case MessageType.Pong:
                        HandlePong(envelope.Data);
                        break;
                    case MessageType.Error:
                        HandleError(envelope.Data);
                        break;
                    default:
                        Debug.LogWarning($"[Network] Unknown message type: {envelope.Type}");
                        break;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[Network] Failed to handle message: {e}");
            }
        }

        private void HandleWelcome(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<WelcomeMessage>(data);
            PlayerId = msg.PlayerId;
            SessionToken = msg.SessionToken;
            Debug.Log($"[Network] Welcome! PlayerId: {PlayerId}");
            OnConnected?.Invoke();
        }

        private void HandleGameState(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<GameStateMessage>(data);
            OnGameStateReceived?.Invoke(msg);
        }

        private void HandlePlayerJoined(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<PlayerJoinedMessage>(data);
            Debug.Log($"[Network] Player joined: {msg.Username}");
            OnPlayerJoined?.Invoke(msg);
        }

        private void HandlePlayerLeft(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<PlayerLeftMessage>(data);
            Debug.Log($"[Network] Player left: {msg.PlayerId}");
            OnPlayerLeft?.Invoke(msg);
        }

        private void HandleMatchStart(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<MatchStartMessage>(data);
            Debug.Log($"[Network] Match started! Mode: {msg.Mode}");
            OnMatchStart?.Invoke(msg);
        }

        private void HandleMatchEnd(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<MatchEndMessage>(data);
            Debug.Log($"[Network] Match ended! Winner: {msg.Winner}");
            OnMatchEnd?.Invoke(msg);
        }

        private void HandlePong(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<PongMessage>(data);
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            int ping = (int)(now - msg.ClientTime);
            OnPingReceived?.Invoke(ping);
        }

        private void HandleError(byte[] data)
        {
            var msg = MessagePackSerializer.Deserialize<ErrorMessage>(data);
            Debug.LogError($"[Network] Server error: {msg.Message}");
        }

        private void OnApplicationQuit()
        {
            shouldReconnect = false;
            Disconnect();
        }

        private void OnDestroy()
        {
            shouldReconnect = false;
            if (websocket != null)
            {
                websocket.CancelConnection();
            }
        }
    }
}
