.PHONY: setup dev build test clean db-migrate db-seed index-sample-repo docker-up docker-down help

# ─── Help ────────────────────────────────────────────────────────────────────
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Setup ────────────────────────────────────────────────────────────────────
setup: ## Install dependencies and generate Prisma client (migrations need Postgres)
	npm install
	npx prisma generate --schema=packages/shared/prisma/schema.prisma
	@echo "Prisma client generated."
	@if [ -n "$$DATABASE_URL" ]; then \
		npx prisma migrate dev --schema=packages/shared/prisma/schema.prisma --name init || true; \
	else \
		echo "DATABASE_URL not set — skipping migrations. Run 'make docker-up' then 'make db-migrate'."; \
	fi
	@echo "Setup complete! Run 'make docker-up' for database, then 'make dev' to start."

# ─── Development ──────────────────────────────────────────────────────────────
dev: ## Start all services in development mode
	npm run dev

dev-web: ## Start only the web app
	cd apps/web && npm run dev

dev-worker: ## Start only the worker
	cd apps/worker && celery -A src.celery_app worker --loglevel=info

# ─── Build ────────────────────────────────────────────────────────────────────
build: ## Build all packages and apps
	npm run build

# ─── Database ─────────────────────────────────────────────────────────────────
db-migrate: ## Run database migrations
	npx prisma migrate dev --schema=packages/shared/prisma/schema.prisma

db-seed: ## Seed the database with sample data
	cd packages/shared && npx tsx src/seed.ts

db-reset: ## Reset the database
	npx prisma migrate reset --schema=packages/shared/prisma/schema.prisma --force

db-studio: ## Open Prisma Studio
	npx prisma studio --schema=packages/shared/prisma/schema.prisma

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-up: ## Start all services via Docker Compose
	docker compose up -d

docker-down: ## Stop all Docker services
	docker compose down

docker-build: ## Build Docker images
	docker compose build

docker-logs: ## View Docker logs
	docker compose logs -f

# ─── Testing ──────────────────────────────────────────────────────────────────
test: ## Run all tests
	npm run test

test-web: ## Run web app tests
	cd apps/web && npm test

test-worker: ## Run worker tests
	cd apps/worker && python -m pytest

# ─── Indexing ─────────────────────────────────────────────────────────────────
index-sample-repo: ## Index a sample public repository for demo
	curl -X POST http://localhost:3000/api/repos/import \
		-H "Content-Type: application/json" \
		-d '{"url": "https://github.com/expressjs/express"}'

# ─── Code Quality ─────────────────────────────────────────────────────────────
lint: ## Run linters
	npm run lint

format: ## Format code
	npm run format

# ─── Cleanup ──────────────────────────────────────────────────────────────────
clean: ## Clean build artifacts
	npm run clean
	rm -rf snapshots/
	rm -rf .turbo/
