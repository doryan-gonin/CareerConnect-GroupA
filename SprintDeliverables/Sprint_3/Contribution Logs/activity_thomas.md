# Sprint 3 Contribution & Activity Log

* **Team Member**: Thomas Martel
* **Role**: Full-Stack Developer / Frontend & Backend
* **Project**: CareerConnect (SOEN 341 - Fall 2026)
* **Sprint**: Sprint 3
* **Total Estimated Time Spent**: ~8.3 Hours

---

## Instructions for AI Assistants and Contributors

> **Note for AI assistants**: Whenever helping Thomas with tasks (features, bug fixes, refactoring, tests, or documentation) during Sprint 3:
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
| **1** | **Job Search Frontend Audit & Roadmap Documentation (FIXES.md Section 5)**<br>Audited the job search frontend interface (`JobSearchPage.jsx`, `JobSearchPageNavbar.jsx`, `api/jobs.js`). Identified 10 key UX and functional issues (empty state ambiguity, hidden search button, destructive reset wiping jobs, stuck dropdown menus, freeform category input, selected job ghosting across queries, lack of fullscreen view, missing sorting by salary/hours, unaligned navbar styling, and missing pagination). Authored Section 5 in `FIXES.md` (Items 7.1–7.10) with detailed fix strategies. | 35 min | • Commit: [`8d25ad5`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/8d25ad5)<br>• Document: `FIXES.md`<br>• Issue: [Issue #75: Bug Fixing](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/75) |
| **2** | **Top Navbar Layout & UI Consistency (Issue 7.9)**<br>Refactored `JobSearchPageNavbar.jsx` to match `Navbar.jsx`: aligned brand logo on the left, Dashboard link and Log out button on the right, and segregated search inputs and filter controls into a dedicated sub-bar beneath the main navigation bar. | 30 min | • Commit: [`ceba1bd`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/ceba1bd)<br>• Files: `src/frontend/src/components/JobSearchPageNavbar.jsx`, `src/frontend/src/App.jsx`<br>• Document: `FIXES.md` (Item 7.9) |
| **3** | **Dropdown Outside-Click Dismissal & Keyboard Navigation (Issue 7.4)**<br>Implemented pointerdown outside-click detection using React `useRef` handles, explicit menu closure upon selecting any option, and Escape key listener across Category, Job Type, Schedule, and Order dropdowns to prevent stuck open menus. | 30 min | • Commit: [`0b44d3e`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/0b44d3e)<br>• File: `src/frontend/src/components/JobSearchPageNavbar.jsx`<br>• Document: `FIXES.md` (Item 7.4) |
| **4** | **Curated Job Category Selection Dropdown (Issue 7.5)**<br>Replaced the freeform category text input in `JobSearchPageNavbar.jsx` with a curated, scrollable dropdown menu featuring standard industry categories (Software Engineering, Design, Data Science & AI, DevOps, QA, Finance, Marketing, etc.) and an "All Categories" option. | 30 min | • Commit: [`0ae2418`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/0ae2418)<br>• File: `src/frontend/src/components/JobSearchPageNavbar.jsx`<br>• Document: `FIXES.md` (Item 7.5) |
| **5** | **Dynamic Return Order & Sorting by Salary/Hours (Issue 7.8)**<br>Updated `searchJobs` in `src/frontend/src/api/jobs.js` to accept `sortBy` and `sortOrder` query parameters. Expanded the Order dropdown in `JobSearchPageNavbar.jsx` with Newest First, Oldest First, Highest Salary (`salary_max` desc), Lowest Salary (`salary_min` asc), Most Hours (`max_hours_per_week` desc), and Fewest Hours (`max_hours_per_week` asc). | 35 min | • Commit: [`f3ea154`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/f3ea154)<br>• Files: `src/frontend/src/api/jobs.js`, `src/frontend/src/components/JobSearchPageNavbar.jsx`<br>• Document: `FIXES.md` (Item 7.8) |
| **6** | **Reactive Filter Application & Search Button (Issue 7.2)**<br>Added a visible primary "Search" button next to filter controls and updated `triggerSearch` so selecting any option in Category, Job Type, Schedule, or Order immediately re-executes the search query reactively. | 25 min | • Commit: [`53ae05b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/53ae05b)<br>• File: `src/frontend/src/components/JobSearchPageNavbar.jsx`<br>• Document: `FIXES.md` (Item 7.2) |
| **7** | **Page Separation & HTML5 History Routing (/dashboard, /jobs) (Issue 7.11)**<br>Architected and implemented client-side HTML5 History API path-based routing in `App.jsx` (`pushState`, `replaceState`, `popstate`), separating `/dashboard` and `/jobs` into distinct, bookmarkable URLs. Added navigation links in `Navbar.jsx` and `JobSearchPageNavbar.jsx`, unauthenticated login redirection with deep-link preservation, and documented Issue 7.11 in `FIXES.md`. | 1 hr | • Commits: [`1d77e83`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/1d77e83), [`6f9010f`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/6f9010f)<br>• Files: `src/frontend/src/App.jsx`, `src/frontend/src/components/Navbar.jsx`, `src/frontend/src/components/JobSearchPageNavbar.jsx`<br>• Document: `FIXES.md` (Item 7.11) |
| **8** | **Filter Reset Refresh & Query Defaults (Issue 7.3)**<br>Updated `handleReset` in `JobSearchPageNavbar.jsx` to restore all filter inputs/dropdowns to default values, automatically execute `searchJobs({})` to display all active postings instead of wiping the results list to an empty array, and invoke `onReset` to clear selection in `JobSearchPage.jsx`. | 25 min | • Commit: [`d6f606a`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/d6f606a)<br>• Files: `src/frontend/src/components/JobSearchPageNavbar.jsx`, `src/frontend/src/components/JobSearchPage.jsx`<br>• Document: `FIXES.md` (Item 7.3) |
| **9** | **Initial Mount Auto-Search & Feedback States (Issue 7.1)**<br>Added initial mount `useEffect` in `JobSearchPageNavbar.jsx` to query and display all active jobs immediately on arrival at `/jobs` without requiring manual search interaction. Updated `JobSearchPage.jsx` with `hasLoaded` state to provide clear `"Loading jobs…"` and `"No jobs found matching your search."` feedback. | 30 min | • Commit: [`80d6ed2`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/80d6ed2)<br>• Files: `src/frontend/src/components/JobSearchPageNavbar.jsx`, `src/frontend/src/components/JobSearchPage.jsx`<br>• Document: `FIXES.md` (Item 7.1) |
| **10** | **Selected Job Persistence & Revalidation (Issue 7.6)**<br>Updated `handleJobsLoaded` in `JobSearchPage.jsx` to revalidate the currently selected job against newly loaded query results, automatically clearing the preview panel and alert messages if the job was filtered out. Added card highlight styling for the selected job. | 30 min | • Commit: [`0d7f833`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/0d7f833)<br>• File: `src/frontend/src/components/JobSearchPage.jsx`<br>• Document: `FIXES.md` (Item 7.6) |
| **11** | **Search Results Pagination & Multi-Page Navigation (Issue 7.10)**<br>Extended `searchJobs` in `api/jobs.js` to accept `page` and `limit`. Updated `JobSearchPageNavbar.jsx` to pass pagination metadata (`page`, `totalPages`, `total`, `limit`) and an `onPageChange` callback to `JobSearchPage.jsx`. Rendered full pagination controls ("Showing X–Y of Z jobs", Previous/Next buttons, and page number buttons). | 45 min | • Commit: [`5e36695`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/5e36695)<br>• Files: `src/frontend/src/api/jobs.js`, `src/frontend/src/components/JobSearchPageNavbar.jsx`, `src/frontend/src/components/JobSearchPage.jsx`<br>• Document: `FIXES.md` (Item 7.10) |
| **12** | **Dedicated Full-Page Job Details Route `/jobs/:job_id` (Issue 7.7)**<br>Pivoted from an overlay modal popup to a dedicated, bookmarkable full-page route at `/jobs/:job_id` per user requirements. Implemented `getJobById` in `api/jobs.js`. Created `JobDetailPage.jsx` featuring top navbar, "← Back to Jobs" link, loading state, 404 error handling, complete specifications grid, full description, and integrated application submission with real-time feedback. Configured routing in `App.jsx` and updated `JobSearchPage.jsx` to link both job title and Expand button to `/jobs/:id`. Updated Section 7.7 in `FIXES.md`. | 1 hr 15 min | • Commit: [`57a4dc0`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/57a4dc0)<br>• Files: `src/frontend/src/api/jobs.js`, `src/frontend/src/components/JobDetailPage.jsx`, `src/frontend/src/App.jsx`, `src/frontend/src/components/JobSearchPage.jsx`<br>• Document: `FIXES.md` (Item 7.7) |
| **13** | **Code Review, Linter Verification & Build Quality Assurance**<br>Conducted rigorous verification across all modified files using `oxlint` (0 errors, 0 warnings across all 20 frontend files) and verified clean Vite production builds (`vite build`). Tested responsive layouts, browser Back/Forward navigation, and deep linking across routes. | 45 min | • Quality Assurance Verification<br>• Linter: `oxlint` (clean)<br>• Bundler: `vite build` (clean) |

---

## Summary of Deliverables & Artifacts Contributed
* **Git Branch**:
  * `fix/frontend-ui-job-search-issues`
* **Commits Authored in Sprint 3**:
  * [`8d25ad5`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/8d25ad5): `docs: add job search frontend deficiencies and UX enhancements to FIXES.md`
  * [`ceba1bd`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/ceba1bd): `refactor: align job search navbar layout and UI consistency with main application`
  * [`0b44d3e`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/0b44d3e): `fix: implement outside-click detection and escape key dismissal for navbar dropdown menus`
  * [`0ae2418`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/0ae2418): `feat: replace category text input with a curated dropdown menu in job search navbar`
  * [`f3ea154`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/f3ea154): `feat: implement comprehensive job sorting options by salary, hours, and date in frontend navbar and api`
  * [`53ae05b`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/53ae05b): `feat: enable automatic search execution upon selecting job filters`
  * [`1d77e83`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/1d77e83): `docs: add documentation for page separation and URL-based routing fix in FIXES.md`
  * [`6f9010f`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/6f9010f): `feat: implement HTML5 History API URL-based routing for pages and navigation components`
  * [`d6f606a`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/d6f606a): `fix: update job search reset action to restore default filters and clear selected state`
  * [`80d6ed2`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/80d6ed2): `fix: trigger initial job search on mount and add loading and empty states to job search page`
  * [`0d7f833`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/0d7f833): `fix: persist and revalidate selected job state during search queries and resets in JobSearchPage`
  * [`5e36695`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/5e36695): `feat: add pagination controls and metadata support for job search results`
  * [`57a4dc0`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/57a4dc0): `feat: add dedicated job detail page and routing for full-screen job postings`
* **Source Code & Components**:
  * `src/frontend/src/App.jsx`: HTML5 History API client routing (`/dashboard`, `/jobs`, `/jobs/:job_id`, `/login`, `/signup`) with popstate listeners and route protection.
  * `src/frontend/src/api/jobs.js`: API client functions `searchJobs` (with pagination, sort, and filters), `getJobById`, and `applyToJob`.
  * `src/frontend/src/components/JobDetailPage.jsx`: Dedicated full-page job details view with specs grid, description, and application workflow.
  * `src/frontend/src/components/JobSearchPage.jsx`: Job search listing view with card selection, pagination controls, and deep-link routing.
  * `src/frontend/src/components/JobSearchPageNavbar.jsx`: Search and filter navigation bar with outside-click dismissal, curated categories, dynamic sorting, and auto-query on mount.
  * `src/frontend/src/components/Navbar.jsx`: Main navigation bar with history navigation to `/jobs`.
* **Testing & Quality Verification**:
  * `oxlint`: 0 warnings, 0 errors across all 20 frontend components and modules.
  * `vite build`: Clean production bundle compilation in under 300ms.
* **Documentation & Planning**:
  * `FIXES.md`: Section 5 documenting Items 7.1 to 7.11 with completed fix descriptions and code references.
  * `AI_Log/Thomas/AI_Log_Sprint3_Thomas.md`: Complete 8-field AI usage and validation log for Sprint 3.
  * `SprintDeliverables/Sprint_3/Contribution Logs/activity_thomas.md`: Official Sprint 3 contribution and activity log.
