SHELL := /bin/bash

.PHONY: dev backend-dev backend frontend-dev frontend test tests e2e seed seed-reset

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

# Run frontend end-to-end tests (Playwright starts its own backend + frontend on ports 8010 / 5180)
# First time only: npx --prefix src/frontend playwright install chromium
e2e:
	npm --prefix src/frontend run test:e2e

# Seed database
seed:
	uv run python utility/seedjobs.py

seed-reset:
	uv run python utility/seedjobs.py --reset