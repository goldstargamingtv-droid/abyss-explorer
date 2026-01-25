#!/bin/bash

# PKM Vault Backup Script
# Creates a timestamped backup of the database and uploads

set -e

BACKUP_DIR="backend/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="pkm_vault_backup_${TIMESTAMP}"

echo "🧠 PKM Vault Backup"
echo "==================="
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create a temporary directory for the backup
TEMP_DIR=$(mktemp -d)
BACKUP_PATH="$TEMP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

echo "📦 Creating backup: $BACKUP_NAME"

# Backup database
if [ -f "backend/data/pkm_vault.db" ]; then
    echo "  - Copying database..."
    cp "backend/data/pkm_vault.db" "$BACKUP_PATH/"
else
    echo "  - No database found, skipping"
fi

# Backup uploads
if [ -d "backend/data/uploads" ] && [ "$(ls -A backend/data/uploads 2>/dev/null)" ]; then
    echo "  - Copying uploads..."
    cp -r "backend/data/uploads" "$BACKUP_PATH/"
else
    echo "  - No uploads found, skipping"
fi

# Backup environment file (without secrets)
if [ -f ".env" ]; then
    echo "  - Copying config (sanitized)..."
    grep -v "SECRET_KEY\|API_KEY\|PASSWORD" .env > "$BACKUP_PATH/env.backup" || true
fi

# Create archive
echo ""
echo "📁 Creating archive..."
cd "$TEMP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
mv "${BACKUP_NAME}.tar.gz" "$OLDPWD/$BACKUP_DIR/"
cd "$OLDPWD"

# Cleanup
rm -rf "$TEMP_DIR"

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo "✅ Backup complete!"
echo "   Location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "   Size: $BACKUP_SIZE"

# Cleanup old backups (keep last 10)
echo ""
echo "🧹 Cleaning up old backups (keeping last 10)..."
cd "$BACKUP_DIR"
ls -t pkm_vault_backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
BACKUP_COUNT=$(ls -1 pkm_vault_backup_*.tar.gz 2>/dev/null | wc -l)
echo "   Current backups: $BACKUP_COUNT"
