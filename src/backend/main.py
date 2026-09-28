# ENTRYPOINT
from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.database import init_db
from backend.routers import auth, profiles
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code here runs once on startup
    init_db()

    yield

    # Code here runs once when server closes

app = FastAPI(title = "CareerConnect", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(profiles.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello World", "status": "running"} 