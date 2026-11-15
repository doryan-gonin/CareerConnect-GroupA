SHELL := /bin/bash

PYTHON_SOURCES := src/backend tests utility

.PHONY: dev backend-dev backend frontend-dev frontend test tests lint format format-check seed seed-reset

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

# Check backend Python style and import hygiene
lint:
	uv run ruff check $(PYTHON_SOURCES)

# Format backend Python sources in place
format:
	uv run ruff format $(PYTHON_SOURCES)

# Verify backend Python sources are already formatted
format-check:
	uv run ruff format --check $(PYTHON_SOURCES)

# Seed database
seed:
	uv run python utility/seedjobs.py

seed-reset:
	uv run python utility/seedjobs.py --reset
