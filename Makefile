.PHONY: help dev prod stop logs clean test backup restore

# Default target
help:
	@echo "PKM Vault - Available Commands"
	@echo "==============================="
	@echo "  make dev      - Start development environment"
	@echo "  make prod     - Start production environment"
	@echo "  make stop     - Stop all containers"
	@echo "  make logs     - View container logs"
	@echo "  make clean    - Remove containers and volumes"
	@echo "  make test     - Run all tests"
	@echo "  make backup   - Create database backup"
	@echo "  make restore  - Restore from backup"
	@echo "  make migrate  - Run database migrations"
	@echo "  make shell-be - Open backend shell"
	@echo "  make shell-fe - Open frontend shell"

# Development
dev:
	docker-compose -f docker-compose.dev.yml up --build

dev-d:
	docker-compose -f docker-compose.dev.yml up --build -d

# Production
prod:
	docker-compose up --build -d

# Stop services
stop:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# View logs
logs:
	docker-compose logs -f

logs-be:
	docker-compose logs -f backend

logs-fe:
	docker-compose logs -f frontend

# Clean up
clean:
	docker-compose down -v --rmi local
	docker-compose -f docker-compose.dev.yml down -v --rmi local

# Testing
test:
	cd backend && pytest
	cd frontend && npm test

test-be:
	cd backend && pytest -v

test-fe:
	cd frontend && npm test

# Database
migrate:
	cd backend && alembic upgrade head

migrate-new:
	@read -p "Migration name: " name; \
	cd backend && alembic revision --autogenerate -m "$$name"

# Backup/Restore
backup:
	./scripts/backup.sh

restore:
	@read -p "Backup file: " file; \
	./scripts/restore.sh $$file

# Shell access
shell-be:
	docker-compose exec backend /bin/bash

shell-fe:
	docker-compose exec frontend /bin/sh

# Local development (without Docker)
local-be:
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

local-fe:
	cd frontend && npm run dev
