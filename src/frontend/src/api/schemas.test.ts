import { describe, expect, it } from "vite-plus/test";
import {
  analyticsResponseSchemas,
  jobFormSchema,
  loginFormSchema,
  signupFormSchema,
} from "./schemas";

describe("runtime schemas", () => {
  it("rejects malformed analytics payloads", () => {
    const result = analyticsResponseSchemas.applications.safeParse({
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      group_by: "week",
      points: [{ period: "2026-11-01" }],
    });

    expect(result.success).toBe(false);
  });

  it("validates authentication form values", () => {
    expect(loginFormSchema.safeParse({ email: "bad", password: "" }).success).toBe(false);
    expect(
      signupFormSchema.safeParse({
        email: "ada@example.com",
        password: "Secure!123",
        confirmPassword: "different",
        isRecruiter: false,
      }).success,
    ).toBe(false);
  });

  it("rejects inverted job ranges", () => {
    const result = jobFormSchema.safeParse({
      title: "Engineer",
      company_name: "Example",
      description: "Build things",
      location: "Remote",
      category: "Engineering",
      job_type: "Permanent",
      job_schedule: "Full-time",
      min_hours_per_week: 40,
      max_hours_per_week: 20,
      salary_min: 120000,
      salary_max: 80000,
    });

    expect(result.success).toBe(false);
  });
});
