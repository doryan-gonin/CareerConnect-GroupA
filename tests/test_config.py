import os
import sys
import pytest
from pathlib import Path


def test_config_constants():
    from backend import config

    assert config.BASE_DIR.is_dir()
    assert config.SECRET_KEY is not None and len(config.SECRET_KEY) > 0
    assert config.ALGORITHM == "HS256"
    assert config.ACCESS_TOKEN_EXPIRE_MINUTES == 30
    assert config.MAX_FAILED_ATTEMPTS == 5
    assert config.LOCKOUT_DURATION_MINUTES == 15
    assert "sqlite:///" in config.DATABASE_URL
    assert isinstance(config.UPLOAD_DIR, Path)


def test_config_missing_jwt_secret_key_raises(monkeypatch):
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)

    # If backend.config is already imported, remove it from sys.modules
    # and mock dotenv loading so it doesn't read the existing .env file
    monkeypatch.setattr("dotenv.load_dotenv", lambda *args, **kwargs: None)
    if "backend.config" in sys.modules:
        monkeypatch.delitem(sys.modules, "backend.config")

    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY is not set"):
        import importlib
        import backend.config
        importlib.reload(backend.config)


def test_config_ai_base_url_unset(monkeypatch):
    monkeypatch.delenv("AI_API_BASE_URL", raising=False)
    monkeypatch.setattr("dotenv.load_dotenv", lambda *args, **kwargs: None)
    if "backend.config" in sys.modules:
        monkeypatch.delitem(sys.modules, "backend.config")
    import importlib
    import backend.config

    reloaded = importlib.reload(backend.config)
    assert reloaded.AI_API_BASE_URL is None


def test_config_ai_base_url_override(monkeypatch):
    monkeypatch.setenv("AI_API_BASE_URL", "http://localhost:11434/v1")
    if "backend.config" in sys.modules:
        monkeypatch.delitem(sys.modules, "backend.config")
    import importlib
    import backend.config

    reloaded = importlib.reload(backend.config)
    assert reloaded.AI_API_BASE_URL == "http://localhost:11434/v1"


def test_config_ai_mock_mode(monkeypatch):
    monkeypatch.setenv("AI_MOCK_MODE", "true")
    if "backend.config" in sys.modules:
        monkeypatch.delitem(sys.modules, "backend.config")
    import importlib
    import backend.config

    reloaded = importlib.reload(backend.config)
    assert reloaded.AI_MOCK_MODE is True


def test_init_db_with_target_engine():
    from sqlmodel import create_engine
    from sqlalchemy import inspect
    from backend.database import init_db

    memory_engine = create_engine("sqlite://")
    init_db(memory_engine)
    inspector = inspect(memory_engine)
    table_names = inspector.get_table_names()
    assert "user" in table_names
    assert "job" in table_names


@pytest.mark.anyio
async def test_lifespan_respects_testing_env(monkeypatch):
    from backend.main import app, lifespan
    import backend.main as main_module

    calls = []
    monkeypatch.setattr(main_module, "init_db", lambda *args, **kwargs: calls.append("init"))

    # When TESTING=1, lifespan should skip init_db
    monkeypatch.setenv("TESTING", "1")
    async with lifespan(app):
        pass
    assert len(calls) == 0

    # When TESTING is empty, lifespan should call init_db
    monkeypatch.delenv("TESTING", raising=False)
    async with lifespan(app):
        pass
    assert calls == ["init"]

