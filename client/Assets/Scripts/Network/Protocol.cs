using System;
using System.Collections.Generic;
using MessagePack;

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

    [MessagePackObject]
    public class MessageEnvelope
    {
        [Key(0)]
        public byte Type { get; set; }

        [Key(1)]
        public long Timestamp { get; set; }

        [Key(2)]
        public byte[] Data { get; set; }
    }

    // Client -> Server Messages

    [MessagePackObject]
    public class ConnectMessage
    {
        [Key(0)]
        public string PlayerId { get; set; }

        [Key(1)]
        public string Username { get; set; }

        [Key(2)]
        public string DeviceId { get; set; }

        [Key(3)]
        public string Platform { get; set; }

        [Key(4)]
        public string GameMode { get; set; }

        [Key(5)]
        public string QueueType { get; set; }
    }

    [MessagePackObject]
    public class InputMessage
    {
        [Key(0)]
        public uint Sequence { get; set; }

        [Key(1)]
        public Vector2Data Direction { get; set; }

        [Key(2)]
        public long Timestamp { get; set; }
    }

    [MessagePackObject]
    public class PingMessage
    {
        [Key(0)]
        public long ClientTime { get; set; }
    }

    // Server -> Client Messages

    [MessagePackObject]
    public class WelcomeMessage
    {
        [Key(0)]
        public string PlayerId { get; set; }

        [Key(1)]
        public string SessionToken { get; set; }

        [Key(2)]
        public long ServerTime { get; set; }

        [Key(3)]
        public int TickRate { get; set; }
    }

    [MessagePackObject]
    public class GameStateMessage
    {
        [Key(0)]
        public ulong Tick { get; set; }

        [Key(1)]
        public List<PlayerState> Players { get; set; }

        [Key(2)]
        public long Timestamp { get; set; }
    }

    [MessagePackObject]
    public class PlayerState
    {
        [Key(0)]
        public string Id { get; set; }

        [Key(1)]
        public Vector2Data Position { get; set; }

        [Key(2)]
        public Vector2Data Direction { get; set; }

        [Key(3)]
        public List<Vector2Data> Trail { get; set; }

        [Key(4)]
        public float Territory { get; set; }

        [Key(5)]
        public bool IsAlive { get; set; }

        [Key(6)]
        public int Kills { get; set; }

        [Key(7)]
        public string TeamId { get; set; }
    }

    [MessagePackObject]
    public class PlayerJoinedMessage
    {
        [Key(0)]
        public string PlayerId { get; set; }

        [Key(1)]
        public string Username { get; set; }

        [Key(2)]
        public string TeamId { get; set; }
    }

    [MessagePackObject]
    public class PlayerLeftMessage
    {
        [Key(0)]
        public string PlayerId { get; set; }

        [Key(1)]
        public string Reason { get; set; }
    }

    [MessagePackObject]
    public class MatchStartMessage
    {
        [Key(0)]
        public string MatchId { get; set; }

        [Key(1)]
        public string Mode { get; set; }

        [Key(2)]
        public int MapSize { get; set; }

        [Key(3)]
        public List<PlayerInfo> Players { get; set; }

        [Key(4)]
        public long StartTime { get; set; }

        [Key(5)]
        public int Duration { get; set; }
    }

    [MessagePackObject]
    public class PlayerInfo
    {
        [Key(0)]
        public string Id { get; set; }

        [Key(1)]
        public string Username { get; set; }

        [Key(2)]
        public int Rating { get; set; }

        [Key(3)]
        public string TeamId { get; set; }

        [Key(4)]
        public Vector2Data SpawnPos { get; set; }
    }

    [MessagePackObject]
    public class MatchEndMessage
    {
        [Key(0)]
        public string MatchId { get; set; }

        [Key(1)]
        public string Winner { get; set; }

        [Key(2)]
        public List<MatchResult> Results { get; set; }

        [Key(3)]
        public int Duration { get; set; }
    }

    [MessagePackObject]
    public class MatchResult
    {
        [Key(0)]
        public string PlayerId { get; set; }

        [Key(1)]
        public int Rank { get; set; }

        [Key(2)]
        public float TerritoryPercent { get; set; }

        [Key(3)]
        public int Kills { get; set; }

        [Key(4)]
        public int TimeAlive { get; set; }

        [Key(5)]
        public int RatingChange { get; set; }
    }

    [MessagePackObject]
    public class PongMessage
    {
        [Key(0)]
        public long ClientTime { get; set; }

        [Key(1)]
        public long ServerTime { get; set; }
    }

    [MessagePackObject]
    public class ErrorMessage
    {
        [Key(0)]
        public int Code { get; set; }

        [Key(1)]
        public string Message { get; set; }
    }

    // Common Types

    [MessagePackObject]
    public class Vector2Data
    {
        [Key(0)]
        public float X { get; set; }

        [Key(1)]
        public float Y { get; set; }

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
