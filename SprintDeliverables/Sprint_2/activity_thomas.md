# Sprint 2 Contribution & Activity Log

* **Team Member**: Thomas Martel
* **Role**: Backend Developer
* **Project**: CareerConnect (SOEN 341 - Fall 2026)
* **Sprint**: Sprint 2
* **Total Estimated Time Spent**: ~6.8 Hours

---

## Instructions for AI Assistants and Contributors

> **Note for AI assistants**: Whenever helping Thomas with tasks (features, bug fixes, refactoring, tests, or documentation) during Sprint 2:
> 1. Append a new numbered entry to the `Detailed Activity Breakdown` table (or update existing related entries if consolidating work).
> 2. Ensure each entry includes a clear activity description, realistic estimated time spent, and exact links to commits, PRs, issues, or documentation.
> 3. Update the `Total Estimated Time Spent` in the metadata header at the top of this document.
> 4. Keep the `Summary of Deliverables & Artifacts Contributed` section at the bottom up-to-date with any new PRs, issues, or documents.

### Row Template for Activity Table
```markdown
| **[#]** | **[Activity Title]**<br>[Detailed description of what was done, architecture decisions, or problem solved.] | [X] hrs / min | • Commit: [`[hash]`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/[full_hash])<br>• [PR #[num]: [PR Title]](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/[num]) |
```

---

## Detailed Activity Breakdown

| # | Activity / Description | Time Spent | References & Links |
| :--- | :--- | :---: | :--- |
| **1** | **Sprint Planning & Issue Creation (Feature 1)**<br>Decomposed requirements for *User Profile and Resume Management* into GitHub issues, wrote descriptions, acceptance criteria, and task assignments. | 20 min | • [Issue #66: US-03.01: Cap resume file size](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/66)<br>• [Issue #68: US-03.02: Backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/68) |
| **2** | **Cap Resume File Size (US-03.01)**<br>Implemented 5MB PDF file size cap validation on the resume upload endpoint with proper HTTP 400 error handling and response messaging. | 25 min | • Commit: [`a37acdd`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a37acddab4c00ee01ba35775a88b0fa73fb4f04a)<br>• [PR #67: Limited pdf file size to 5 mb](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/67) |
| **3** | **Multi-Resume Database Architecture (US-03.02)**<br>Designed and implemented updated database models, tables, and Pydantic schemas supporting multi-resume uploads and tracking per user. | 30 min | • Commit: [`113edd8`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/113edd82643a75e032dfa22c4f6f874983050116)<br>• [PR #69: Feature/68/backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/69) |
| **4** | **Multi-Resume CRUD Endpoints & 5-Resume Limit (US-03.02)**<br>Implemented endpoints for resume uploading, listing, downloading, and deleting. Enforced business logic capping maximum stored resumes to 5 per candidate user. | 2 hrs | • Commits: [`9b691b0`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/9b691b0c0ce9857d9b93ae793a388e22822a1593), [`ad6c2d6`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/ad6c2d67a14e9f90640dfb0b9dcfe9a9f24ba5c7)<br>• [PR #69: Feature/68/backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/69) |
| **5** | **Backend Audit & Architectural Improvement Tracking**<br>Logged tracking issue #75 and authored comprehensive backend security and architectural audit documentation (`FIXES.md`) detailing remaining issues, file validation vulnerabilities, token typing, and test lifecycle gaps. | 30 min | • [Issue #75: Bug Fixing](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/75)<br>• Commits: [`a5d869a`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a5d869a3cfc684fb68d9f48641496b86e00b8480), [`9a9d9b5`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/9a9d9b5e396263595ebf0cb0c9d784a962a93ce1)<br>• Document: `FIXES.md` |
| **6** | **Auth Security Hardening & CORS Configuration**<br>Mitigated user enumeration and timing attacks during authentication by introducing dummy bcrypt hash checks for non-existent users. Configured FastAPI CORS middleware to allow cross-origin requests from the React frontend. | 25 min | • Commits: [`eaae6d9`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/eaae6d944e8ec3e887fc19b9d3bc2dc528cbe98c), [`d1098ac`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/d1098ac149ffb74fc71e06fa99e5a1b3297a7e13)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |
| **7** | **Streaming Resume Validation & Async Temp Cleanup**<br>Refactored the resume upload endpoint to stream file chunk size validation dynamically (preventing memory exhaustion on large payload attacks) and ensured temporary upload files are cleaned up asynchronously. | 25 min | • Commit: [`a34a501`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a34a501e741e4695024b42b1029c66e2c884cb40)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |
| **8** | **API Route Normalization & Profile Model Fixes**<br>Resolved invalid non-integer user ID crashes in auth dependency, corrected profile model fields and name type defaults, and removed redundant `/api` route prefixing in profile router. | 25 min | • Commits: [`e37f3e4`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/e37f3e4), [`340605b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/340605b), [`1bb663f`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/1bb663f), [`cf0234b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/cf0234b), [`f49a415`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/f49a415)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |
| **9** | **Developer Tooling, Imports Cleanup & Merge**<br>Implemented a project `Makefile` for local testing/linting/running, standardized absolute module imports from `src.backend` to `backend`, removed orphaned repository files, and merged PR #76 into `main`. | 20 min | • Commits: [`c9c8c89`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/c9c8c89), [`178237b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/178237b), [`4666b69`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/4666b69)<br>• Merge Commit: [`df7f670`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/df7f670)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |
| **10** | **Job Data Models, Enums & Schemas (US-04 / Feature 2)**<br>Architected and implemented the `Job` database table in SQLModel with typed `JobSchedule` (Full-time, Part-time) and `JobType` (Permanent, Contract, Temporary, Seasonal, Internship) enums, optional weekly hours range (`min_hours_per_week`, `max_hours_per_week`), salary range, and associated Pydantic request/response schemas. | 30 min | • File: `src/backend/models.py`<br>• Issue: [US-04 (Issue #23)](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/23) |
| **11** | **Job Search, Multi-Filter & Listing API Router (US-04 / Feature 2)**<br>Built dedicated `src/backend/routers/jobs.py` router implementing public case-insensitive keyword search (across title, company, description), multi-criteria filtering (location, category, schedule, type, salary, hours), pagination metadata, detailed job retrieval (404 for inactive), authenticated posting creation, owner editing, and soft deletion. Registered router in `main.py` and documented recruiter inactive visibility in `FIXES.md` (6.6). | 30 min | • Files: `src/backend/routers/jobs.py`, `src/backend/main.py`<br>• Document: `FIXES.md` |
| **12** | **Database Seeding Utility & Developer Tooling (Feature 2)**<br>Developed standalone idempotent seeding script `utility/seedjobs.py` creating an automated demo recruiter account (`recruiter@careerconnect.com`) and populating 15 realistic job postings with diverse categories, locations, schedules, and tech keywords for frontend integration and TA lab demos. Added `make seed` and `make seed-reset` to `Makefile`. | 30 min | • Files: `utility/seedjobs.py`, `Makefile` |

---

## Summary of Deliverables & Artifacts Contributed
* **Pull Requests Created & Merged**:
  * [PR #67: Limited pdf file size to 5 mb](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/67)
  * [PR #69: Feature/68/backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/69)
  * [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76)
* **GitHub Issues Authored / Managed**:
  * [Issue #66: US-03.01: Cap resume file size](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/66)
  * [Issue #68: US-03.02: Backend implementation for multiple resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/68)
  * [Issue #75: Bug Fixing](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/75)
  * [Issue #23: US-04: Job Search and Filtering Capabilities](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/23)
* **Source Code & Routers**:
  * `src/backend/models.py`: Added `Job` table, `JobType`, `JobSchedule` enums, and job schemas.
  * `src/backend/routers/jobs.py`: Complete search, multi-filter, pagination, and CRUD API.
  * `src/backend/main.py`: Mounted `/api/jobs` router.
* **Testing & Developer Utilities**:
  * `utility/seedjobs.py`: Idempotent database seeder with 15 realistic job postings and demo recruiter.
  * `Makefile`: Added `make seed` and `make seed-reset` commands.
* **Documentation**:
  * `FIXES.md`: Comprehensive backend audit and architectural improvement document (including Item 6.6).
