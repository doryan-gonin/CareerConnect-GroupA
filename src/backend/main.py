
# ENTRYPOINT

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.database import init_db
from src.backend.routers import auth, profiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="CareerConnect",
    lifespan=lifespan
)

# Allow the React development server to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Register existing API routers
app.include_router(auth.router, prefix="/api/auth")
app.include_router(profiles.router)


@app.get("/")
def read_root():
    return {
        "message": "Hello World",
        "status": "running"
    }
