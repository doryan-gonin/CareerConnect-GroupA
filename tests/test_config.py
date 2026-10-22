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
