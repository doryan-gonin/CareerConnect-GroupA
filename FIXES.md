This document details all remaining issues, architectural defects, security enhancements, and tests identified during the backend audit. For each item, the problem, file locations, and recommended fix are provided.

---

## Table of Contents
1. [Security & Authentication](#1-security--authentication)
   - [3.3 File Validation Bypass & Filename Sanitization](#33-file-validation-bypass--filename-sanitization)
   - [3.4 Missing Token Type Distinction (Access vs. Refresh)](#34-missing-token-type-distinction-access-vs-refresh)
   - [3.5 Duplicated Configuration and Credentials [FIXED]](#35-duplicated-configuration-and-credentials-fixed)
2. [Data Integrity, Concurrency & Lifecycle](#2-data-integrity-concurrency--lifecycle)
   - [4.1 Timezone Inconsistencies (Naive vs. UTC Datetimes)](#41-timezone-inconsistencies-naive-vs-utc-datetimes)
   - [4.2 Account Re-lockout Bug After Lockout Duration Expires](#42-account-re-lockout-bug-after-lockout-duration-expires)
   - [4.3 Relative Working Directory Dependencies (DB & Uploads)](#43-relative-working-directory-dependencies-db--uploads)
   - [4.4 Non-Atomic File Operations & Orphaned Files](#44-non-atomic-file-operations--orphaned-files)
   - [4.5 Race Conditions in Resume Count & Default Status](#45-race-conditions-in-resume-count--default-status)
   - [4.6 Missing Profile Creation on User Registration](#46-missing-profile-creation-on-user-registration)
   - [4.7 Resume Deletion vs. Active Application Retention](#47-resume-deletion-vs-active-application-retention)
3. [Testing & Database Infrastructure](#3-testing--database-infrastructure)
   - [5.1 Test Suite Lifespan Modifying Development Database](#51-test-suite-lifespan-modifying-development-database)
   - [5.2 Foreign Keys Disabled in Test In-Memory Database](#52-foreign-keys-disabled-in-test-in-memory-database)
   - [5.3 Missing Test Coverage (Profiles, Resumes, Lockout, Revocation)](#53-missing-test-coverage-profiles-resumes-lockout-revocation)
4. [Frontend-Backend Integration & Code Cleanup](#4-frontend-backend-integration--code-cleanup)
   - [6.1 Frontend Logout Does Not Revoke Token on Backend [FIXED]](#61-frontend-logout-does-not-revoke-token-on-backend-fixed)
   - [6.2 Frontend Password Rules Missing 72-Byte Limit [FIXED]](#62-frontend-password-rules-missing-72-byte-limit-fixed)
   - [6.3 Orphaned 1-Byte File `frontend` in Project Root](#63-orphaned-1-byte-file-frontend-in-project-root)
   - [6.4 Typo in Model Name `ResumeReponse`](#64-typo-in-model-name-resumereponse)
   - [6.5 Unbounded Growth of `RevokedToken` Table](#65-unbounded-growth-of-revokedtoken-table)
   - [6.6 Recruiter Inactive Job Visibility & Reactivation](#66-recruiter-inactive-job-visibility--reactivation)
5. [Job Search Frontend Deficiencies & UX Enhancements](#5-job-search-frontend-deficiencies--ux-enhancements)
   - [7.1 Empty State UI & Feedback](#71-empty-state-ui--feedback)
   - [7.2 Automatic & Explicit Filter Application [FIXED]](#72-automatic--explicit-filter-application-fixed)
   - [7.3 Reset Filter Action & Search Query Refresh [FIXED]](#73-reset-filter-action--search-query-refresh-fixed)
   - [7.4 Dropdown Menu Dismissal & Outside-Click Handling [FIXED]](#74-dropdown-menu-dismissal--outside-click-handling-fixed)
   - [7.5 Category Selector Dropdown [FIXED]](#75-category-selector-dropdown-fixed)
   - [7.6 Selected Job Persistence on Query and Reset](#76-selected-job-persistence-on-query-and-reset)
   - [7.7 Fullscreen & Dedicated Job Posting View](#77-fullscreen--dedicated-job-posting-view)
   - [7.8 Dynamic Return Order (Salary & Hours Sorting) [FIXED]](#78-dynamic-return-order-salary--hours-sorting-fixed)
   - [7.9 Top Navbar Layout & UI Consistency [FIXED]](#79-top-navbar-layout--ui-consistency-fixed)
   - [7.10 Pagination & Multi-Page Search Results](#710-pagination--multi-page-search-results)
   - [7.11 Page Separation & URL-Based Routing (/dashboard, /jobs) [FIXED]](#711-page-separation--url-based-routing-dashboard-jobs-fixed)

---

## 1. Security & Authentication

### 3.3 File Validation Bypass & Filename Sanitization
- **Issue**:
  1. **MIME/Header Spoofing**: `file.content_type != "application/pdf"` and `file.filename.lower().endswith(".pdf")` are completely client-controlled. A user can upload an executable or script simply by renaming it to `.pdf` and sending the header.
  2. **NoneType Filename Crash**: If `file.filename` is `None` (valid in multipart specs), calling `file.filename.lower()` raises `AttributeError: 'NoneType' object has no attribute 'lower'`.
  3. **Path Traversal / Unsanitized Names**: `unique_file_name = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}_{file.filename}"` includes the raw client filename directly in the disk path. If the filename contains `../` or special filesystem characters, it could attempt to write outside the folder or cause filesystem errors.
- **Where to fix**:
  - `src/backend/routers/profiles.py` (inside `upload_resume`, around lines 82–120)
- **The Fix**:
  1. Default `filename` safely: `raw_filename = file.filename or "resume.pdf"`.
  2. Validate PDF magic bytes: ensure the first 5 bytes match `b"%PDF-"`.
  3. Generate a pure UUID-based disk filename (e.g. `f"{uuid.uuid4().hex}.pdf"`) while storing the cleaned basename (`Path(raw_filename).name`) in the database `file_name` column for downloads:
  ```python
  raw_filename = Path(file.filename or "resume.pdf").name
  if not raw_filename.lower().endswith(".pdf"):
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pdf files are allowed.")

  # Validate magic bytes
  header = await file.read(5)
  await file.seek(0)
  if header != b"%PDF-":
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is not a valid PDF document.")

  # Pure UUID on disk avoids path traversal entirely
  stored_filename = f"user_{current_user.id}_{uuid.uuid4().hex}.pdf"
  file_path = UPLOAD_DIR / stored_filename
  ```

---

### 3.4 Missing Token Type Distinction (Access vs. Refresh)
- **Issue**:
  The `/api/auth/refresh` endpoint accepts any valid access token and hands out a new access token while revoking the old one. Because tokens have no `"type"` claim (`"access"` vs `"refresh"`), access tokens and refresh tokens are completely interchangeable. If an attacker intercepts an access token, they can refresh it indefinitely.
- **Where to fix**:
  - `src/backend/routers/auth.py` (`create_access_token`, `login_user`, and `refresh_token`)
  - `src/backend/dependencies.py` (`get_token_payload`)
- **The Fix**:
  1. Add a `token_type` claim to JWT payload (`"type": "access"` vs `"type": "refresh"`).
  2. During login, issue both an `access_token` (e.g., expires in 30 mins) and a `refresh_token` (e.g., expires in 7 days).
  3. Update `/api/auth/refresh` to require a token where `payload.get("type") == "refresh"`:
  ```python
  def create_token(data: dict, expires_delta: timedelta, token_type: str = "access") -> str:
      to_encode = data.copy()
      expire = datetime.now(timezone.utc) + expires_delta
      to_encode.update({"exp": expire, "jti": str(uuid.uuid4()), "type": token_type})
      return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  ```

---

### 3.5 Duplicated Configuration and Credentials [FIXED]
- **Status**: ✅ Fixed (Created `src/backend/config.py` and centralized configuration and environment loading across `dependencies.py`, `routers/auth.py`, `database.py`, and `routers/profiles.py`)
- **Issue**:
  `SECRET_KEY`, `ALGORITHM`, and `load_dotenv()` are copy-pasted across `src/backend/dependencies.py` and `src/backend/routers/auth.py` (with a typo in `auth.py`: `"Creat a .env file"`). If settings or keys change, they can fall out of sync.
- **Where to fix**:
  - Create `src/backend/config.py`
  - Refactor `src/backend/dependencies.py`, `src/backend/routers/auth.py`, and `src/backend/database.py`
- **The Fix**:
  Create a single configuration source:
  ```python
  # src/backend/config.py
  import os
  from pathlib import Path
  from dotenv import load_dotenv

  BASE_DIR = Path(__file__).resolve().parent.parent.parent
  load_dotenv(BASE_DIR / ".env")

  SECRET_KEY = os.getenv("JWT_SECRET_KEY")
  if not SECRET_KEY:
      raise RuntimeError("JWT_SECRET_KEY is not set. Create a .env file.")

  ALGORITHM = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES = 30
  DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'careerconnect_test.db'}")
  UPLOAD_DIR = BASE_DIR / "uploads" / "resumes"
  ```

---

## 2. Data Integrity, Concurrency & Lifecycle

### 4.1 Timezone Inconsistencies (Naive vs. UTC Datetimes)
- **Issue**:
  Timestamps are created inconsistently throughout the backend:
  - `src/backend/models.py`: `default_factory=datetime.now` (naive local machine time).
  - `src/backend/routers/profiles.py`: `profile.last_updated = datetime.now()` (naive local machine time).
  - `src/backend/routers/auth.py`: `datetime.now(timezone.utc)` (aware UTC) with `.replace(tzinfo=None)`.
  Comparing naive timestamps to UTC timestamps leads to lockouts and expiry times being off by the server's UTC offset.
- **Where to fix**:
  - `src/backend/models.py` (lines 16, 29, 36, 44)
  - `src/backend/routers/profiles.py` (line 48)
  - `src/backend/routers/auth.py` (lines 33, 104, 115)
- **The Fix**:
  Use `datetime.now(timezone.utc)` everywhere. In SQLModel fields, define:
  ```python
  created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
  uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
  ```
  And in endpoints:
  ```python
  profile.last_updated = datetime.now(timezone.utc)
  ```

---

### 4.2 Account Re-lockout Bug After Lockout Duration Expires
- **Issue**:
  When an account gets locked out, `user.failed_attempts` reaches 5 and `user.locked_until` is set. After the 15-minute lockout period elapses, `user.failed_attempts` is still 5. If the user mistypes their password on their very first attempt after waiting 15 minutes, `user.failed_attempts += 1` makes it 6 (`>= 5`), immediately locking them out for another 15 minutes.
- **Where to fix**:
  - `src/backend/routers/auth.py` (inside `login_user`, around lines 103–120)
- **The Fix**:
  If the lockout duration has passed, reset the counter before validating the password:
  ```python
  now = datetime.now(timezone.utc)
  if user.locked_until:
      locked_until_utc = user.locked_until if user.locked_until.tzinfo else user.locked_until.replace(tzinfo=timezone.utc)
      if locked_until_utc > now:
          raise HTTPException(
              status_code=status.HTTP_403_FORBIDDEN,
              detail="Too many failed attempts. Try again later."
          )
      else:
          # Lockout expired: reset failed attempts
          user.failed_attempts = 0
          user.locked_until = None
          session.add(user)
  ```

---

### 4.3 Relative Working Directory Dependencies (DB & Uploads)
- **Issue**:
  `DATABASE_FILE: str = "careerconnect_test.db"` and `UPLOAD_DIR: Path = Path("uploads/resumes")` use relative paths. If FastAPI or test runners are launched from a subfolder or another working directory, SQLite creates a separate database file and resumes are saved in a disjoint folder.
- **Where to fix**:
  - `src/backend/database.py` (line 9)
  - `src/backend/routers/profiles.py` (line 19)
- **The Fix**:
  Anchor paths to the project root directory:
  ```python
  BASE_DIR = Path(__file__).resolve().parent.parent.parent
  DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'careerconnect_test.db'}")
  UPLOAD_DIR = BASE_DIR / "uploads" / "resumes"
  UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
  ```

---

### 4.4 Non-Atomic File Operations & Orphaned Files
- **Issue**:
  1. In `upload_resume`: The file is saved to disk *before* `session.commit()`. If the database commit fails (e.g. constraint error or database locked), the file stays orphaned on disk forever.
  2. In `delete_resume`: The file is deleted from disk *before* `session.commit()`. If the database rollback occurs, the database record references a deleted file.
  3. In `delete_resume`: There are two separate `session.commit()` calls (one for deleting, and one for promoting the fallback default resume).
- **Where to fix**:
  - `src/backend/routers/profiles.py` (`upload_resume` and `delete_resume`)
- **The Fix**:
  - For uploads: Clean up disk file in an `except` block if database commit fails:
  ```python
  try:
      session.add(new_resume)
      session.commit()
      session.refresh(new_resume)
  except Exception:
      if file_path.exists():
          file_path.unlink()
      raise
  ```
  - For deletes: Remove the record and reassign default in a single commit, and only delete the physical file from disk *after* the commit succeeds:
  ```python
  file_to_delete = resume.file_path
  was_default = resume.is_default

  session.delete(resume)

  if was_default:
      fallback = session.exec(
          select(Resume)
          .where(Resume.user_id == current_user.id, Resume.id != resume_id)
          .order_by(Resume.uploaded_at.desc())
      ).first()
      if fallback:
          fallback.is_default = True
          session.add(fallback)

  session.commit()

  # Only remove from disk after DB successfully commits
  if os.path.exists(file_to_delete):
      os.remove(file_to_delete)
  ```

---

### 4.5 Race Conditions in Resume Count & Default Status
- **Issue**:
  In `upload_resume` and `set_default_resume`:
  1. Checking resume limit (`len(existing_resumes) >= 5`) in Python is subject to race conditions under concurrent requests, allowing users to exceed the 5-resume cap.
  2. Marking default resumes loops through instances in Python and calls `session.add(r)`, which can leave multiple resumes marked as default if concurrent requests hit the endpoint.
- **Where to fix**:
  - `src/backend/routers/profiles.py` (`upload_resume` and `set_default_resume`)
- **The Fix**:
  Use atomic SQL update statements:
  ```python
  from sqlmodel import update

  # In upload_resume:
  if should_be_default:
      session.exec(
          update(Resume)
          .where(Resume.user_id == current_user.id)
          .values(is_default=False)
      )

  # In set_default_resume:
  session.exec(
      update(Resume)
      .where(Resume.user_id == current_user.id)
      .values(is_default=False)
  )
  target_resume.is_default = True
  session.add(target_resume)
  session.commit()
  ```

---

### 4.6 Missing Profile Creation on User Registration
- **Issue**:
  `register_user` in `auth.py` creates a `User`, but never creates a corresponding `Profile` record. `profiles.py` uses a helper `get_or_create_profile` to patch around this, but `User.profile` is typed as non-optional. If any query accesses `user.profile` prior to a user visiting `/api/profiles/me`, it returns `None`.
- **Where to fix**:
  - `src/backend/routers/auth.py` (`register_user`, around line 84–92)
  - `src/backend/models.py` (`User.profile` relationship type)
- **The Fix**:
  1. In `src/backend/models.py`:
  ```python
  profile: Optional["Profile"] = Relationship(back_populates="user")
  ```
  2. In `src/backend/routers/auth.py`, create the profile in the same registration transaction:
  ```python
  new_user = User(email_address=clean_email, password_hash=pw_hash_str)
  session.add(new_user)
  session.flush() # Allocates new_user.id

  new_profile = Profile(user_id=new_user.id, first_name="", last_name="")
  session.add(new_profile)

  session.commit()
  session.refresh(new_user)
  ```

---

### 4.7 Resume Deletion vs. Active Application Retention
- **Issue**:
  When a candidate submits an application, it references `resume_id` (`Application.resume_id -> Resume.id`). If the candidate later goes to `/api/profiles/me/resumes/{resume_id}` and deletes that resume:
  1. **Foreign Key Integrity / Deletion Block**: Currently `delete_resume` executes `session.delete(resume)`. With SQLite foreign key constraints enabled (`PRAGMA foreign_keys=ON;`), this operation raises an `IntegrityError` if the foreign key restricts deletion, or cascades/sets null depending on schema configuration.
  2. **Recruiter Data Loss & Broken Links**: `delete_resume` executes `os.remove(resume.file_path)` on disk. Once deleted from disk, any recruiter attempting to review or download the applicant's resume for an active job application encounters a missing file / 404 error.
- **Where to fix**:
  - `src/backend/routers/profiles.py` (`delete_resume`)
  - `src/backend/routers/jobs.py` (`apply_to_job`)
  - `src/backend/models.py` (`Application`, `Resume`)
- **The Fix Options**:
  1. **Option A (Application Snapshotting — Recommended)**:
     When an application is submitted, create an immutable copy of the resume PDF into an archive directory (e.g. `uploads/applications/app_{id}_{filename}.pdf`) and link the application record to this frozen snapshot. If the user deletes or replaces their profile resume later, the recruiter's received copy remains intact and unaffected.
  2. **Option B (Soft-Delete / Archive on Profile Resumes)**:
     Add `is_archived: bool = False` or `is_deleted: bool = False` to `Resume`. When a user deletes a resume from their profile, mark `is_archived = True` instead of executing `os.remove()` and `session.delete()`. It is hidden from the candidate's active list, but preserved on disk for recruiters.
  3. **Option C (Active Application Deletion Guard)**:
     In `delete_resume`, query `select(Application).where(Application.resume_id == resume_id)`. If active applications exist, reject the deletion with `HTTP 400 Bad Request` ("Cannot delete a resume attached to active job applications. Withdraw the applications first or upload an updated resume.").

---

## 3. Testing & Database Infrastructure

### 5.1 Test Suite Lifespan Modifying Development Database
- **Issue**:
  `tests/conftest.py` overrides `get_session` with an in-memory database (`sqlite://`), but `TestClient(app)` triggers the FastAPI app lifespan (`src/backend/main.py:8-12`). That lifespan calls `init_db()`, which runs `SQLModel.metadata.create_all(engine)` using the production/development disk engine in `database.py`. Running `pytest` modifies and writes `careerconnect_test.db` to disk.
- **Where to fix**:
  - `src/backend/database.py` (`init_db`)
  - `src/backend/main.py` (`lifespan`)
  - `tests/conftest.py`
- **The Fix**:
  Allow `init_db()` to accept an optional engine or inspect an environment flag (e.g. `TESTING=True`):
  ```python
  def init_db(target_engine: Engine = engine):
      from src.backend import models
      SQLModel.metadata.create_all(target_engine)
  ```
  In `conftest.py`, suppress lifespan database initialization during tests or set `os.environ["TESTING"] = "1"`.

---

### 5.2 Foreign Keys Disabled in Test In-Memory Database
- **Issue**:
  SQLite disables foreign key enforcement by default. `database.py` enables it on the main engine via `PRAGMA foreign_keys=ON`, but `tests/conftest.py` creates a separate in-memory engine without attaching the event listener. Foreign key constraints are therefore bypassed during testing.
- **Where to fix**:
  - `tests/conftest.py` (lines 12–18)
- **The Fix**:
  Attach the listener to the test engine in `conftest.py`:
  ```python
  from sqlalchemy import event
  from sqlalchemy.engine import Engine

  @event.listens_for(engine, "connect")
  def set_sqlite_pragma(dbapi_connection, connection_record):
      cursor = dbapi_connection.cursor()
      cursor.execute("PRAGMA foreign_keys=ON")
      cursor.close()
  ```

---

### 5.3 Missing Test Coverage (Profiles, Resumes, Lockout, Revocation)
- **Issue**:
  `tests/test_auth.py` contains only 6 tests for basic login and registration. There are currently zero tests for:
  - Profile retrieval and update (`/api/profiles/me`)
  - Resume upload (PDF format check, file size limit)
  - Resume download, delete, and default toggling
  - Account lockout after 5 failed attempts
  - Token revocation on `/api/auth/logout`
  - Token refresh on `/api/auth/refresh`
- **Where to fix**:
  - Create `tests/test_profiles.py`
  - Expand `tests/test_auth.py`
- **The Fix**:
  Implement test fixtures for authenticated users and add tests for:
  - `test_read_profile`, `test_update_profile`
  - `test_upload_valid_resume`, `test_upload_invalid_filetype`, `test_upload_oversized_resume`
  - `test_resume_max_limit_enforced`
  - `test_logout_token_blacklisting`
  - `test_account_lockout_after_five_failures`

---

## 4. Frontend-Backend Integration & Code Cleanup

### 6.1 Frontend Logout Does Not Revoke Token on Backend [FIXED]
- **Status**: ✅ Fixed (Implemented `logoutUser` in `src/frontend/src/api/auth.js` and integrated with `handleLogout` in `src/frontend/src/App.jsx`)
- **Issue**:
  `handleLogout` in `src/frontend/src/App.jsx` simply deletes `accessToken` from `localStorage`. It never calls `POST /api/auth/logout`. The JWT remains valid on the server until expiration.
- **Where to fix**:
  - `src/frontend/src/api/auth.js`
  - `src/frontend/src/App.jsx`
- **The Fix**:
  1. Add a `logoutUser` function in `src/frontend/src/api/auth.js`:
  ```javascript
  export async function logoutUser(token) {
    return fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
  ```
  2. Call `await logoutUser(token)` inside `handleLogout` before clearing `localStorage`.

---

### 6.2 Frontend Password Rules Missing 72-Byte Limit [FIXED]
- **Status**: ✅ Fixed (Added 72-byte limit rule using `TextEncoder` in `src/frontend/src/utils/passwordRules.js`)
- **Issue**:
  `src/backend/routers/auth.py:46-47` rejects passwords greater than 72 bytes due to bcrypt's internal limit. However, `src/frontend/src/utils/passwordRules.js` does not check this constraint, allowing users to submit passwords that are immediately rejected by the server.
- **Where to fix**:
  - `src/frontend/src/utils/passwordRules.js`
- **The Fix**:
  Add the 72-byte rule to the validation array:
  ```javascript
  export const passwordRules = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'At most 72 bytes', test: (pw) => new TextEncoder().encode(pw).length <= 72 },
    { label: 'An uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'A lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'A number', test: (pw) => /\d/.test(pw) },
    { label: 'A special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  ]
  ```

---

### 6.3 Orphaned 1-Byte File `frontend` in Project Root
- **Issue**:
  There is a stray 1-byte file named `frontend` in the repository root directory alongside the actual frontend directory at `src/frontend`.
- **Where to fix**:
  - Root directory file `frontend`
- **The Fix**:
  Delete the stray file `rm frontend`.

---

### 6.4 Typo in Model Name `ResumeReponse`
- **Issue**:
  `ResumeReponse` is misspelled (missing 's'). It is used across `src/backend/models.py` and `src/backend/routers/profiles.py`.
- **Where to fix**:
  - `src/backend/models.py` (line 63)
  - `src/backend/routers/profiles.py` (lines 14, 60, 76, 139)
- **The Fix**:
  Rename `ResumeReponse` to `ResumeResponse` in both files.

---

### 6.5 Unbounded Growth of `RevokedToken` Table
- **Issue**:
  Tokens added to `RevokedToken` on logout or refresh are never purged. Over time, expired tokens accumulate indefinitely in the database, slowing down JTI verification queries.
- **Where to fix**:
  - `src/backend/database.py` or `src/backend/main.py`
- **The Fix**:
  Add a helper function to purge expired tokens, called periodically or during application startup:
  ```python
  def purge_expired_revoked_tokens(session: Session):
      now = datetime.now(timezone.utc)
      session.exec(delete(RevokedToken).where(RevokedToken.expires_at < now))
      session.commit()
  ```

---

### 6.6 Recruiter Inactive Job Visibility & Reactivation
- **Issue**:
  Currently, `GET /api/jobs/{job_id}` and `GET /api/jobs` return `404 Not Found` or filter out postings where `is_active == False` to prevent job seekers from viewing closed or draft positions. However, recruiters who authored those postings need visibility into their own inactive postings so they can review historical submissions and reactivate them (`is_active = True`) without needing to recreate the posting from scratch.
- **Where to fix**:
  - `src/backend/routers/jobs.py` (`get_job_by_id` and adding `GET /api/jobs/recruiter/my-postings`).
- **The Fix**:
  1. In `GET /api/jobs/{job_id}`, check if the requesting user is the authenticated `recruiter_id`; if so, allow returning the job even when `is_active == False`.
  2. Implement a dedicated recruiter endpoint `GET /api/jobs/recruiter/my-postings` that returns both active and inactive jobs owned by the logged-in user.
  3. Ensure `PUT /api/jobs/{job_id}` allows the owner to toggle `is_active` back to `True` for reactivation.

---

## 5. Job Search Frontend Deficiencies & UX Enhancements

### 7.1 Empty State UI & Feedback
- **Issue**:
  When users navigate to the job search page initially, `jobs.length === 0` renders the message `"Search for a job above to see results."`. When a user submits a search query that yields zero matches, the UI renders the exact same initial string. There is no visual feedback indicating that a search was conducted and yielded no matching positions.
- **Where to fix**:
  - `src/frontend/src/components/JobSearchPage.jsx`
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
- **The Fix**:
  1. Track search execution state (e.g. `hasSearched: boolean` or loading/searched status).
  2. Distinguish the initial welcome state ("Find your next opportunity by keyword, location, or category above") from the empty result state ("No jobs found matching your criteria. Try adjusting your search or clearing filters.").

---

### 7.2 Automatic & Explicit Filter Application [FIXED]
- **Status**: ✅ Fixed (Added visible primary Search button and implemented triggerSearch to automatically re-query and apply filters whenever an option in Category, Job Type, Schedule, or Order is clicked)
- **Issue**:
  Clicking options in dropdown filters (Job Type, Schedule, Order) updates internal React state variables (`jobType`, `jobSchedule`, `order`) but does not execute a search. The form submit button is marked `hidden` (`<button type="submit" hidden>Search</button>`), preventing users from clicking to search. Users are forced to manually enter one of the text inputs and press Enter to trigger the query.
- **Where to fix**:
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
- **The Fix**:
  1. Render a visible, primary-styled "Search" button next to the input fields.
  2. Automatically trigger a new search when an option in any dropdown is selected, providing immediate reactive filtering.

---

### 7.3 Reset Filter Action & Search Query Refresh [FIXED]
- **Status**: ✅ Fixed (Updated `handleReset` in `JobSearchPageNavbar.jsx` to restore all filter fields and dropdowns to default, automatically execute `searchJobs({})` to display all active postings, and invoke `onReset` to clear the selected job card in `JobSearchPage.jsx`)
- **Issue**:
  The "Reset" button executes `handleReset`, which clears local filter state and invokes `onJobsLoaded([])`. Instead of clearing the active filters and fetching the default list of all active jobs, it wipes out all displayed listings, returning the user to the unsearched empty state.
- **Where to fix**:
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
- **The Fix**:
  1. Have `handleReset` restore all filters to their blank/default values and trigger an immediate search query (`searchJobs({})`), populating the page with all current active jobs.
  2. Clear any currently selected job card when filters are reset.

---

### 7.4 Dropdown Menu Dismissal & Outside-Click Handling [FIXED]
- **Status**: ✅ Fixed (Added explicit menu close calls on option selection, pointerdown outside-click detection via React refs, and Escape key listeners)
- **Issue**:
  When an option in a dropdown menu (Job Type, Schedule, Order) is clicked, the selection handler updates the label and value, but fails to set the menu's open state to `false` (`setIsJobTypeOpen(false)`, etc.). Furthermore, there is no document-level click listener to close open menus when clicking elsewhere. Menus stay stuck open until the user clicks the menu button again.
- **Where to fix**:
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
- **The Fix**:
  1. Explicitly close the active dropdown when an item is selected (`setIsJobTypeOpen(false)`).
  2. Implement an outside-click handler (via a `ref` and `useEffect` listener on `mousedown`/`pointerdown`) to automatically dismiss any open dropdown menu when clicking anywhere outside.

---

### 7.5 Category Selector Dropdown [FIXED]
- **Status**: ✅ Fixed (Replaced freeform text input with a curated, scrollable category dropdown menu supporting "All Categories" and distinct business categories with outside-click dismissal)
- **Issue**:
  The job category is currently a freeform text input (`<input type="text" placeholder="Category (e.g. Software, Design)" />`). Because users do not know the exact nomenclature of categories in the database (e.g., "Engineering", "Design", "Product", "Marketing"), misspellings and mismatches cause valid jobs to be missed.
- **Where to fix**:
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
- **The Fix**:
  Replace the text input with a structured dropdown menu listing known job categories (e.g., All Categories, Engineering, Design, Product, Finance, Marketing, Sales, Customer Support, Human Resources, Operations, Other). Selecting a category updates the filter and applies the search.

---

### 7.6 Selected Job Persistence on Query and Reset
- **Issue**:
  In `JobSearchPage.jsx`, `selectedJob` is retained in component state across searches and resets. If a user selects a job posting and then runs a new search that returns different results (or clicks Reset), the details card of the previously selected job remains displayed in the right pane, despite no longer matching or being present in the current results list.
- **Where to fix**:
  - `src/frontend/src/components/JobSearchPage.jsx`
- **The Fix**:
  Reset `selectedJob` to `null` whenever a new search or reset is executed (`onJobsLoaded`), or ensure `selectedJob` is cleared if its ID does not exist in the newly loaded jobs list.

---

### 7.7 Fullscreen & Dedicated Job Posting View
- **Issue**:
  Job postings can only be previewed in a constrained half-width side panel. There is no fullscreen or dedicated view to inspect comprehensive details, full descriptions, requirements, and application status comfortably.
- **Where to fix**:
  - `src/frontend/src/components/JobSearchPage.jsx`
  - Dedicated component `src/frontend/src/components/JobDetailModal.jsx` or full-page view
- **The Fix**:
  1. Add an "Expand" / "Fullscreen" action to the job preview panel.
  2. Implement a full-screen modal or dedicated full-width view that shows complete job specifications, company info, salary ranges, work hours, and application submission status.

---

### 7.8 Dynamic Return Order (Salary & Hours Sorting) [FIXED]
- **Status**: ✅ Fixed (Added `sortBy` query parameter handling to `searchJobs` in `jobs.js`, integrated `sortBy` and `sortOrder` in `JobSearchPageNavbar.jsx`, and provided sorting by Newest, Oldest, Highest Salary, Lowest Salary, Most Hours, and Fewest Hours)
- **Issue**:
  The backend `GET /api/jobs` endpoint supports sorting by multiple fields via `sort_by` (`posted_at`, `salary_max`, `salary_min`, `max_hours_per_week`) and `sort_order` (`asc`, `desc`). However, `src/frontend/src/api/jobs.js` does not accept or pass `sort_by`, and the frontend dropdown only offers "By Newest" and "By Oldest". Sorting by compensation or work hours is completely unavailable to users.
- **Where to fix**:
  - `src/frontend/src/api/jobs.js`
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
- **The Fix**:
  1. Update `searchJobs` in `jobs.js` to accept `sortBy` and pass `sort_by` in query parameters.
  2. Expand the Order dropdown in `JobSearchPageNavbar.jsx` to include:
     - Newest First (`posted_at` desc)
     - Oldest First (`posted_at` asc)
     - Highest Salary (`salary_max` desc)
     - Lowest Salary (`salary_min` asc)
     - Most Hours / Week (`max_hours_per_week` desc)
     - Fewest Hours / Week (`max_hours_per_week` asc)

---

### 7.9 Top Navbar Layout & UI Consistency [FIXED]
- **Status**: ✅ Fixed (Aligned top navigation bar with `Navbar.jsx`, styled Dashboard as text link, separated search controls into sub-bar, and harmonized container layout)
- **Issue**:
  `JobSearchPageNavbar.jsx` was visually inconsistent with the rest of the application:
  1. `Navbar.jsx` uses `justify-between` with brand on the left and navigation on the right; `JobSearchPageNavbar.jsx` lumped brand, inputs, filters, and logout into a crowded left-aligned row.
  2. In `Navbar.jsx`, navigation is a styled text link ("Browse Jobs"), whereas in `JobSearchPageNavbar.jsx`, "Dashboard" was styled as a gray button.
  3. Pill buttons (`rounded-full`) in search clashed with square/rounded-md elements elsewhere.
- **Where to fix**:
  - `src/frontend/src/App.jsx`
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
  - `src/frontend/src/components/Navbar.jsx`
- **The Fix**:
  1. Align the top navigation bar layout with `Navbar.jsx` (Brand on left, "Dashboard" link, and "Log out" button on right).
  2. Position search and filter controls in a dedicated, cohesive filter bar directly beneath the main navbar.
  3. Align page container margins and colors across views.

---

### 7.10 Pagination & Multi-Page Search Results
- **Issue**:
  The backend endpoint `GET /api/jobs` enforces pagination with a default limit of 20 (`limit=20`) and returns `JobListResponse(jobs, total, page, limit, total_pages)`. The frontend API ignores `page` and `limit`, and `JobSearchPageNavbar` extracts only `data.jobs`, discarding `total`, `page`, and `total_pages`. No pagination controls exist in `JobSearchPage.jsx`, meaning any results beyond the first 20 are completely inaccessible.
- **Where to fix**:
  - `src/frontend/src/api/jobs.js`
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
  - `src/frontend/src/components/JobSearchPage.jsx`
- **The Fix**:
  1. Update `searchJobs` to accept `page` and `limit`.
  2. Pass pagination state (`page`, `total`, `totalPages`, `onPageChange`) to `JobSearchPage`.
  3. Render pagination controls (Previous/Next buttons, page numbers, and "Showing X of Y jobs") beneath the results list.

---

### 7.11 Page Separation & URL-Based Routing (/dashboard, /jobs) [FIXED]
- **Status**: ✅ Fixed (Implemented HTML5 History API path-based routing in `App.jsx` for `/dashboard`, `/jobs`, `/login`, and `/signup`, synchronized browser URL state with `pushState`/`replaceState`/`popstate`, updated navigation links across `Navbar.jsx` and `JobSearchPageNavbar.jsx`, and added route protection)
- **Issue**:
  The frontend currently manages screens entirely via internal React state in `App.jsx` (`view === 'login' | 'signup' | 'loggedIn' | 'jobSearch'`) without updating the browser URL. The URL remains static at `/` regardless of whether the user is on the dashboard or browsing jobs. Consequently:
  1. Users cannot directly visit, share, or bookmark `/dashboard` or `/jobs`.
  2. Browser Back and Forward navigation buttons do not work between dashboard and job listings.
  3. Refreshing the browser or opening links in new tabs resets the user to the default view rather than keeping them on the active page.
- **Where to fix**:
  - `src/frontend/src/App.jsx`
  - `src/frontend/src/components/Navbar.jsx`
  - `src/frontend/src/components/JobSearchPageNavbar.jsx`
- **The Fix**:
  1. Implement HTML5 History API path-based routing (`pushState`, `replaceState`, and `popstate` event listeners) in `App.jsx`.
  2. Map routes cleanly:
     - `/dashboard`: Authenticated dashboard view ([LoggedInScreen.jsx](file:///home/thomas/SOEN-341---Group-A/src/frontend/src/components/LoggedInScreen.jsx))
     - `/jobs`: Job search and listings view ([JobSearchPage.jsx](file:///home/thomas/SOEN-341---Group-A/src/frontend/src/components/JobSearchPage.jsx))
     - `/login` & `/signup`: Authentication screens
     - `/`: Redirects authenticated users to `/jobs` (or `/dashboard`), and unauthenticated users to `/login`.
  3. Update navigation triggers in `Navbar.jsx` ("Browse Jobs" -> `/jobs`) and `JobSearchPageNavbar.jsx` ("Dashboard" -> `/dashboard`) to push browser history entries and update the path without page reloads.


