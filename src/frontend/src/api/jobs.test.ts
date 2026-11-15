import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { MockInstance } from "vite-plus/test";
import { API_BASE_URL } from "./client";
import { getSavedJobs, saveJob, unsaveJob } from "./jobs";

describe("saved jobs API", () => {
  let fetchMock: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests the authenticated saved-job collection", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 1,
            user_id: 7,
            job_id: 42,
            saved_at: "2026-11-01",
            job: {
              id: 42,
              title: "Engineer",
              company_name: "Example",
              description: "Build things",
              location: "Remote",
              category: "Engineering",
              job_type: "Permanent",
              job_schedule: "Full-time",
              is_active: true,
              posted_at: "2026-11-01",
            },
          },
        ]),
        { status: 200 },
      ),
    );

    await expect(getSavedJobs("token")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/jobs/saved`, {
      method: "GET",
      headers: { Authorization: "Bearer token" },
    });
  });

  it("uses the idempotent bookmark endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            user_id: 7,
            job_id: 42,
            saved_at: "2026-11-01",
            job: {
              id: 42,
              title: "Engineer",
              company_name: "Example",
              description: "Build things",
              location: "Remote",
              category: "Engineering",
              job_type: "Permanent",
              job_schedule: "Full-time",
              is_active: true,
              posted_at: "2026-11-01",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(saveJob("token", 42)).resolves.toMatchObject({ job_id: 42 });
    await expect(unsaveJob("token", 42)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls.map(([url, options]) => [url, options?.method])).toEqual([
      [`${API_BASE_URL}/api/jobs/42/save`, "POST"],
      [`${API_BASE_URL}/api/jobs/42/save`, "DELETE"],
    ]);
  });
});
