# ==================================
# Oreo CodePen - Makefile
# ==================================
# Convenient commands for Docker operations

.PHONY: help dev prod build-dev build-prod stop clean logs shell

# Default target
help:
	@echo "╔════════════════════════════════════════════════════════════╗"
	@echo "║           🍪 Oreo CodePen - Docker Commands                ║"
	@echo "╠════════════════════════════════════════════════════════════╣"
	@echo "║  Development:                                              ║"
	@echo "║    make dev        - Start development environment         ║"
	@echo "║    make build-dev  - Build development image               ║"
	@echo "║    make logs-dev   - View development logs                 ║"
	@echo "║    make shell-dev  - Open shell in dev container           ║"
	@echo "║                                                            ║"
	@echo "║  Production:                                               ║"
	@echo "║    make prod       - Start production environment          ║"
	@echo "║    make build-prod - Build production image                ║"
	@echo "║    make logs-prod  - View production logs                  ║"
	@echo "║                                                            ║"
	@echo "║  General:                                                  ║"
	@echo "║    make stop       - Stop all containers                   ║"
	@echo "║    make clean      - Remove containers and images          ║"
	@echo "║    make status     - Show container status                 ║"
	@echo "╚════════════════════════════════════════════════════════════╝"

# ---- Development Commands ----
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-detached:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

build-dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

logs-dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

shell-dev:
	docker exec -it oreo-codepen-dev sh

# ---- Production Commands ----
prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

logs-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

shell-prod:
	docker exec -it oreo-codepen-prod sh

# ---- General Commands ----
stop:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

clean:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --rmi local
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v --rmi local
	docker system prune -f

status:
	@echo "\n🍪 Oreo CodePen Container Status:\n"
	@docker ps -a --filter "name=oreo-codepen" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ---- Quick Setup ----
setup:
	@echo "Creating .env file from template..."
	@cp -n .env.example .env || true
	@echo "Creating projects directory..."
	@mkdir -p projects
	@echo "Creating empty metadata.json..."
	@echo '{"projects":{}}' > metadata.json
	@echo "✅ Setup complete! Run 'make dev' to start development."
