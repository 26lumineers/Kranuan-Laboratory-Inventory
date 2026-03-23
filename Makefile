.PHONY: help db-up db-down db-logs pgadmin-up pgadmin-down backend-dev backend-start db-migrate db-push db-seed db-studio frontend-dev frontend-build

help:
	@echo "Laboratory Inventory - Available Commands"
	@echo ""
	@echo "Docker:"
	@echo "  make db-up        Start PostgreSQL and pgAdmin"
	@echo "  make db-down      Stop PostgreSQL and pgAdmin"
	@echo "  make db-logs      Show database logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   Run database migrations"
	@echo "  make db-push      Push schema to database"
	@echo "  make db-seed      Seed database with initial data"
	@echo "  make db-studio    Open Drizzle Studio"
	@echo ""
	@echo "Backend:"
	@echo "  make backend-dev  Start backend in dev mode (watch)"
	@echo "  make backend-start Start backend"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-dev Start frontend in dev mode"
	@echo "  make frontend-build Build frontend"
	@echo ""
	@echo "Full Stack:"
	@echo "  make dev          Start both frontend and backend"
	@echo "  make setup        Initial setup (db-up, db-push, db-seed)"

# Docker
db-up:
	docker-compose up -d postgres pgadmin

db-down:
	docker-compose down postgres pgadmin

db-logs:
	docker-compose -f docker-compose.db.yml logs -f postgres

# Database
db-migrate:
	cd packages/db && export $$(cat ../../.env | xargs) && bun run migrate

db-push:
	cd packages/db && export $$(cat ../../.env | xargs) && bun run push

db-seed:
	cd packages/db && export $$(cat ../../.env | xargs) && bun run seed

db-studio:
	cd packages/db && export $$(cat ../../.env | xargs) && bun run studio

be:
	cd apps/server && bun run start

# Frontend
fe:
	cd apps/web && bun run dev

frontend-build:
	cd apps/web && bun run build
seed:
	cd packages/db && bun run seed
# Full Stack
dev:
	@echo "Starting backend and frontend..."
	@trap 'kill 0' INT; \
	cd apps/server && bun run dev & \
	cd apps/web && bun run dev & \
	wait

setup: db-up
	@echo "Waiting for database to be ready..."
	@sleep 3
	$(MAKE) db-push
	$(MAKE) db-seed
	@echo "Setup complete!"
