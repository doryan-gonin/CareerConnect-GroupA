# SQLMODEL DATABASE TABLES

from pydantic import EmailStr
from sqlmodel import SQLModel, Field
from datetime import datetime

# TABLES

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    email_address: EmailStr = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.now)

# REQUEST/RESPONSES SCHEMAS

class UserCreate(SQLModel):
    first_name: str
    last_name: str
    email_address: EmailStr
    password: str

class UserResponse(SQLModel):
    id: int
    email_address: EmailStr
    created_at: datetime