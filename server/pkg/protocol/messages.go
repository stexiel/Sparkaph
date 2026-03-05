package protocol

import "time"

// Message types
const (
	// Client -> Server
	MsgTypeConnect      = 1
	MsgTypeInput        = 2
	MsgTypeDisconnect   = 3
	MsgTypePing         = 4
	MsgTypeChatMessage  = 5

	// Server -> Client
	MsgTypeWelcome      = 10
	MsgTypeGameState    = 11
	MsgTypePlayerJoined = 12
	MsgTypePlayerLeft   = 13
	MsgTypeMatchStart   = 14
	MsgTypeMatchEnd     = 15
	MsgTypePong         = 16
	MsgTypeError        = 17
	MsgTypeTerritoryUpdate = 18
)

// Base message structure
type Message struct {
	Type      uint8     `msgpack:"t"`
	Timestamp int64     `msgpack:"ts"`
	Data      []byte    `msgpack:"d,omitempty"`
}

// Client -> Server Messages

type ConnectMessage struct {
	PlayerID    string `msgpack:"pid"`
	Username    string `msgpack:"u"`
	DeviceID    string `msgpack:"did"`
	Platform    string `msgpack:"p"` // ios, android, webgl
	GameMode    string `msgpack:"gm"` // solo, duo, squad
	QueueType   string `msgpack:"qt"` // arena, infinite
}

type InputMessage struct {
	Sequence  uint32  `msgpack:"seq"`
	Direction Vector2 `msgpack:"dir"`
	Timestamp int64   `msgpack:"ts"`
}

type PingMessage struct {
	ClientTime int64 `msgpack:"ct"`
}

// Server -> Client Messages

type WelcomeMessage struct {
	PlayerID     string `msgpack:"pid"`
	SessionToken string `msgpack:"st"`
	ServerTime   int64  `msgpack:"svt"`
	TickRate     int    `msgpack:"tr"`
}

type GameStateMessage struct {
	Tick      uint64         `msgpack:"tick"`
	Players   []PlayerState  `msgpack:"players"`
	Timestamp int64          `msgpack:"ts"`
}

type PlayerState struct {
	ID           string    `msgpack:"id"`
	Position     Vector2   `msgpack:"pos"`
	Direction    Vector2   `msgpack:"dir"`
	Trail        []Vector2 `msgpack:"trail,omitempty"`
	Territory    float32   `msgpack:"terr"` // percentage
	IsAlive      bool      `msgpack:"alive"`
	Kills        int       `msgpack:"kills"`
	TeamID       string    `msgpack:"tid,omitempty"`
}

type PlayerJoinedMessage struct {
	PlayerID  string `msgpack:"pid"`
	Username  string `msgpack:"u"`
	TeamID    string `msgpack:"tid,omitempty"`
}

type PlayerLeftMessage struct {
	PlayerID string `msgpack:"pid"`
	Reason   string `msgpack:"r"` // disconnect, killed, timeout
}

type MatchStartMessage struct {
	MatchID      string        `msgpack:"mid"`
	Mode         string        `msgpack:"mode"`
	MapSize      int           `msgpack:"ms"`
	Players      []PlayerInfo  `msgpack:"players"`
	StartTime    int64         `msgpack:"st"`
	Duration     int           `msgpack:"dur"` // seconds
}

type PlayerInfo struct {
	ID       string  `msgpack:"id"`
	Username string  `msgpack:"u"`
	Rating   int     `msgpack:"r"`
	TeamID   string  `msgpack:"tid,omitempty"`
	SpawnPos Vector2 `msgpack:"sp"`
}

type MatchEndMessage struct {
	MatchID     string         `msgpack:"mid"`
	Winner      string         `msgpack:"w"`
	Results     []MatchResult  `msgpack:"res"`
	Duration    int            `msgpack:"dur"`
}

type MatchResult struct {
	PlayerID         string  `msgpack:"pid"`
	Rank             int     `msgpack:"rank"`
	TerritoryPercent float32 `msgpack:"terr"`
	Kills            int     `msgpack:"kills"`
	TimeAlive        int     `msgpack:"ta"`
	RatingChange     int     `msgpack:"rc"`
}

type PongMessage struct {
	ClientTime int64 `msgpack:"ct"`
	ServerTime int64 `msgpack:"st"`
}

type ErrorMessage struct {
	Code    int    `msgpack:"code"`
	Message string `msgpack:"msg"`
}

type TerritoryUpdateMessage struct {
	PlayerID string      `msgpack:"pid"`
	Cells    []CellUpdate `msgpack:"cells"`
}

type CellUpdate struct {
	X     int    `msgpack:"x"`
	Y     int    `msgpack:"y"`
	Owner string `msgpack:"o"`
	State uint8  `msgpack:"s"` // 0=empty, 1=territory, 2=trail
}

// Common types

type Vector2 struct {
	X float32 `msgpack:"x"`
	Y float32 `msgpack:"y"`
}

func (v Vector2) Length() float32 {
	return float32(sqrt(float64(v.X*v.X + v.Y*v.Y)))
}

func (v Vector2) Normalize() Vector2 {
	length := v.Length()
	if length == 0 {
		return Vector2{X: 0, Y: 0}
	}
	return Vector2{
		X: v.X / length,
		Y: v.Y / length,
	}
}

func sqrt(x float64) float64 {
	if x == 0 {
		return 0
	}
	z := x
	for i := 0; i < 10; i++ {
		z = (z + x/z) / 2
	}
	return z
}

// Helper functions

func NewMessage(msgType uint8, data []byte) *Message {
	return &Message{
		Type:      msgType,
		Timestamp: time.Now().UnixMilli(),
		Data:      data,
	}
}
