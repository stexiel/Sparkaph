-- Initial database schema for Sparkaph

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    total_matches INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_kills INT DEFAULT 0,
    total_deaths INT DEFAULT 0,
    total_territory_captured BIGINT DEFAULT 0,
    highest_territory_percent FLOAT DEFAULT 0,
    current_rating INT DEFAULT 1000,
    device_id VARCHAR(255),
    platform VARCHAR(20)
);

-- Match history
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(20) NOT NULL, -- solo, duo, squad, arena, infinite
    map_size INT NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INT,
    total_players INT NOT NULL,
    winner_id UUID REFERENCES users(id),
    server_region VARCHAR(10)
);

-- Match participants and results
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id),
    team_id VARCHAR(50), -- for duo/squad modes
    final_rank INT NOT NULL,
    territory_percent FLOAT NOT NULL,
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    time_alive_seconds INT NOT NULL,
    max_territory_percent FLOAT,
    rating_change INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Leaderboards (materialized view for performance)
CREATE TABLE IF NOT EXISTS leaderboard_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES users(id),
    mode VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    wins INT DEFAULT 0,
    matches_played INT DEFAULT 0,
    avg_territory_percent FLOAT,
    total_kills INT DEFAULT 0,
    rating INT DEFAULT 1000,
    rank INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, mode, date)
);

-- Player sessions (for online tracking)
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_heartbeat TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    ip_address INET,
    server_region VARCHAR(10)
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rating ON users(current_rating DESC);
CREATE INDEX idx_matches_mode_started ON matches(mode, started_at DESC);
CREATE INDEX idx_match_results_player ON match_results(player_id, created_at DESC);
CREATE INDEX idx_match_results_match ON match_results(match_id);
CREATE INDEX idx_leaderboard_mode_date ON leaderboard_daily(mode, date, rating DESC);
CREATE INDEX idx_sessions_player ON player_sessions(player_id, started_at DESC);
CREATE INDEX idx_sessions_token ON player_sessions(session_token);

-- Function to update user stats after match
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET 
        total_matches = total_matches + 1,
        total_wins = total_wins + CASE WHEN NEW.final_rank = 1 THEN 1 ELSE 0 END,
        total_kills = total_kills + NEW.kills,
        total_deaths = total_deaths + NEW.deaths,
        total_territory_captured = total_territory_captured + (NEW.territory_percent * 1000)::BIGINT,
        highest_territory_percent = GREATEST(highest_territory_percent, NEW.territory_percent),
        current_rating = current_rating + NEW.rating_change
    WHERE id = NEW.player_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update user stats
CREATE TRIGGER trigger_update_user_stats
AFTER INSERT ON match_results
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- View for active players
CREATE OR REPLACE VIEW active_players AS
SELECT 
    u.id,
    u.username,
    u.current_rating,
    ps.server_region,
    ps.last_heartbeat
FROM users u
JOIN player_sessions ps ON u.id = ps.player_id
WHERE ps.ended_at IS NULL
  AND ps.last_heartbeat > NOW() - INTERVAL '5 minutes';

-- View for top players (leaderboard)
CREATE OR REPLACE VIEW top_players_solo AS
SELECT 
    u.id,
    u.username,
    u.current_rating,
    u.total_wins,
    u.total_matches,
    CASE WHEN u.total_matches > 0 
         THEN (u.total_wins::FLOAT / u.total_matches * 100)::NUMERIC(5,2)
         ELSE 0 
    END as win_rate,
    u.highest_territory_percent,
    ROW_NUMBER() OVER (ORDER BY u.current_rating DESC) as rank
FROM users u
WHERE u.total_matches >= 10
ORDER BY u.current_rating DESC
LIMIT 100;
