import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event
from sqlalchemy.engine import Engine

from backend.config import DATABASE_URL

url = DATABASE_URL
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

# Ensure SSL mode is enabled for remote cloud PostgreSQL (Neon)
if not url.startswith("sqlite") and "sslmode" not in url:
    separator = "&" if "?" in url else "?"
    url = f"{url}{separator}sslmode=require"

is_sqlite = url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# pool_pre_ping=True tests connections before executing queries to prevent SSL disconnect errors
engine: Engine = create_engine(
    url,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300  # Recycles connections every 5 minutes
)

if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

def init_db():
    from backend import models
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
