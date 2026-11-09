from datetime import datetime, timezone
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, col

from backend.database import get_session
from backend.models import (
    User,
    Job,
    Resume,
    Application,
    InterviewRole,
    InterviewMessage,
    InterviewSession,
    InterviewSessionMessage,
    InterviewSessionCreate,
    InterviewMessageCreate,
    InterviewSessionSummary,
    InterviewSessionDetail,
)
from backend.dependencies import get_current_user
from backend.services.interview_service import get_interview_reply, get_opening_message, validate_new_message

router = APIRouter(tags=["Interview Prep"])


def _get_owned_session(session_id: int, current_user: User, session: Session) -> InterviewSession:
    interview = session.get(InterviewSession, session_id)
    if not interview or interview.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")
    return interview


def _resolve_resume(application: Application, current_user: User, session: Session) -> Resume | None:
    """Uses the resume sent with the application, then the default, then the most recent."""
    if application.resume_id is not None:
        resume = session.get(Resume, application.resume_id)
        if resume:
            return resume

    return session.exec(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(col(Resume.is_default).desc(), col(Resume.uploaded_at).desc())
    ).first()


def _load_messages(session_id: int, session: Session) -> list[InterviewMessage]:
    rows = session.exec(
        select(InterviewSessionMessage)
        .where(InterviewSessionMessage.session_id == session_id)
        .order_by(col(InterviewSessionMessage.id))
    ).all()
    return [InterviewMessage(role=row.role, content=row.content) for row in rows]


def _summary_fields(interview: InterviewSession, job: Job) -> dict:
    return {
        "id": interview.id,
        "job_id": interview.job_id,
        "job_title": job.title,
        "company_name": job.company_name,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
    }


@router.get("/sessions", response_model=List[InterviewSessionSummary])
def list_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    rows = session.exec(
        select(InterviewSession, Job)
        .join(Job, InterviewSession.job_id == Job.id)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(col(InterviewSession.updated_at).desc())
    ).all()
    return [InterviewSessionSummary(**_summary_fields(interview, job)) for interview, job in rows]


@router.post("/sessions", response_model=InterviewSessionDetail, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: InterviewSessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    application = session.get(Application, payload.application_id)
    if not application or application.applicant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    job = session.get(Job, application.job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")

    resume = _resolve_resume(application, current_user, session)
    # The AI call comes first so a provider failure leaves no empty session behind
    opening_message = get_opening_message(job, resume)

    interview = InterviewSession(user_id=current_user.id, job_id=job.id, resume_id=resume.id if resume else None)
    session.add(interview)
    session.flush()
    session.add(InterviewSessionMessage(session_id=interview.id, role=InterviewRole.ASSISTANT, content=opening_message))
    session.commit()
    session.refresh(interview)

    return InterviewSessionDetail(
        **_summary_fields(interview, job),
        messages=[InterviewMessage(role=InterviewRole.ASSISTANT, content=opening_message)],
    )


@router.get("/sessions/{session_id}", response_model=InterviewSessionDetail)
def get_session_detail(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    interview = _get_owned_session(session_id, current_user, session)
    job = session.get(Job, interview.job_id)
    return InterviewSessionDetail(**_summary_fields(interview, job), messages=_load_messages(interview.id, session))


@router.post("/sessions/{session_id}/messages", response_model=InterviewMessage)
def send_message(
    session_id: int,
    payload: InterviewMessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    interview = _get_owned_session(session_id, current_user, session)
    validate_new_message(payload.content)

    job = session.get(Job, interview.job_id)
    resume = session.get(Resume, interview.resume_id) if interview.resume_id else None
    history = _load_messages(interview.id, session)
    history.append(InterviewMessage(role=InterviewRole.USER, content=payload.content))

    # Nothing is saved until the AI answers, so a failed send can simply be retried
    reply = get_interview_reply(job, resume, history)

    session.add(InterviewSessionMessage(session_id=interview.id, role=InterviewRole.USER, content=payload.content))
    session.add(InterviewSessionMessage(session_id=interview.id, role=InterviewRole.ASSISTANT, content=reply))
    interview.updated_at = datetime.now(timezone.utc)
    session.add(interview)
    session.commit()

    return InterviewMessage(role=InterviewRole.ASSISTANT, content=reply)
