# ENTRYPOINT
from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.backend.database import init_db # Absolute import to avoid PyTest errors
from src.backend.routers import auth, profiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code here runs once on startup
    init_db()

    yield

    # Code here runs once when server closes

app = FastAPI(title = "CareerConnect", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(profiles.router)

@app.get("/")
def read_root():
    return {"message": "Hello World", "status": "running"} 
