#!/usr/bin/env bash
# ==============================================================================
# Bếp Dì 6 - Database Backup Script for Home Server / VPS
# Dumps PostgreSQL database, compresses with gzip, and retains 7 daily backups.
# ==============================================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-/home/ngoctin/Projects/bepdi6-zalo-miniapp/infra/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="bepdi6_db_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="bepdi6_postgres"
DB_NAME="${POSTGRES_DB:-bepdi6_db}"
DB_USER="${POSTGRES_USER:-postgres}"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup for '${DB_NAME}'..."

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "${BACKUP_DIR}/${BACKUP_FILENAME}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILENAME}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup created: ${BACKUP_FILENAME} (${BACKUP_SIZE})"

# Remove backups older than 7 days
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up local backups older than 7 days..."
find "$BACKUP_DIR" -name "bepdi6_db_*.sql.gz" -type f -mtime +7 -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup process completed successfully."
