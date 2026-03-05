package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Server    ServerConfig
	Database  DatabaseConfig
	Redis     RedisConfig
	Game      GameConfig
}

type ServerConfig struct {
	Host           string
	Port           int
	Region         string
	MaxConnections int
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxConns int
	MinConns int
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type GameConfig struct {
	TickRate           int           // Server tick rate (Hz)
	MaxPlayersPerMatch int           // Maximum players in one match
	MapSize            int           // Grid size (e.g., 1000x1000)
	MatchDuration      time.Duration // Max match duration
	MovementSpeed      float64       // Player movement speed
	TrailWidth         int           // Width of player trail
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Host:           getEnv("SERVER_HOST", "0.0.0.0"),
			Port:           getEnvInt("SERVER_PORT", 8080),
			Region:         getEnv("SERVER_REGION", "us-east"),
			MaxConnections: getEnvInt("MAX_CONNECTIONS", 10000),
			ReadTimeout:    time.Duration(getEnvInt("READ_TIMEOUT_SEC", 10)) * time.Second,
			WriteTimeout:   time.Duration(getEnvInt("WRITE_TIMEOUT_SEC", 10)) * time.Second,
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvInt("DB_PORT", 5432),
			User:     getEnv("DB_USER", "sparkaph"),
			Password: getEnv("DB_PASSWORD", "sparkaph_dev"),
			DBName:   getEnv("DB_NAME", "sparkaph"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			MaxConns: getEnvInt("DB_MAX_CONNS", 100),
			MinConns: getEnvInt("DB_MIN_CONNS", 10),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		Game: GameConfig{
			TickRate:           getEnvInt("GAME_TICK_RATE", 60),
			MaxPlayersPerMatch: getEnvInt("MAX_PLAYERS_PER_MATCH", 20),
			MapSize:            getEnvInt("MAP_SIZE", 1000),
			MatchDuration:      time.Duration(getEnvInt("MATCH_DURATION_SEC", 180)) * time.Second,
			MovementSpeed:      getEnvFloat("MOVEMENT_SPEED", 5.0),
			TrailWidth:         getEnvInt("TRAIL_WIDTH", 2),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
			return floatVal
		}
	}
	return defaultValue
}
