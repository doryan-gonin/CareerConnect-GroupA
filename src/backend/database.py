import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event
from sqlalchemy.engine import Engine

from backend.config import DATABASE_URL

# Normalize database URL if provider uses legacy 'postgres://' format
url = DATABASE_URL
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

# Apply SQLite-specific arguments ONLY when running against SQLite
is_sqlite = url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Initialize database engine dynamically
engine: Engine = create_engine(url, echo=False, connect_args=connect_args)

# Enable foreign keys dynamically ONLY when connected to a SQLite database
if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Create tables in database if they do not exist already
def init_db():
    from backend import models  # Register models before metadata creation
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
