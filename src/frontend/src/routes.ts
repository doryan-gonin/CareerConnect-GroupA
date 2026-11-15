export type AppRoute =
  | { kind: "login" }
  | { kind: "signup" }
  | { kind: "dashboard" }
  | { kind: "analytics" }
  | { kind: "jobs" }
  | { kind: "saved" }
  | { kind: "recruiter-dashboard" }
  | { kind: "job-detail"; jobId: number; applying: boolean }
  | { kind: "interview" }
  | { kind: "interview-new" }
  | { kind: "interview-session"; sessionId: number };

export function normalizePath(pathname: string): string {
  const cleaned = pathname.replace(/\/+$/, "");
  return cleaned === "" ? "/" : cleaned;
}

export function parseRoute(pathname: string): AppRoute | null {
  const path = normalizePath(pathname);
  if (path === "/login") return { kind: "login" };
  if (path === "/signup") return { kind: "signup" };
  if (path === "/dashboard") return { kind: "dashboard" };
  if (path === "/analytics") return { kind: "analytics" };
  if (path === "/jobs") return { kind: "jobs" };
  if (path === "/saved") return { kind: "saved" };
  if (path === "/recruiter/dashboard") return { kind: "recruiter-dashboard" };
  if (path === "/interview") return { kind: "interview" };
  if (path === "/interview/new") return { kind: "interview-new" };

  const interviewMatch = path.match(/^\/interview\/(\d+)$/);
  if (interviewMatch) return { kind: "interview-session", sessionId: Number(interviewMatch[1]) };

  const jobMatch = path.match(/^\/jobs\/(\d+)(\/apply)?$/);
  if (jobMatch) {
    return { kind: "job-detail", jobId: Number(jobMatch[1]), applying: Boolean(jobMatch[2]) };
  }
  return null;
}

export function isAllowedAppPath(pathname: string): boolean {
  return parseRoute(pathname) !== null;
}
