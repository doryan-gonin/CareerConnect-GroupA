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
* **Task ID / Title**: [Short description or GitHub issue ID, e.g., US-03.01 / Issue #66]
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
* **Task ID / Title**: US-04: Feature 2 — Job Search, Multi-Filter, and Listing Backend Implementation
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

---

<!-- Future AI interactions should be appended below this line -->

---

## Appendix: Extended Prompts & Responses (Optional)

*(Include full prompts and extended AI outputs here if conversation share links are unavailable.)*

### Appendix 1: Context for Entry 1
* **Context**: Reviewing Sprint 2 guidelines and compiling individual deliverables (Activity Log and AI Log) based on repository history.
* **Key Queries**:
  1. Explanation of Sprint 2 individual submittables based on project guideline documents.
  2. Consolidation and formatting of Git commits, PRs, and issues into an official activity log.
  3. Initialization of the AI Usage Log with reusable structure for subsequent sprint entries.
