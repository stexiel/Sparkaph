package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Connection metrics
	ActiveConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "sparkaph_active_connections",
		Help: "Number of active WebSocket connections",
	})

	TotalConnections = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sparkaph_total_connections",
		Help: "Total number of connections since server start",
	})

	// Match metrics
	ActiveMatches = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "sparkaph_active_matches",
		Help: "Number of currently active matches",
	})

	TotalMatches = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sparkaph_total_matches",
		Help: "Total number of matches since server start",
	})

	MatchDuration = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "sparkaph_match_duration_seconds",
		Help:    "Match duration in seconds",
		Buckets: prometheus.LinearBuckets(60, 30, 10), // 60s to 330s in 30s increments
	})

	// Player metrics
	ActivePlayers = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "sparkaph_active_players",
		Help: "Number of currently active players",
	})

	PlayersPerMatch = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "sparkaph_players_per_match",
		Help:    "Number of players per match",
		Buckets: prometheus.LinearBuckets(5, 5, 8), // 5 to 40 in steps of 5
	})

	// Queue metrics
	QueueSize = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "sparkaph_queue_size",
		Help: "Number of players in matchmaking queue",
	}, []string{"mode"})

	QueueWaitTime = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "sparkaph_queue_wait_seconds",
		Help:    "Time spent waiting in queue",
		Buckets: prometheus.ExponentialBuckets(1, 2, 10), // 1s to 512s
	}, []string{"mode"})

	// Game metrics
	PlayerKills = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sparkaph_player_kills_total",
		Help: "Total number of player kills",
	})

	TerritoryCaptures = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sparkaph_territory_captures_total",
		Help: "Total number of territory captures",
	})

	// Network metrics
	MessagesSent = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "sparkaph_messages_sent_total",
		Help: "Total number of messages sent",
	}, []string{"type"})

	MessagesReceived = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "sparkaph_messages_received_total",
		Help: "Total number of messages received",
	}, []string{"type"})

	MessageSize = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "sparkaph_message_size_bytes",
		Help:    "Size of messages in bytes",
		Buckets: prometheus.ExponentialBuckets(100, 2, 10), // 100B to 51.2KB
	}, []string{"type"})

	NetworkLatency = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "sparkaph_network_latency_ms",
		Help:    "Network latency in milliseconds",
		Buckets: prometheus.LinearBuckets(10, 10, 20), // 10ms to 200ms
	})

	// Server performance
	ServerTickRate = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "sparkaph_server_tick_rate",
		Help: "Current server tick rate (Hz)",
	})

	CPUUsage = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "sparkaph_cpu_usage_percent",
		Help: "CPU usage percentage",
	})

	MemoryUsage = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "sparkaph_memory_usage_bytes",
		Help: "Memory usage in bytes",
	})

	GoroutineCount = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "sparkaph_goroutines",
		Help: "Number of goroutines",
	})

	// Error metrics
	Errors = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "sparkaph_errors_total",
		Help: "Total number of errors",
	}, []string{"type"})

	// Anti-cheat metrics
	SuspiciousActivities = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "sparkaph_suspicious_activities_total",
		Help: "Total number of suspicious activities detected",
	}, []string{"type"})

	BannedPlayers = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sparkaph_banned_players_total",
		Help: "Total number of banned players",
	})

	// Database metrics
	DatabaseQueries = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "sparkaph_database_queries_total",
		Help: "Total number of database queries",
	}, []string{"operation"})

	DatabaseQueryDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "sparkaph_database_query_duration_seconds",
		Help:    "Database query duration",
		Buckets: prometheus.ExponentialBuckets(0.001, 2, 10), // 1ms to 512ms
	}, []string{"operation"})

	// Cache metrics
	CacheHits = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sparkaph_cache_hits_total",
		Help: "Total number of cache hits",
	})

	CacheMisses = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sparkaph_cache_misses_total",
		Help: "Total number of cache misses",
	})
)

// Helper functions

func RecordMatchStart(mode string, playerCount int) {
	ActiveMatches.Inc()
	TotalMatches.Inc()
	PlayersPerMatch.Observe(float64(playerCount))
}

func RecordMatchEnd(durationSeconds float64) {
	ActiveMatches.Dec()
	MatchDuration.Observe(durationSeconds)
}

func RecordPlayerConnection() {
	ActiveConnections.Inc()
	TotalConnections.Inc()
	ActivePlayers.Inc()
}

func RecordPlayerDisconnection() {
	ActiveConnections.Dec()
	ActivePlayers.Dec()
}

func RecordQueueJoin(mode string) {
	QueueSize.WithLabelValues(mode).Inc()
}

func RecordQueueLeave(mode string, waitTimeSeconds float64) {
	QueueSize.WithLabelValues(mode).Dec()
	QueueWaitTime.WithLabelValues(mode).Observe(waitTimeSeconds)
}

func RecordMessageSent(msgType string, sizeBytes int) {
	MessagesSent.WithLabelValues(msgType).Inc()
	MessageSize.WithLabelValues(msgType).Observe(float64(sizeBytes))
}

func RecordMessageReceived(msgType string, sizeBytes int) {
	MessagesReceived.WithLabelValues(msgType).Inc()
	MessageSize.WithLabelValues(msgType).Observe(float64(sizeBytes))
}

func RecordError(errorType string) {
	Errors.WithLabelValues(errorType).Inc()
}

func RecordSuspiciousActivity(activityType string) {
	SuspiciousActivities.WithLabelValues(activityType).Inc()
}

func RecordDatabaseQuery(operation string, durationSeconds float64) {
	DatabaseQueries.WithLabelValues(operation).Inc()
	DatabaseQueryDuration.WithLabelValues(operation).Observe(durationSeconds)
}
