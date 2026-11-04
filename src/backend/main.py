# ENTRYPOINT
from os import getenv
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.routers import auth, profiles, jobs, applications, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code here runs once on startup
    init_db()

    yield

    # Code here runs once when server closes

app = FastAPI(title = "CareerConnect", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Good for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(profiles.router, prefix="/api/profiles")
app.include_router(jobs.router, prefix="/api/jobs")
app.include_router(applications.router, prefix="/api/applications")
app.include_router(analytics.router, prefix="/api/analytics")

@app.get("/")
def read_root():
    return {"message": "Hello World", "status": "running"} 

if __name__ == "__main__":
    import uvicorn

    # HF routes internal container traffic through port 7860
    port = int(getenv("PORT", 7860))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
