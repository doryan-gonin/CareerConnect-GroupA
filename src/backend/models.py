# SQLMODEL DATABASE TABLES

from pyclbr import Class # Unnecessary import, leaving it in for now

from enum import Enum
from pydantic import EmailStr
from sqlalchemy import UniqueConstraint
from sqlmodel import SQLModel, Field, Relationship
from typing import List
from datetime import date, datetime, timezone

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

class JobSortBy(str, Enum):
    POSTED_AT = "posted_at"
    SALARY_MAX = "salary_max"
    SALARY_MIN = "salary_min"
    HOURS_MAX = "max_hours_per_week"

class JobSortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class ApplicationStatus(str, Enum):
    APPLIED = "Applied"
    UNDER_REVIEW = "Under Review"
    INTERVIEW = "Interview"
    OFFERED = "Offered"
    REJECTED = "Rejected"

class NotificationType(str, Enum):
    STATUS_UPDATE = "status_update"
    INTERVIEW_INVITATION = "interview_invitation"
    APPLICATION_RECEIVED = "application_received"
    SYSTEM = "system"

class InterviewRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class AnalyticsGranularity(str, Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

# TABLES

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email_address: EmailStr = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    failed_attempts: int = Field(default=0)
    locked_until: datetime | None = Field(default=None)

    profile: Profile = Relationship(back_populates="user")
    resumes: List[Resume] = Relationship(back_populates="user")
    posted_jobs: List["Job"] = Relationship(back_populates="recruiter")
    applications: List["Application"] = Relationship(back_populates="applicant")
    notifications: List["Notification"] = Relationship(back_populates="user")


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
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    posted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    recruiter: User | None = Relationship(back_populates="posted_jobs")
    applications: List["Application"] = Relationship(back_populates="job")


class Application(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("job_id", "applicant_id", name="uq_job_applicant"),)

    id: int | None = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="job.id", index=True, nullable=False)
    applicant_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    resume_id: int | None = Field(default=None, foreign_key="resume.id", index=True)
    cover_letter: str | None = Field(default=None)
    status: ApplicationStatus = Field(default=ApplicationStatus.APPLIED, index=True, nullable=False)
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime | None = Field(default=None)

    job: Job | None = Relationship(back_populates="applications")
    applicant: User | None = Relationship(back_populates="applications")
    resume: Resume | None = Relationship()

class SearchLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    keyword: str | None
    location: str | None
    category: str | None
    job_type: JobType | None
    job_schedule: JobSchedule | None
    salary_min: int | None
    result_count: int | None #Will help the AI know if the search was fruitful or not
    searched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class JobViewLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    job_id: int = Field(foreign_key="job.id", index=True)
    viewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class Notification(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    title: str = Field(nullable=False)
    message: str = Field(nullable=False)
    notification_type: NotificationType = Field(default=NotificationType.STATUS_UPDATE, index=True)
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    reference_id: int | None = Field(default=None)
    reference_type: str | None = Field(default=None)

    user: User | None = Relationship(back_populates="notifications")

class InterviewSession(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    job_id: int = Field(foreign_key="job.id", index=True, nullable=False)
    # No foreign key: resumes are hard-deleted and that must not be blocked by old sessions
    resume_id: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class InterviewSessionMessage(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="interviewsession.id", index=True, nullable=False)
    role: InterviewRole = Field(nullable=False)
    content: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# APPLICATION CLASSES

class ApplicationCreate(SQLModel):
    resume_id: int | None = None
    cover_letter: str | None = None

class ApplicationResponse(SQLModel):
    id: int
    job_id: int
    applicant_id: int
    resume_id: int | None = None
    cover_letter: str | None = None
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime | None = None
    message: str | None = None

class ApplicationDetailResponse(SQLModel):
    id: int
    job_id: int
    applicant_id: int
    resume_id: int | None = None
    resume_name: str | None = None
    cover_letter: str | None = None
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime | None = None
    job_title: str
    company_name: str
    location: str
    category: str
    job_type: JobType
    job_schedule: JobSchedule

class ApplicationStatusUpdate(SQLModel):
    status: ApplicationStatus

# ANALYTICS CLASSES

class AnalyticsPoint(SQLModel):
    period: date
    count: int

class ApplicationAnalyticsResponse(SQLModel):
    start_date: date
    end_date: date
    group_by: AnalyticsGranularity
    points: List[AnalyticsPoint]

class SearchAnalyticsResponse(ApplicationAnalyticsResponse):
    pass

class ViewAnalyticsPoint(SQLModel):
    period: date
    unique_postings: int

class ViewAnalyticsResponse(SQLModel):
    start_date: date
    end_date: date
    group_by: AnalyticsGranularity
    points: List[ViewAnalyticsPoint]

class SalaryDistributionResponse(SQLModel):
    start_date: date
    end_date: date
    salary_count: int
    average_salary: float | None = None
    minimum_salary: float | None = None
    maximum_salary: float | None = None
    standard_deviation: float | None = None

class ApplicationSummaryResponse(SQLModel):
    start_date: date
    end_date: date
    category: str | None = None
    category_count: int = 0
    location: str | None = None
    location_count: int = 0

# NOTIFICATION SCHEMAS

class NotificationResponse(SQLModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime
    reference_id: int | None = None
    reference_type: str | None = None

class NotificationListResponse(SQLModel):
    total_count: int
    unread_count: int
    notifications: List[NotificationResponse]

# INTERVIEW PREP SCHEMAS

class InterviewMessage(SQLModel):
    role: InterviewRole
    content: str

class InterviewSessionCreate(SQLModel):
    application_id: int

class InterviewMessageCreate(SQLModel):
    content: str

class InterviewSessionSummary(SQLModel):
    id: int
    job_id: int
    job_title: str
    company_name: str
    created_at: datetime
    updated_at: datetime

class InterviewSessionDetail(InterviewSessionSummary):
    messages: List[InterviewMessage]
