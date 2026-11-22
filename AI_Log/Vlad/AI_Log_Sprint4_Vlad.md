# CareerConnect: AI Usage Log, Sprint 4

**Team Member:** Vlad Shkuratov | **Tool:** Claude Code | **Session:** November 22, 2026

Prompts below were cleaned up for readability (spelling and casual wording). Their meaning was not changed and no prompts were added. Pasted GitHub issue text is summarized instead of copied in full. Routine Git questions are not logged because the AI output did not change any deliverable.

---

## Sprint 4 Session (November 22, 2026)

### Task 4.1: Saved Jobs Backend & DB: US-05.01 (Issue #237)

**Purpose of AI Use**
Implementation help for my assigned issue: the database relationship and backend endpoints for saved jobs.

**Prompt / Response**
Prompt: Implement issue #237 in the project. (Issue text pasted.)

Response: Claude read the existing models, routers and tests first and followed the same patterns. It checked that jobs are soft-deleted (`is_active = False`) before linking saved jobs to jobs with a foreign key, since a hard delete would have been blocked by saved rows. It also noticed that `make seed-reset` hard-deletes jobs, so the reset now clears saved jobs first.

**Follow-up Questions (code review session after implementation)**
Q: Why does saving a job need a unique constraint in the database if the endpoint already checks for duplicates?

A: The check and the insert are two separate steps. If two save requests arrive at the same time (a double click, two tabs), both can pass the check before either one is saved. The constraint makes the database reject the second row, and the endpoint turns that error into a 409. It also protects against any other code that writes to the table directly.

Q: Why does saving a job that's already saved return a 409 instead of just succeeding?

A: 409 Conflict tells the client its view is out of date: the job was already saved. It's a design choice; quietly succeeding would also have worked. In practice the UI never sends a duplicate, because it tracks which jobs are saved.

Q: Why was it safe to give SavedJob a foreign key to job.id, and what would break if jobs were hard-deleted?

A: Closing a job only sets `is_active` to false, so the job row never disappears and the foreign key always points to something. If jobs were hard-deleted, the delete would fail while any saved row referenced the job. That's what happens with `make seed-reset`, which is why the reset now deletes saved jobs first. The alternatives would be cascade deletes, or removing saved rows before deleting a job.

Q: What is the /ids endpoint for, when GET /api/saved-jobs already returns everything?

A: The job search page only needs to know which cards to show as bookmarked. `/ids` returns a short list of numbers instead of full job objects with descriptions, so filling in the icons costs one small request.

Q: Why does the saved list still return closed jobs instead of hiding them?

A: If a closed job just disappeared, the user would lose a bookmark with no explanation. Keeping it with `is_active: false` lets the UI show a "Closed" badge, and the user can remove it themselves. Saving a job that is already closed is still blocked.

**AI-Suggested Content**
A `SavedJob` table (`user_id`, `job_id`, `saved_at`) with a unique constraint on the user and job pair, plus a `saved_jobs` relationship on `User`. A new router at `/api/saved-jobs`: list saved jobs with full job details, list only the saved IDs, save a job (404 if missing or closed, 409 if already saved) and remove a job (404 if not saved). Applicants only, matching how applying to jobs works.

**Validation**
The full PyTest suite passed (104 tests at that point, including 16 new ones). I reviewed the endpoints against the acceptance criteria before moving on.

**Decision**
Accepted. Two choices the issue did not specify were flagged for the team instead of being decided silently: only applicants can save jobs, and closed jobs cannot be newly saved (both are recorded in FIXES.md §6.6).

**Reflection**
Checking how jobs are deleted before adding a foreign key avoided a bug that would only have shown up later. Writing down the unclear choices is better than guessing what "users" means in the issue.

**Responsible Person**
Vlad Shkuratov

---

### Task 4.2: Saved Jobs Frontend: US-05.03 (Issue #239)

**Purpose of AI Use**
Implementation help for the saved-jobs UI. I moved this issue ahead of the E2E tests, since end-to-end tests need a UI to test.

**Prompt / Response**
Prompt: The three US-05 tasks will be pushed together, but keep the work for each one clearly separated, since each is documented as its own task. Next, implement #238. (Issue text pasted.)

Response: Claude wrote the backend unit tests, then stopped before the E2E part: there was no saved-jobs UI and no E2E framework in the frontend, so it asked how to proceed.

Prompt: #239, the saved-jobs frontend, is also assigned to me. Since it needs to come first, implement #239 and then the E2E tests, and keep track of which work belongs to which issue. (Issue text pasted.)

Response: Claude built #239 first, then the E2E tests for #238 on top of it, and kept a record of which files belong to which issue.

**Follow-up Questions (code review session after implementation)**
Q: Why is the bookmark button next to the job card instead of inside it?

A: The job card is already a `<button>`, and HTML doesn't allow a button inside another button: browsers can mis-handle the clicks, and screen readers get confused. So the card and the bookmark are siblings in a wrapper, and the bookmark is positioned over the card's corner.

Q: What happens in the UI if saving a job fails, and why update the icon before the server replies?

A: The icon changes right away so the click feels instant, which is called an optimistic update. If the request fails, the icon switches back and an error message appears above the job list. The button is also disabled while its request is running, so fast repeated clicks can't send overlapping requests.

Q: How do the bookmark on the card and the one in the preview panel stay in sync?

A: Both read from the same `savedJobIds` set kept in `JobSearchPage`, and both call the same toggle function. With one source of truth, updating the set updates every icon for that job.

Q: Why does the bookmark button stop the click from reaching the job card?

A: It calls `stopPropagation()` so clicking the bookmark doesn't also select the job. Since the bookmark now sits beside the card rather than inside it, the click wouldn't reach the card anyway. It's a safeguard in case the button is ever placed inside a clickable element.

Q: Why does the Saved Jobs tab load fresh data each time it opens, instead of sharing state with the job search page?

A: The app has no shared global state (no context or store), and each page loads its own data. The Saved Jobs list is mounted whenever the tab is opened, so it fetches the current list from the server. That way anything saved or removed on the job search page shows up immediately, as #239 requires, without wiring state between pages.

**AI-Suggested Content**
A `BookmarkButton` component on every job card and in the job preview panel (applicants only). Clicking it updates the icon right away and reverts it if the request fails. The bookmark is a sibling of the card, not inside it, because the card is already a `<button>`. A "My Applications" / "Saved Jobs" tab switcher on the dashboard, where the profile section lives. The saved list opens a job when you click its title, removes it when you unclick the bookmark, and marks closed jobs with a "Closed" badge. A new API client, `api/savedJobs.js`. No new UI libraries.

**Validation**
`npm run build` passed, and the new files have no lint warnings. Every acceptance criterion is covered by the E2E tests in Task 4.3: saving from a card, the job appearing in the Saved Jobs tab, and unsaving from both the tab and the browsing page. Not yet checked visually in the browser; planned before the demo.

**Decision**
Accepted. The issue asks for the tab "in the user's profile". The app has no separate profile page, so the tab is on the dashboard next to the profile section; this is noted in FIXES.md §6.6.

**Reflection**
Doing #239 before the E2E half of #238 was the right order. Tests written against a UI that does not exist yet would just be guesses about selectors.

**Responsible Person**
Vlad Shkuratov

---

### Task 4.3: Saved Jobs Testing: US-05.02 (Issue #238)

**Purpose of AI Use**
Test case generation: backend unit tests and frontend E2E tests.

**Prompt / Response**
(Same prompts as Task 4.2. The backend unit tests were written first, and the E2E tests once #239 was done.)

Response: The backend tests were expanded to cover the database constraint and relationship, plus auth and roles on every endpoint. For E2E, Claude set up Playwright so that each run starts its own backend and frontend, on separate ports with a fresh SQLite database and AI mock mode.

**Follow-up Questions (code review session after implementation)**
Q: How do the E2E tests avoid touching my dev database and dev servers?

A: `playwright.config.js` starts its own backend on port 8010 and its own frontend on port 5180, instead of the dev ports 8000 and 5173. The backend uses a separate SQLite file, `src/frontend/e2e/.data/e2e.db`, which is wiped at the start of every run, plus its own upload folder, with AI mock mode on. Environment variables take priority over `.env`, so the dev settings aren't used. One caveat: locally, Playwright reuses a server that's already running on 8010 or 5180, so don't run anything else on those ports.

Q: Why were the E2E tests reaching the dev backend, and how was it fixed?

A: `getCurrentUser` in `api/auth.js` calls the relative URL `/api/auth/me`. That request goes through the Vite dev proxy, which always pointed at port 8000. If the dev backend had been running, it would have rejected the test user's token and logged the user out mid-test. The proxy target now follows `VITE_API_BASE_URL` when it's set. The real fix, using `API_BASE_URL` in `auth.js`, is recorded in FIXES.md §6.4.

Q: Why do the E2E tests create users and jobs through the API but log in through the UI?

A: Creating users and jobs isn't what's being tested, and doing it through the API is fast and reliable. Logging in through the real form means the token is stored and used exactly the way a real user's would be, so the tests cover the actual path from login to saving.

Q: How do we know the E2E tests aren't flaky?

A: The suite was run three times in a row (27 of 27 passed). Every test creates its own users and a job with a unique title, so tests running in parallel never share data. The tests wait for things to appear on screen, and use `expect.poll` for the API checks, instead of fixed sleeps. Three runs is reasonable evidence, but not proof.

Q: What do the backend unit tests cover that the E2E tests don't, and the other way round?

A: The unit tests cover what the UI never triggers: the database constraint, every error code (401, 403, 404, 409, 422), invalid tokens, recruiters calling each endpoint, and the `user.saved_jobs` relationship. The E2E tests cover what unit tests can't see: buttons rendering, clicks, the icon updating, the two bookmarks staying in sync, the state surviving a reload, navigation, and the frontend and backend working together (URLs, auth headers, CORS).

**AI-Suggested Content**
`tests/test_saved_jobs.py` with 30 tests:
- saving, removing and listing jobs
- the unique constraint and the `user.saved_jobs` relationship
- auth and roles on every endpoint
- closed jobs, invalid IDs, and each user's saved list staying private

`src/frontend/e2e/saved-jobs.spec.js` with 9 Playwright tests:
- saving from a job card
- unsaving from the browsing page and from the Saved Jobs tab
- bookmark state persisting after a reload
- the bookmark in the preview panel staying in sync with the card
- opening a saved job
- the Closed badge
- saved lists staying private per user
- recruiters seeing no bookmark icons

A `make e2e` target was also added.

**Validation**
- Backend: the full suite passed with 118 tests.
- E2E: the first run failed because test emails used the reserved `.test` domain, which the backend's email validator rejects. After switching to `example.com`, all 9 tests passed.
- To check for flaky tests, the E2E suite was run three times in a row (27 of 27 passed).
- The server logs showed requests to `/api/auth/me` reaching port 8000, the dev backend, instead of the test backend. The cause was an existing relative URL in `api/auth.js`. The Vite proxy now follows `VITE_API_BASE_URL` when it is set, and the next run had no stray requests.

**Decision**
Modified before use (the email domain and the proxy fix came out of the first runs). The E2E tests are not added to CI yet; this is recorded in FIXES.md §6.2.

**Reflection**
Reading the server logs, not just the pass/fail results, caught a problem the tests themselves did not report. With the dev backend running, the test user would have been logged out partway through a test, which would show up as random, hard-to-explain failures.

**Responsible Person**
Vlad Shkuratov

---

### Task 4.4: Completion Review and Documentation of Gaps (#237, #238, #239)

**Purpose of AI Use**
Review: checking that the three issues were really complete before opening the PR, then documentation.

**Prompt / Response**
Prompt: Before opening the PR, confirm whether all three tasks are fully complete.

Response: Claude said every acceptance criterion and task was done, but listed what was not. Three choices needed team confirmation (applicants only, closed jobs, the tab's location). There were also four gaps: no bookmark on `/jobs/:id`, E2E tests not in CI, nothing tested on PostgreSQL, and no visual check of the UI.

Prompt: Document the gaps rather than building them, because the issues only ask for what's already there.

Response: Claude added section 6 to `FIXES.md`, in the file's existing format, with each item tagged by issue number and priority tier. Before documenting the `make seed-reset` problem, it reproduced the failure on a throwaway database to confirm it.

Prompt: (Screenshots of issues #237, #238 and #239 attached.) Check each issue's acceptance criteria and tasks, and confirm whether they are complete.

Response: Claude checked every acceptance criterion and task in the screenshots against the work: all done, but only locally until pushed and merged.

Prompt: (Screenshot of the PR template attached.) Write the PR description in this format.

**AI-Suggested Content**
`FIXES.md` §6 with six items: the missing bookmark on the full job page, E2E tests not in CI, PostgreSQL not tested, two existing bugs found during the work (`getCurrentUser` ignoring `API_BASE_URL`, and `make seed-reset` failing once jobs have applications) and the design choices to confirm. Also a PR description that closes all three issues, with changes grouped by issue.

**Validation**
I compared the issue screenshots against the work myself. The `make seed-reset` failure was reproduced before it was written down. The PR checklist items were checked against the actual build, lint and test results.

**Decision**
Accepted. I chose to document the gaps rather than build them, to keep the PR inside the scope of the three issues.

**Reflection**
Reviewing completion before opening the PR turned up two existing bugs that no issue tracks. `getCurrentUser` probably fails silently in production. Documenting them in FIXES.md makes sure they are not lost, without growing this PR beyond its issues.

**Responsible Person**
Vlad Shkuratov
