"""Run the real API with a disposable database and upload directory for E2E tests."""
import os
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

if __name__ == "__main__":
    with TemporaryDirectory(prefix="careerconnect-e2e-") as directory:
        os.environ.update({
            "DATABASE_URL": f"sqlite:///{directory}/e2e.db",
            "UPLOAD_DIR": f"{directory}/uploads",
            "JWT_SECRET_KEY": "e2e-only-secret-key-at-least-32-characters",
            "AI_MOCK_MODE": "true",
            "AI_API_KEY": "",
            "AI_API_BASE_URL": "",
            "TESTING": "false",
        })
        import uvicorn
        uvicorn.run("backend.main:app", host="127.0.0.1", port=int(os.getenv("PORT", "8765")))
