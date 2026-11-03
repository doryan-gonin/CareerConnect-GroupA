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


