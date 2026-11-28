"""
Seed script to populate CareerConnect database with sample applicants and applications
for testing Recruiter Dashboard applicant filtering & sorting.
Run utility/seedjobs.py first so the demo recruiter and job postings exist.
"""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import bcrypt
from sqlmodel import Session, select
from backend.database import engine, init_db
from backend.models import (
    Application,
    ApplicationStatus,
    FluencyLevel,
    Job,
    Profile,
    ProfileLanguage,
    User,
)

DEMO_RECRUITER_EMAIL = "recruiter@careerconnect.com"
DEMO_APPLICANT_PASSWORD = "Password123!"

SAMPLE_APPLICANTS = [
    {
        "email": "alice.martin@example.com",
        "first_name": "Alice",
        "last_name": "Martin",
        "status": ApplicationStatus.APPLIED,
        "days_ago": 5,
        "languages": [
            {"language": "English", "fluency_level": FluencyLevel.NATIVE.value},
            {"language": "French", "fluency_level": FluencyLevel.FLUENT.value},
        ],
    },
    {
        "email": "bruno.silva@example.com",
        "first_name": "Bruno",
        "last_name": "Silva",
        "status": ApplicationStatus.UNDER_REVIEW,
        "days_ago": 4,
        "languages": [
            {"language": "English", "fluency_level": FluencyLevel.FLUENT.value},
            {"language": "Spanish", "fluency_level": FluencyLevel.NATIVE.value},
        ],
    },
    {
        "email": "claire.dubois@example.com",
        "first_name": "Claire",
        "last_name": "Dubois",
        "status": ApplicationStatus.INTERVIEW,
        "days_ago": 3,
        "languages": [
            {"language": "French", "fluency_level": FluencyLevel.NATIVE.value},
            {"language": "English", "fluency_level": FluencyLevel.INTERMEDIATE.value},
        ],
    },
    {
        "email": "david.chen@example.com",
        "first_name": "David",
        "last_name": "Chen",
        "status": ApplicationStatus.OFFERED,
        "days_ago": 6,
        "languages": [
            {"language": "English", "fluency_level": FluencyLevel.NATIVE.value},
            {"language": "Mandarin", "fluency_level": FluencyLevel.FLUENT.value},
        ],
    },
    {
        "email": "elena.kowalski@example.com",
        "first_name": "Elena",
        "last_name": "Kowalski",
        "status": ApplicationStatus.REJECTED,
        "days_ago": 7,
        "languages": [
            {"language": "German", "fluency_level": FluencyLevel.NATIVE.value},
            {"language": "English", "fluency_level": FluencyLevel.FLUENT.value},
        ],
    },
    {
        "email": "farid.hassan@example.com",
        "first_name": "Farid",
        "last_name": "Hassan",
        "status": ApplicationStatus.APPLIED,
        "days_ago": 1,
        "languages": [
            {"language": "Arabic", "fluency_level": FluencyLevel.NATIVE.value},
            {"language": "French", "fluency_level": FluencyLevel.FLUENT.value},
            {"language": "English", "fluency_level": FluencyLevel.FLUENT.value},
        ],
    },
    {
        "email": "grace.kim@example.com",
        "first_name": "Grace",
        "last_name": "Kim",
        "status": ApplicationStatus.INTERVIEW,
        "days_ago": 2,
        "languages": [
            {"language": "English", "fluency_level": FluencyLevel.FLUENT.value},
            {"language": "Korean", "fluency_level": FluencyLevel.NATIVE.value},
        ],
    },
]


def seed_applicants() -> None:
    init_db()
    pw_hash = bcrypt.hashpw(
        DEMO_APPLICANT_PASSWORD.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        recruiter = session.exec(
            select(User).where(User.email_address == DEMO_RECRUITER_EMAIL)
        ).first()
        if not recruiter:
            print(f"Recruiter {DEMO_RECRUITER_EMAIL} not found. Run utility/seedjobs.py first.")
            return

        job = session.exec(select(Job).where(Job.recruiter_id == recruiter.id)).first()
        if not job:
            print(f"No jobs found for {DEMO_RECRUITER_EMAIL}. Run utility/seedjobs.py first.")
            return

        created_apps = 0
        for item in SAMPLE_APPLICANTS:
            user = session.exec(
                select(User).where(User.email_address == item["email"])
            ).first()
            if not user:
                user = User(
                    email_address=item["email"],
                    password_hash=pw_hash,
                    is_recruiter=False,
                )
                session.add(user)
                session.commit()
                session.refresh(user)

                profile = Profile(
                    user_id=user.id,
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                )
                session.add(profile)
                session.commit()
                session.refresh(profile)

                for lang in item["languages"]:
                    session.add(
                        ProfileLanguage(
                            profile_id=profile.id,
                            language=lang["language"],
                            fluency_level=FluencyLevel(lang["fluency_level"]),
                        )
                    )
                session.commit()

            existing_app = session.exec(
                select(Application).where(
                    Application.job_id == job.id,
                    Application.applicant_id == user.id,
                )
            ).first()
            if not existing_app:
                session.add(
                    Application(
                        job_id=job.id,
                        applicant_id=user.id,
                        status=item["status"],
                        languages=item["languages"],
                        applied_at=now - timedelta(days=item["days_ago"]),
                    )
                )
                created_apps += 1

        session.commit()
        print(f"Seeded {created_apps} new application(s) for job #{job.id} ('{job.title}').")


if __name__ == "__main__":
    seed_applicants()
