package game

import (
	"testing"
	"time"

	"github.com/stexiel/sparkaph/pkg/protocol"
)

func TestPlayerCreation(t *testing.T) {
	player := NewPlayer("test-id", "TestPlayer", protocol.Vector2{X: 100, Y: 100})

	if player.ID != "test-id" {
		t.Errorf("Expected player ID 'test-id', got '%s'", player.ID)
	}

	if player.Username != "TestPlayer" {
		t.Errorf("Expected username 'TestPlayer', got '%s'", player.Username)
	}

	if !player.IsAlive {
		t.Error("Expected new player to be alive")
	}

	if player.Position.X != 100 || player.Position.Y != 100 {
		t.Errorf("Expected position (100, 100), got (%.2f, %.2f)", player.Position.X, player.Position.Y)
	}
}

func TestPlayerMovement(t *testing.T) {
	player := NewPlayer("test-id", "TestPlayer", protocol.Vector2{X: 100, Y: 100})
	
	// Set direction
	player.SetDirection(protocol.Vector2{X: 1, Y: 0})

	// Update position (simulate 1 second at 5 units/sec)
	deltaTime := float32(1.0)
	player.Update(deltaTime)

	expectedX := float32(100 + 5) // 100 + (1 * 5 * 1.0)
	if player.Position.X != expectedX {
		t.Errorf("Expected X position %.2f, got %.2f", expectedX, player.Position.X)
	}
}

func TestPlayerTrail(t *testing.T) {
	player := NewPlayer("test-id", "TestPlayer", protocol.Vector2{X: 100, Y: 100})
	
	// Move player to create trail
	player.SetDirection(protocol.Vector2{X: 1, Y: 0})
	
	for i := 0; i < 10; i++ {
		player.Update(0.1)
	}

	if len(player.Trail) == 0 {
		t.Error("Expected trail to have points")
	}
}

func TestPlayerDeath(t *testing.T) {
	player := NewPlayer("test-id", "TestPlayer", protocol.Vector2{X: 100, Y: 100})
	
	player.Kill()

	if player.IsAlive {
		t.Error("Expected player to be dead after Kill()")
	}

	if len(player.Trail) != 0 {
		t.Error("Expected trail to be cleared after death")
	}
}

func TestPlayerInputBuffering(t *testing.T) {
	player := NewPlayer("test-id", "TestPlayer", protocol.Vector2{X: 100, Y: 100})

	// Add inputs
	for i := 0; i < 5; i++ {
		player.AddInput(protocol.InputMessage{
			Sequence:  uint32(i),
			Direction: protocol.Vector2{X: 1, Y: 0},
			Timestamp: time.Now().UnixMilli(),
		})
	}

	// Process inputs
	inputs := player.GetPendingInputs()
	if len(inputs) != 5 {
		t.Errorf("Expected 5 pending inputs, got %d", len(inputs))
	}

	// Clear inputs
	player.ClearInputs()
	inputs = player.GetPendingInputs()
	if len(inputs) != 0 {
		t.Errorf("Expected 0 inputs after clear, got %d", len(inputs))
	}
}

func TestPlayerTerritory(t *testing.T) {
	player := NewPlayer("test-id", "TestPlayer", protocol.Vector2{X: 100, Y: 100})

	// Initially should have 0 territory
	if player.Territory.Percentage != 0 {
		t.Errorf("Expected 0%% territory, got %.2f%%", player.Territory.Percentage)
	}

	// Set territory
	player.Territory.Percentage = 25.5
	player.Territory.CellCount = 255

	if player.Territory.Percentage != 25.5 {
		t.Errorf("Expected 25.5%% territory, got %.2f%%", player.Territory.Percentage)
	}

	if player.Territory.CellCount != 255 {
		t.Errorf("Expected 255 cells, got %d", player.Territory.CellCount)
	}
}

func BenchmarkPlayerUpdate(b *testing.B) {
	player := NewPlayer("test-id", "TestPlayer", protocol.Vector2{X: 100, Y: 100})
	player.SetDirection(protocol.Vector2{X: 1, Y: 0})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		player.Update(0.016) // ~60 FPS
	}
}
