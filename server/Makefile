.PHONY: help build run test clean docker-build docker-up docker-down migrate lint

help:
	@echo "Sparkaph Server - Makefile Commands"
	@echo ""
	@echo "  make build        - Build the server binary"
	@echo "  make run          - Run the server locally"
	@echo "  make test         - Run all tests"
	@echo "  make bench        - Run benchmarks"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start services with docker-compose"
	@echo "  make docker-down  - Stop services"
	@echo "  make migrate      - Run database migrations"
	@echo "  make lint         - Run linter"
	@echo "  make deps         - Download dependencies"
	@echo ""

build:
	@echo "Building server..."
	go build -o bin/gameserver ./cmd/gameserver

run:
	@echo "Running server..."
	go run ./cmd/gameserver

test:
	@echo "Running tests..."
	go test -v ./...

bench:
	@echo "Running benchmarks..."
	go test -bench=. -benchmem ./...

test-coverage:
	@echo "Running tests with coverage..."
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

clean:
	@echo "Cleaning..."
	rm -rf bin/
	rm -f coverage.out coverage.html

docker-build:
	@echo "Building Docker image..."
	docker build -t sparkaph-server:latest .

docker-up:
	@echo "Starting services..."
	docker-compose up -d

docker-down:
	@echo "Stopping services..."
	docker-compose down

docker-logs:
	docker-compose logs -f gameserver

migrate:
	@echo "Running migrations..."
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "ERROR: DATABASE_URL not set"; \
		exit 1; \
	fi
	psql $(DATABASE_URL) < migrations/001_initial_schema.sql

migrate-docker:
	@echo "Running migrations in Docker..."
	docker-compose exec postgres psql -U sparkaph -d sparkaph -f /migrations/001_initial_schema.sql

lint:
	@echo "Running linter..."
	golangci-lint run ./...

fmt:
	@echo "Formatting code..."
	go fmt ./...

deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

deps-update:
	@echo "Updating dependencies..."
	go get -u ./...
	go mod tidy

dev:
	@echo "Starting development environment..."
	docker-compose up -d postgres redis
	@echo "Waiting for services to be ready..."
	sleep 3
	@make migrate-docker
	@make run

prod-build:
	@echo "Building production binary..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o bin/gameserver ./cmd/gameserver

install-tools:
	@echo "Installing development tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

health-check:
	@echo "Checking server health..."
	curl -f http://localhost:8080/health || exit 1

metrics:
	@echo "Fetching metrics..."
	curl http://localhost:8080/metrics

# Database commands
db-shell:
	docker-compose exec postgres psql -U sparkaph -d sparkaph

db-backup:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U sparkaph sparkaph > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore:
	@echo "Restoring database from backup..."
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "ERROR: BACKUP_FILE not set. Usage: make db-restore BACKUP_FILE=backup.sql"; \
		exit 1; \
	fi
	docker-compose exec -T postgres psql -U sparkaph -d sparkaph < $(BACKUP_FILE)

# Redis commands
redis-cli:
	docker-compose exec redis redis-cli

redis-flush:
	docker-compose exec redis redis-cli FLUSHALL

# Monitoring
logs:
	docker-compose logs -f

stats:
	@echo "Server Statistics:"
	@curl -s http://localhost:8080/metrics | grep sparkaph_active

# Load testing
load-test:
	@echo "Running load test..."
	@if command -v hey >/dev/null 2>&1; then \
		hey -n 1000 -c 10 http://localhost:8080/health; \
	else \
		echo "ERROR: 'hey' not installed. Install with: go install github.com/rakyll/hey@latest"; \
	fi

# Git hooks
install-hooks:
	@echo "Installing git hooks..."
	@echo "#!/bin/sh\nmake test" > .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Git hooks installed"

# All-in-one commands
all: clean deps build test

ci: deps lint test

deploy: prod-build docker-build
	@echo "Ready for deployment"
