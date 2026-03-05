package analytics

import (
	"context"
	"time"

	"github.com/stexiel/sparkaph/pkg/db"
	"go.uber.org/zap"
)

type AnalyticsTracker struct {
	redis  *db.RedisCache
	logger *zap.Logger
}

func NewAnalyticsTracker(redis *db.RedisCache, logger *zap.Logger) *AnalyticsTracker {
	return &AnalyticsTracker{
		redis:  redis,
		logger: logger,
	}
}

// Event tracking

type Event struct {
	Name       string
	PlayerID   string
	Properties map[string]interface{}
	Timestamp  time.Time
}

func (a *AnalyticsTracker) TrackEvent(ctx context.Context, event Event) {
	event.Timestamp = time.Now()
	
	// Increment event counter
	counterKey := "event:" + event.Name
	if err := a.redis.IncrementCounter(ctx, counterKey); err != nil {
		a.logger.Error("Failed to increment event counter", 
			zap.String("event", event.Name), 
			zap.Error(err))
	}

	// Store event details (optional, for detailed analytics)
	// In production, you'd send this to analytics service like Mixpanel, Amplitude, etc.
	
	a.logger.Debug("Event tracked",
		zap.String("event", event.Name),
		zap.String("playerId", event.PlayerID),
	)
}

// Player lifecycle events

func (a *AnalyticsTracker) TrackPlayerConnected(ctx context.Context, playerID string, platform string) {
	a.TrackEvent(ctx, Event{
		Name:     "player_connected",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"platform": platform,
		},
	})
}

func (a *AnalyticsTracker) TrackPlayerDisconnected(ctx context.Context, playerID string, sessionDuration time.Duration) {
	a.TrackEvent(ctx, Event{
		Name:     "player_disconnected",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"session_duration_seconds": sessionDuration.Seconds(),
		},
	})
}

// Match events

func (a *AnalyticsTracker) TrackMatchStarted(ctx context.Context, matchID string, mode string, playerCount int) {
	a.TrackEvent(ctx, Event{
		Name:     "match_started",
		PlayerID: "",
		Properties: map[string]interface{}{
			"match_id":     matchID,
			"mode":         mode,
			"player_count": playerCount,
		},
	})
}

func (a *AnalyticsTracker) TrackMatchEnded(ctx context.Context, matchID string, duration time.Duration, winnerID string) {
	a.TrackEvent(ctx, Event{
		Name:     "match_ended",
		PlayerID: winnerID,
		Properties: map[string]interface{}{
			"match_id":         matchID,
			"duration_seconds": duration.Seconds(),
		},
	})
}

func (a *AnalyticsTracker) TrackPlayerKill(ctx context.Context, killerID, victimID string) {
	a.TrackEvent(ctx, Event{
		Name:     "player_kill",
		PlayerID: killerID,
		Properties: map[string]interface{}{
			"victim_id": victimID,
		},
	})
}

func (a *AnalyticsTracker) TrackTerritoryCapture(ctx context.Context, playerID string, cellsCaptured int, newPercentage float32) {
	a.TrackEvent(ctx, Event{
		Name:     "territory_captured",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"cells_captured": cellsCaptured,
			"new_percentage": newPercentage,
		},
	})
}

// Retention metrics

func (a *AnalyticsTracker) TrackDailyActiveUser(ctx context.Context, playerID string) {
	date := time.Now().Format("2006-01-02")
	key := "dau:" + date
	
	// Add to set of daily active users
	if err := a.redis.Set(ctx, key+":"+playerID, true, 25*time.Hour); err != nil {
		a.logger.Error("Failed to track DAU", zap.Error(err))
	}
}

func (a *AnalyticsTracker) GetDAU(ctx context.Context, date time.Time) (int64, error) {
	// In production, you'd query all keys for the date
	// For now, return from counter
	dateStr := date.Format("2006-01-02")
	return a.redis.GetCounter(ctx, "dau:"+dateStr)
}

// Performance metrics

func (a *AnalyticsTracker) TrackServerPerformance(ctx context.Context, metrics ServerMetrics) {
	a.redis.SetMetric(ctx, "server:cpu", metrics.CPUUsage, 5*time.Minute)
	a.redis.SetMetric(ctx, "server:memory", metrics.MemoryUsage, 5*time.Minute)
	a.redis.SetMetric(ctx, "server:active_matches", metrics.ActiveMatches, 5*time.Minute)
	a.redis.SetMetric(ctx, "server:active_players", metrics.ActivePlayers, 5*time.Minute)
}

type ServerMetrics struct {
	CPUUsage      float64
	MemoryUsage   float64
	ActiveMatches int
	ActivePlayers int
	AvgTickRate   float64
}

// Revenue tracking (for future monetization)

func (a *AnalyticsTracker) TrackAdImpression(ctx context.Context, playerID string, adType string) {
	a.TrackEvent(ctx, Event{
		Name:     "ad_impression",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"ad_type": adType,
		},
	})
}

func (a *AnalyticsTracker) TrackAdClick(ctx context.Context, playerID string, adType string) {
	a.TrackEvent(ctx, Event{
		Name:     "ad_click",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"ad_type": adType,
		},
	})
}

func (a *AnalyticsTracker) TrackPurchase(ctx context.Context, playerID string, itemID string, price float64) {
	a.TrackEvent(ctx, Event{
		Name:     "purchase",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"item_id": itemID,
			"price":   price,
		},
	})
}

// Funnel tracking

func (a *AnalyticsTracker) TrackFunnelStep(ctx context.Context, playerID string, step string) {
	a.TrackEvent(ctx, Event{
		Name:     "funnel_step",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"step": step,
		},
	})
}

// Error tracking

func (a *AnalyticsTracker) TrackError(ctx context.Context, errorType string, errorMsg string, playerID string) {
	a.TrackEvent(ctx, Event{
		Name:     "error",
		PlayerID: playerID,
		Properties: map[string]interface{}{
			"error_type":    errorType,
			"error_message": errorMsg,
		},
	})
	
	a.logger.Error("Error tracked",
		zap.String("type", errorType),
		zap.String("message", errorMsg),
		zap.String("playerId", playerID),
	)
}
