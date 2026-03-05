package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"go.uber.org/zap"
)

type PostgresDB struct {
	db     *sql.DB
	logger *zap.Logger
}

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxConns int
	MinConns int
}

func NewPostgresDB(cfg Config, logger *zap.Logger) (*PostgresDB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(cfg.MaxConns)
	db.SetMaxIdleConns(cfg.MinConns)
	db.SetConnMaxLifetime(time.Hour)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Connected to PostgreSQL",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
		zap.String("database", cfg.DBName),
	)

	return &PostgresDB{
		db:     db,
		logger: logger,
	}, nil
}

func (p *PostgresDB) Close() error {
	return p.db.Close()
}

func (p *PostgresDB) DB() *sql.DB {
	return p.db
}

func (p *PostgresDB) HealthCheck(ctx context.Context) error {
	return p.db.PingContext(ctx)
}

// User operations

type User struct {
	ID                      string
	Username                string
	CreatedAt               time.Time
	LastLogin               *time.Time
	TotalMatches            int
	TotalWins               int
	TotalKills              int
	TotalDeaths             int
	TotalTerritoryCaptured  int64
	HighestTerritoryPercent float64
	CurrentRating           int
	DeviceID                string
	Platform                string
}

func (p *PostgresDB) CreateUser(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (id, username, device_id, platform, current_rating)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (id) DO UPDATE SET last_login = NOW()
		RETURNING created_at
	`

	err := p.db.QueryRowContext(
		ctx, query,
		user.ID, user.Username, user.DeviceID, user.Platform, user.CurrentRating,
	).Scan(&user.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	p.logger.Info("User created", zap.String("userId", user.ID), zap.String("username", user.Username))
	return nil
}

func (p *PostgresDB) GetUser(ctx context.Context, userID string) (*User, error) {
	query := `
		SELECT id, username, created_at, last_login, total_matches, total_wins,
		       total_kills, total_deaths, total_territory_captured,
		       highest_territory_percent, current_rating, device_id, platform
		FROM users
		WHERE id = $1
	`

	user := &User{}
	err := p.db.QueryRowContext(ctx, query, userID).Scan(
		&user.ID, &user.Username, &user.CreatedAt, &user.LastLogin,
		&user.TotalMatches, &user.TotalWins, &user.TotalKills, &user.TotalDeaths,
		&user.TotalTerritoryCaptured, &user.HighestTerritoryPercent,
		&user.CurrentRating, &user.DeviceID, &user.Platform,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (p *PostgresDB) UpdateUserLastLogin(ctx context.Context, userID string) error {
	query := `UPDATE users SET last_login = NOW() WHERE id = $1`
	_, err := p.db.ExecContext(ctx, query, userID)
	return err
}

// Match operations

type Match struct {
	ID            string
	Mode          string
	MapSize       int
	StartedAt     time.Time
	EndedAt       *time.Time
	DurationSecs  *int
	TotalPlayers  int
	WinnerID      *string
	ServerRegion  string
}

func (p *PostgresDB) CreateMatch(ctx context.Context, match *Match) error {
	query := `
		INSERT INTO matches (id, mode, map_size, total_players, server_region)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING started_at
	`

	err := p.db.QueryRowContext(
		ctx, query,
		match.ID, match.Mode, match.MapSize, match.TotalPlayers, match.ServerRegion,
	).Scan(&match.StartedAt)

	if err != nil {
		return fmt.Errorf("failed to create match: %w", err)
	}

	p.logger.Info("Match created",
		zap.String("matchId", match.ID),
		zap.String("mode", match.Mode),
		zap.Int("players", match.TotalPlayers),
	)
	return nil
}

func (p *PostgresDB) EndMatch(ctx context.Context, matchID string, winnerID *string, durationSecs int) error {
	query := `
		UPDATE matches
		SET ended_at = NOW(), winner_id = $2, duration_seconds = $3
		WHERE id = $1
	`

	_, err := p.db.ExecContext(ctx, query, matchID, winnerID, durationSecs)
	if err != nil {
		return fmt.Errorf("failed to end match: %w", err)
	}

	p.logger.Info("Match ended", zap.String("matchId", matchID))
	return nil
}

// Match results

type MatchResult struct {
	ID               string
	MatchID          string
	PlayerID         string
	TeamID           *string
	FinalRank        int
	TerritoryPercent float64
	Kills            int
	Deaths           int
	TimeAliveSecs    int
	MaxTerritoryPct  float64
	RatingChange     int
}

func (p *PostgresDB) SaveMatchResult(ctx context.Context, result *MatchResult) error {
	query := `
		INSERT INTO match_results (
			match_id, player_id, team_id, final_rank, territory_percent,
			kills, deaths, time_alive_seconds, max_territory_percent, rating_change
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`

	err := p.db.QueryRowContext(
		ctx, query,
		result.MatchID, result.PlayerID, result.TeamID, result.FinalRank,
		result.TerritoryPercent, result.Kills, result.Deaths,
		result.TimeAliveSecs, result.MaxTerritoryPct, result.RatingChange,
	).Scan(&result.ID)

	if err != nil {
		return fmt.Errorf("failed to save match result: %w", err)
	}

	return nil
}

func (p *PostgresDB) SaveMatchResults(ctx context.Context, results []*MatchResult) error {
	tx, err := p.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO match_results (
			match_id, player_id, team_id, final_rank, territory_percent,
			kills, deaths, time_alive_seconds, max_territory_percent, rating_change
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, result := range results {
		_, err := stmt.ExecContext(
			ctx,
			result.MatchID, result.PlayerID, result.TeamID, result.FinalRank,
			result.TerritoryPercent, result.Kills, result.Deaths,
			result.TimeAliveSecs, result.MaxTerritoryPct, result.RatingChange,
		)
		if err != nil {
			return fmt.Errorf("failed to insert result: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	p.logger.Info("Match results saved", zap.Int("count", len(results)))
	return nil
}

// Leaderboard

type LeaderboardEntry struct {
	PlayerID   string
	Username   string
	Rating     int
	Wins       int
	Matches    int
	WinRate    float64
	MaxTerrPct float64
	Rank       int
}

func (p *PostgresDB) GetLeaderboard(ctx context.Context, mode string, limit int) ([]*LeaderboardEntry, error) {
	query := `
		SELECT 
			u.id, u.username, u.current_rating, u.total_wins, u.total_matches,
			CASE WHEN u.total_matches > 0 
				THEN (u.total_wins::FLOAT / u.total_matches * 100)
				ELSE 0 
			END as win_rate,
			u.highest_territory_percent,
			ROW_NUMBER() OVER (ORDER BY u.current_rating DESC) as rank
		FROM users u
		WHERE u.total_matches >= 10
		ORDER BY u.current_rating DESC
		LIMIT $1
	`

	rows, err := p.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []*LeaderboardEntry
	for rows.Next() {
		entry := &LeaderboardEntry{}
		err := rows.Scan(
			&entry.PlayerID, &entry.Username, &entry.Rating,
			&entry.Wins, &entry.Matches, &entry.WinRate,
			&entry.MaxTerrPct, &entry.Rank,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

// Player session

type PlayerSession struct {
	ID            string
	PlayerID      string
	SessionToken  string
	StartedAt     time.Time
	LastHeartbeat time.Time
	EndedAt       *time.Time
	IPAddress     string
	ServerRegion  string
}

func (p *PostgresDB) CreateSession(ctx context.Context, session *PlayerSession) error {
	query := `
		INSERT INTO player_sessions (player_id, session_token, ip_address, server_region)
		VALUES ($1, $2, $3, $4)
		RETURNING id, started_at, last_heartbeat
	`

	err := p.db.QueryRowContext(
		ctx, query,
		session.PlayerID, session.SessionToken, session.IPAddress, session.ServerRegion,
	).Scan(&session.ID, &session.StartedAt, &session.LastHeartbeat)

	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}

	return nil
}

func (p *PostgresDB) UpdateSessionHeartbeat(ctx context.Context, sessionToken string) error {
	query := `UPDATE player_sessions SET last_heartbeat = NOW() WHERE session_token = $1`
	_, err := p.db.ExecContext(ctx, query, sessionToken)
	return err
}

func (p *PostgresDB) EndSession(ctx context.Context, sessionToken string) error {
	query := `UPDATE player_sessions SET ended_at = NOW() WHERE session_token = $1`
	_, err := p.db.ExecContext(ctx, query, sessionToken)
	return err
}

// Stats

type ServerStats struct {
	TotalUsers       int
	ActiveUsers      int
	TotalMatches     int
	MatchesToday     int
	AvgMatchDuration float64
}

func (p *PostgresDB) GetServerStats(ctx context.Context) (*ServerStats, error) {
	stats := &ServerStats{}

	// Total users
	err := p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&stats.TotalUsers)
	if err != nil {
		return nil, err
	}

	// Active users (logged in last 24h)
	err = p.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '24 hours'
	`).Scan(&stats.ActiveUsers)
	if err != nil {
		return nil, err
	}

	// Total matches
	err = p.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM matches`).Scan(&stats.TotalMatches)
	if err != nil {
		return nil, err
	}

	// Matches today
	err = p.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM matches WHERE started_at > CURRENT_DATE
	`).Scan(&stats.MatchesToday)
	if err != nil {
		return nil, err
	}

	// Average match duration
	err = p.db.QueryRowContext(ctx, `
		SELECT COALESCE(AVG(duration_seconds), 0) FROM matches WHERE duration_seconds IS NOT NULL
	`).Scan(&stats.AvgMatchDuration)
	if err != nil {
		return nil, err
	}

	return stats, nil
}
