# SQLMODEL DATABASE TABLES

from pydantic import EmailStr
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    email_address: EmailStr
    pass