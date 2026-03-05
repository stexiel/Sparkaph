# Getting Started with Sparkaph Development

## Prerequisites

### Required Software

1. **Go 1.21+**
   - Download: https://go.dev/dl/
   - Verify: `go version`

2. **PostgreSQL 15+**
   - Download: https://www.postgresql.org/download/
   - Or use Docker (recommended)

3. **Redis 7+**
   - Download: https://redis.io/download/
   - Or use Docker (recommended)

4. **Unity 2022 LTS**
   - Download: https://unity.com/download
   - Required modules: iOS Build Support, Android Build Support

5. **Docker** (optional but recommended)
   - Download: https://www.docker.com/get-started

---

## Quick Start (5 minutes)

### Option 1: Using Docker (Easiest)

```bash
# Clone repository
cd "c:/Users/Aser/Downloads/CATEC/Stexiel Corparation/Sparkaph"

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f gameserver

# Server is now running on http://localhost:8080
```

### Option 2: Manual Setup

```bash
# 1. Start PostgreSQL
# Create database
createdb sparkaph

# Run migrations
cd server
psql sparkaph < migrations/001_initial_schema.sql

# 2. Start Redis
redis-server

# 3. Install Go dependencies
cd server
go mod download

# 4. Run game server
go run cmd/gameserver/main.go
```

---

## Development Setup

### Backend (Go)

```bash
cd server

# Install dependencies
go mod download

# Run tests
go test ./...

# Run with hot reload (install air first)
go install github.com/cosmtrek/air@latest
air

# Build for production
go build -o bin/gameserver cmd/gameserver/main.go
```

### Frontend (Unity)

```bash
# 1. Open Unity Hub
# 2. Add project: client/
# 3. Open with Unity 2022 LTS
# 4. Open scene: Assets/Scenes/MainMenu.unity
# 5. Press Play
```

---

## Project Structure Explained

```
Sparkaph/
├── server/                    # Go backend
│   ├── cmd/                   # Entry points
│   │   └── gameserver/        # Main game server
│   ├── pkg/                   # Packages
│   │   ├── config/            # Configuration
│   │   ├── game/              # Game logic
│   │   │   ├── player.go      # Player entity
│   │   │   ├── match.go       # Match orchestration
│   │   │   └── grid.go        # Territory grid
│   │   ├── matchmaker/        # Matchmaking
│   │   └── protocol/          # Network protocol
│   └── migrations/            # Database migrations
│
├── client/                    # Unity project
│   └── Assets/
│       ├── Scripts/
│       │   ├── Network/       # WebSocket client
│       │   ├── Game/          # Game controllers
│       │   └── UI/            # User interface
│       └── Scenes/
│
├── infrastructure/            # DevOps
│   ├── docker/
│   └── k8s/
│
└── docs/                      # Documentation
```

---

## Configuration

### Environment Variables

Create `.env` file in `server/`:

```bash
# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_REGION=us-east

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=sparkaph
DB_PASSWORD=your_password
DB_NAME=sparkaph
DB_SSLMODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Game
GAME_TICK_RATE=60
MAX_PLAYERS_PER_MATCH=20
MAP_SIZE=1000
MATCH_DURATION_SEC=180
```

### Unity Configuration

Edit `Assets/Resources/GameConfig.asset`:

```
Server URL: ws://localhost:8080/ws
Tick Rate: 60
Map Size: 1000
```

---

## Testing

### Backend Tests

```bash
cd server

# Unit tests
go test ./pkg/game/...
go test ./pkg/matchmaker/...

# Integration tests
go test ./tests/integration/...

# Benchmark tests
go test -bench=. ./pkg/game/...
```

### Load Testing

```bash
# Simulate 100 concurrent players
go run cmd/loadtest/main.go -players 100 -duration 60s

# Expected output:
# Players connected: 100
# Matches created: 5
# Average latency: 25ms
# Packet loss: 0.1%
```

### Unity Tests

```
1. Open Unity Test Runner (Window > General > Test Runner)
2. Run PlayMode tests
3. Run EditMode tests
```

---

## Common Tasks

### Add New Game Mode

1. **Define mode in protocol:**
```go
// server/pkg/protocol/messages.go
const ModeCustom GameMode = "custom"
```

2. **Add to matchmaker:**
```go
// server/pkg/matchmaker/matchmaker.go
queues[ModeCustom] = &Queue{Mode: ModeCustom}
```

3. **Update Unity UI:**
```csharp
// client/Assets/Scripts/UI/ModeSelector.cs
public enum GameMode { Solo, Duo, Squad, Custom }
```

### Modify Territory Calculation

Edit: `server/pkg/game/grid.go`

```go
func (g *TerritoryGrid) FloodFill(player *Player) int {
    // Your custom algorithm here
}
```

### Change Match Duration

```bash
# In .env
MATCH_DURATION_SEC=300  # 5 minutes
```

Or in code:
```go
// server/pkg/game/match.go
MaxDuration: 300 * time.Second
```

### Add Power-ups

1. **Define power-up type:**
```go
// server/pkg/game/powerup.go
type PowerUpType int
const (
    PowerUpSpeed PowerUpType = iota
    PowerUpShield
)
```

2. **Spawn logic:**
```go
// In match.go update()
if m.Tick % 600 == 0 { // Every 10 seconds
    m.spawnPowerUp()
}
```

3. **Client rendering:**
```csharp
// Unity: PowerUpRenderer.cs
void RenderPowerUp(PowerUp powerUp) {
    // Instantiate prefab
}
```

---

## Debugging

### Server Debugging

```bash
# Enable debug logs
export LOG_LEVEL=debug
go run cmd/gameserver/main.go

# Use delve debugger
dlv debug cmd/gameserver/main.go
```

### Unity Debugging

1. Attach Visual Studio to Unity
2. Set breakpoints in C# code
3. Play in Editor
4. Debug → Attach to Unity

### Network Debugging

```bash
# Monitor WebSocket traffic
wscat -c ws://localhost:8080/ws

# Send test message
{"type": 1, "data": {...}}

# View server metrics
curl http://localhost:8080/metrics
```

---

## Deployment

### Deploy to VPS (Hetzner)

```bash
# 1. Build binary
GOOS=linux GOARCH=amd64 go build -o gameserver cmd/gameserver/main.go

# 2. Copy to server
scp gameserver user@your-server:/opt/sparkaph/

# 3. SSH and run
ssh user@your-server
cd /opt/sparkaph
./gameserver
```

### Deploy with Docker

```bash
# Build image
docker build -t sparkaph-server:latest .

# Run container
docker run -d \
  -p 8080:8080 \
  -e DB_HOST=postgres \
  -e REDIS_HOST=redis \
  sparkaph-server:latest
```

### Deploy to Kubernetes

```bash
# Apply configs
kubectl apply -f infrastructure/k8s/

# Check status
kubectl get pods
kubectl logs -f deployment/sparkaph-gameserver

# Scale
kubectl scale deployment/sparkaph-gameserver --replicas=10
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
# Response: OK
```

### Metrics

```bash
curl http://localhost:8080/metrics
# {
#   "active_connections": 150,
#   "active_matches": 8,
#   "queue_solo": 12
# }
```

### Logs

```bash
# Docker
docker-compose logs -f gameserver

# Kubernetes
kubectl logs -f deployment/sparkaph-gameserver

# Local
tail -f /var/log/sparkaph/server.log
```

---

## Troubleshooting

### "Connection refused"

```bash
# Check if server is running
curl http://localhost:8080/health

# Check firewall
sudo ufw allow 8080

# Check Docker
docker-compose ps
```

### "Database connection failed"

```bash
# Check PostgreSQL
psql -U sparkaph -d sparkaph -c "SELECT 1"

# Check credentials in .env
cat .env | grep DB_

# Reset database
dropdb sparkaph
createdb sparkaph
psql sparkaph < migrations/001_initial_schema.sql
```

### "Redis connection failed"

```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### "Unity can't connect to server"

1. Check server URL in GameConfig
2. Verify server is running: `curl http://localhost:8080/health`
3. Check Unity console for errors
4. Try WebSocket test: `wscat -c ws://localhost:8080/ws`

---

## Performance Tips

### Server Optimization

```go
// Use sync.Pool for frequently allocated objects
var playerPool = sync.Pool{
    New: func() interface{} {
        return &Player{}
    },
}

// Reuse slices
trail := trail[:0]  // Clear without reallocation
```

### Unity Optimization

```csharp
// Object pooling
public class ObjectPool {
    Queue<GameObject> pool = new Queue<GameObject>();
    
    public GameObject Get() {
        return pool.Count > 0 ? pool.Dequeue() : Instantiate(prefab);
    }
}

// Batch rendering
Graphics.DrawMeshInstanced(mesh, 0, material, matrices);
```

---

## Next Steps

1. ✅ Set up development environment
2. ✅ Run local server
3. ✅ Open Unity project
4. ⬜ Implement basic movement
5. ⬜ Add territory capture
6. ⬜ Test multiplayer locally
7. ⬜ Deploy to VPS
8. ⬜ Launch beta

---

## Getting Help

- **Documentation:** `/docs`
- **Issues:** Create GitHub issue
- **Discord:** (TODO: Add community server)
- **Email:** dev@stexiel.com
