package game

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/stexiel/sparkaph/pkg/protocol"
)

type Player struct {
	ID           string
	Username     string
	Position     protocol.Vector2
	Direction    protocol.Vector2
	Speed        float32
	Trail        []protocol.Vector2
	Territory    *Territory
	IsAlive      bool
	Kills        int
	Deaths       int
	TeamID       string
	Rating       int
	LastInput    time.Time
	SpawnTime    time.Time
	
	mu           sync.RWMutex
	inputBuffer  []protocol.InputMessage
}

type Territory struct {
	Cells       map[CellKey]bool // owned cells
	Percentage  float32
	MaxReached  float32
	mu          sync.RWMutex
}

type CellKey struct {
	X, Y int
}

func NewPlayer(id, username string, spawnPos protocol.Vector2) *Player {
	if id == "" {
		id = uuid.New().String()
	}
	
	return &Player{
		ID:        id,
		Username:  username,
		Position:  spawnPos,
		Direction: protocol.Vector2{X: 0, Y: 0},
		Speed:     5.0,
		Trail:     make([]protocol.Vector2, 0, 1000),
		Territory: &Territory{
			Cells:      make(map[CellKey]bool),
			Percentage: 0,
		},
		IsAlive:   true,
		Kills:     0,
		Deaths:    0,
		LastInput: time.Now(),
		SpawnTime: time.Now(),
	}
}

func (p *Player) Update(deltaTime float32) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if !p.IsAlive {
		return
	}

	// Process input buffer
	if len(p.inputBuffer) > 0 {
		// Take latest input
		input := p.inputBuffer[len(p.inputBuffer)-1]
		p.Direction = input.Direction.Normalize()
		p.inputBuffer = p.inputBuffer[:0] // Clear buffer
		p.LastInput = time.Now()
	}

	// Update position
	p.Position.X += p.Direction.X * p.Speed * deltaTime
	p.Position.Y += p.Direction.Y * p.Speed * deltaTime

	// Add to trail if moving
	if p.Direction.Length() > 0.1 {
		p.Trail = append(p.Trail, p.Position)
		
		// Limit trail length to prevent memory issues
		if len(p.Trail) > 10000 {
			p.Trail = p.Trail[len(p.Trail)-5000:]
		}
	}
}

func (p *Player) AddInput(input protocol.InputMessage) {
	p.mu.Lock()
	defer p.mu.Unlock()
	
	p.inputBuffer = append(p.inputBuffer, input)
	
	// Keep only last 10 inputs
	if len(p.inputBuffer) > 10 {
		p.inputBuffer = p.inputBuffer[len(p.inputBuffer)-10:]
	}
}

func (p *Player) Kill() {
	p.mu.Lock()
	defer p.mu.Unlock()
	
	p.IsAlive = false
	p.Deaths++
	p.Trail = p.Trail[:0]
}

func (p *Player) AddKill() {
	p.mu.Lock()
	defer p.mu.Unlock()
	
	p.Kills++
}

func (p *Player) GetState() protocol.PlayerState {
	p.mu.RLock()
	defer p.mu.RUnlock()

	// Copy trail (only last 100 points for network efficiency)
	trailCopy := make([]protocol.Vector2, 0)
	if len(p.Trail) > 0 {
		start := 0
		if len(p.Trail) > 100 {
			start = len(p.Trail) - 100
		}
		trailCopy = append(trailCopy, p.Trail[start:]...)
	}

	return protocol.PlayerState{
		ID:        p.ID,
		Position:  p.Position,
		Direction: p.Direction,
		Trail:     trailCopy,
		Territory: p.Territory.GetPercentage(),
		IsAlive:   p.IsAlive,
		Kills:     p.Kills,
		TeamID:    p.TeamID,
	}
}

func (p *Player) IsInOwnTerritory() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()

	cellX := int(p.Position.X / 10) // Assuming 10x10 cell size
	cellY := int(p.Position.Y / 10)
	
	return p.Territory.HasCell(cellX, cellY)
}

func (p *Player) ClearTrail() {
	p.mu.Lock()
	defer p.mu.Unlock()
	
	p.Trail = p.Trail[:0]
}

// Territory methods

func (t *Territory) HasCell(x, y int) bool {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	return t.Cells[CellKey{X: x, Y: y}]
}

func (t *Territory) AddCell(x, y int) {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	t.Cells[CellKey{X: x, Y: y}] = true
}

func (t *Territory) RemoveCell(x, y int) {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	delete(t.Cells, CellKey{X: x, Y: y})
}

func (t *Territory) GetPercentage() float32 {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	return t.Percentage
}

func (t *Territory) SetPercentage(pct float32) {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	t.Percentage = pct
	if pct > t.MaxReached {
		t.MaxReached = pct
	}
}

func (t *Territory) GetCellCount() int {
	t.mu.RLock()
	defer t.mu.RUnlock()
	
	return len(t.Cells)
}

func (t *Territory) Clear() {
	t.mu.Lock()
	defer t.mu.Unlock()
	
	t.Cells = make(map[CellKey]bool)
	t.Percentage = 0
}
