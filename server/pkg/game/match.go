package game

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/stexiel/sparkaph/pkg/protocol"
	"go.uber.org/zap"
)

type MatchState int

const (
	MatchStateWaiting MatchState = iota
	MatchStateStarting
	MatchStateRunning
	MatchStateEnding
	MatchStateFinished
)

type Match struct {
	ID            string
	Mode          string // solo, duo, squad, arena, infinite
	State         MatchState
	Players       map[string]*Player
	Grid          *TerritoryGrid
	Tick          uint64
	TickRate      time.Duration
	StartTime     time.Time
	EndTime       time.Time
	MaxDuration   time.Duration
	MaxPlayers    int
	WinnerID      string
	
	logger        *zap.Logger
	mu            sync.RWMutex
	stopChan      chan struct{}
	tickerDone    chan struct{}
}

func NewMatch(mode string, maxPlayers int, mapSize int, logger *zap.Logger) *Match {
	return &Match{
		ID:          uuid.New().String(),
		Mode:        mode,
		State:       MatchStateWaiting,
		Players:     make(map[string]*Player),
		Grid:        NewTerritoryGrid(mapSize),
		Tick:        0,
		TickRate:    16 * time.Millisecond, // 60 Hz
		MaxDuration: 180 * time.Second,      // 3 minutes
		MaxPlayers:  maxPlayers,
		logger:      logger,
		stopChan:    make(chan struct{}),
		tickerDone:  make(chan struct{}),
	}
}

func (m *Match) AddPlayer(player *Player) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	if len(m.Players) >= m.MaxPlayers {
		return false
	}

	if m.State != MatchStateWaiting {
		return false
	}

	m.Players[player.ID] = player
	
	// Initialize player territory with spawn area
	m.initializePlayerTerritory(player)
	
	m.logger.Info("Player joined match",
		zap.String("matchID", m.ID),
		zap.String("playerID", player.ID),
		zap.Int("playerCount", len(m.Players)),
	)

	return true
}

func (m *Match) RemovePlayer(playerID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if player, exists := m.Players[playerID]; exists {
		// Clear player's territory
		m.Grid.ClearPlayerTerritory(playerID)
		delete(m.Players, playerID)
		
		m.logger.Info("Player left match",
			zap.String("matchID", m.ID),
			zap.String("playerID", playerID),
			zap.Int("kills", player.Kills),
			zap.Float32("territory", player.Territory.GetPercentage()),
		)
	}
}

func (m *Match) Start() {
	m.mu.Lock()
	if m.State != MatchStateWaiting {
		m.mu.Unlock()
		return
	}
	m.State = MatchStateRunning
	m.StartTime = time.Now()
	m.mu.Unlock()

	m.logger.Info("Match starting",
		zap.String("matchID", m.ID),
		zap.String("mode", m.Mode),
		zap.Int("players", len(m.Players)),
	)

	go m.gameLoop()
}

func (m *Match) Stop() {
	m.mu.Lock()
	if m.State == MatchStateFinished {
		m.mu.Unlock()
		return
	}
	m.State = MatchStateFinished
	m.EndTime = time.Now()
	m.mu.Unlock()

	close(m.stopChan)
	<-m.tickerDone

	m.logger.Info("Match finished",
		zap.String("matchID", m.ID),
		zap.Duration("duration", m.EndTime.Sub(m.StartTime)),
		zap.String("winner", m.WinnerID),
	)
}

func (m *Match) gameLoop() {
	ticker := time.NewTicker(m.TickRate)
	defer ticker.Stop()
	defer close(m.tickerDone)

	for {
		select {
		case <-m.stopChan:
			return
		case <-ticker.C:
			m.update()
		}
	}
}

func (m *Match) update() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.State != MatchStateRunning {
		return
	}

	deltaTime := float32(m.TickRate.Seconds())
	m.Tick++

	// Update all players
	for _, player := range m.Players {
		if !player.IsAlive {
			continue
		}
		
		player.Update(deltaTime)
		
		// Check if player is outside their territory
		if !player.IsInOwnTerritory() {
			// Player is creating a trail
			// Check for collisions with other trails
			if m.checkTrailCollisions(player) {
				m.killPlayer(player)
				continue
			}
		} else {
			// Player returned to territory - capture new area
			if len(player.Trail) > 3 {
				m.captureTerritory(player)
			}
		}
	}

	// Update territory percentages
	m.updateTerritoryPercentages()

	// Check win conditions
	m.checkWinConditions()

	// Check timeout
	if time.Since(m.StartTime) > m.MaxDuration {
		m.endMatchByTimeout()
	}
}

func (m *Match) checkTrailCollisions(player *Player) bool {
	if len(player.Trail) == 0 {
		return false
	}

	currentPos := player.Position

	// Check collision with own trail
	for i := 0; i < len(player.Trail)-5; i++ {
		if m.pointsCollide(currentPos, player.Trail[i], 2.0) {
			return true
		}
	}

	// Check collision with other players' trails
	for _, otherPlayer := range m.Players {
		if otherPlayer.ID == player.ID || !otherPlayer.IsAlive {
			continue
		}

		for _, trailPoint := range otherPlayer.Trail {
			if m.pointsCollide(currentPos, trailPoint, 2.0) {
				// Other player gets a kill
				otherPlayer.AddKill()
				return true
			}
		}
	}

	return false
}

func (m *Match) pointsCollide(p1, p2 protocol.Vector2, threshold float32) bool {
	dx := p1.X - p2.X
	dy := p1.Y - p2.Y
	distSq := dx*dx + dy*dy
	return distSq < threshold*threshold
}

func (m *Match) killPlayer(player *Player) {
	player.Kill()
	m.Grid.ClearPlayerTerritory(player.ID)
	
	m.logger.Info("Player killed",
		zap.String("matchID", m.ID),
		zap.String("playerID", player.ID),
		zap.Float32("territoryLost", player.Territory.GetPercentage()),
	)
}

func (m *Match) captureTerritory(player *Player) {
	// Use flood fill algorithm to capture enclosed area
	captured := m.Grid.FloodFill(player)
	
	if captured > 0 {
		player.ClearTrail()
		
		m.logger.Debug("Territory captured",
			zap.String("playerID", player.ID),
			zap.Int("cellsCaptured", captured),
		)
	}
}

func (m *Match) updateTerritoryPercentages() {
	totalCells := m.Grid.Size * m.Grid.Size
	
	for _, player := range m.Players {
		cellCount := player.Territory.GetCellCount()
		percentage := float32(cellCount) / float32(totalCells) * 100.0
		player.Territory.SetPercentage(percentage)
	}
}

func (m *Match) checkWinConditions() {
	// Count alive players
	aliveCount := 0
	var lastAlive *Player
	
	for _, player := range m.Players {
		if player.IsAlive {
			aliveCount++
			lastAlive = player
			
			// Check if player reached 50% territory
			if player.Territory.GetPercentage() >= 50.0 {
				m.endMatchByDomination(player)
				return
			}
		}
	}

	// Last player standing
	if aliveCount == 1 && lastAlive != nil {
		m.endMatchByElimination(lastAlive)
	}
}

func (m *Match) endMatchByDomination(winner *Player) {
	m.WinnerID = winner.ID
	m.State = MatchStateEnding
	
	m.logger.Info("Match ended by domination",
		zap.String("matchID", m.ID),
		zap.String("winner", winner.Username),
		zap.Float32("territory", winner.Territory.GetPercentage()),
	)
	
	go func() {
		time.Sleep(3 * time.Second)
		m.Stop()
	}()
}

func (m *Match) endMatchByElimination(winner *Player) {
	m.WinnerID = winner.ID
	m.State = MatchStateEnding
	
	m.logger.Info("Match ended by elimination",
		zap.String("matchID", m.ID),
		zap.String("winner", winner.Username),
	)
	
	go func() {
		time.Sleep(3 * time.Second)
		m.Stop()
	}()
}

func (m *Match) endMatchByTimeout() {
	// Find player with most territory
	var winner *Player
	maxTerritory := float32(0)
	
	for _, player := range m.Players {
		if player.Territory.GetPercentage() > maxTerritory {
			maxTerritory = player.Territory.GetPercentage()
			winner = player
		}
	}
	
	if winner != nil {
		m.WinnerID = winner.ID
	}
	
	m.State = MatchStateEnding
	
	m.logger.Info("Match ended by timeout",
		zap.String("matchID", m.ID),
		zap.String("winner", m.WinnerID),
	)
	
	go func() {
		time.Sleep(3 * time.Second)
		m.Stop()
	}()
}

func (m *Match) GetState() protocol.GameStateMessage {
	m.mu.RLock()
	defer m.mu.RUnlock()

	players := make([]protocol.PlayerState, 0, len(m.Players))
	for _, player := range m.Players {
		players = append(players, player.GetState())
	}

	return protocol.GameStateMessage{
		Tick:      m.Tick,
		Players:   players,
		Timestamp: time.Now().UnixMilli(),
	}
}

func (m *Match) GetResults() []protocol.MatchResult {
	m.mu.RLock()
	defer m.mu.RUnlock()

	results := make([]protocol.MatchResult, 0, len(m.Players))
	
	// Sort players by territory percentage
	type playerScore struct {
		player *Player
		score  float32
	}
	
	scores := make([]playerScore, 0, len(m.Players))
	for _, player := range m.Players {
		scores = append(scores, playerScore{
			player: player,
			score:  player.Territory.MaxReached,
		})
	}
	
	// Simple bubble sort (fine for small player counts)
	for i := 0; i < len(scores); i++ {
		for j := i + 1; j < len(scores); j++ {
			if scores[j].score > scores[i].score {
				scores[i], scores[j] = scores[j], scores[i]
			}
		}
	}
	
	// Create results
	for rank, ps := range scores {
		timeAlive := int(time.Since(ps.player.SpawnTime).Seconds())
		
		results = append(results, protocol.MatchResult{
			PlayerID:         ps.player.ID,
			Rank:             rank + 1,
			TerritoryPercent: ps.player.Territory.MaxReached,
			Kills:            ps.player.Kills,
			TimeAlive:        timeAlive,
			RatingChange:     m.calculateRatingChange(rank+1, len(scores)),
		})
	}
	
	return results
}

func (m *Match) calculateRatingChange(rank, totalPlayers int) int {
	// Simple ELO-like rating change
	baseChange := 25
	
	if rank == 1 {
		return baseChange
	} else if rank <= totalPlayers/4 {
		return baseChange / 2
	} else if rank <= totalPlayers/2 {
		return 0
	} else {
		return -baseChange / 2
	}
}

func (m *Match) initializePlayerTerritory(player *Player) {
	// Give player a small starting territory (5x5 cells)
	cellX := int(player.Position.X / 10)
	cellY := int(player.Position.Y / 10)
	
	for dx := -2; dx <= 2; dx++ {
		for dy := -2; dy <= 2; dy++ {
			x := cellX + dx
			y := cellY + dy
			if m.Grid.IsValidCell(x, y) {
				m.Grid.SetCell(x, y, player.ID, CellStateTerritory)
				player.Territory.AddCell(x, y)
			}
		}
	}
}

func (m *Match) IsFull() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.Players) >= m.MaxPlayers
}

func (m *Match) GetPlayerCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.Players)
}
