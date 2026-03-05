package game

import (
	"sync"
)

type CellState uint8

const (
	CellStateEmpty     CellState = 0
	CellStateTerritory CellState = 1
	CellStateTrail     CellState = 2
)

type Cell struct {
	OwnerID string
	State   CellState
}

type TerritoryGrid struct {
	Size  int
	Cells [][]Cell
	mu    sync.RWMutex
}

func NewTerritoryGrid(size int) *TerritoryGrid {
	cells := make([][]Cell, size)
	for i := range cells {
		cells[i] = make([]Cell, size)
	}

	return &TerritoryGrid{
		Size:  size,
		Cells: cells,
	}
}

func (g *TerritoryGrid) IsValidCell(x, y int) bool {
	return x >= 0 && x < g.Size && y >= 0 && y < g.Size
}

func (g *TerritoryGrid) GetCell(x, y int) (Cell, bool) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	if !g.IsValidCell(x, y) {
		return Cell{}, false
	}

	return g.Cells[x][y], true
}

func (g *TerritoryGrid) SetCell(x, y int, ownerID string, state CellState) bool {
	g.mu.Lock()
	defer g.mu.Unlock()

	if !g.IsValidCell(x, y) {
		return false
	}

	g.Cells[x][y] = Cell{
		OwnerID: ownerID,
		State:   state,
	}

	return true
}

func (g *TerritoryGrid) ClearCell(x, y int) {
	g.SetCell(x, y, "", CellStateEmpty)
}

func (g *TerritoryGrid) ClearPlayerTerritory(playerID string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	for x := 0; x < g.Size; x++ {
		for y := 0; y < g.Size; y++ {
			if g.Cells[x][y].OwnerID == playerID {
				g.Cells[x][y] = Cell{
					OwnerID: "",
					State:   CellStateEmpty,
				}
			}
		}
	}
}

// FloodFill captures territory enclosed by player's trail
func (g *TerritoryGrid) FloodFill(player *Player) int {
	if len(player.Trail) < 3 {
		return 0
	}

	g.mu.Lock()
	defer g.mu.Unlock()

	// Mark trail cells
	trailCells := make(map[CellKey]bool)
	for _, point := range player.Trail {
		cellX := int(point.X / 10)
		cellY := int(point.Y / 10)
		if g.IsValidCell(cellX, cellY) {
			trailCells[CellKey{X: cellX, Y: cellY}] = true
			g.Cells[cellX][cellY] = Cell{
				OwnerID: player.ID,
				State:   CellStateTrail,
			}
		}
	}

	// Find enclosed area using scanline flood fill
	// This is a simplified version - production would use more sophisticated algorithm
	captured := 0

	// Get bounding box of trail
	minX, maxX := g.Size, 0
	minY, maxY := g.Size, 0
	for key := range trailCells {
		if key.X < minX {
			minX = key.X
		}
		if key.X > maxX {
			maxX = key.X
		}
		if key.Y < minY {
			minY = key.Y
		}
		if key.Y > maxY {
			maxY = key.Y
		}
	}

	// Simple fill: mark all cells within bounding box that aren't owned by others
	for x := minX; x <= maxX; x++ {
		for y := minY; y <= maxY; y++ {
			cell := g.Cells[x][y]
			
			// If empty or already owned by this player, capture it
			if cell.State == CellStateEmpty || cell.OwnerID == player.ID {
				if cell.OwnerID != player.ID || cell.State != CellStateTerritory {
					g.Cells[x][y] = Cell{
						OwnerID: player.ID,
						State:   CellStateTerritory,
					}
					player.Territory.AddCell(x, y)
					captured++
				}
			}
		}
	}

	return captured
}

// GetDeltaUpdates returns cells that changed since last update
func (g *TerritoryGrid) GetDeltaUpdates(lastTick uint64) []CellUpdate {
	// In production, you'd track dirty cells
	// For now, return empty (optimization for later)
	return []CellUpdate{}
}

type CellUpdate struct {
	X     int
	Y     int
	Owner string
	State CellState
}

// GetPlayerCellCount returns number of cells owned by player
func (g *TerritoryGrid) GetPlayerCellCount(playerID string) int {
	g.mu.RLock()
	defer g.mu.RUnlock()

	count := 0
	for x := 0; x < g.Size; x++ {
		for y := 0; y < g.Size; y++ {
			if g.Cells[x][y].OwnerID == playerID && g.Cells[x][y].State == CellStateTerritory {
				count++
			}
		}
	}

	return count
}

// GetSnapshot returns full grid state (for debugging/admin)
func (g *TerritoryGrid) GetSnapshot() [][]Cell {
	g.mu.RLock()
	defer g.mu.RUnlock()

	snapshot := make([][]Cell, g.Size)
	for i := range snapshot {
		snapshot[i] = make([]Cell, g.Size)
		copy(snapshot[i], g.Cells[i])
	}

	return snapshot
}
