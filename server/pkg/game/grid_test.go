package game

import (
	"testing"
)

func TestGridCreation(t *testing.T) {
	size := 100
	grid := NewTerritoryGrid(size)

	if grid.Size != size {
		t.Errorf("Expected grid size %d, got %d", size, grid.Size)
	}

	if len(grid.Cells) != size {
		t.Errorf("Expected %d rows, got %d", size, len(grid.Cells))
	}

	if len(grid.Cells[0]) != size {
		t.Errorf("Expected %d columns, got %d", size, len(grid.Cells[0]))
	}
}

func TestGridSetGetCell(t *testing.T) {
	grid := NewTerritoryGrid(100)
	playerID := "test-player"

	// Set cell
	grid.SetCell(50, 50, playerID)

	// Get cell
	owner := grid.GetCell(50, 50)
	if owner != playerID {
		t.Errorf("Expected cell owner '%s', got '%s'", playerID, owner)
	}
}

func TestGridBoundaryCheck(t *testing.T) {
	grid := NewTerritoryGrid(100)

	// Test out of bounds
	grid.SetCell(-1, 50, "player1")
	grid.SetCell(50, -1, "player1")
	grid.SetCell(100, 50, "player1")
	grid.SetCell(50, 100, "player1")

	// Should not crash and should handle gracefully
	owner := grid.GetCell(-1, 50)
	if owner != "" {
		t.Error("Expected empty string for out of bounds cell")
	}
}

func TestGridClearPlayerTerritory(t *testing.T) {
	grid := NewTerritoryGrid(100)
	playerID := "test-player"

	// Set multiple cells
	for i := 0; i < 10; i++ {
		for j := 0; j < 10; j++ {
			grid.SetCell(i, j, playerID)
		}
	}

	// Clear player territory
	grid.ClearPlayerTerritory(playerID)

	// Verify all cells are cleared
	for i := 0; i < 10; i++ {
		for j := 0; j < 10; j++ {
			owner := grid.GetCell(i, j)
			if owner == playerID {
				t.Errorf("Expected cell (%d, %d) to be cleared", i, j)
			}
		}
	}
}

func TestGridGetPlayerCellCount(t *testing.T) {
	grid := NewTerritoryGrid(100)
	playerID := "test-player"

	// Set 25 cells
	for i := 0; i < 5; i++ {
		for j := 0; j < 5; j++ {
			grid.SetCell(i, j, playerID)
		}
	}

	count := grid.GetPlayerCellCount(playerID)
	if count != 25 {
		t.Errorf("Expected 25 cells, got %d", count)
	}
}

func TestGridGetTerritoryPercentage(t *testing.T) {
	grid := NewTerritoryGrid(100)
	playerID := "test-player"

	// Set 100 cells in a 100x100 grid = 1%
	for i := 0; i < 10; i++ {
		for j := 0; j < 10; j++ {
			grid.SetCell(i, j, playerID)
		}
	}

	percentage := grid.GetTerritoryPercentage(playerID)
	expected := float32(1.0) // 100 / 10000 = 1%

	if percentage != expected {
		t.Errorf("Expected %.2f%% territory, got %.2f%%", expected, percentage)
	}
}

func BenchmarkGridSetCell(b *testing.B) {
	grid := NewTerritoryGrid(1000)
	playerID := "test-player"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		x := i % 1000
		y := (i / 1000) % 1000
		grid.SetCell(x, y, playerID)
	}
}

func BenchmarkGridGetPlayerCellCount(b *testing.B) {
	grid := NewTerritoryGrid(1000)
	playerID := "test-player"

	// Pre-fill grid
	for i := 0; i < 100; i++ {
		for j := 0; j < 100; j++ {
			grid.SetCell(i, j, playerID)
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		grid.GetPlayerCellCount(playerID)
	}
}
