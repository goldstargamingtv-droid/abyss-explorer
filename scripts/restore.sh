#!/bin/bash

# PKM Vault Restore Script
# Restores from a backup archive

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -la backend/data/backups/pkm_vault_backup_*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🧠 PKM Vault Restore"
echo "===================="
echo ""
echo "⚠️  WARNING: This will overwrite your current data!"
echo "   Backup file: $BACKUP_FILE"
echo ""

read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Create a backup of current data first
echo ""
echo "📦 Creating backup of current data..."
./scripts/backup.sh

# Extract backup
echo ""
echo "📂 Extracting backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_NAME=$(ls "$TEMP_DIR")

# Restore database
if [ -f "$TEMP_DIR/$BACKUP_NAME/pkm_vault.db" ]; then
    echo "  - Restoring database..."
    cp "$TEMP_DIR/$BACKUP_NAME/pkm_vault.db" "backend/data/"
else
    echo "  - No database in backup"
fi

# Restore uploads
if [ -d "$TEMP_DIR/$BACKUP_NAME/uploads" ]; then
    echo "  - Restoring uploads..."
    rm -rf "backend/data/uploads"
    cp -r "$TEMP_DIR/$BACKUP_NAME/uploads" "backend/data/"
else
    echo "  - No uploads in backup"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Restore complete!"
echo ""
echo "Please restart the application to apply changes."
