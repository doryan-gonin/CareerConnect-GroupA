# SQLMODEL DATABASE TABLES

from pyclbr import Class # Unnecessary import, leaving it in for now

from enum import Enum
from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship
from typing import List
from datetime import datetime

# ENUMS

class JobSchedule(str, Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"

class JobType(str, Enum):
    PERMANENT = "Permanent"
    TEMPORARY = "Temporary"
    CONTRACT = "Contract"
    SEASONAL = "Seasonal"
    INTERNSHIP = "Internship"

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
    posted_jobs: List["Job"] = Relationship(back_populates="recruiter")


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


class Job(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    recruiter_id: int | None = Field(default=None, foreign_key="user.id", index=True)
    title: str = Field(index=True, nullable=False)
    company_name: str = Field(index=True, nullable=False)
    description: str = Field(nullable=False)
    location: str = Field(index=True, nullable=False)
    category: str = Field(index=True, nullable=False)
    job_type: JobType = Field(default=JobType.PERMANENT, index=True)
    job_schedule: JobSchedule = Field(default=JobSchedule.FULL_TIME, index=True)
    min_hours_per_week: int | None = Field(default=None)
    max_hours_per_week: int | None = Field(default=None)
    salary_min: int | None = Field(default=None)
    salary_max: int | None = Field(default=None)
    is_active: bool = Field(default=True, index=True)
    posted_at: datetime = Field(default_factory=datetime.now)

    recruiter: User | None = Relationship(back_populates="posted_jobs")

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
    first_name: str | None = None
    last_name: str | None = None

class ProfileResponse(SQLModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    last_updated: datetime | None = None

# JOB CLASSES
class JobCreate(SQLModel):
    title: str
    company_name: str
    description: str
    location: str
    category: str
    job_type: JobType = JobType.PERMANENT
    job_schedule: JobSchedule = JobSchedule.FULL_TIME
    min_hours_per_week: int | None = None
    max_hours_per_week: int | None = None
    salary_min: int | None = None
    salary_max: int | None = None

class JobUpdate(SQLModel):
    title: str | None = None
    company_name: str | None = None
    description: str | None = None
    location: str | None = None
    category: str | None = None
    job_type: JobType | None = None
    job_schedule: JobSchedule | None = None
    min_hours_per_week: int | None = None
    max_hours_per_week: int | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    is_active: bool | None = None

class JobResponse(SQLModel):
    id: int
    recruiter_id: int | None = None
    title: str
    company_name: str
    description: str
    location: str
    category: str
    job_type: JobType
    job_schedule: JobSchedule
    min_hours_per_week: int | None = None
    max_hours_per_week: int | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    is_active: bool
    posted_at: datetime

class JobListResponse(SQLModel):
    jobs: List[JobResponse]
    total: int
    page: int
    limit: int
    total_pages: int
