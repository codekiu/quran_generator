.PHONY: up down dev build clean logs local-backend local-frontend

up: ## Start production containers
	docker compose up --build -d

down: ## Stop all containers
	docker compose down

dev: ## Start dev containers with hot-reloading
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

build: ## Build containers without starting
	docker compose build

clean: ## Stop containers, remove volumes and orphans
	docker compose down -v --remove-orphans

logs: ## Tail container logs
	docker compose logs -f

local-backend: ## Run backend locally (requires venv)
	cd backend && source .venv/bin/activate && python app.py

local-frontend: ## Run frontend locally
	cd frontend && npm run dev
