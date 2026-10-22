SHELL := /bin/bash

.PHONY: dev backend-dev backend frontend-dev frontend test tests seed seed-reset

# Run both backend and frontend concurrently
dev:
	$(MAKE) -j2 backend-dev frontend-dev

# Backend development server
backend-dev:
	uv run fastapi dev src/backend/main.py

backend: backend-dev

# Frontend development server
frontend-dev:
	npm --prefix src/frontend run dev

frontend: frontend-dev

# Run unit tests
test:
	uv run pytest tests/ -v

tests: test

# Seed database
seed:
	uv run python utility/seedjobs.py

seed-reset:
	uv run python utility/seedjobs.py --reset