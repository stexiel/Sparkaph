package matchmaker

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/stexiel/sparkaph/pkg/game"
	"github.com/stexiel/sparkaph/pkg/protocol"
	"go.uber.org/zap"
)

type GameMode string

const (
	ModeSolo     GameMode = "solo"
	ModeDuo      GameMode = "duo"
	ModeSquad    GameMode = "squad"
	ModeArena    GameMode = "arena"
	ModeInfinite GameMode = "infinite"
)

type Queue struct {
	Mode    GameMode
	Players []*QueuedPlayer
	mu      sync.RWMutex
}

type QueuedPlayer struct {
	ID        string
	Username  string
	Rating    int
	TeamID    string
	JoinedAt  time.Time
}

type Matchmaker struct {
	queues        map[GameMode]*Queue
	activeMatches map[string]*game.Match
	logger        *zap.Logger
	mu            sync.RWMutex
	stopChan      chan struct{}
}

func NewMatchmaker(logger *zap.Logger) *Matchmaker {
	mm := &Matchmaker{
		queues: map[GameMode]*Queue{
			ModeSolo:     {Mode: ModeSolo, Players: make([]*QueuedPlayer, 0)},
			ModeDuo:      {Mode: ModeDuo, Players: make([]*QueuedPlayer, 0)},
			ModeSquad:    {Mode: ModeSquad, Players: make([]*QueuedPlayer, 0)},
			ModeArena:    {Mode: ModeArena, Players: make([]*QueuedPlayer, 0)},
			ModeInfinite: {Mode: ModeInfinite, Players: make([]*QueuedPlayer, 0)},
		},
		activeMatches: make(map[string]*game.Match),
		logger:        logger,
		stopChan:      make(chan struct{}),
	}

	go mm.matchmakingLoop()

	return mm
}

func (mm *Matchmaker) AddToQueue(mode GameMode, player *QueuedPlayer) error {
	mm.mu.Lock()
	defer mm.mu.Unlock()

	queue, exists := mm.queues[mode]
	if !exists {
		return ErrInvalidMode
	}

	queue.mu.Lock()
	defer queue.mu.Unlock()

	// Check if player already in queue
	for _, p := range queue.Players {
		if p.ID == player.ID {
			return ErrAlreadyInQueue
		}
	}

	player.JoinedAt = time.Now()
	queue.Players = append(queue.Players, player)

	mm.logger.Info("Player joined queue",
		zap.String("playerID", player.ID),
		zap.String("mode", string(mode)),
		zap.Int("queueSize", len(queue.Players)),
	)

	return nil
}

func (mm *Matchmaker) RemoveFromQueue(playerID string) {
	mm.mu.Lock()
	defer mm.mu.Unlock()

	for _, queue := range mm.queues {
		queue.mu.Lock()
		for i, player := range queue.Players {
			if player.ID == playerID {
				queue.Players = append(queue.Players[:i], queue.Players[i+1:]...)
				mm.logger.Info("Player removed from queue",
					zap.String("playerID", playerID),
					zap.String("mode", string(queue.Mode)),
				)
				break
			}
		}
		queue.mu.Unlock()
	}
}

func (mm *Matchmaker) matchmakingLoop() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-mm.stopChan:
			return
		case <-ticker.C:
			mm.tryCreateMatches()
		}
	}
}

func (mm *Matchmaker) tryCreateMatches() {
	mm.mu.Lock()
	defer mm.mu.Unlock()

	for mode, queue := range mm.queues {
		queue.mu.Lock()

		var playersNeeded int
		switch mode {
		case ModeSolo, ModeArena:
			playersNeeded = 20
		case ModeDuo:
			playersNeeded = 10 // 10 teams of 2
		case ModeSquad:
			playersNeeded = 5 // 5 teams of 4
		case ModeInfinite:
			playersNeeded = 10 // Start with minimum 10
		}

		if len(queue.Players) >= playersNeeded {
			// Create match
			players := queue.Players[:playersNeeded]
			queue.Players = queue.Players[playersNeeded:]

			queue.mu.Unlock()
			mm.createMatch(mode, players)
		} else {
			queue.mu.Unlock()
		}
	}
}

func (mm *Matchmaker) createMatch(mode GameMode, queuedPlayers []*QueuedPlayer) {
	mapSize := 1000
	if mode == ModeInfinite {
		mapSize = 5000
	}

	match := game.NewMatch(string(mode), len(queuedPlayers), mapSize, mm.logger)

	// Spawn positions
	spawnPositions := mm.generateSpawnPositions(len(queuedPlayers), mapSize)

	// Add players to match
	for i, qp := range queuedPlayers {
		player := game.NewPlayer(qp.ID, qp.Username, spawnPositions[i])
		player.Rating = qp.Rating
		player.TeamID = qp.TeamID
		match.AddPlayer(player)
	}

	mm.activeMatches[match.ID] = match

	mm.logger.Info("Match created",
		zap.String("matchID", match.ID),
		zap.String("mode", string(mode)),
		zap.Int("players", len(queuedPlayers)),
	)

	// Start match
	match.Start()

	// Monitor match completion
	go mm.monitorMatch(match)
}

func (mm *Matchmaker) monitorMatch(match *game.Match) {
	// Wait for match to finish
	for {
		time.Sleep(1 * time.Second)
		if match.State == game.MatchStateFinished {
			break
		}
	}

	// Save match results to database (TODO)
	results := match.GetResults()
	mm.logger.Info("Match completed",
		zap.String("matchID", match.ID),
		zap.Int("players", len(results)),
	)

	// Remove from active matches
	mm.mu.Lock()
	delete(mm.activeMatches, match.ID)
	mm.mu.Unlock()
}

func (mm *Matchmaker) generateSpawnPositions(count, mapSize int) []protocol.Vector2 {
	positions := make([]protocol.Vector2, count)

	// Distribute players evenly around the map edges
	for i := 0; i < count; i++ {
		angle := float32(i) / float32(count) * 2 * 3.14159
		radius := float32(mapSize) * 0.4

		centerX := float32(mapSize) * 5.0 // Grid cell size is 10
		centerY := float32(mapSize) * 5.0

		positions[i] = protocol.Vector2{
			X: centerX + radius*cos(angle),
			Y: centerY + radius*sin(angle),
		}
	}

	return positions
}

func (mm *Matchmaker) GetQueueSize(mode GameMode) int {
	mm.mu.RLock()
	defer mm.mu.RUnlock()

	queue, exists := mm.queues[mode]
	if !exists {
		return 0
	}

	queue.mu.RLock()
	defer queue.mu.RUnlock()

	return len(queue.Players)
}

func (mm *Matchmaker) GetActiveMatchCount() int {
	mm.mu.RLock()
	defer mm.mu.RUnlock()

	return len(mm.activeMatches)
}

func (mm *Matchmaker) Stop() {
	close(mm.stopChan)
}

// Helper math functions
func cos(x float32) float32 {
	// Simple approximation
	x = x - float32(int(x/(2*3.14159)))*(2*3.14159)
	return 1 - x*x/2 + x*x*x*x/24
}

func sin(x float32) float32 {
	return cos(x - 3.14159/2)
}

// Errors
var (
	ErrInvalidMode    = &MatchmakerError{Message: "invalid game mode"}
	ErrAlreadyInQueue = &MatchmakerError{Message: "player already in queue"}
)

type MatchmakerError struct {
	Message string
}

func (e *MatchmakerError) Error() string {
	return e.Message
}
