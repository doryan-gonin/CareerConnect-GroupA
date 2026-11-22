import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run against a real backend + frontend.
// Both servers use dedicated ports and a throwaway SQLite DB so they never
// touch the dev servers (5173 / 8000) or the dev database.
const BACKEND_PORT = 8010
const FRONTEND_PORT = 5180
const E2E_DB = 'src/frontend/e2e/.data/e2e.db' // relative to the repo root

export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Wipe the previous run's DB, then start the API from the repo root
      command:
        `uv run python -c "import pathlib; p = pathlib.Path('${E2E_DB}'); p.parent.mkdir(parents=True, exist_ok=True); p.unlink(missing_ok=True)"` +
        ` && uv run uvicorn --app-dir src backend.main:app --host 127.0.0.1 --port ${BACKEND_PORT}`,
      cwd: '../..',
      url: `${BACKEND_URL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL: `sqlite:///${E2E_DB}`,
        UPLOAD_DIR: 'src/frontend/e2e/.data/uploads',
        JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'e2e-dummy-secret-key-not-for-production',
        AI_MOCK_MODE: 'true',
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
      url: `http://127.0.0.1:${FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: BACKEND_URL,
      },
    },
  ],
})
