> **IMPORTANT SUBMISSION NOTE:**
> According to the SOEN 341 project guidelines, each team member must upload a **PDF report** of their AI log to their personal subdirectory (`AI_Log/<Name>/`). 
> Please export or convert this Markdown document into `AI_Log_Sprint3_Doryan.pdf` (e.g., using VS Code Markdown PDF export, pandoc, or browser print-to-PDF) before the final sprint evaluation.

---

# AI Usage & Validation Log — Sprint 3

* **Student Name**: Doryan Gonin
* **Course**: SOEN 341 — Software Process (Fall 2026)
* **Project**: CareerConnect — Job Search and Application Tracking Platform
* **Sprint**: Sprint 3
* **Directory**: `AI_Log/Doryan/`

---

## Instructions for AI Assistants and Contributors

> **Note for AI assistants**: Whenever assisting Doryan with tasks (requirements, planning, code generation, debugging, testing, or documentation), append a new entry to the [Logged AI Interactions](#logged-ai-interactions) section below using the standard 8-field format.

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
* **Responsible Person**: Doryan Gonin
```

---

## Logged AI Interactions

### Entry 1: Planning and code template generation for analytics DB (#111)
* **Task ID / Title**: Planning and code template generation for analytics DB (#111)
* **Purpose of AI Use**: Brainstorming / Requirements Analysis / Coding
* **Chat Link or Prompt/Response**: Local Antigravity session (ID:`8589b1a1-daa3-4abc-8249-2670b8651c26`)
* **AI-Suggested Content**: Suggested adding 2 new tables to the database for data logging (of searches) and modifying the job search API to log search data. Provided code templates for the aforementioned features, including DB schema and API modifications.
* **Validation**: Manual review
* **Decision**: Code was rejected / Plan was taken into account for further research
* **Reflection**: Agent tried to acces `.env` variables and provided features that broke compilation.
* **Responsible Person**: Doryan Gonin

---

### Entry 2: Debugging and fixing analytics DB issues (#111)
* **Task ID / Title**: Debugging and fixing analytics DB issues (#111)
* **Purpose of AI Use**: Debugging / Coding
* **Chat Link or Prompt/Response**: Local Copilot session
* **AI-Suggested Content**: Suggested potential solutions for the identified issues in the analytics DB, including code fixes and configuration adjustments. Suggested changes to the frontend to ensure token verification is handled before logging data. Provided code snippets for the fixes.
* **Validation**: Manual review and testing of the fixes in a local environment.
* **Decision**: Accepted with modifications to ensure compatibility with existing codebase.
* **Reflection**: Useful assistance in identifying where the issues came from. Very useful assistance for the frontend modifications and fixes to duplication errors linked to particularites of React in dev mode.
* **Responsible Person**: Doryan Gonin

---

### Entry 3: Designing independent analytics endpoints
* **Task ID / Title**: Designing independent analytics endpoints
* **Purpose of AI Use**: Brainstorming / Requirements Analysis
* **Chat Link or Prompt/Response**: Local Copilot session
* **AI-Suggested Content**: Recommended separating analytics into independent authenticated endpoints so each dashboard widget can request its own date range and grouping. Discussed application, search, view, salary, category, and location metrics.
* **Validation**: Manual review against the existing `Application`, `SearchLog`, and `JobViewLog` models.
* **Decision**: Accepted with modifications.
* **Reflection**: Independent endpoints fit the planned dashboard better than one large analytics response because each graph can use different periods and parameters.
* **Responsible Person**: Doryan Gonin

---

### Entry 4: Implementing backend analytics computations
* **Task ID / Title**: Implementing backend analytics computations
* **Purpose of AI Use**: Coding / Documentation
* **Chat Link or Prompt/Response**: Local Copilot session
* **AI-Suggested Content**: Added service-layer computations and authenticated endpoints for searches, unique viewed postings, applied-job salary buckets, most-applied category, and most-common location. Added response models and shared date-period helpers.
* **Validation**: Python compilation and git diff validation passed.
* **Decision**: Modified before use.
* **Reflection**: The service/router separation makes it clearer that analytics are computed only when a dashboard widget requests them. Salary buckets are useful for a frequency chart, but average, median, and spread is more adapated to salary visualization.
* **Responsible Person**: Doryan Gonin

---

### Entry 5: Final analytics review and validation
* **Task ID / Title**: Final analytics review and validation
* **Purpose of AI Use**: Review / Testing / Debugging
* **Chat Link or Prompt/Response**: Local Copilot session
* **AI-Suggested Content**: Reviewed the analytics models, router, service computations, job-search logging, job-view logging, fixtures, and endpoint tests. Identified and corrected the application-summary ranking bug so the highest-count category/location is selected, while preserving the existing alphabetical tie-breaker.
* **Validation**: All 9 analytics tests passed. Backend compilation and `git diff --check` also passed.
* **Decision**: Accepted.
* **Reflection**: The final pass confirmed that analytics are computed on request and scoped to the authenticated user. It also clarified that viewed-posting analytics count unique postings per period, while salary analytics returns count, average, minimum, maximum, and standard deviation based on salary midpoints.
* **Responsible Person**: Doryan Gonin

---

### Entry 6: General Deployment Help and Guidance
* **Task ID / Title**: General Deployment Help and Guidance
* **Purpose of AI Use**: Brainstorming / Requirements Analysis / Coding
* **Chat Link or Prompt/Response**: Local session
* **AI-Suggested Content**: Provided guidance on deployment strategies, including Dockerization, cloud hosting, free hosting options, code modifications to align with host changes ...
* **Validation**: Couldn't be validated, the "free" hosts and suggested requirements were wrong and/or outdated.
* **Decision**: Rejected.
* **Reflection**: The AI provided some useful guidance on deployment strategies, but the information was outdated and not applicable to our project. Everything had to be reworked to align with the limited free options available.
* **Responsible Person**: Doryan Gonin

---
