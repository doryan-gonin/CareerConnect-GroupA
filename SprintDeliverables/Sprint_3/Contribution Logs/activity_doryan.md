# Sprint 3 Contribution & Activity Log

* **Team Member**: Doryan Gonin
* **Role**: ScrumMaster - Documentation - Acceptance & Unit Testing - Backend - Deployment
* **Project**: CareerConnect (SOEN 341 - Fall 2026)
* **Sprint**: Sprint 3
* **Time Spent**: ~ 26 hours

---

## Detailed Breakdown
| **#**  |                     **Activity**                      |  **Time**  | **Commit Number** | **PR Number** | **Issues** | **Date Done** |
| :----: | :---------------------------------------------------- | :--------- | :---------------: | :-----------: | :--------: | :-----------: |
| **1**  | PR Review (post demo sprint2 frontend fixes)          | 15 min     |                   | #104        | #102     | 29/10/26      |
| **2**  | Setup Sprint 3 AI log and contribution log templates  | 15 min     | Project           |               |            | 02/11/26      |
| **3**  | Update project board with new tasks and issues for sprint 3 | 45 min | Project         |               |            | 02/11/26      |
| **4**  | Research [deployment strategies](https://github.com/doryan-gonin/CareerConnect-GroupA/issues/110/artifacts/1) | 1 hr |  |  | #110 | 02/11/26 |
| **5**  | **Data logging feature** <br> - Added new DB tables to store user data <br> - Modified frontend behavior to only log data for signed in users via token verification <br> - Modified job search API to log search data <br> | 2 hr | [`e8812e4`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/e8812e4) <br> to <br> [`1ffc120`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/1ffc120) | #115 | #111 | 02/11/26 |
| **6**  | **Analytics Computation** <br> - Designed independent analytics endpoints <br> - Added computation handlers for applications, searches, viewed postings, salary statistics, categories, and locations <br> - Added response models and shared date/grouping helpers <br> - Validated analytics endpoints and fixed summary ranking behavior <br> | 2 hr | [`369c6eb`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/369c6eb) <br> to <br> [`f17cd23`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/f17cd23) | #115 | #112 | 03/11/26 |
| **7**  | **Analytics Test cases** <br> - Added test cases for analytics endpoints and computations <br> - Added test fixtures for applications, searches, and viewed postings <br> - Validated analytics endpoints and fixed summary ranking behavior <br> | 1.75 hr | [`01bcd38`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/01bcd38) <br> to <br> [`a08ab0d`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a08ab0d) | #114 | #113 | 03/11/26 |
| **8**  | PRs for analytics and testing                         | 10 min     |            | #115        | #111     | 03/11/26      |
| **9**  | Created sub-issues for Analytics frontend             | 15 min     | Project    |               |  #116    | 03/11/26      |
| **10** | Team Point (discord message)                          | 30 min     |            |               |            | 03/11/26      |
| **11** | **Initial deployment attempt** (Vercel & HF) [FAILED] <br> - Rewrote frontend endpoints to allow remote deployment <br> - Configured prod env variables <br> - Updated CORS and added Uvicorn startup script <br> - ~~Added Dockerfile and YAML config file for HF~~ <br> - ~~Test deployed frontend on Vercel (no free support for path rewrites)~~ <br> - ~~Tried to deploy backend on HF (free plan doesn't support Docker and AI model hosting anymore)~~   | 2 hr       | [`e8e9520`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/e8e9520) <br> to <br> [`a721ab2`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/a721ab2) | #119 | #117 <br> #118 | 04/11/26 |
| **12** | **Correct Deployment** (Render and Neon) (see #120 for more info) <br> - Cleaned up stale configs <br> - Migrated DB to PostgreSQL so it could be hosted online (on Neon) <br> - Created Render static site for frontend <br> - Created Render web service for backend <br> - Connected DB, backend, frontend with paths as environment variables <br> - Set-up autodeploy | 5 hr | [`695e6cc`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/695e6cc) <br> to <br> [`7426855`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/7426855) | #123 <br> to <br> #126 | #120 | 04/11/26 |
| **13** | Update relevant issues, project board, and contribution logs | 1 hr | Project | | | 04/11/26
| **14** | Board update and refactoring of tasks                | 1 hr        | Project   |               |            | 05/11/26      |
| **15** | DB Seeding (add seedscript to deploy commands)       | 30 min      |           |               |            | 05/11/26      |
| **16** | **Analytics backend fixes** <br> - Stop counting empty searches <br> - Refactor frontend endpoints to count job views even when not expanded | 45 min | [`01a0471`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/01a0471) <br> [`bc6e9e5`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/bc6e9e5) | #128 | #127 | 05/11/26
| **17** | Board update & team point                            | 45 min      | Project   |               |            | 05/11/26      |
| **18** | **Analytics backend fixes** <br> - Add endpoint call from frontend to count views | 45 min | [`96eb9f3`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/96eb9f3) | #129 | #127 | 06/11/26 | 
| **19** | **PR #130 review and fixes** <br> - Pulled `main` to resolve stale branch (2 weeks old) <br> - Fixed merge conflicts (+317 -70) <br> - Isolated needed feature from erroneuous backend and frontend modifications <br> - Redirect apply button to application form <br> - Documented pre-merge fixes (see comments #130) <br> - Documented issues to be addressed (see #131) - Accepted PR #130 with aforementioned fixes <br> - Left a review outlining the fixes and issues to be addressed <br> | 2 hr | [`565c36c`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/565c36c) <br> [`06af154`](https://github.com/doryan-gonin/CareerConnect-GroupA/commit/06af154) | #130 | #94 <br> #131 | 06/11/26 |
| **20** | **Project board & Acceptance Tests** <br> - Final update of project board for Sprint 3 <br> - Added acceptance tests documentation in each relevant User Story to keep it readable and organized | 1.5 hr | Project | | | 07/11/26 |

