package validation

import (
	"fmt"
	"math"
	"time"

	"github.com/stexiel/sparkaph/pkg/protocol"
)

type InputValidator struct {
	maxSpeed            float32
	maxInputRate        int
	inputRateWindow     time.Duration
	maxPositionDrift    float32
	maxDirectionChange  float32
	
	playerInputHistory  map[string]*InputHistory
}

type InputHistory struct {
	LastInputTime    time.Time
	InputCount       int
	WindowStart      time.Time
	LastPosition     protocol.Vector2
	LastDirection    protocol.Vector2
	SuspiciousCount  int
}

func NewInputValidator() *InputValidator {
	return &InputValidator{
		maxSpeed:           10.0,  // максимальная скорость движения
		maxInputRate:       100,   // максимум 100 input/сек
		inputRateWindow:    time.Second,
		maxPositionDrift:   50.0,  // максимальное отклонение позиции
		maxDirectionChange: 2.0,   // максимальное изменение направления
		playerInputHistory: make(map[string]*InputHistory),
	}
}

func (v *InputValidator) ValidateInput(playerID string, input protocol.InputMessage, currentPos protocol.Vector2) error {
	history := v.getOrCreateHistory(playerID)
	now := time.Now()

	// Проверка rate limiting
	if err := v.checkInputRate(history, now); err != nil {
		return err
	}

	// Проверка направления
	if err := v.checkDirection(input.Direction); err != nil {
		return err
	}

	// Проверка изменения направления (anti-spin hack)
	if err := v.checkDirectionChange(history, input.Direction); err != nil {
		return err
	}

	// Обновляем историю
	v.updateHistory(history, now, currentPos, input.Direction)

	return nil
}

func (v *InputValidator) ValidatePosition(playerID string, serverPos, clientPos protocol.Vector2, deltaTime float32) error {
	// Проверяем максимальную скорость
	distance := v.distance(serverPos, clientPos)
	maxDistance := v.maxSpeed * deltaTime * 2 // x2 для учета lag

	if distance > maxDistance {
		return fmt.Errorf("position drift too large: %.2f > %.2f (possible teleport hack)", distance, maxDistance)
	}

	return nil
}

func (v *InputValidator) CheckSuspiciousActivity(playerID string) (bool, string) {
	history, exists := v.playerInputHistory[playerID]
	if !exists {
		return false, ""
	}

	// Проверяем количество подозрительных действий
	if history.SuspiciousCount > 10 {
		return true, "too many suspicious inputs detected"
	}

	return false, ""
}

func (v *InputValidator) checkInputRate(history *InputHistory, now time.Time) error {
	// Сброс счетчика если прошло окно
	if now.Sub(history.WindowStart) > v.inputRateWindow {
		history.InputCount = 0
		history.WindowStart = now
	}

	history.InputCount++

	if history.InputCount > v.maxInputRate {
		history.SuspiciousCount++
		return fmt.Errorf("input rate too high: %d > %d (possible bot)", history.InputCount, v.maxInputRate)
	}

	return nil
}

func (v *InputValidator) checkDirection(direction protocol.Vector2) error {
	// Проверяем что направление нормализовано
	length := direction.Length()
	
	if length > 1.5 {
		return fmt.Errorf("invalid direction length: %.2f (must be <= 1.0)", length)
	}

	return nil
}

func (v *InputValidator) checkDirectionChange(history *InputHistory, newDirection protocol.Vector2) error {
	if history.LastDirection.X == 0 && history.LastDirection.Y == 0 {
		return nil // первый input
	}

	// Вычисляем угол между направлениями
	dot := history.LastDirection.X*newDirection.X + history.LastDirection.Y*newDirection.Y
	angle := float32(math.Acos(float64(dot)))

	// Если угол слишком большой за короткое время - подозрительно
	timeDelta := time.Since(history.LastInputTime).Seconds()
	if timeDelta < 0.1 && angle > v.maxDirectionChange {
		history.SuspiciousCount++
		// Не блокируем, но отмечаем
	}

	return nil
}

func (v *InputValidator) updateHistory(history *InputHistory, now time.Time, pos, dir protocol.Vector2) {
	history.LastInputTime = now
	history.LastPosition = pos
	history.LastDirection = dir
}

func (v *InputValidator) getOrCreateHistory(playerID string) *InputHistory {
	if history, exists := v.playerInputHistory[playerID]; exists {
		return history
	}

	history := &InputHistory{
		WindowStart: time.Now(),
	}
	v.playerInputHistory[playerID] = history
	return history
}

func (v *InputValidator) distance(a, b protocol.Vector2) float32 {
	dx := a.X - b.X
	dy := a.Y - b.Y
	return float32(math.Sqrt(float64(dx*dx + dy*dy)))
}

func (v *InputValidator) CleanupPlayer(playerID string) {
	delete(v.playerInputHistory, playerID)
}

// Territory validation

type TerritoryValidator struct {
	maxCapturePerTick int
	maxTerritoryPct   float32
}

func NewTerritoryValidator() *TerritoryValidator {
	return &TerritoryValidator{
		maxCapturePerTick: 1000, // максимум ячеек за тик
		maxTerritoryPct:   100.0,
	}
}

func (v *TerritoryValidator) ValidateCapture(cellsCaptured int, newTerritoryPct float32) error {
	if cellsCaptured > v.maxCapturePerTick {
		return fmt.Errorf("too many cells captured: %d > %d (possible territory hack)", 
			cellsCaptured, v.maxCapturePerTick)
	}

	if newTerritoryPct > v.maxTerritoryPct {
		return fmt.Errorf("territory percentage too high: %.2f > %.2f", 
			newTerritoryPct, v.maxTerritoryPct)
	}

	return nil
}

func (v *TerritoryValidator) ValidateTrailLength(trailLength int, timeAlive time.Duration) error {
	// Максимальная длина trail основана на времени жизни
	maxTrailLength := int(timeAlive.Seconds() * 60) // 60 точек в секунду
	
	if trailLength > maxTrailLength*2 {
		return fmt.Errorf("trail too long: %d > %d (possible memory hack)", 
			trailLength, maxTrailLength)
	}

	return nil
}
