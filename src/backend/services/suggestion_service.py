"""AI assisted job suggestions with a deterministic, offline fallback.

The provider receives a compact JSON document and must return
``{"suggestions": [{"job_id": 1, "score": 0.8, "justification": "..."}]}``.
Cached rows keep browsing fast and make provider failures non-blocking.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timedelta, timezone

import httpx
from sqlmodel import Session, select

from backend.config import (
    AI_API_BASE_URL,
    AI_API_KEY,
    AI_MODEL,
    AI_MOCK_MODE,
    AI_SUGGESTIONS_CACHE_TTL_MINUTES,
)
from backend.models import Job, JobSuggestion, JobViewLog, Resume, SearchLog, User
from backend.services.interview_service import extract_resume_text

MAX_JOBS_IN_PROMPT = 100
_SKILL_WORDS = {
    "python", "javascript", "typescript", "react", "sql", "java", "c++", "aws",
    "docker", "kubernetes", "git", "excel", "figma", "product", "marketing",
    "sales", "design", "finance", "research", "analytics", "leadership",
}


def _skills(text: str) -> set[str]:
    lower = text.lower()
    return {skill for skill in _SKILL_WORDS if re.search(rf"(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])", lower)}


def candidate_context(session: Session, user: User, resume: Resume | None) -> dict:
    text = extract_resume_text(resume)
    logs = session.exec(select(SearchLog).where(SearchLog.user_id == user.id).order_by(SearchLog.searched_at.desc()).limit(20)).all()
    views = session.exec(
        select(Job).join(JobViewLog, JobViewLog.job_id == Job.id)
        .where(JobViewLog.user_id == user.id).order_by(JobViewLog.viewed_at.desc()).limit(20)
    ).all()
    locations = [log.location.strip() for log in logs if log.location and log.location.strip()]
    categories = [log.category.strip() for log in logs if log.category and log.category.strip()]
    salary_values = [log.salary_min for log in logs if log.salary_min is not None]
    hours = [job.max_hours_per_week or job.min_hours_per_week for job in views if job.max_hours_per_week or job.min_hours_per_week]
    return {
        "skills": sorted(_skills(text)),
        "salary_min": round(sum(salary_values) / len(salary_values)) if salary_values else None,
        "locations": [item for item, _ in Counter(locations).most_common(5)],
        "categories": [item for item, _ in Counter(categories).most_common(5)],
        "typical_hours_per_week": round(sum(hours) / len(hours)) if hours else None,
    }


def build_suggestion_prompt(candidate: dict, jobs: list[Job]) -> str:
    payload = {
        "candidate": candidate,
        "jobs": [
            {"job_id": job.id, "title": job.title, "description": job.description[:800],
             "location": job.location, "category": job.category,
             "salary_min": job.salary_min, "salary_max": job.salary_max,
             "min_hours_per_week": job.min_hours_per_week, "max_hours_per_week": job.max_hours_per_week}
            for job in jobs[:MAX_JOBS_IN_PROMPT]
        ],
    }
    return (
        "Rank these job postings for the candidate. Consider resume skills, salary fit, "
        "geographic patterns, and typical weekly hours when available. Return JSON only, "
        "with this schema: {\"suggestions\":[{\"job_id\":number,\"score\":number,"
        "\"justification\":string}]}. Score must be 0..1. Include one concise factual "
        "justification for every job. Never invent candidate facts.\n" + json.dumps(payload, separators=(",", ":"))
    )


def _deterministic(candidate: dict, jobs: list[Job]) -> list[dict]:
    skills = set(candidate.get("skills") or [])
    salary = candidate.get("salary_min")
    locations = {str(x).casefold() for x in candidate.get("locations") or []}
    hours = candidate.get("typical_hours_per_week")
    results = []
    for job in jobs:
        haystack = f"{job.title} {job.description} {job.category}".lower()
        matched = sorted(skill for skill in skills if skill in haystack)
        score = min(1.0, 0.2 + 0.14 * len(matched))
        reasons = []
        if matched:
            reasons.append("matches resume skills: " + ", ".join(matched[:4]))
        if salary is not None and (job.salary_max or 0) >= salary:
            score += 0.15
            reasons.append("meets your observed salary preference")
        if locations and any(loc in job.location.casefold() for loc in locations):
            score += 0.15
            reasons.append("matches a location from your searches")
        job_hours = job.max_hours_per_week or job.min_hours_per_week
        if hours is not None and job_hours is not None and abs(job_hours - hours) <= 5:
            score += 0.1
            reasons.append("fits your typical weekly hours")
        if not reasons:
            reasons.append("similar to your recent job browsing")
        results.append({"job_id": job.id, "score": round(min(score, 1.0), 3), "justification": "; ".join(reasons) + "."})
    return results


def _provider_suggestions(candidate: dict, jobs: list[Job]) -> list[dict] | None:
    if AI_MOCK_MODE or not AI_API_KEY or not AI_API_BASE_URL or not AI_MODEL:
        return None
    payload = {
        "model": AI_MODEL,
        "messages": [
            {"role": "system", "content": "You are a job recommendation engine. Return valid JSON only."},
            {"role": "user", "content": build_suggestion_prompt(candidate, jobs)},
        ],
        "temperature": 0,
        "max_tokens": 3000,
        "response_format": {"type": "json_object"},
    }
    headers = {"Authorization": f"Bearer {AI_API_KEY}"}
    try:
        response = httpx.post(f"{AI_API_BASE_URL.rstrip('/')}/chat/completions", json=payload, headers=headers, timeout=20.0)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        data = json.loads(content)
        rows = data.get("suggestions")
        valid_ids = {job.id for job in jobs}
        if not isinstance(rows, list):
            return None
        output = []
        for row in rows:
            if not isinstance(row, dict) or row.get("job_id") not in valid_ids:
                continue
            if not isinstance(row.get("justification"), str) or not row["justification"].strip():
                continue
            try:
                score = max(0.0, min(1.0, float(row.get("score", 0))))
            except (TypeError, ValueError):
                continue
            output.append({"job_id": row["job_id"], "score": score, "justification": row["justification"].strip()[:500]})
        return output or None
    except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        return None


def refresh_suggestions(session: Session, user: User, jobs: list[Job] | None = None) -> list[JobSuggestion]:
    jobs = jobs or session.exec(select(Job).where(Job.is_active == True).order_by(Job.posted_at.desc()).limit(MAX_JOBS_IN_PROMPT)).all()
    resume = session.exec(select(Resume).where(Resume.user_id == user.id).order_by(Resume.is_default.desc(), Resume.uploaded_at.desc())).first()
    candidate = candidate_context(session, user, resume)
    rows = _provider_suggestions(candidate, jobs) or _deterministic(candidate, jobs)
    by_id = {row["job_id"]: row for row in rows}
    now = datetime.now(timezone.utc)
    existing = {item.job_id: item for item in session.exec(select(JobSuggestion).where(JobSuggestion.user_id == user.id)).all()}
    for job in jobs:
        row = by_id.get(job.id) or {"job_id": job.id, "score": 0.0, "justification": "No matching profile data was available."}
        item = existing.get(job.id) or JobSuggestion(user_id=user.id, job_id=job.id)
        item.score, item.justification, item.generated_at = row["score"], row["justification"], now
        session.add(item)
    session.commit()
    return list(existing.values()) + [item for item in session.exec(select(JobSuggestion).where(JobSuggestion.user_id == user.id)).all() if item.job_id not in existing]


def get_cached_suggestions(session: Session, user: User, refresh: bool = False) -> dict[int, JobSuggestion]:
    rows = session.exec(select(JobSuggestion).where(JobSuggestion.user_id == user.id)).all()
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=AI_SUGGESTIONS_CACHE_TTL_MINUTES)
    stale = refresh or not rows or any((row.generated_at.replace(tzinfo=timezone.utc) if row.generated_at.tzinfo is None else row.generated_at) < cutoff for row in rows)
    if stale:
        rows = refresh_suggestions(session, user)
    return {row.job_id: row for row in rows}
