# ENTRYPOINT
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.backend.database import init_db # Absolute import to avoid PyTest errors
from src.backend.routers import auth, profiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code here runs once on startup
    init_db()

    yield

    # Code here runs once when server closes

app = FastAPI(title = "CareerConnect", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(profiles.router, prefix="/api/profiles")

@app.get("/")
def read_root():
    return {"message": "Hello World", "status": "running"} 
