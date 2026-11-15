import { describe, expect, it } from "vite-plus/test";
import { isAllowedAppPath, parseRoute } from "./routes";

describe("frontend route parser", () => {
  it("parses typed job and interview routes", () => {
    expect(parseRoute("/jobs/42/apply")).toEqual({ kind: "job-detail", jobId: 42, applying: true });
    expect(parseRoute("/interview/7")).toEqual({ kind: "interview-session", sessionId: 7 });
  });

  it("normalizes trailing slashes and rejects unknown routes", () => {
    expect(parseRoute("/dashboard/")).toEqual({ kind: "dashboard" });
    expect(isAllowedAppPath("/unknown")).toBe(false);
  });
});
