# Sprint 3 Contribution & Activity Log

* **Team Member**: Doryan Gonin
* **Role**: ScrumMaster - Documentation - Testing - Backend
* **Project**: CareerConnect (SOEN 341 - Fall 2026)
* **Sprint**: Sprint 3
* **Time Spent**: 16h50

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
