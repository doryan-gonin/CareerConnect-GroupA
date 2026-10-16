> **IMPORTANT SUBMISSION NOTE:**
> According to the SOEN 341 project guidelines, each team member must upload a **PDF report** of their AI log to their personal subdirectory (`AI_Log/<Name>/`). 
> Please export or convert this Markdown document into `AI_Log_Sprint2_Thomas.pdf` (e.g., using VS Code Markdown PDF export, pandoc, or browser print-to-PDF) before the final sprint evaluation.

---

# AI Usage & Validation Log — Sprint 2

* **Student Name**: Thomas Martel
* **Course**: SOEN 341 — Software Process (Fall 2026)
* **Project**: CareerConnect — Job Search and Application Tracking Platform
* **Sprint**: Sprint 2
* **Directory**: `AI_Log/Thomas/`

---

## Instructions for AI Assistants and Contributors

> **Note for AI assistants**: Whenever assisting Thomas with tasks (requirements, planning, code generation, debugging, testing, or documentation), append a new entry to the [Logged AI Interactions](#logged-ai-interactions) section below using the standard 8-field format.

### Standard Entry Template
```markdown
### Entry [X]: [Task ID / Title]
* **Task ID / Title**: [Short description]
* **Purpose of AI Use**: [Brainstorming / Requirements Analysis / Coding / Debugging / Testing / Documentation / Review]
* **Chat Link or Prompt/Response**: [Link to conversation or reference to Appendix item]
* **AI-Suggested Content**: [Concise summary of what the AI proposed, suggested, or generated]
* **Validation**: [How the output was verified, e.g., manual review, running pytest suite, git diff check, comparison against sprint guidelines]
* **Decision**: [Accepted | Modified before use | Rejected]
* **Reflection**: [Brief reflection on what was learned and whether the AI assistance was useful]
* **Responsible Person**: Thomas Martel
```

---

## Logged AI Interactions

### Entry 1: Sprint 2 Deliverables Guidance & Activity Log Structuring
* **Task ID / Title**: Sprint 2 Deliverables Guidance & Activity Log Structuring
* **Purpose of AI Use**: Documentation, sprint deliverable planning, and Git activity audit.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `f5e8e5d0-5e27-4d58-8902-dae3acf27a35`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Analyzed uploaded project guidelines for Sprint 2 individual submittables (Activity Log and AI Log requirements and rubric weight).
  - Audited local Git commits, GitHub Pull Requests (#67, #69, #76), and GitHub issues (#66, #68, #75) associated with Thomas.
  - Recommended and drafted a consolidated 9-item activity log with realistic time estimates, milestone groupings, and clickable reference links (`activity_thomas.md`).
  - Created the standard, reusable AI Log template for Sprint 2 adhering to the 8 mandatory fields.
* **Validation**: 
  - Cross-referenced all proposed entries against the actual Git log history (`git log --author="tom.laripo@gmail.com"`), merged PR branches, and GitHub issue numbers.
  - Reviewed the generated activity log against the official Sprint 2 evaluation rubric criteria.
* **Decision**: Accepted and modified before use (reviewed the structured `.md` log, verified the commit SHAs and PR URLs, and removed the initial `.txt` draft in favor of the markdown deliverable).
* **Reflection**: Using AI significantly streamlined the process of auditing fragmented commits and translating them into clear, professional sprint milestones linked to user stories and deliverables. It helped ensure all mandatory rubric items were covered.
* **Responsible Person**: Thomas Martel

### Entry 2: Feature 2 — Job Search, Filtering, and Listing Backend Implementation
* **Task ID / Title**: Feature 2 — Job Search, Multi-Filter, and Listing Backend Implementation
* **Purpose of AI Use**: Architecture design, schema definition, query implementation, and development utility generation.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `f5e8e5d0-5e27-4d58-8902-dae3acf27a35`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Designed the `Job` database table and schemas (`JobCreate`, `JobUpdate`, `JobResponse`, `JobListResponse`) in `src/backend/models.py`.
  - Introduced typed `JobSchedule` (Full-time, Part-time) and `JobType` (Permanent, Temporary, Contract, Seasonal, Internship) `str, Enum` classes, along with an optional weekly hours range (`min_hours_per_week`, `max_hours_per_week`).
  - Created `src/backend/routers/jobs.py` featuring multi-criteria search (keyword across title, company, description; location; category; salary; hours; schedule; type) with pagination and authenticated CRUD endpoints.
  - Mounted `/api/jobs` router into `src/backend/main.py`.
  - Documented future recruiter inactive job visibility & reactivation in `FIXES.md` (item 6.6).
  - Developed the idempotent seed script `utility/seedjobs.py` with 15 realistic job postings and a demo recruiter account, and updated the `Makefile` with `make seed` and `make seed-reset`.
* **Validation**: 
  - Verified SQLModel and Pydantic schema validation for enum values and optional fields.
  - Confirmed query logic using SQLModel `col().ilike()` and `or_` conditions.
  - Verified import paths and package structure across `models.py`, `jobs.py`, and `utility/seedjobs.py`.
* **Decision**: Accepted and modified before use (adjusted naming of `JobSchedule` vs `JobType` to reflect schedule commitment vs contract nature, structured hours as an optional range, and relocated the seed utility to `utility/` outside `src/`).
* **Reflection**: AI accelerated generating boilerplate query logic and varied sample data. Developer intervention ensured proper architectural boundaries (keeping utility scripts out of `src/`) and intuitive domain terminology.
* **Responsible Person**: Thomas Martel

### Entry 3: Comprehensive Backend Code Audit, Security/Data Bug Fixes & Import Refactoring
* **Task ID / Title**: Comprehensive Backend Code Audit, Security/Data Bug Fixes & Import Refactoring
* **Purpose of AI Use**: Code review, bug identification, security analysis, testing, architecture refactoring, and documentation.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `9dbbde45-0919-46cf-b68b-54bde2b22119`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Conducted a comprehensive audit of the backend repository, identifying critical issues: double router prefix on profiles causing 404 errors, literal string `"None"` defaults in `ProfileUpdate` overwriting SQLite fields, schema mismatches in `ProfileResponse`, unhandled 500 errors on invalid JWT `sub` claims, missing CORS middleware, and user enumeration timing attack vulnerabilities on `/api/auth/login`.
  - Formulated step-by-step solutions for each issue, and authored `FIXES.md` in the project root documenting backlog items (3.3 onwards) including PDF magic-byte validation, access/refresh token distinction, timezone unification, and transactional file cleanup.
  - Identified two runtime exceptions during initial patch implementation: missing `await` on `file.read()` (`TypeError: object of type 'coroutine' has no len()`) and an invalid dummy salt in `bcrypt.checkpw()` (`ValueError: Invalid salt`), providing the working fixes for both.
  - Built an automated 10-point test verification script covering CORS preflight, profile CRUD, safe JWT parsing, timing dummy checks, and chunked resume streaming size limits.
  - Refactored project imports from `src.backend.*` to `backend.*`, removed `src/__init__.py`, and updated `pyproject.toml` (`pythonpath = ["src"]`) to resolve `fastapi-cli` discovery errors (`ModuleNotFoundError: No module named 'src'`) so `make backend-dev` launches cleanly as `backend.main:app`.
  - Drafted a structured GitHub Issue documenting all resolved bugs and verification steps.
* **Validation**: 
  - Executed existing `pytest tests/` test suite (6/6 passing).
  - Authored and executed an in-memory integration verification suite (`verify_fixes.py`) validating CORS preflights, profile CRUD, safe JWT parsing, timing dummy checks, and async resume stream size rejection (10/10 passing).
  - Verified local dev server execution (`make backend-dev`) launching `backend.main:app` cleanly on `http://127.0.0.1:8000`.
* **Decision**: Accepted and modified before use (collaboratively reviewed each bug report, applied fixes iteratively, verified automated test results, agreed on standardizing the package layout to `backend.*`, and reviewed the drafted GitHub issue).
* **Reflection**: Pair programming with the AI for code review was highly effective in spotting subtle runtime exceptions (such as unawaited coroutines and bcrypt salt format requirements) and edge-case data corruption bugs that standard unit tests had missed. The audit significantly hardened the security, data integrity, and developer experience of the backend.
* **Responsible Person**: Thomas Martel

---

<!-- Future AI interactions should be appended below this line -->

### Entry 4: Feature 3 — Job Application Submission & Tracking Backend Implementation
* **Task ID / Title**: Feature 3 — Job Application Submission and Tracking Backend Implementation
* **Purpose of AI Use**: Architecture planning, database schema design, edge-case vulnerability analysis, and API endpoint implementation.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `a007eadf-242e-4ac9-992e-6aba80f6469b`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Designed the `Application` database table with compound unique constraint `(job_id, applicant_id)` and typed `ApplicationStatus` enum (`Applied`, `Under Review`, `Interview`, `Offered`, `Rejected`).
  - Authored Pydantic request and response schemas including `ApplicationDetailResponse` which joins job details and resume information into single response cards for the candidate tracking dashboard.
  - Implemented `POST /api/jobs/{job_id}/apply` supporting optional cover letters, automatic resume resolution (validating specified resume ID vs falling back to user's default/latest resume), recruiter self-application prevention, and duplicate application prevention (`409 Conflict`).
  - Created `src/backend/routers/applications.py` providing candidate application listing with status filtering (`GET /api/applications/me`), single application retrieval (`GET /api/applications/{id}`), candidate application withdrawal (`DELETE /api/applications/{id}`), and recruiter status updates (`PATCH /api/applications/{id}/status`).
  - Analyzed the resume deletion edge case (where deleting a resume from a profile breaks active applications and foreign keys) and authored Item 4.7 in `FIXES.md` documenting snapshotting and soft-delete retention solutions.
* **Validation**: 
  - Authored and executed an in-memory 12-point automated verification script (`scratch/test_feature3.py`) testing all application endpoints, default resume resolution, duplicate rejection (409), self-application guards (400), candidate tracking queries, recruiter status progression (Applied -> Under Review -> Interview -> Offered), authorization isolation (403), and candidate withdrawal (12/12 passed).
  - Executed existing pytest suite (`tests/test_auth.py`, `tests/test_profile.py`), ensuring 100% regression pass (20/20 passed).
  - Formulated manual verification testing checklist via interactive FastAPI Swagger documentation (`http://127.0.0.1:8000/docs`) simulating candidate and recruiter interactions.
* **Decision**: Accepted and modified before use (designated apply endpoint as `POST /api/jobs/{job_id}/apply`, ensured optional cover letter support, added candidate withdrawal capability, omitted automated test writing in favor of manual testing, and documented the resume deletion lifecycle in `FIXES.md`).
* **Reflection**: Collaborative planning and scratch test execution with AI helped anticipate complex domain constraints early—such as race conditions in multi-resume resolution, self-application prevention, and file retention upon resume deletion—producing thoroughly verified backend endpoints ready for frontend integration and peer test authoring.
* **Responsible Person**: Thomas Martel

---

## Appendix: Extended Prompts & Responses (Optional)

*(Include full prompts and extended AI outputs here if conversation share links are unavailable.)*

### Appendix 1: Context for Entry 1
* **Context**: Reviewing Sprint 2 guidelines and compiling individual deliverables (Activity Log and AI Log) based on repository history.
* **Key Queries**:
  1. Explanation of Sprint 2 individual submittables based on project guideline documents.
  2. Consolidation and formatting of Git commits, PRs, and issues into an official activity log.
  3. Initialization of the AI Usage Log with reusable structure for subsequent sprint entries.

### Appendix 2: Context for Entry 3
* **Context**: Backend code audit, security vulnerability identification, runtime bug remediation, and import architecture refactoring.
* **Key Queries**:
  1. Backend code audit identifying current bugs, security flaws, and architectural problems.
  2. Diagnostic review of initial bug fixes catching runtime `TypeError` and `ValueError: Invalid salt`.
  3. Creation of `FIXES.md` detailing remaining backlog improvements.
  4. Integration testing and debugging of `fastapi dev` `ModuleNotFoundError: No module named 'src'`.
  5. Refactoring to standard `backend.*` namespace layout and drafting a GitHub Issue.
