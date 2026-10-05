# SQLITE DATABASE ENGINE

from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlite3 import Connection

# Test database for development. Needs to be changed to a prod database later.
DATABASE_FILE: str = "careerconnect_test.db"
DATABASE_URL: str = f"sqlite:///{DATABASE_FILE}"

# echo prints sql statements to standard output, turn it on for debugging, otherwise leave it off.
# Leave "check_same_thread" to false, SQLite needs it to allow multiple threads to interact with the db.
engine: Engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

# Enable foreign keys on db
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection: Connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# Create tables in database if they do not exist already.
def init_db():
    from src.backend import models # Importing models here ensures the models are registered before the tables are created
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
