#!/bin/bash

# Sparkaph Backup Script
# Creates backups of database and files

set -e

echo "💾 Starting backup..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/home/$USER/sparkaph"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
echo -e "${YELLOW}Backing up database...${NC}"
pg_dump sparkaph > "$BACKUP_DIR/sparkaph_db_$DATE.sql"
gzip "$BACKUP_DIR/sparkaph_db_$DATE.sql"

# Backup uploads
echo -e "${YELLOW}Backing up uploads...${NC}"
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" "$PROJECT_DIR/backend/uploads"

# Backup apps (deployed applications)
echo -e "${YELLOW}Backing up apps...${NC}"
tar -czf "$BACKUP_DIR/apps_$DATE.tar.gz" "$PROJECT_DIR/backend/apps"

# Keep only last 7 days of backups
echo -e "${YELLOW}Cleaning old backups...${NC}"
find "$BACKUP_DIR" -name "sparkaph_db_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "apps_*.tar.gz" -mtime +7 -delete

echo -e "${GREEN}✅ Backup completed!${NC}"
echo "Database: $BACKUP_DIR/sparkaph_db_$DATE.sql.gz"
echo "Uploads: $BACKUP_DIR/uploads_$DATE.tar.gz"
echo "Apps: $BACKUP_DIR/apps_$DATE.tar.gz"
