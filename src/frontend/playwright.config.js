import { defineConfig, devices } from "@playwright/test";

const configuredApiValue = process.env.E2E_API_BASE_URL?.replace(/\/+$/, "");
const configuredApiBase = configuredApiValue
  ? /\/api$/.test(configuredApiValue)
    ? configuredApiValue
    : `${configuredApiValue}/api`
  : null;
const backendPort = configuredApiBase ? null : Number(process.env.E2E_BACKEND_PORT || 8765);
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 4173);
const apiOrigin = configuredApiBase
  ? configuredApiBase.replace(/\/api\/?$/, "")
  : `http://127.0.0.1:${backendPort}`;
const apiBase = configuredApiBase || `${apiOrigin}/api`;
const frontendBase = `http://127.0.0.1:${frontendPort}`;

// The test workers inherit this value, so helpers use the same API origin as
// the browser when custom E2E ports or an external API are configured.
process.env.E2E_API_BASE_URL = apiBase;

const webServer = [];
if (!configuredApiBase) {
  webServer.push({
    command: "uv run --project ../.. python e2e/serve_backend.py",
    url: apiBase.replace(/\/api$/, ""),
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PORT: String(backendPort) },
  });
}
webServer.push({
  command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort} --strictPort`,
  env: { VITE_API_BASE_URL: apiOrigin },
  url: frontendBase,
  reuseExistingServer: false,
  timeout: 120_000,
});

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendBase,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer,
});
