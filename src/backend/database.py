from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

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
    pool_recycle=300,  # Recycles connections every 5 minutes
)

if is_sqlite:

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def init_db(target_engine: Engine | None = None):
    target = target_engine or engine

    # Import models before creating tables so SQLModel metadata is populated.
    from backend import models  # noqa: F401

    SQLModel.metadata.create_all(target)
    # Lightweight schema migration for existing SQLite databases
    with Session(target) as session:
        try:
            from sqlalchemy import text

            session.exec(
                text("ALTER TABLE user ADD COLUMN is_recruiter BOOLEAN DEFAULT 0 NOT NULL")
            )
            session.commit()
        except Exception:
            pass


def get_session():
    with Session(engine) as session:
        yield session
