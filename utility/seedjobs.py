"""
Seed script to populate CareerConnect database with realistic job postings
for testing and demonstration of Feature 2 (Job Search & Filtering).
"""
import sys
import argparse
from pathlib import Path

# Ensure 'src' is in sys.path so 'backend' package is discoverable
ROOT_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

import bcrypt
from sqlmodel import Session, select
from backend.database import engine, init_db
from backend.models import User, Profile, Job, JobType, JobSchedule

DEMO_RECRUITER_EMAIL = "recruiter@careerconnect.com"
DEMO_RECRUITER_PASSWORD = "Password123!"


def get_or_create_demo_recruiter(session: Session) -> User:
    """Finds or creates the demo recruiter account to own the seeded jobs."""
    recruiter = session.exec(
        select(User).where(User.email_address == DEMO_RECRUITER_EMAIL.casefold())
    ).first()

    if not recruiter:
        pw_hashed = bcrypt.hashpw(DEMO_RECRUITER_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        recruiter = User(
            email_address=DEMO_RECRUITER_EMAIL.casefold(),
            password_hash=pw_hashed,
        )
        session.add(recruiter)
        session.commit()
        session.refresh(recruiter)

        # Create profile
        profile = Profile(
            user_id=recruiter.id,
            first_name="Sarah",
            last_name="Recruiter",
        )
        session.add(profile)
        session.commit()
        print(f"Created demo recruiter account: {DEMO_RECRUITER_EMAIL} (Password: {DEMO_RECRUITER_PASSWORD})")
    else:
        print(f"Using existing demo recruiter account: {DEMO_RECRUITER_EMAIL}")

    return recruiter


SAMPLE_JOBS = [
    {
        "title": "Senior Backend Engineer (Python / FastAPI)",
        "company_name": "Shopify",
        "description": (
            "We are looking for a Senior Backend Engineer to build high-scale, resilient services powering our merchant checkout platform. "
            "You will work with Python, FastAPI, PostgreSQL, and distributed message queues. "
            "Requirements:\n"
            "- 5+ years of experience with Python and relational databases\n"
            "- Strong grasp of asynchronous programming (asyncio, FastAPI)\n"
            "- Familiarity with Docker, Kubernetes, and CI/CD pipelines"
        ),
        "location": "Montreal, QC",
        "category": "Software Engineering",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 40,
        "max_hours_per_week": 40,
        "salary_min": 125000,
        "salary_max": 155000,
    },
    {
        "title": "Junior Frontend Developer (React / TypeScript)",
        "company_name": "Element AI",
        "description": (
            "Join our design engineering team to craft delightful web interfaces for AI-driven customer tools. "
            "Stack includes React, TypeScript, Tailwind CSS, and Vite. "
            "Responsibilities include implementing reusable components, collaborating with UX designers, and writing unit tests."
        ),
        "location": "Montreal, QC",
        "category": "Software Engineering",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 37,
        "max_hours_per_week": 40,
        "salary_min": 70000,
        "salary_max": 85000,
    },
    {
        "title": "UI/UX Product Designer",
        "company_name": "Lightspeed Commerce",
        "description": (
            "Lightspeed is seeking a talented UI/UX Product Designer to design intuitive POS and eCommerce experiences. "
            "You will conduct user interviews, build wireframes, and design high-fidelity prototypes in Figma. "
            "Portfolio demonstrating end-to-end user workflows is required."
        ),
        "location": "Montreal, QC",
        "category": "Design",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 40,
        "max_hours_per_week": 40,
        "salary_min": 85000,
        "salary_max": 110000,
    },
    {
        "title": "Software Engineering Intern (Winter 2027)",
        "company_name": "Morgan Stanley",
        "description": (
            "Great opportunity for students enrolled in Computer Science or Software Engineering. "
            "Work alongside senior developers on real-time financial services and distributed microservices. "
            "Must be comfortable with object-oriented programming (Python, Java, or C++) and basic data structures."
        ),
        "location": "Montreal, QC",
        "category": "Software Engineering",
        "job_type": JobType.INTERNSHIP,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 35,
        "max_hours_per_week": 40,
        "salary_min": 55000,
        "salary_max": 65000,
    },
    {
        "title": "Part-Time Technical Support Specialist",
        "company_name": "CloudWorks",
        "description": (
            "Seeking a flexible, customer-focused tech support agent to assist clients with software setup, "
            "troubleshooting network connectivity, and ticket triaging. Flexible shift scheduling ideal for university students."
        ),
        "location": "Remote",
        "category": "Technical Support",
        "job_type": JobType.TEMPORARY,
        "job_schedule": JobSchedule.PART_TIME,
        "min_hours_per_week": 15,
        "max_hours_per_week": 25,
        "salary_min": 35000,
        "salary_max": 45000,
    },
    {
        "title": "Data Scientist / Machine Learning Engineer",
        "company_name": "Mila - Quebec AI Institute",
        "description": (
            "Join researchers and industry partners in fine-tuning open-source LLMs and training computer vision models. "
            "Requirements:\n"
            "- Proficiency in PyTorch, Python, and scientific computing (NumPy, Pandas)\n"
            "- Experience training models on distributed GPU clusters\n"
            "- Strong background in statistics and algorithmic evaluation"
        ),
        "location": "Montreal, QC",
        "category": "Data Science & AI",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 40,
        "max_hours_per_week": 40,
        "salary_min": 110000,
        "salary_max": 140000,
    },
    {
        "title": "Cloud Infrastructure & DevOps Engineer",
        "company_name": "Bell Canada",
        "description": (
            "Contract position focused on migrating legacy services to AWS and automated Terraform orchestration. "
            "Must possess solid Linux systems administration skills, Terraform expertise, and Kubernetes knowledge."
        ),
        "location": "Toronto, ON",
        "category": "DevOps & Infrastructure",
        "job_type": JobType.CONTRACT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 40,
        "max_hours_per_week": 40,
        "salary_min": 100000,
        "salary_max": 130000,
    },
    {
        "title": "Part-Time QA Manual & Automation Tester",
        "company_name": "Ubisoft Montreal",
        "description": (
            "Work with development squads to perform regression testing, report reproducible game bugs, and write Playwright scripts. "
            "Flexible 20 hours per week schedule."
        ),
        "location": "Montreal, QC",
        "category": "Quality Assurance",
        "job_type": JobType.CONTRACT,
        "job_schedule": JobSchedule.PART_TIME,
        "min_hours_per_week": 18,
        "max_hours_per_week": 25,
        "salary_min": 40000,
        "salary_max": 52000,
    },
    {
        "title": "Full-Stack Web Developer",
        "company_name": "Wealthsimple",
        "description": (
            "Build secure financial dashboard features used by millions of Canadians. "
            "Tech stack: TypeScript, Node.js, Next.js, and PostgreSQL. Experience building accessible and high-performance apps is a big plus."
        ),
        "location": "Toronto, ON",
        "category": "Software Engineering",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 40,
        "max_hours_per_week": 40,
        "salary_min": 115000,
        "salary_max": 145000,
    },
    {
        "title": "Product Marketing Coordinator",
        "company_name": "Hopper",
        "description": (
            "Lead email campaigns, app-store optimization, and growth analytics for our travel booking platform. "
            "Collaborate with product and data engineering teams to optimize customer conversion."
        ),
        "location": "Remote",
        "category": "Marketing",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 40,
        "max_hours_per_week": 40,
        "salary_min": 65000,
        "salary_max": 80000,
    },
    {
        "title": "Seasonal IT Support Technician",
        "company_name": "Concordia University",
        "description": (
            "Provide student and faculty assistance for computer labs, printer networks, and account password resets during peak semester periods. "
            "Great on-campus opportunity for students."
        ),
        "location": "Montreal, QC",
        "category": "Information Technology",
        "job_type": JobType.SEASONAL,
        "job_schedule": JobSchedule.PART_TIME,
        "min_hours_per_week": 10,
        "max_hours_per_week": 20,
        "salary_min": 28000,
        "salary_max": 36000,
    },
    {
        "title": "Data Analyst Intern (Summer 2027)",
        "company_name": "Air Canada",
        "description": (
            "Assist revenue management and route scheduling teams by analyzing flight metrics, passenger traffic, and pricing trends using SQL and Tableau. "
            "Mentorship from senior data specialists provided."
        ),
        "location": "Montreal, QC",
        "category": "Data Science & AI",
        "job_type": JobType.INTERNSHIP,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 35,
        "max_hours_per_week": 40,
        "salary_min": 50000,
        "salary_max": 60000,
    },
    {
        "title": "Mobile App Developer (React Native)",
        "company_name": "SSENSE",
        "description": (
            "Develop modern, fluid mobile commerce experiences for iOS and Android. "
            "Strong TypeScript, React Native, and REST/GraphQL API integration experience required."
        ),
        "location": "Montreal, QC",
        "category": "Software Engineering",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 40,
        "max_hours_per_week": 40,
        "salary_min": 95000,
        "salary_max": 125000,
    },
    {
        "title": "Cybersecurity Analyst",
        "company_name": "National Bank of Canada",
        "description": (
            "Monitor enterprise networks for suspicious activities, execute vulnerability assessments, and help maintain incident response protocols. "
            "Familiarity with SIEM tools and security frameworks is required."
        ),
        "location": "Montreal, QC",
        "category": "Cybersecurity",
        "job_type": JobType.PERMANENT,
        "job_schedule": JobSchedule.FULL_TIME,
        "min_hours_per_week": 37,
        "max_hours_per_week": 40,
        "salary_min": 90000,
        "salary_max": 120000,
    },
    {
        "title": "Part-Time Technical Content Writer",
        "company_name": "OpenText",
        "description": (
            "Draft API documentation, release notes, and developer guides for enterprise cloud platforms. "
            "Flexible hours; requires strong technical communication skills and familiarity with Markdown and Git."
        ),
        "location": "Remote",
        "category": "Content & Communications",
        "job_type": JobType.TEMPORARY,
        "job_schedule": JobSchedule.PART_TIME,
        "min_hours_per_week": 10,
        "max_hours_per_week": 15,
        "salary_min": 30000,
        "salary_max": 40000,
    },
]


def seed_jobs(reset: bool = False):
    """Seed sample jobs into SQLite database."""
    init_db()

    with Session(engine) as session:
        if reset:
            print("Resetting existing job postings...")
            existing_jobs = session.exec(select(Job)).all()
            for job in existing_jobs:
                session.delete(job)
            session.commit()
            print("Cleared all job records.")

        recruiter = get_or_create_demo_recruiter(session)

        added = 0
        skipped = 0

        for job_data in SAMPLE_JOBS:
            # Check for existing job by title and company to avoid duplicates
            existing = session.exec(
                select(Job).where(
                    Job.title == job_data["title"],
                    Job.company_name == job_data["company_name"],
                )
            ).first()

            if existing:
                skipped += 1
                continue

            new_job = Job(
                recruiter_id=recruiter.id,
                is_active=True,
                **job_data,
            )
            session.add(new_job)
            added += 1

        session.commit()
        total = session.exec(select(Job)).all()
        print(f"Seeding complete! Added: {added}, Skipped (existing): {skipped}, Total jobs in DB: {len(total)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed CareerConnect database with sample job postings")
    parser.add_argument("--reset", action="store_true", help="Delete all existing jobs before seeding")
    args = parser.parse_args()

    seed_jobs(reset=args.reset)
