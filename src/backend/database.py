# SQLITE DATABASE ENGINE

from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event, inspect, text
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

# We have no migration tool (e.g. Alembic), so create_all() alone only creates
# brand-new tables. Anyone with an existing db file predating a model change
# (e.g. the failed_attempts/locked_until columns added for login lockout) ends
# up with a table missing those columns, crashing every query that touches
# them. This adds any columns present in the models but missing from the
# actual table, so pulling new model code can't leave a stale local db behind.
def _add_missing_columns():
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table in SQLModel.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            existing_columns = {col["name"] for col in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_columns:
                    continue
                column_type = column.type.compile(engine.dialect)
                ddl = f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {column_type}'
                default = column.default.arg if column.default is not None else None
                if not column.nullable and isinstance(default, (int, float, str)):
                    ddl += f" NOT NULL DEFAULT {default!r}" if isinstance(default, str) else f" NOT NULL DEFAULT {default}"
                conn.execute(text(ddl))

# Create tables in database if they do not exist already.
def init_db():
    from backend import models # Importing models here ensures the models are registered before the tables are created
    SQLModel.metadata.create_all(engine)
    _add_missing_columns()

def get_session():
    with Session(engine) as session:
        yield session