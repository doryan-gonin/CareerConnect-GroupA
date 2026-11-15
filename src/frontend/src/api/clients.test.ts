import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { MockInstance } from "vite-plus/test";
import { registerUser, loginUser, logoutUser, getCurrentUser } from "./auth";
import { getApplication, getMyApplications, withdrawApplication } from "./applications";
import { createInterviewSession, sendInterviewMessage } from "./interview";
import { getAnalytics } from "./analytics";
import { searchJobs, applyToJob, getJobById } from "./jobs";
import { updateProfile, uploadResume, getResumes, deleteResume } from "./profiles";
import { API_BASE_URL } from "./client";

let fetchMock: MockInstance<typeof fetch>;
type RecordedRequest = [string, RequestInit];

function jsonBody(request: RecordedRequest): unknown {
  if (typeof request[1].body !== "string") throw new Error("Expected a JSON request body");
  return JSON.parse(request[1].body);
}

function requestHeader(request: RecordedRequest, name: string): string | null {
  const headers = request[1].headers;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers))
    return headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? null;
  return headers?.[name] ?? null;
}

function formBody(request: RecordedRequest): FormData {
  if (!(request[1].body instanceof FormData)) throw new Error("Expected a form body");
  return request[1].body;
}

beforeEach(() => {
  fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/auth/login")) {
      return new Response(JSON.stringify({ access_token: "token", token_type: "bearer" }), {
        status: 200,
      });
    }
    if (url.includes("/applications/me")) return new Response("[]", { status: 200 });
    if (url.includes("/interview/sessions")) return new Response("[]", { status: 200 });
    if (url.includes("/jobs?") || url.endsWith("/jobs")) {
      return new Response(
        JSON.stringify({ jobs: [], total: 0, page: 1, limit: 20, total_pages: 0 }),
        {
          status: 200,
        },
      );
    }
    if (url.includes("/profiles/me/resumes")) return new Response("[]", { status: 200 });
    if (url.includes("/analytics/")) {
      return new Response(
        JSON.stringify({
          start_date: "2026-11-01",
          end_date: "2026-11-30",
          group_by: "week",
          points: [],
        }),
        { status: 200 },
      );
    }
    if (url.endsWith("/auth/register") || url.endsWith("/auth/me")) {
      return new Response(
        JSON.stringify({
          id: 7,
          email_address: "ada@example.com",
          is_recruiter: false,
          created_at: "2026-11-01",
        }),
        { status: 200 },
      );
    }
    return new Response("{}", { status: 200 });
  });
});
afterEach(() => vi.restoreAllMocks());
const lastRequest = (): RecordedRequest => {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error("Expected fetch to be called");
  return [String(call[0]), call[1] ?? {}];
};

describe("API request contracts", () => {
  it("registers recruiter credentials and logs in using backend field names", async () => {
    await registerUser("ada@example.com", "Secure!123", true);
    expect(lastRequest()[0]).toBe(`${API_BASE_URL}/api/auth/register`);
    expect(jsonBody(lastRequest())).toEqual({
      email_address: "ada@example.com",
      password: "Secure!123",
      is_recruiter: true,
    });
    await loginUser("ada@example.com", "Secure!123");
    expect(lastRequest()[0]).toBe(`${API_BASE_URL}/api/auth/login`);
    expect(jsonBody(lastRequest())).toEqual({
      email_address: "ada@example.com",
      password: "Secure!123",
    });
  });

  it("uses the configured API origin for account loading and tolerates offline logout", async () => {
    await getCurrentUser("token");
    expect(lastRequest()[0]).toBe(`${API_BASE_URL}/api/auth/me`);
    expect(requestHeader(lastRequest(), "Authorization")).toBe("Bearer token");
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(logoutUser("token")).resolves.toBeUndefined();
  });

  it("encodes application statuses and handles bodyless withdrawal", async () => {
    await getMyApplications("token", "Under Review");
    expect(lastRequest()[0]).toContain("/api/applications/me?status=Under%20Review");
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(withdrawApplication("token", 12)).resolves.toBe(true);
    expect(lastRequest()[1].method).toBe("DELETE");
  });

  it("loads a single application with authentication", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 12,
          job_id: 4,
          applicant_id: 7,
          status: "Under Review",
          applied_at: "2026-11-01",
          job_title: "Engineer",
          company_name: "Example",
          location: "Remote",
          category: "Engineering",
          job_type: "Permanent",
          job_schedule: "Full-time",
        }),
        { status: 200 },
      ),
    );
    await expect(getApplication("token", 12)).resolves.toMatchObject({
      id: 12,
      status: "Under Review",
    });
    expect(lastRequest()[0]).toBe(`${API_BASE_URL}/api/applications/12`);
    expect(requestHeader(lastRequest(), "Authorization")).toBe("Bearer token");
  });

  it("sends interview context and messages as JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 4,
          job_id: 12,
          job_title: "Engineer",
          company_name: "Example",
          created_at: "2026-11-01",
          updated_at: "2026-11-01",
          messages: [{ role: "assistant", content: "Welcome" }],
        }),
        { status: 200 },
      ),
    );
    await createInterviewSession("token", 12);
    expect(jsonBody(lastRequest())).toEqual({ application_id: 12 });
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ role: "assistant", content: "Answer" }), { status: 200 }),
    );
    await sendInterviewMessage("token", 4, "How should I prepare?");
    expect(lastRequest()[0]).toContain("/api/interview/sessions/4/messages");
    expect(jsonBody(lastRequest())).toEqual({ content: "How should I prepare?" });
  });

  it("encodes analytics date parameters", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          start_date: "2026-11-01",
          end_date: "2026-11-30",
          group_by: "week",
          points: [],
        }),
        { status: 200 },
      ),
    );
    await getAnalytics("token", "applications", { start_date: "2026-11-01", group_by: "week" });
    expect(new URL(lastRequest()[0]).searchParams.get("start_date")).toBe("2026-11-01");
    expect(new URL(lastRequest()[0]).searchParams.get("group_by")).toBe("week");
  });

  it("rejects malformed analytics responses at the API boundary", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ start_date: "2026-11-01", points: null }), { status: 200 }),
    );

    await expect(getAnalytics("token", "applications")).rejects.toThrow(
      "Invalid response from /api/analytics/applications?",
    );
  });

  it("encodes job filters, pagination and sorting without undefined values", async () => {
    await searchJobs("token", {
      keyword: "React & Python",
      location: "New York",
      jobType: "Contract",
      jobSchedule: "Full-time",
      sortBy: "salary_max",
      sortOrder: "desc",
      page: 2,
      limit: 10,
    });
    const params = new URL(lastRequest()[0]).searchParams;
    expect(Object.fromEntries(params)).toEqual({
      keyword: "React & Python",
      location: "New York",
      job_type: "Contract",
      job_schedule: "Full-time",
      sort_by: "salary_max",
      sort_order: "desc",
      page: "2",
      limit: "10",
    });
  });

  it("submits the selected resume and cover letter", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 12,
          job_id: 8,
          applicant_id: 7,
          status: "Applied",
          applied_at: "2026-11-01",
        }),
        { status: 200 },
      ),
    );
    await applyToJob("token", 8, { resumeId: 2, coverLetter: "Hello!" });
    expect(lastRequest()[0]).toContain("/api/jobs/8/apply");
    expect(jsonBody(lastRequest())).toEqual({ resume_id: 2, cover_letter: "Hello!" });
  });

  it("preserves cancellation while loading job details", async () => {
    const error = new DOMException("Cancelled", "AbortError");
    const controller = new AbortController();
    fetchMock.mockRejectedValue(error);
    await expect(getJobById("token", 8, controller.signal)).rejects.toBe(error);
  });

  it("maps profile fields and uploads resumes as FormData", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 3,
          user_id: 7,
          first_name: "Ada",
          last_name: "Lovelace",
          last_updated: "2026-11-01",
        }),
        { status: 200 },
      ),
    );
    await updateProfile("token", { firstName: "Ada", lastName: "Lovelace" });
    expect(jsonBody(lastRequest())).toEqual({ first_name: "Ada", last_name: "Lovelace" });
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 2,
          user_id: 7,
          file_name: "cv.pdf",
          is_default: true,
          uploaded_at: "2026-11-01",
        }),
        { status: 200 },
      ),
    );
    const file = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
    await uploadResume("token", file, true);
    expect(lastRequest()[0]).toContain("make_default=true");
    expect(formBody(lastRequest()).get("file")).toBe(file);
    expect(requestHeader(lastRequest(), "Content-Type")).toBeNull();
  });

  it("returns an empty resume list for an empty response and handles bodyless delete", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(getResumes("token")).resolves.toEqual([]);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteResume("token", 2)).resolves.toBe(true);
  });

  it.each([
    ["authentication", () => loginUser("a@example.com", "bad")],
    ["jobs", () => searchJobs("token")],
    ["applications", () => getMyApplications("token")],
    ["profiles", () => getResumes("token")],
    ["interviews", () => createInterviewSession("token", 2)],
    ["analytics", () => getAnalytics("token", "applications", {})],
  ])("%s exposes backend error messages", async (_name, call) => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Request rejected." }), { status: 403 }),
    );
    await expect(call()).rejects.toThrow("Request rejected.");
  });
});
