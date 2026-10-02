# SQLMODEL DATABASE TABLES

from pyclbr import Class # Unnecessary import, leaving it in for now

from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship
from typing import List
from datetime import datetime

# TABLES

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email_address: EmailStr = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.now)
    failed_attempts: int = Field(default=0)
    locked_until: datetime | None = Field(default=None)

    profile: Profile = Relationship(back_populates="user")
    resumes: List[Resume] = Relationship(back_populates="user")


class Profile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, nullable=False)
    first_name: str = Field(default="")
    last_name: str = Field(default="")
    last_updated: datetime | None = Field(default=None)

    user: User | None = Relationship(back_populates="profile")

class RevokedToken(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jti: str = Field(unique=True, index=True, nullable=False)
    expires_at: datetime

class Resume(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    file_name: str # Original filename
    file_path: str # Path on disk
    is_default: bool = Field(default=False)
    uploaded_at: datetime = Field(default_factory=datetime.now)

    user: User | None = Relationship(back_populates="resumes")

# REQUEST/RESPONSES SCHEMAS

class UserCreate(SQLModel):
    email_address: EmailStr
    password: str

class UserResponse(SQLModel):
    id: int
    email_address: EmailStr
    created_at: datetime

class UserLogin(SQLModel): # We don't need user's name for login
    email_address: EmailStr
    password: str

class ResumeReponse(SQLModel):
    id: int
    user_id: int
    file_name: str
    is_default: bool
    uploaded_at: datetime

# TOKEN CLASSES
class Token(SQLModel):
    access_token: str
    token_type: str

class TokenData(SQLModel):
    id: str | None = None

# PROFILE CLASSES
class ProfileUpdate(SQLModel):
    first_name: str | None = "None"
    last_name: str | None = "None"

class ProfileResponse(SQLModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    resume_path: str | None = None
    last_update: datetime | None = None
