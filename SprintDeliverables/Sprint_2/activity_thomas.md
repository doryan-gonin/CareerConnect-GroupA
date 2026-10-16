# Sprint 2 Contribution & Activity Log

* **Team Member**: Thomas Martel
* **Role**: Backend Developer
* **Project**: CareerConnect (SOEN 341 - Fall 2026)
* **Sprint**: Sprint 2
* **Total Estimated Time Spent**: ~12.5 Hours

---

## Detailed Activity Breakdown

| # | Activity / Description | Time Spent | References & Links |
| :--- | :--- | :---: | :--- |
| **1** | **Sprint Planning & Issue Creation (Feature 1)**<br>Decomposed requirements for *User Profile and Resume Management* into GitHub issues, wrote descriptions, acceptance criteria, and task assignments. | 45 min | • [Issue #66: US-03.01: Cap resume file size](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/66)<br>• [Issue #68: US-03.02: Backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/68) |
| **2** | **Cap Resume File Size (US-03.01)**<br>Implemented 5MB PDF file size cap validation on the resume upload endpoint with proper HTTP 400 error handling and response messaging. | 1 hr | • Commit: [`a37acdd`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a37acddab4c00ee01ba35775a88b0fa73fb4f04a)<br>• [PR #67: Limited pdf file size to 5 mb](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/67) |
| **3** | **Multi-Resume Database Architecture (US-03.02)**<br>Designed and implemented updated database models, tables, and Pydantic schemas supporting multi-resume uploads and tracking per user. | 1.5 hrs | • Commit: [`113edd8`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/113edd82643a75e032dfa22c4f6f874983050116)<br>• [PR #69: Feature/68/backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/69) |
| **4** | **Multi-Resume CRUD Endpoints & 5-Resume Limit (US-03.02)**<br>Implemented endpoints for resume uploading, listing, downloading, and deleting. Enforced business logic capping maximum stored resumes to 5 per candidate user. | 2.5 hrs | • Commits: [`9b691b0`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/9b691b0c0ce9857d9b93ae793a388e22822a1593), [`ad6c2d6`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/ad6c2d67a14e9f90640dfb0b9dcfe9a9f24ba5c7)<br>• [PR #69: Feature/68/backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/69) |
| **5** | **Backend Audit & Architectural Improvement Tracking**<br>Logged tracking issue #75 and authored comprehensive backend security and architectural audit documentation (`FIXES.md`) detailing remaining issues, file validation vulnerabilities, token typing, and test lifecycle gaps. | 2 hrs | • [Issue #75: Bug Fixing](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/75)<br>• Commits: [`a5d869a`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a5d869a3cfc684fb68d9f48641496b86e00b8480), [`9a9d9b5`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/9a9d9b5e396263595ebf0cb0c9d784a962a93ce1)<br>• Document: [`FIXES.md`](file:///home/thomas/SOEN-341---Group-A/FIXES.md) |
| **6** | **Auth Security Hardening & CORS Configuration**<br>Mitigated user enumeration and timing attacks during authentication by introducing dummy bcrypt hash checks for non-existent users. Configured FastAPI CORS middleware to allow cross-origin requests from the React frontend. | 1.5 hrs | • Commits: [`eaae6d9`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/eaae6d944e8ec3e887fc19b9d3bc2dc528cbe98c), [`d1098ac`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/d1098ac149ffb74fc71e06fa99e5a1b3297a7e13)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |
| **7** | **Streaming Resume Validation & Async Temp Cleanup**<br>Refactored the resume upload endpoint to stream file chunk size validation dynamically (preventing memory exhaustion on large payload attacks) and ensured temporary upload files are cleaned up asynchronously. | 1.5 hrs | • Commit: [`a34a501`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a34a501e741e4695024b42b1029c66e2c884cb40)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |
| **8** | **API Route Normalization & Profile Model Fixes**<br>Resolved invalid non-integer user ID crashes in auth dependency, corrected profile model fields and name type defaults, and removed redundant `/api` route prefixing in profile router. | 1.5 hrs | • Commits: [`e37f3e4`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/e37f3e4), [`340605b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/340605b), [`1bb663f`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/1bb663f), [`cf0234b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/cf0234b), [`f49a415`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/f49a415)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |
| **9** | **Developer Tooling, Imports Cleanup & Merge**<br>Implemented a project `Makefile` for local testing/linting/running, standardized absolute module imports from `src.backend` to `backend`, removed orphaned repository files, and merged PR #76 into `main`. | 1 hr | • Commits: [`c9c8c89`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/c9c8c89), [`178237b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/178237b), [`4666b69`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/4666b69)<br>• Merge Commit: [`df7f670`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/df7f670)<br>• [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76) |

---

## Summary of Deliverables & Artifacts Contributed
* **Pull Requests Created & Merged**:
  * [PR #67: Limited pdf file size to 5 mb](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/67)
  * [PR #69: Feature/68/backend multi resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/69)
  * [PR #76: Fix/backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/76)
* **GitHub Issues Authored**:
  * [Issue #66: US-03.01: Cap resume file size](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/66)
  * [Issue #68: US-03.02: Backend implementation for multiple resumes](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/68)
  * [Issue #75: Bug Fixing](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/75)
* **Documentation**:
  * [`FIXES.md`](file:///home/thomas/SOEN-341---Group-A/FIXES.md): Comprehensive 400+ line backend audit covering security, data integrity, test suite isolation, and route fixes.
