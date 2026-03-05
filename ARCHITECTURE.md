# Sparkaph - Production Architecture

## Scalability Design: 10 Players → 10M MAU

### Core Principle: Horizontal Scaling

Архитектура спроектирована так, что **один game server = один матч**.
При росте нагрузки просто добавляем больше серверов.

```
10 игроков    = 1 server instance
100 игроков   = 5 server instances
1,000 игроков = 50 server instances
10,000 игроков = 500 server instances
100,000 игроков = 5,000 server instances
```

---

## Architecture Layers

### Layer 1: Client (Unity)

**Responsibilities:**
- Render graphics (60 FPS)
- Capture player input
- Send input to server (60 Hz)
- Receive game state updates
- Client-side prediction
- Interpolation for smooth movement

**Network Protocol:**
- WebSocket (binary)
- MessagePack serialization
- Delta compression

**Bandwidth per player:** ~5-10 KB/s

---

### Layer 2: Load Balancer (Global)

**Technology:** Cloudflare / Nginx

**Responsibilities:**
- SSL termination
- DDoS protection
- Geo-routing (closest region)
- Health checks
- Rate limiting

**Scaling:** Managed service, auto-scales

---

### Layer 3: Gateway Service

**Technology:** Go + Gorilla WebSocket

**Responsibilities:**
- Accept WebSocket connections
- Authenticate players
- Route to matchmaker
- Maintain player sessions

**Scaling:** 
- 1 instance handles ~10,000 concurrent connections
- Auto-scale based on connection count

---

### Layer 4: Matchmaker Service

**Technology:** Go + Redis

**Responsibilities:**
- Maintain queues (Solo/Duo/Squad/Arena/Infinite)
- Match players by rating (ELO)
- Allocate game servers
- Start matches

**Queue Logic:**
```
Solo Queue: 20 players → 1 match
Duo Queue: 10 teams (20 players) → 1 match
Squad Queue: 5 teams (20 players) → 1 match
```

**Scaling:**
- 1 instance handles ~1,000 matches/minute
- Stateless, can run multiple instances

---

### Layer 5: Game Server (Authoritative)

**Technology:** Go

**Responsibilities:**
- Run game loop (60 tick/sec)
- Validate all player actions
- Calculate physics & collisions
- Territory capture algorithm
- Broadcast state to all players
- Anti-cheat validation

**Performance per instance:**
- 1 match = 20 players
- CPU: ~2-5%
- RAM: ~50 MB
- Network: ~200 KB/s

**Scaling:**
- Each match runs in separate goroutine
- 1 server can run 100-200 matches (2,000-4,000 players)
- Auto-scale based on CPU/RAM

**Lifecycle:**
```
1. Matchmaker allocates server
2. Players connect
3. Match starts (3 min duration)
4. Match ends
5. Results saved to DB
6. Server goroutine terminates
```

---

### Layer 6: Database Layer

#### PostgreSQL (Persistent Data)

**Stores:**
- User profiles
- Match history
- Leaderboards (daily/weekly/all-time)
- Player statistics

**Scaling:**
- Master-slave replication
- Read replicas for leaderboards
- Partitioning by date (match_results table)

**Performance:**
- Writes: ~1,000 TPS (match results)
- Reads: ~10,000 TPS (leaderboards)

#### Redis (Real-time State)

**Stores:**
- Active player sessions
- Matchmaking queues
- Live leaderboards (sorted sets)
- Match state cache

**Scaling:**
- Redis Cluster (sharding)
- Separate clusters per region

---

## Scaling Phases

### Phase 1: MVP (0-1K CCU)

**Infrastructure:**
```
1x VPS (Hetzner CX31)
  - 2 vCPU, 8 GB RAM
  - Game Server + Matchmaker + Gateway
  - PostgreSQL + Redis

Cost: €10/month
Players: 1,000 CCU = 50 matches
```

### Phase 2: Growth (1K-10K CCU)

**Infrastructure:**
```
1x Load Balancer (Cloudflare - free)
3x App Servers (Hetzner CX41)
  - Each: 4 vCPU, 16 GB RAM
  - ~150 matches per server
1x PostgreSQL (managed, Hetzner)
1x Redis Cluster (3 nodes)

Cost: €150/month
Players: 10,000 CCU = 500 matches
```

### Phase 3: Scale (10K-50K CCU)

**Infrastructure:**
```
Multi-region deployment (US, EU, Asia)

Per region:
  - 5x App Servers (auto-scaling)
  - 1x Redis Cluster
  
Global:
  - 1x PostgreSQL Primary (US)
  - 2x PostgreSQL Read Replicas (EU, Asia)
  - CDN (Cloudflare)

Cost: €1,000-2,000/month
Players: 50,000 CCU = 2,500 matches
```

### Phase 4: Massive (50K-100K CCU)

**Infrastructure:**
```
Kubernetes (GKE/EKS)
  - Auto-scaling pods
  - 100-200 game server pods
  - 10-20 matchmaker pods
  - 5-10 gateway pods

Database:
  - PostgreSQL cluster (Patroni)
  - Redis Cluster (10+ nodes)
  - TimescaleDB for analytics

Monitoring:
  - Prometheus + Grafana
  - ELK stack (logs)
  - Sentry (errors)

Cost: €5,000-10,000/month
Players: 100,000 CCU = 5,000 matches
```

---

## Performance Calculations

### For 10M MAU:

**Assumptions:**
- 10M MAU
- 5% daily active = 500K DAU
- 10% concurrent = 50K CCU peak
- 80% in matches = 40K playing
- 20 players/match = 2,000 matches

**Server Requirements:**
```
Game Servers:
  - 2,000 matches / 100 matches per server = 20 servers
  - With auto-scaling buffer (2x) = 40 servers
  - Hetzner CX41 (€15/month) = €600/month

Matchmakers:
  - 5 instances (redundancy) = €75/month

Gateways:
  - 10 instances (5K connections each) = €150/month

Database:
  - PostgreSQL cluster = €200/month
  - Redis cluster = €150/month

Total: ~€1,200/month for 50K CCU
```

**Network Bandwidth:**
```
50,000 players × 10 KB/s = 500 MB/s = 4 Gbps
Monthly: ~130 TB

Cost: €0.01/GB = €1,300/month
```

**Total Infrastructure Cost for 10M MAU:**
- Servers: €1,200/month
- Bandwidth: €1,300/month
- **Total: ~€2,500/month**

---

## Anti-Cheat Strategy

### Server-Side Validation

**All game logic on server:**
- Client sends only input (direction)
- Server calculates position
- Server validates all actions

**Checks:**
1. Speed hacking: Validate movement distance
2. Teleportation: Check position delta
3. Territory manipulation: Server-side calculation only
4. Input flooding: Rate limiting

### Client-Side Protection

- Code obfuscation (IL2CPP)
- Anti-debugging
- Checksum validation

---

## Monitoring & Observability

### Key Metrics

**Server Health:**
- CPU usage per instance
- RAM usage per instance
- Active matches count
- Players per match

**Game Metrics:**
- Average match duration
- Player retention (D1, D7, D30)
- Matchmaking wait time
- Server tick rate (should be 60 Hz)

**Business Metrics:**
- DAU / MAU
- CCU (peak, average)
- Revenue per user
- Churn rate

### Alerts

```
Critical:
  - Server CPU > 90%
  - Database connection pool exhausted
  - Match creation failures

Warning:
  - Matchmaking queue > 60 seconds
  - Server tick rate < 55 Hz
  - Player disconnection rate > 10%
```

---

## Disaster Recovery

### Database Backups

- Automated daily backups (PostgreSQL)
- Point-in-time recovery (7 days)
- Cross-region replication

### Server Failures

- Health checks every 10 seconds
- Auto-restart failed instances
- Graceful match migration (TODO)

### DDoS Protection

- Cloudflare (Layer 7)
- Rate limiting (100 req/sec per IP)
- Connection limits (10 per IP)

---

## Development Workflow

### Local Development

```bash
# Start dependencies
docker-compose up -d postgres redis

# Run game server
cd server
go run cmd/gameserver/main.go

# Open Unity project
# Connect to localhost:8080
```

### Testing

```bash
# Unit tests
go test ./...

# Load testing (simulate 1000 players)
go run cmd/loadtest/main.go -players 1000

# Integration tests
go test ./tests/integration/...
```

### Deployment

```bash
# Build Docker image
docker build -t sparkaph-server:v1.0 .

# Push to registry
docker push registry.example.com/sparkaph-server:v1.0

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml

# Or deploy to VPS
scp gameserver user@server:/opt/sparkaph/
ssh user@server 'systemctl restart sparkaph'
```

---

## Security Considerations

### Authentication

- Guest mode: Device ID
- Registered: Email/password
- Social: Google/Apple Sign-In

### Data Protection

- HTTPS/WSS only
- Encrypted player data
- GDPR compliance (data deletion)

### Rate Limiting

```
Connection: 10/minute per IP
Messages: 100/second per connection
Match creation: 1/minute per player
```

---

## Cost Optimization

### Strategies

1. **Spot instances** for game servers (50% savings)
2. **Reserved instances** for databases (30% savings)
3. **CDN caching** for static assets
4. **Compression** for network traffic
5. **Auto-scaling** to match demand

### Estimated Costs by Scale

```
1K CCU:    €50/month
10K CCU:   €500/month
50K CCU:   €2,500/month
100K CCU:  €5,000/month
```

---

## Next Steps

1. **Week 1-2:** Implement core game mechanics (local)
2. **Week 3-4:** Add multiplayer (WebSocket + basic server)
3. **Week 5-6:** Matchmaking + multiple game modes
4. **Week 7-8:** Polish + deploy to production
5. **Week 9+:** Marketing + user acquisition

---

## Technical Debt to Address

- [ ] Implement proper flood fill algorithm (current is simplified)
- [ ] Add client-side prediction for better UX
- [ ] Implement lag compensation
- [ ] Add replay system
- [ ] Optimize network protocol (delta compression)
- [ ] Add graceful match migration on server failure
- [ ] Implement anti-cheat heuristics
- [ ] Add analytics pipeline
