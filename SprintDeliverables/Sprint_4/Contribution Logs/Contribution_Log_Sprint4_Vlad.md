# Sprint 4 Contribution Log: Vlad Shkuratov

**GitHub:** vshkuratov4
**Sprint:** 4 (work done November 22, 2026)

## Summary

| Issue | Title | Branch | PR | Status |
| :---: | :--- | :--- | :---: | :--- |
| #237 | US-05.01: Saved Jobs Backend & DB | `SavedJobs-Vlad` | #___ | In review |
| #238 | US-05.02: Saved Jobs Testing | `SavedJobs-Vlad` | #___ | In review |
| #239 | US-05.03: Saved Jobs Frontend | `SavedJobs-Vlad` | #___ | In review |

All three are sub-issues of US-05: Saved jobs (#24) and are delivered together in one PR.

## Details

### #237: Saved Jobs Backend & DB
- Added a `SavedJob` table linking a user to a job, with a unique constraint so a job can't be saved twice
- Added a `saved_jobs` relationship on `User`
- Added endpoints under `/api/saved-jobs` to list saved jobs, list saved IDs, save a job and remove a job (applicants only)
- Closed or missing jobs return 404, duplicates return 409, and removing a job that isn't saved returns 404
- Closed jobs stay in the saved list (with `is_active: false`) so users can see what happened to them
- `make seed-reset` now clears saved jobs before deleting jobs
- No migration needed: the table is created automatically on startup

### #239: Saved Jobs Frontend
- Added a bookmark icon to every job card and to the job preview panel on the job browsing page
- The icon updates right away when clicked and reverts if the request fails
- Added "My Applications" / "Saved Jobs" tabs to the dashboard
- The Saved Jobs list opens a job when you click its title, removes it when you unclick its bookmark, and shows a "Closed" badge on closed jobs
- Recruiters don't see bookmark icons
- Frontend only, with no new UI libraries

### #238: Saved Jobs Testing
- Added `tests/test_saved_jobs.py` with 30 backend tests: saving, removing and listing jobs, the database constraint and relationship, auth and roles on every endpoint, closed jobs, invalid IDs, and each user's saved list staying private
- Set up Playwright for frontend E2E testing, with 9 tests in `src/frontend/e2e/saved-jobs.spec.js` covering every acceptance criterion of #239
- E2E runs start their own backend and frontend on separate ports with a fresh database, so dev servers and data are never touched
- Added `make e2e`
- Fixed E2E runs reaching the dev backend through the Vite proxy (the proxy now follows `VITE_API_BASE_URL` when it's set)
- Results: 118 backend tests pass, and the 9 E2E tests passed 3 runs in a row (27 of 27)

## Other
- Did a completion review against all three issues before opening the PR
- Documented known gaps and two existing bugs in `FIXES.md` §6:
  - no bookmark on `/jobs/:id`
  - E2E tests not in CI
  - not yet tested on PostgreSQL
  - `getCurrentUser` ignoring `API_BASE_URL`
  - `make seed-reset` failing once jobs have applications
  - design choices for the team to confirm
- Wrote the PR description
- AI usage log: `AI_Log/Vlad/AI_Log_Sprint4_Vlad.md`
