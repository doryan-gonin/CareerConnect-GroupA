import test from "node:test";
import assert from "node:assert/strict";
import { getSavedJobs, saveJob, unsaveJob } from "./jobs.js";

function response(body, ok = true) {
  return { ok, json: async () => body };
}

test("getSavedJobs requests the authenticated saved-job collection", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return response([{ job_id: 42 }]);
  };

  try {
    assert.deepEqual(await getSavedJobs("token"), [{ job_id: 42 }]);
    assert.equal(request.url, "http://localhost:8000/api/jobs/saved");
    assert.equal(request.options.headers.Authorization, "Bearer token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saveJob and unsaveJob use the idempotent bookmark endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return options.method === "POST" ? response({ job_id: 42 }) : response(null);
  };

  try {
    assert.deepEqual(await saveJob("token", 42), { job_id: 42 });
    assert.equal(await unsaveJob("token", 42), undefined);
    assert.deepEqual(
      requests.map(({ url, options }) => [url, options.method]),
      [
        ["http://localhost:8000/api/jobs/42/save", "POST"],
        ["http://localhost:8000/api/jobs/42/save", "DELETE"],
      ],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
