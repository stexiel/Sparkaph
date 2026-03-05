package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type RedisCache struct {
	client *redis.Client
	logger *zap.Logger
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

func NewRedisCache(cfg RedisConfig, logger *zap.Logger) (*RedisCache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logger.Info("Connected to Redis",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
	)

	return &RedisCache{
		client: client,
		logger: logger,
	}, nil
}

func (r *RedisCache) Close() error {
	return r.client.Close()
}

func (r *RedisCache) HealthCheck(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

// Match state operations

func (r *RedisCache) SetMatchState(ctx context.Context, matchID string, state interface{}, ttl time.Duration) error {
	data, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("failed to marshal match state: %w", err)
	}

	key := fmt.Sprintf("match:%s", matchID)
	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *RedisCache) GetMatchState(ctx context.Context, matchID string, state interface{}) error {
	key := fmt.Sprintf("match:%s", matchID)
	data, err := r.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return fmt.Errorf("match not found")
	}
	if err != nil {
		return err
	}

	return json.Unmarshal(data, state)
}

func (r *RedisCache) DeleteMatchState(ctx context.Context, matchID string) error {
	key := fmt.Sprintf("match:%s", matchID)
	return r.client.Del(ctx, key).Err()
}

// Player session operations

func (r *RedisCache) SetPlayerSession(ctx context.Context, playerID string, sessionData interface{}, ttl time.Duration) error {
	data, err := json.Marshal(sessionData)
	if err != nil {
		return fmt.Errorf("failed to marshal session: %w", err)
	}

	key := fmt.Sprintf("session:%s", playerID)
	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *RedisCache) GetPlayerSession(ctx context.Context, playerID string, sessionData interface{}) error {
	key := fmt.Sprintf("session:%s", playerID)
	data, err := r.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return fmt.Errorf("session not found")
	}
	if err != nil {
		return err
	}

	return json.Unmarshal(data, sessionData)
}

func (r *RedisCache) DeletePlayerSession(ctx context.Context, playerID string) error {
	key := fmt.Sprintf("session:%s", playerID)
	return r.client.Del(ctx, key).Err()
}

// Matchmaking queue operations

func (r *RedisCache) AddToQueue(ctx context.Context, queueName string, playerID string, score float64) error {
	key := fmt.Sprintf("queue:%s", queueName)
	return r.client.ZAdd(ctx, key, redis.Z{
		Score:  score,
		Member: playerID,
	}).Err()
}

func (r *RedisCache) RemoveFromQueue(ctx context.Context, queueName string, playerID string) error {
	key := fmt.Sprintf("queue:%s", queueName)
	return r.client.ZRem(ctx, key, playerID).Err()
}

func (r *RedisCache) GetQueuePlayers(ctx context.Context, queueName string, count int64) ([]string, error) {
	key := fmt.Sprintf("queue:%s", queueName)
	return r.client.ZRange(ctx, key, 0, count-1).Result()
}

func (r *RedisCache) GetQueueSize(ctx context.Context, queueName string) (int64, error) {
	key := fmt.Sprintf("queue:%s", queueName)
	return r.client.ZCard(ctx, key).Result()
}

// Leaderboard operations (real-time)

func (r *RedisCache) UpdateLeaderboard(ctx context.Context, mode string, playerID string, rating int) error {
	key := fmt.Sprintf("leaderboard:%s", mode)
	return r.client.ZAdd(ctx, key, redis.Z{
		Score:  float64(rating),
		Member: playerID,
	}).Err()
}

func (r *RedisCache) GetLeaderboardTop(ctx context.Context, mode string, count int64) ([]redis.Z, error) {
	key := fmt.Sprintf("leaderboard:%s", mode)
	return r.client.ZRevRangeWithScores(ctx, key, 0, count-1).Result()
}

func (r *RedisCache) GetPlayerRank(ctx context.Context, mode string, playerID string) (int64, error) {
	key := fmt.Sprintf("leaderboard:%s", mode)
	rank, err := r.client.ZRevRank(ctx, key, playerID).Result()
	if err == redis.Nil {
		return -1, nil
	}
	return rank + 1, err // +1 because rank is 0-indexed
}

// Active players tracking

func (r *RedisCache) AddActivePlayer(ctx context.Context, playerID string, serverRegion string) error {
	key := fmt.Sprintf("active:players:%s", serverRegion)
	return r.client.SAdd(ctx, key, playerID).Err()
}

func (r *RedisCache) RemoveActivePlayer(ctx context.Context, playerID string, serverRegion string) error {
	key := fmt.Sprintf("active:players:%s", serverRegion)
	return r.client.SRem(ctx, key, playerID).Err()
}

func (r *RedisCache) GetActivePlayerCount(ctx context.Context, serverRegion string) (int64, error) {
	key := fmt.Sprintf("active:players:%s", serverRegion)
	return r.client.SCard(ctx, key).Result()
}

func (r *RedisCache) GetTotalActivePlayerCount(ctx context.Context) (int64, error) {
	keys, err := r.client.Keys(ctx, "active:players:*").Result()
	if err != nil {
		return 0, err
	}

	var total int64
	for _, key := range keys {
		count, err := r.client.SCard(ctx, key).Result()
		if err != nil {
			continue
		}
		total += count
	}

	return total, nil
}

// Server metrics

func (r *RedisCache) IncrementCounter(ctx context.Context, counterName string) error {
	key := fmt.Sprintf("counter:%s", counterName)
	return r.client.Incr(ctx, key).Err()
}

func (r *RedisCache) GetCounter(ctx context.Context, counterName string) (int64, error) {
	key := fmt.Sprintf("counter:%s", counterName)
	return r.client.Get(ctx, key).Int64()
}

func (r *RedisCache) SetMetric(ctx context.Context, metricName string, value interface{}, ttl time.Duration) error {
	key := fmt.Sprintf("metric:%s", metricName)
	return r.client.Set(ctx, key, value, ttl).Err()
}

func (r *RedisCache) GetMetric(ctx context.Context, metricName string) (string, error) {
	key := fmt.Sprintf("metric:%s", metricName)
	return r.client.Get(ctx, key).Result()
}

// Rate limiting

func (r *RedisCache) CheckRateLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	rateLimitKey := fmt.Sprintf("ratelimit:%s", key)
	
	count, err := r.client.Incr(ctx, rateLimitKey).Result()
	if err != nil {
		return false, err
	}

	if count == 1 {
		r.client.Expire(ctx, rateLimitKey, window)
	}

	return count <= int64(limit), nil
}

// Pub/Sub for real-time events

func (r *RedisCache) Publish(ctx context.Context, channel string, message interface{}) error {
	data, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	return r.client.Publish(ctx, channel, data).Err()
}

func (r *RedisCache) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return r.client.Subscribe(ctx, channels...)
}

// Cache helpers

func (r *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, key, data, ttl).Err()
}

func (r *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := r.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return fmt.Errorf("key not found")
	}
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

func (r *RedisCache) Delete(ctx context.Context, keys ...string) error {
	return r.client.Del(ctx, keys...).Err()
}

func (r *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	count, err := r.client.Exists(ctx, key).Result()
	return count > 0, err
}
