using System;
using System.Collections.Generic;

namespace Sparkaph.Network
{
    // Message Types
    public static class MessageType
    {
        public const byte Connect = 1;
        public const byte Input = 2;
        public const byte Disconnect = 3;
        public const byte Ping = 4;
        public const byte ChatMessage = 5;

        public const byte Welcome = 10;
        public const byte GameState = 11;
        public const byte PlayerJoined = 12;
        public const byte PlayerLeft = 13;
        public const byte MatchStart = 14;
        public const byte MatchEnd = 15;
        public const byte Pong = 16;
        public const byte Error = 17;
        public const byte TerritoryUpdate = 18;
    }

    [System.Serializable]
    public class MessageEnvelope
    {
        public byte Type;
        public long Timestamp;
        public byte[] Data;
    }

    // Client -> Server Messages

    [System.Serializable]
    public class ConnectMessage
    {
        public string PlayerId;
        public string Username;

        public string DeviceId;
        public string Platform;
        public string GameMode;
        public string QueueType;
    }

    [System.Serializable]
    public class InputMessage
    {
        public uint Sequence;
        public Vector2Data Direction;
        public long Timestamp;
    }

    [System.Serializable]
    public class PingMessage
    {
        public long ClientTime;
    }

    // Server -> Client Messages

    [System.Serializable]
    public class WelcomeMessage
    {
        public string PlayerId;
        public string SessionToken;
        public long ServerTime;
        public int TickRate;
    }

    [System.Serializable]
    public class GameStateMessage
    {
        public ulong Tick;
        public List<PlayerState> Players;
        public long Timestamp;
    }

    [System.Serializable]
    public class PlayerState
    {
        public string Id;
        public Vector2Data Position;
        public Vector2Data Direction;
        public List<Vector2Data> Trail;
        public float Territory;
        public bool IsAlive;
        public int Kills;
        public string TeamId;
    }

    [System.Serializable]
    public class PlayerJoinedMessage
    {
        public string PlayerId;
        public string Username;
        public string TeamId;
    }

    [System.Serializable]
    public class PlayerLeftMessage
    {
        public string PlayerId;
        public string Reason;
    }

    [System.Serializable]
    public class MatchStartMessage
    {
        public string MatchId;
        public string Mode;
        public int MapSize;
        public List<PlayerInfo> Players;
        public long StartTime;
        public int Duration;
    }

    [System.Serializable]
    public class PlayerInfo
    {
        public string Id;
        public string Username;
        public int Rating;
        public string TeamId;
        public Vector2Data SpawnPos;
    }

    [System.Serializable]
    public class MatchEndMessage
    {
        public string MatchId;
        public string Winner;
        public List<MatchResult> Results;
        public int Duration;
    }

    [System.Serializable]
    public class MatchResult
    {
        public string PlayerId;
        public int Rank;
        public float TerritoryPercent;
        public int Kills;
        public int TimeAlive;
        public int RatingChange;
    }

    [System.Serializable]
    public class PongMessage
    {
        public long ClientTime;
        public long ServerTime;
    }

    [System.Serializable]
    public class ErrorMessage
    {
        public int Code;
        public string Message;
    }

    // Common Types

    [System.Serializable]
    public class Vector2Data
    {
        public float X;
        public float Y;

        public UnityEngine.Vector2 ToVector2()
        {
            return new UnityEngine.Vector2(X, Y);
        }

        public static Vector2Data FromVector2(UnityEngine.Vector2 v)
        {
            return new Vector2Data { X = v.x, Y = v.y };
        }
    }
}
