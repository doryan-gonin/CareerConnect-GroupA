.PHONY: backend-dev

backend-dev:
	uv run fastapi dev src/backend/main.py