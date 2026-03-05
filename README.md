# Sparkaph - Scalable Multiplayer Territory Game

## Architecture Overview

Production-ready multiplayer game designed to scale from 10 players to 10M MAU.

### Tech Stack
- **Backend:** Go 1.21+ (high performance, low latency)
- **Database:** PostgreSQL 15+ (persistent data) + Redis 7+ (real-time state)
- **Client:** Unity 2022 LTS + C#
- **Protocol:** WebSocket with binary protocol (MessagePack)
- **Deployment:** Docker + Kubernetes (auto-scaling)

### Key Metrics Target
- 10M MAU (Monthly Active Users)
- ~500K DAU (Daily Active Users)
- ~50K CCU (Concurrent Users at peak)
- ~2,000 simultaneous matches
- 60 tick/sec server update rate
- <50ms latency (regional servers)

## Project Structure

```
Sparkaph/
├── server/                 # Go backend
│   ├── cmd/
│   │   ├── gameserver/    # Game server (authoritative)
│   │   ├── matchmaker/    # Matchmaking service
│   │   └── gateway/       # WebSocket gateway
│   ├── pkg/
│   │   ├── game/          # Core game logic
│   │   ├── territory/     # Territory calculation
│   │   ├── physics/       # Collision detection
│   │   ├── protocol/      # Network protocol
│   │   └── db/            # Database layer
│   └── migrations/        # SQL migrations
├── client/                # Unity project
│   ├── Assets/
│   │   ├── Scripts/
│   │   │   ├── Network/   # WebSocket client
│   │   │   ├── Game/      # Game logic
│   │   │   ├── UI/        # User interface
│   │   │   └── Controllers/
│   │   └── Scenes/
│   └── Packages/
├── infrastructure/        # DevOps
│   ├── docker/
│   ├── k8s/              # Kubernetes configs
│   └── terraform/        # Infrastructure as code
└── docs/                 # Documentation
```

## Game Modes

### 1. Arena Mode (Ranked)
- Limited map (1000x1000 grid)
- 20 players per match
- 2-3 minute matches
- Win condition: 50% territory OR last survivor
- Modes: Solo / Duo / Squad

### 2. Infinite Mode (Casual)
- Unlimited map (procedurally generated)
- 50-200 players per server
- No time limit
- Leaderboard based on territory %

## Scaling Strategy

### Phase 1: MVP (0-1K CCU)
- 1 server instance
- Single region
- Cost: ~$50/month

### Phase 2: Growth (1K-10K CCU)
- 5-10 server instances
- 2 regions (US, EU)
- Auto-scaling enabled
- Cost: ~$500/month

### Phase 3: Scale (10K-50K CCU)
- 50-100 server instances
- 3-5 regions
- Redis cluster
- PostgreSQL read replicas
- Cost: ~$2,000/month

### Phase 4: Massive (50K-100K CCU)
- 200-500 server instances
- Global distribution
- Full Kubernetes orchestration
- Cost: ~$5,000-10,000/month

## Development Roadmap

### Week 1-2: Core Mechanics
- [ ] Basic territory system
- [ ] Player movement
- [ ] Collision detection
- [ ] Territory capture algorithm

### Week 3-4: Multiplayer Foundation
- [ ] WebSocket protocol
- [ ] Authoritative server
- [ ] Client-side prediction
- [ ] State synchronization

### Week 5-6: Game Modes
- [ ] Arena mode (Solo)
- [ ] Matchmaking system
- [ ] Win conditions
- [ ] Leaderboards

### Week 7-8: Polish & Deploy
- [ ] UI/UX
- [ ] Mobile optimization
- [ ] Deployment pipeline
- [ ] Beta testing

## Quick Start

### Prerequisites
- Go 1.21+
- PostgreSQL 15+
- Redis 7+
- Unity 2022 LTS
- Docker (optional)

### Running Locally

```bash
# 1. Start database
docker-compose up -d postgres redis

# 2. Run migrations
cd server
go run cmd/migrate/main.go up

# 3. Start game server
go run cmd/gameserver/main.go

# 4. Start matchmaker
go run cmd/matchmaker/main.go

# 5. Open Unity project
# Open client/ folder in Unity
# Press Play
```

## Performance Targets

- Server tick rate: 60 Hz
- Client update rate: 30-60 FPS
- Network bandwidth: <10 KB/s per player
- Server CPU: <5% per match (20 players)
- Server RAM: <50 MB per match
- Database queries: <10ms p99

## License

Proprietary - Stexiel Corporation
