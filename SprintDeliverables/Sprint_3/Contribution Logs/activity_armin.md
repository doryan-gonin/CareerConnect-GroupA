# Sprint 3 Contribution Log: Armin Mohebbipour

* **GitHub**: `mesterM12`
* **Role**: Backend Developer / Testing / AI Feature Validation
* **Project**: CareerConnect (SOEN 341 - Fall 2026)
* **Sprint**: Sprint 3
* **Feature**: US-15 — AI Suggested Postings
* **Estimated Time**: Approximately 2–3 hours

## Summary

| Issue | Title | Branch | PR | Status |
|---|---|---|---|---|
| [#135](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/135) | US-15.01: Suggested Postings Backend | `feature/us-15-ai-suggested-postings` | [#222](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/222) | Approved / open |
| [#58](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/58) | US-15: AI Suggested Postings | `feature/us-15-ai-suggested-postings` | [#222](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/222) | Backend scope completed |

## Detailed Breakdown

| # | Activity / Description | Time Spent | References & Links |
| :--- | :--- | :---: | :--- |
| **1** | **AI suggested postings backend implementation**<br>Implemented the applicant recommendation flow using the existing OpenAI-compatible configuration. Added the `JobSuggestion` cache model with a unique user/job constraint, recommendation scores, justifications, and generation timestamps. Added the `suggestion` sort option and suggestion fields to job responses. | 2–3 hrs | • Commit: [`4fefd30`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/4fefd30bdc44eab57869190e01c110f88b9c1c7a)<br>• Issue: [#135](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/135) |
| **2** | **Candidate context and provider adapter**<br>Built candidate context from resume text, recent searches, and viewed postings. Added a compact JSON prompt for job ranking, validation of provider responses, score normalization, and a deterministic fallback when the provider is unavailable or mock mode is enabled. | Included above | • File: `src/backend/services/suggestion_service.py`<br>• Commit: [`4fefd30`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/4fefd30bdc44eab57869190e01c110f88b9c1c7a) |
| **3** | **Authentication, refresh, and job-search integration**<br>Warmed the applicant suggestion cache after login, added `POST /api/jobs/suggestions/refresh`, protected suggestion access to applicants, added AI filtering and score-based sorting to `GET /api/jobs`, and exposed concise explanations in the response payload. | Included above | • Files: `src/backend/routers/auth.py`, `src/backend/routers/jobs.py`<br>• PR: [#222](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/222) |
| **4** | **Cache lifecycle improvement**<br>Added stale cache cleanup during refresh so suggestions for jobs outside the current cacheable active-job set are removed instead of accumulating indefinitely. | Included above | • Commit: [`249605a`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/249605a70a3fd89ef7c541a1dbccaf25390e32f9) |
| **5** | **Automated acceptance tests**<br>Added tests covering login-time cache warming, AI-filtered job results with explanations, the applicant-only refresh endpoint, cache row creation, and unauthenticated access rejection. | Included above | • File: `tests/test_suggestions.py`<br>• Full suite: 87 tests passed |
| **6** | **Live provider and manual API validation**<br>Validated the feature against an OpenAI-compatible endpoint using `gpt-6.1-sol` with a proper 32-byte JWT test secret. Tested registration, recruiter job creation, applicant login warming, AI ranking, refresh, OpenAPI documentation, authorization failures, database persistence, and deterministic provider-failure fallback. | Included above | • Provider: OpenAI-compatible `/v1` endpoint<br>• PR validation notes: [#222](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/222) |
| **7** | **PR review and scope cleanup**<br>Kept the PR backend-only, removed frontend changes from the original feature transfer, updated the PR description with validation evidence, and incorporated reviewer feedback for cache cleanup and documentation placement. | Included above | • PR: [#222](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/222)<br>• Review status: Approved |

## Validation Results

- Automated backend suite: **87 passed** using a randomly generated JWT secret of at least 32 bytes.
- Live OpenAI-compatible provider smoke test: `/v1/models` and `/v1/chat/completions` returned successful responses.
- Manual end-to-end flow passed with temporary SQLite data:
  - recruiter and applicant registration/login;
  - three job postings created;
  - login-time suggestion warming;
  - AI-filtered results with scores and justifications;
  - suggestion sorting and manual refresh;
  - applicant-only authorization checks;
  - Swagger/OpenAPI verification;
  - deterministic fallback after provider failure.
- Temporary databases, processes, and test files were removed after validation.
- No secrets were committed.

## Artifacts

- Pull request: [#222 — feat: add AI suggested postings backend](https://github.com/doryan-gonin/CareerConnect-GroupA/pull/222)
- Backend issue: [#135 — US-15.01: Suggested Postings Backend](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/135)
- Parent user story: [#58 — US-15: AI Suggested Postings](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/58)
- AI usage log: `AI_Log/Armin/AI_Log_Sprint3_Armin.md`
