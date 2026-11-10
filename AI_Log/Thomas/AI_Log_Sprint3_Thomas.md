> **IMPORTANT SUBMISSION NOTE:**
> According to the SOEN 341 project guidelines, each team member must upload a **PDF report** of their AI log to their personal subdirectory (`AI_Log/<Name>/`). 
> Please export or convert this Markdown document into `AI_Log_Sprint3_Thomas.pdf` (e.g., using VS Code Markdown PDF export, pandoc, or browser print-to-PDF) before the final sprint evaluation.

---

# AI Usage & Validation Log — Sprint 3

* **Student Name**: Thomas Martel
* **Course**: SOEN 341 — Software Process (Fall 2026)
* **Project**: CareerConnect — Job Search and Application Tracking Platform
* **Sprint**: Sprint 3
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

### Entry 1: Job Search Frontend Deficiencies & UX Enhancements Audit (Issues 7.1 – 7.10)
* **Task ID / Title**: Job Search Frontend Deficiencies & UX Enhancements Audit (Issues 7.1 – 7.10)
* **Purpose of AI Use**: Requirements analysis, frontend code audit, architectural planning, and documentation.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `d099cdb9-5661-4970-a028-a16306bfbaac`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Conducted a comprehensive audit of the job search page frontend (`src/frontend/src/components/JobSearchPage.jsx`, `JobSearchPageNavbar.jsx`, and `src/frontend/src/api/jobs.js`).
  - Identified 10 key UX, UI, and functional deficiencies: ambiguous initial/empty search feedback (7.1), hidden search button (7.2), destructive reset wiping all job postings (7.3), stuck dropdown menus lacking outside-click handlers (7.4), freeform category text input causing misspellings (7.5), selected job preview ghosting across queries (7.6), lack of dedicated full-screen job posting inspection (7.7), missing sorting by salary/hours in frontend and API (7.8), top navbar styling and layout inconsistencies (7.9), and missing pagination controls (7.10).
  - Authored Section 5 in `FIXES.md` (Items 7.1 through 7.10) establishing an iterative, prioritized remediation roadmap.
* **Validation**: 
  - Cross-referenced issues against live component behavior, user story acceptance criteria (US-04.01, US-04.02), and backend capabilities in `src/backend/routers/jobs.py`.
  - Confirmed documentation accuracy in `FIXES.md` with git diff validation.
* **Decision**: Accepted (reviewed the 10-point audit, validated the proposed fix strategies, and authorized proceeding sequentially).
* **Reflection**: Establishing a rigorous, documented defect inventory in `FIXES.md` prior to code modifications prevented fragmented hotfixes and ensured clear tracking across all UI/UX enhancements.
* **Responsible Person**: Thomas Martel

### Entry 2: Frontend UI Alignment & Dropdown Menu Interaction Fixes (Issues 7.9 & 7.4)
* **Task ID / Title**: Frontend UI Alignment & Dropdown Menu Interaction Fixes (Issues 7.9 & 7.4)
* **Purpose of AI Use**: UI styling alignment, React state management, DOM event handling, and linter validation.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `d099cdb9-5661-4970-a028-a16306bfbaac`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Refactored `JobSearchPageNavbar.jsx` to harmonize its visual appearance with `Navbar.jsx`: aligned top navigation bar with brand on the left, Dashboard link and Log out button on the right, and segregated search and filter controls into a dedicated sub-bar.
  - Implemented outside-click detection using React `useRef` and `pointerdown` listeners, explicit menu closure upon option selection, and `Escape` key dismissal across Category, Job Type, Schedule, and Order dropdowns.
* **Validation**: 
  - Verified in-browser dropdown behavior: menus close immediately on option selection, clicking anywhere outside, or pressing the Escape key.
  - Executed `npm --prefix src/frontend run lint` (`oxlint`) and `npm --prefix src/frontend run build` (`vite build`) confirming 0 errors and clean compilation.
* **Decision**: Accepted (reviewed layout changes, verified event listeners, and confirmed clean build).
* **Reflection**: Harmonizing component styling and implementing standard popover dismissal patterns first created a clean, distraction-free foundation before tackling complex filtering and data-fetching logic.
* **Responsible Person**: Thomas Martel

### Entry 3: Curated Category Selection Dropdown & Dynamic Multi-Criteria Sorting (Issues 7.5 & 7.8)
* **Task ID / Title**: Curated Category Selection Dropdown & Dynamic Multi-Criteria Sorting (Issues 7.5 & 7.8)
* **Purpose of AI Use**: Frontend development, API parameter integration, and query parameter handling.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `d099cdb9-5661-4970-a028-a16306bfbaac`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Replaced the error-prone freeform text input for category in `JobSearchPageNavbar.jsx` with a curated, scrollable dropdown supporting standard industry categories (Software Engineering, Design, Data Science & AI, DevOps, Finance, Marketing, etc.) and an "All Categories" reset option.
  - Updated `searchJobs` in `src/frontend/src/api/jobs.js` to accept `sortBy` and `sortOrder` and pass them as query parameters to `/api/jobs`.
  - Expanded the Order dropdown in `JobSearchPageNavbar.jsx` to include Newest First, Oldest First, Highest Salary (`salary_max` desc), Lowest Salary (`salary_min` asc), Most Hours (`max_hours_per_week` desc), and Fewest Hours (`max_hours_per_week` asc).
* **Validation**: 
  - Verified API requests with query parameters against FastAPI backend endpoints.
  - Verified sorting returns matching job records correctly ordered by compensation and hours.
  - Executed `oxlint` and `vite build` confirming 0 warnings and 0 errors.
* **Decision**: Accepted (reviewed category options, confirmed API query string formatting, and validated build).
* **Reflection**: Utilizing existing backend sort and category capabilities without requiring schema changes delivered immediate user value, making job discovery fast and intuitive.
* **Responsible Person**: Thomas Martel

### Entry 4: Reactive Filter Application & HTML5 History Routing Separation (Issues 7.2 & 7.11)
* **Task ID / Title**: Reactive Filter Application & HTML5 History Routing Separation (Issues 7.2 & 7.11)
* **Purpose of AI Use**: Reactive UI event architecture, client-side routing design, and browser history management.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `d099cdb9-5661-4970-a028-a16306bfbaac`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Added a visible primary Search button and updated `triggerSearch` so clicking any option in Category, Job Type, Schedule, or Order immediately re-executes the search reactively.
  - Introduced Issue 7.11 (Page Separation) to separate `/dashboard` and `/jobs` into distinct, URL-addressable pages.
  - Implemented HTML5 History API path-based routing in `App.jsx` (`pushState`, `replaceState`, and `popstate` event listeners) supporting `/dashboard`, `/jobs`, `/login`, and `/signup`.
  - Updated `Navbar.jsx` ("Browse Jobs" -> `/jobs`) and `JobSearchPageNavbar.jsx` ("Dashboard" -> `/dashboard`) with history navigation.
  - Documented Issue 7.11 in `FIXES.md`.
* **Validation**: 
  - Verified URL transitions between `/dashboard` and `/jobs` without full page reloads.
  - Tested browser Back and Forward navigation buttons, confirming correct view restoration.
  - Verified direct URL navigation and deep-link preservation upon login.
  - Verified `oxlint` and `vite build` with 0 warnings.
* **Decision**: Accepted (reviewed routing implementation, verified popstate handling, and confirmed clean build).
* **Reflection**: Client-side HTML5 history routing elevates the application from a single-screen prototype to a multi-page web application while preserving instant SPA transitions.
* **Responsible Person**: Thomas Martel

### Entry 5: Search Query Reset, Initial Mount Auto-Search & Selection Synchronization (Issues 7.3, 7.1 & 7.6)
* **Task ID / Title**: Search Query Reset, Initial Mount Auto-Search & Selection Synchronization (Issues 7.3, 7.1 & 7.6)
* **Purpose of AI Use**: Lifecycle state management, edge-case bug remediation, and user experience enhancement.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `d099cdb9-5661-4970-a028-a16306bfbaac`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Updated `handleReset` in `JobSearchPageNavbar.jsx` to restore all filter inputs/dropdowns to default and immediately trigger `searchJobs({})`, displaying all active jobs instead of clearing the results list to an empty array.
  - Added initial mount `useEffect` in `JobSearchPageNavbar.jsx` to automatically fetch and display all active jobs immediately upon arrival at `/jobs`, eliminating the unsearched empty prompt.
  - Updated `JobSearchPage.jsx` with `hasLoaded` state to provide distinct feedback: `"Loading jobs…"` during fetching and `"No jobs found matching your search."` when zero results match.
  - Updated `handleJobsLoaded` in `JobSearchPage.jsx` to revalidate `selectedJob` against newly loaded results, clearing selection and alerts if the previously selected job is no longer present.
* **Validation**: 
  - Verified that navigating to `/jobs` immediately displays all available active jobs without manual user interaction.
  - Verified that clicking Reset re-fetches all jobs and deselects the current preview.
  - Verified that running a search query that excludes the selected job cleanly removes the right-pane preview without ghost data.
  - Executed `oxlint` and `vite build` with 0 warnings and 0 errors.
* **Decision**: Accepted (reviewed behavior, checked exhaustive-deps lint annotations, and verified build).
* **Reflection**: Auto-loading results on mount and synchronizing side-panel selection with query results eliminates confusion, ensuring the UI always accurately reflects current state.
* **Responsible Person**: Thomas Martel

### Entry 6: Search Results Pagination & Multi-Page Navigation (Issue 7.10)
* **Task ID / Title**: Search Results Pagination & Multi-Page Navigation (Issue 7.10)
* **Purpose of AI Use**: Frontend API pagination integration, state flow design, and UI component implementation.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `d099cdb9-5661-4970-a028-a16306bfbaac`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Updated `searchJobs` in `src/frontend/src/api/jobs.js` to accept `page` and `limit` arguments and pass them to backend query parameters.
  - Updated `JobSearchPageNavbar.jsx` to extract `page`, `totalPages`, `total`, and `limit` from the backend `JobListResponse` and pass pagination metadata along with an `onPageChange` callback to `JobSearchPage.jsx`.
  - Implemented pagination controls in `JobSearchPage.jsx` rendering: "Showing X–Y of Z jobs" summary, Previous and Next buttons with boundary disabling, and intelligent ellipsis page number buttons.
* **Validation**: 
  - Tested pagination across multi-page result sets, verifying correct boundary calculations and page switching.
  - Verified that changing filter criteria resets pagination to page 1.
  - Executed `oxlint` and `vite build` with 0 warnings and 0 errors.
* **Decision**: Accepted (reviewed pagination UI layout, verified boundary disabling, and confirmed clean build).
* **Reflection**: Multi-page pagination allows CareerConnect to scale effortlessly to hundreds or thousands of postings while maintaining fast response times and clean presentation.
* **Responsible Person**: Thomas Martel

### Entry 7: Dedicated Full-Page Job Details Route `/jobs/:job_id` (Issue 7.7)
* **Task ID / Title**: Dedicated Full-Page Job Details Route `/jobs/:job_id` (Issue 7.7)
* **Purpose of AI Use**: Architecture design, routing integration, component development, and build validation.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `d099cdb9-5661-4970-a028-a16306bfbaac`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - In response to user feedback, replaced the initial popup modal design with a dedicated full-page view at `siteurl/jobs/:job_id`.
  - Added `getJobById(jobId)` to `src/frontend/src/api/jobs.js` fetching `GET /api/jobs/{job_id}` with comprehensive error handling.
  - Created `src/frontend/src/components/JobDetailPage.jsx` featuring:
    - Dedicated top navbar (CareerConnect logo linking to `/dashboard`, "Browse Jobs", "Dashboard", and "Log out" button).
    - "← Back to Jobs" breadcrumb navigation link.
    - Loading spinner and 404 error state handling.
    - Comprehensive job header (company, category badge, posted date, title, location).
    - Specifications grid (Job Type, Schedule, formatted Compensation, Work Hours, Location, Category).
    - Full description block with proper whitespace handling.
    - Integrated application submission button with real-time feedback.
  - Wired `/jobs/:job_id` routing in `App.jsx` with regex matching, popstate handling, and unauthenticated deep-linking preservation.
  - Updated `JobSearchPage.jsx` to link both the job title and the "Expand" button to `/jobs/:id` via `onViewJob`, supporting right-click new tab navigation.
  - Updated Section 7.7 in `FIXES.md`.
* **Validation**: 
  - Verified direct URL navigation to `/jobs/:id` and browser Back/Forward navigation between search listings and job details.
  - Tested application submission and error/success alerts.
  - Validated with `oxlint` (0 errors, 0 warnings) and verified Vite production build.
* **Decision**: Accepted and modified before use (pivoted from modal popup to dedicated page route per user requirement).
* **Reflection**: Dedicated page routing provides a superior experience over modals by enabling direct bookmarking, URL sharing, seamless back-button navigation, and clean separation of concerns.
* **Responsible Person**: Thomas Martel

### Entry 8: Priority Roadmap Restructuring & Issue Reorganization (FIXES.md)
* **Task ID / Title**: Priority Roadmap Restructuring & Issue Reorganization (FIXES.md)
* **Purpose of AI Use**: Code review analysis, prioritization roadmap design, and documentation refactoring.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `e3ce2ccb-15fc-478c-8a92-a77155b38367`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Audited code review findings on the merged AI interview preparation pull request and integrated newly identified defects with the existing backlog.
  - Restructured `FIXES.md` with an operational Priority Roadmap grouping items into four clear urgency tiers:
    - **Tier 1: Blockers & Runtime Bugs** (Issues 4.8, 4.7, 2.2, 2.6).
    - **Tier 2: Functional Reliability & UX** (Issues 4.7 fallback, 4.9, 4.10, 3.1).
    - **Tier 3: Test Architecture & Data Integrity** (Issues 1.1, 1.2, 1.3, 3.2, 3.3, 3.4, 4.2).
    - **Tier 4: Quality of Life & Scalability** (Issues 2.1, 2.3, 2.4, 2.5, 2.7, 4.1, 4.3, 4.4, 4.5, 4.6, 4.11).
  - Sequentially renumbered all document sections (Sections 1.1–5.11) and updated all cross-references and internal anchor links.
  - Authored detailed issue specifications for new AI interview items (4.8 defensive parsing, 4.9 turn-based history truncation, 4.10 chat Markdown rendering, 4.11 mock/offline fallback).
  - Removed dev-environment-only dependency issue 3.5 (`pypdf` sync) upon user request.
* **Validation**: 
  - Verified document markdown formatting, sequential numbering accuracy, and internal anchor navigation.
  - Verified git diff across `FIXES.md` to ensure clarity and preservation of all active issues.
* **Decision**: Accepted (reviewed roadmap tiers, verified clear separation of concerns, and authorized proceeding sequentially through Tier 1).
* **Reflection**: Establishing an explicit, tiered roadmap prior to fixing bugs prevents scope creep and ensures critical runtime crashes and authentication blockers are eliminated before secondary enhancements are introduced.
* **Responsible Person**: Thomas Martel

### Entry 9: Tier 1 Defect Remediation & Automated Test Suite Expansion (Issues 4.8, 4.7, 2.2, 2.6)
* **Task ID / Title**: Tier 1 Defect Remediation & Automated Test Suite Expansion (Issues 4.8, 4.7, 2.2, 2.6)
* **Purpose of AI Use**: Backend defect fixing, defensive API integration, dynamic configuration, SQLModel database relationship modeling, and automated test suite expansion.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `e3ce2ccb-15fc-478c-8a92-a77155b38367`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - **Issue 4.8 (Defensive AI Response Parsing)**: Added comprehensive payload validation in `src/backend/services/interview_service.py` (`_chat_completion`) checking for valid JSON dict, non-empty `choices` list, valid `message` dict, and non-empty `content` string. Converted unhandled 500 crashes into clean HTTP 502 Bad Gateway responses with actionable error detail. Added 5 failure-path tests in `tests/test_interview.py`.
  - **Issue 4.7 (Decouple Provider & Base URL Config)**: Removed hardcoded Groq provider references from `src/backend/config.py` and `.env.example`. Configured `AI_API_BASE_URL` dynamically from the environment, stripped trailing slashes, allowed keyless local models, and raised HTTP 503 Service Unavailable when the base URL is unset. Added tests in `tests/test_config.py` and `tests/test_interview.py`.
  - **Issue 2.2 (Account Lockout Reset on Expiry)**: Fixed persistent re-lockout loop in `src/backend/routers/auth.py`. When `user.locked_until <= now`, reset `failed_attempts = 0` and cleared `locked_until = None` before password validation. Created shared `db_session` fixture in `tests/conftest.py` and regression tests in `tests/test_auth.py`.
  - **Issue 2.6 (Atomic Profile Creation on Registration)**: Fixed missing profile records on registration in `src/backend/routers/auth.py` by flushing `new_user.id` and inserting a linked `Profile` row atomically within the transaction. Corrected SQLModel relationship typing in `src/backend/models.py` to `Optional["Profile"] = Relationship(...)` to prevent class registry resolution errors. Added verification test in `tests/test_auth.py`.
* **Validation**: 
  - Executed automated test suite (`.venv/bin/pytest`), verifying all 72/72 tests pass cleanly with zero regressions.
  - Inspected code diffs to confirm no hardcoded credentials or provider URLs remained.
* **Decision**: Accepted (reviewed each fix and automated test sequentially with user confirmation at each step).
* **Reflection**: Writing regression unit tests alongside each bug fix provided immediate proof of correctness and surfaced subtle framework-level edge cases (such as SQLModel forward reference parsing) before reaching production.
* **Responsible Person**: Thomas Martel

### Entry 10: Manual End-to-End Verification & API Edge-Case Testing
* **Task ID / Title**: Manual End-to-End Verification & API Edge-Case Testing
* **Purpose of AI Use**: End-to-end verification planning, curl command generation, dummy server script creation, and API error debugging.
* **Chat Link or Prompt/Response**: Local AI Assistant session (Conversation ID: `e3ce2ccb-15fc-478c-8a92-a77155b38367`). Full prompt and summary maintained in project workspace session.
* **AI-Suggested Content**: 
  - Designed a 4-step manual verification procedure covering all Tier 1 fixes in a live running environment:
    1. **Registration & Profile Creation**: Executed signup via `POST /api/auth/register` and verified atomic creation of linked `Profile` row via SQLite query (`SELECT * FROM profile WHERE user_id = ?`).
    2. **Lockout Counter Reset**: Simulated 5 failed logins to trigger lockout, confirmed 403 Forbidden with lockout timestamp, waited for expiration, and verified successful login resets `failed_attempts` to 0.
    3. **Unset AI Base URL Handling**: Unset `AI_API_BASE_URL` in `.env`, restarted backend, and confirmed `POST /api/interview/sessions` returns HTTP 503 Service Unavailable with descriptive JSON error message.
    4. **Malformed AI Provider Response Handling**: Configured `AI_API_BASE_URL` pointing to a local Python dummy server returning HTML error pages, and confirmed backend returns HTTP 502 Bad Gateway rather than crashing with an unhandled 500 error.
  - Guided debugging of runtime edge cases encountered during testing:
    - Diagnosed initial 404 "Application not found" by providing a script to create an application linked to the authenticated user.
    - Diagnosed a 422 JSON parsing typo in user's curl payload, enabling successful 502 Bad Gateway verification.
* **Validation**: 
  - User executed all 4 manual test scenarios against the running FastAPI application.
  - Confirmed expected HTTP status codes (200, 403, 503, 502) and SQLite database state changes.
* **Decision**: Accepted (verified all Tier 1 fixes behave robustly end-to-end).
* **Reflection**: Manual testing against live HTTP endpoints and real databases complements automated unit tests by verifying middleware pipelines, JSON serialization, and realistic upstream network failure modes.
* **Responsible Person**: Thomas Martel

---

## Appendix: Extended Prompts & Responses (Optional)

### Appendix 1: Context for Entry 1
* **Context**: Systematic audit of the frontend job search interface based on course user stories and backend capabilities.
* **Key Queries**:
  1. Audit of UI deficiencies, race conditions, and unhandled states in `JobSearchPage.jsx` and `JobSearchPageNavbar.jsx`.
  2. Construction of prioritized items (7.1 – 7.10) in `FIXES.md`.
  3. Formulating a step-by-step remediation plan for incremental execution without regressions.

### Appendix 2: Context for Entry 2
* **Context**: Aligning job search navbar styling with the main application and resolving menu dismissal issues.
* **Key Queries**:
  1. Restructuring top bar to mirror `Navbar.jsx` with brand on left and dashboard/logout on right.
  2. Outside-click handling using React `useRef` and `pointerdown` listeners.
  3. `Escape` key listener for accessibility and menu dismissal.

### Appendix 3: Context for Entry 3
* **Context**: Replacing freeform category text input with curated dropdown and implementing multi-criteria sorting.
* **Key Queries**:
  1. Standardizing category options to match industry nomenclature.
  2. Extending `searchJobs` in `api/jobs.js` to accept `sortBy` and `sortOrder`.
  3. Integrating Newest, Oldest, Salary (Highest/Lowest), and Hours (Most/Fewest) sorting.

### Appendix 4: Context for Entry 4
* **Context**: Implementing reactive filter execution and establishing URL-based routing between `/dashboard` and `/jobs`.
* **Key Queries**:
  1. Reactive re-query execution on dropdown item selection.
  2. HTML5 History API integration in `App.jsx` (`pushState`, `replaceState`, `popstate`).
  3. Deep-link preservation and login redirect handling.

### Appendix 5: Context for Entry 5
* **Context**: Refreshing all jobs on filter reset, querying on initial mount, and synchronizing selected preview state.
* **Key Queries**:
  1. Restoring default filters and re-fetching active jobs on Reset.
  2. Automatic job query on initial component mount to eliminate empty prompt.
  3. Revalidating `selectedJob` against incoming results to prevent stale previews.

### Appendix 6: Context for Entry 6
* **Context**: Implementing complete search results pagination.
* **Key Queries**:
  1. Passing `page` and `limit` to backend `GET /api/jobs`.
  2. Passing pagination metadata (`total`, `page`, `totalPages`) and `onPageChange` callback.
  3. UI pagination component with Previous/Next and page number buttons.

### Appendix 7: Context for Entry 7
* **Context**: Transitioning from modal popup to dedicated page route `/jobs/:job_id`.
* **Key Queries**:
  1. User requirement: open full posting on dedicated page `/jobs/:job_id` instead of modal popup.
  2. Implementation of `getJobById(jobId)` API function.
  3. Creation of `JobDetailPage.jsx` and integration with `App.jsx` router.
  4. Updating `JobSearchPage.jsx` Expand action and title link.

### Appendix 8: Context for Entry 8
* **Context**: Priority Roadmap Restructuring and Issue Reorganization in `FIXES.md`.
* **Key Queries**:
  1. Synthesizing pull request code review items for AI interview prep with the general backend backlog.
  2. Defining 4 operational urgency tiers (Blockers, Reliability/UX, Test Architecture, Scalability).
  3. Renumbering all document sections sequentially (1.1 through 5.11) with updated internal anchor links.
  4. Incorporating new AI interview prep issues (4.8, 4.9, 4.10, 4.11) and removing dev-env dependency sync (3.5).

### Appendix 9: Context for Entry 9
* **Context**: Tier 1 Defect Remediation and Automated Test Suite Expansion (Issues 4.8, 4.7, 2.2, 2.6).
* **Key Queries**:
  1. Defensive JSON response validation in `_chat_completion` converting unhandled 500s into HTTP 502 Bad Gateway.
  2. Decoupling `AI_API_BASE_URL` from Groq, supporting dynamic base URLs and keyless local models, and returning 503 on missing config.
  3. Resetting `failed_attempts` upon lockout expiration in `login_user` to eliminate persistent lockout loop.
  4. Atomic `Profile` insertion upon registration and `Optional["Profile"]` SQLModel relationship typing.
  5. Creating unit and regression tests in `test_interview.py`, `test_config.py`, and `test_auth.py` (72/72 tests passing).

### Appendix 10: Context for Entry 10
* **Context**: Manual End-to-End Verification and API Edge-Case Testing.
* **Key Queries**:
  1. Designing manual verification protocols for registration profile creation, account lockout expiration reset, missing base URL (503), and malformed upstream AI responses (502).
  2. Simulating malformed upstream HTML error responses using a lightweight local Python HTTP server.
  3. Resolving 404 "Application not found" by linking a test job application to the authenticated user.
  4. Diagnosing a curl JSON syntax typo to verify successful 502 Bad Gateway handling.
