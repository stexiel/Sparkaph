# Sparkaph WMS - Monolithic Architecture

## Stack
- **Backend**: Go 1.23 + Gin + GORM
- **Frontend**: Vue.js 3 + TypeScript + Vite
- **Database**: PostgreSQL 14

## Project Structure
```
Sparkaph/
├── backend/
│   ├── cmd/main.go           # Server entry point
│   ├── internal/
│   │   ├── config/           # Configuration
│   │   ├── models/           # GORM models
│   │   ├── handlers/         # API handlers
│   │   └── middleware/       # CORS, Auth, Logging
│   └── pkg/database/         # Database connection
└── frontend/
    ├── src/
    │   ├── views/            # Vue components
    │   ├── router/           # Vue Router
    │   └── main.ts           # App entry point
    └── vite.config.ts        # Vite configuration
```

## Database Setup

Create PostgreSQL database:
```sql
CREATE DATABASE sparkaph;
```

## Run Backend

```bash
cd backend
& "C:\Program Files\Go\bin\go.exe" run cmd/main.go
```

Server runs on port 8080.

## Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on port 5173.

## API Endpoints

### Auth
- POST /auth/login
- POST /auth/register

### Products (Protected)
- GET /api/products
- POST /api/products

### Inventory (Protected)
- GET /api/inventory
- POST /api/inventory

### Orders (Protected)
- GET /api/orders
- POST /api/orders
- GET /api/orders/:id
- PUT /api/orders/:id/status

### Picking (Protected)
- GET /api/picking/tasks
- POST /api/picking/tasks
- POST /api/picking/scan
- PUT /api/picking/tasks/:id/complete
