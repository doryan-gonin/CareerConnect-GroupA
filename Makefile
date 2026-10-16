.PHONY: backend-dev seed seed-reset

backend-dev:
	uv run fastapi dev src/backend/main.py

seed:
	uv run python utility/seedjobs.py

seed-reset:
	uv run python utility/seedjobs.py --reset