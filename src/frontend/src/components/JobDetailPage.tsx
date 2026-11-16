import { useState, useEffect } from "react";
import { getJobById, applyToJob } from "../api/jobs";
import { getMyApplications } from "../api/applications";
import ApplicationForm from "./ApplicationForm";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import MarkdownView from "./MarkdownView";
import NotificationBell from "./NotificationBell";
import type { ApplicationStatus, Job, Notification } from "../api/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

type Props = {
  token: string;
  jobId: number;
  onNavigateJobs?: () => void;
  onNavigateDashboard?: () => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
  isApplying?: boolean;
  onApply?: () => void;
  onBackToPosting?: () => void;
  isRecruiter?: boolean;
  onNotificationClick?: (notification: Notification) => void | Promise<void>;
};

type JobState = { id: number | null; job: Job | null; isLoading: boolean; error: string };
type ApplicationState = { id: number | null; status: ApplicationStatus | null };

function formatSalary(min: number | null | undefined, max: number | null | undefined) {
  if (min && max) {
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  }
  if (min) {
    return `From $${min.toLocaleString()}`;
  }
  if (max) {
    return `Up to $${max.toLocaleString()}`;
  }
  return null;
}

function formatHours(min: number | null | undefined, max: number | null | undefined) {
  if (min && max) {
    return `${min} – ${max} hrs / week`;
  }
  if (max) {
    return `Up to ${max} hrs / week`;
  }
  if (min) {
    return `At least ${min} hrs / week`;
  }
  return null;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function JobDetailPage({
  token,
  jobId,
  onNavigateJobs,
  onNavigateDashboard,
  onLogout,
  isLoggingOut = false,
  isApplying = false,
  onApply,
  onBackToPosting,
  isRecruiter = false,
  onNotificationClick,
}: Props) {
  const [jobState, setJobState] = useState<JobState>({
    id: null,
    job: null,
    isLoading: true,
    error: "",
  });
  const [applicationState, setApplicationState] = useState<ApplicationState>({
    id: null,
    status: null,
  });
  const job = jobState.id === jobId ? jobState.job : null;
  const isLoading = jobState.id !== jobId || jobState.isLoading;
  const loadError = jobState.id === jobId ? jobState.error : "";
  const isCheckingApplication = applicationState.id !== jobId;
  const applicationStatus = isCheckingApplication ? null : applicationState.status;

  useEffect(() => {
    const controller = new AbortController();

    getJobById(token, jobId, controller.signal)
      .then((data) => {
        setJobState({ id: jobId, job: data, isLoading: false, error: "" });
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error("Failed to load job posting.");
        if (error.name !== "AbortError") {
          setJobState({ id: jobId, job: null, isLoading: false, error: error.message });
        }
      });

    return () => {
      controller.abort();
    };
  }, [token, jobId]);

  useEffect(() => {
    if (isRecruiter) return;
    let active = true;

    getMyApplications(token)
      .then((applications) => {
        const existing = applications.find((application) => application.job_id === jobId);
        if (active) setApplicationState({ id: jobId, status: existing?.status ?? null });
      })
      .catch(() => {
        // The backend still rejects duplicates, so a failed check must not block applying
        if (active) setApplicationState({ id: jobId, status: null });
      });

    return () => {
      active = false;
    };
  }, [token, jobId, isRecruiter]);

  async function handleSubmitApplication({
    job_id,
    resume_id,
  }: {
    job_id: number;
    resume_id?: number | null;
  }) {
    await applyToJob(token, job_id, { resumeId: resume_id });
    setApplicationState({ id: job_id, status: "Applied" });
  }

  const salaryDisplay = job ? formatSalary(job.salary_min, job.salary_max) : null;
  const hoursDisplay = job ? formatHours(job.min_hours_per_week, job.max_hours_per_week) : null;
  const postedDisplay = job ? formatDate(job.posted_at) : null;

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <a
              href="/dashboard"
              onClick={(event) => {
                if (onNavigateDashboard) {
                  event.preventDefault();
                  onNavigateDashboard();
                }
              }}
              className="cursor-pointer text-xl font-bold"
            >
              Career<span className="text-primary">Connect</span>
            </a>
            {isRecruiter && <Badge variant="secondary">Recruiter</Badge>}
          </div>
          <div className="flex items-center gap-4">
            {onNavigateJobs && (
              <a
                href="/jobs"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateJobs();
                }}
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Browse Jobs
              </a>
            )}
            {onNavigateDashboard && (
              <a
                href="/dashboard"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateDashboard();
                }}
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
              >
                Dashboard
              </a>
            )}
            <NotificationBell token={token} onNotificationClick={onNotificationClick} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out…" : "Log out"}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {!isApplying && (
          <div className="mb-6">
            <a
              href="/jobs"
              onClick={(event) => {
                event.preventDefault();
                onNavigateJobs?.();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              ← Back to Jobs
            </a>
          </div>
        )}
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col gap-3 p-16 text-center">
              <Skeleton className="mx-auto h-8 w-1/3" />
              <Skeleton className="mx-auto h-4 w-1/2" />
            </CardContent>
          </Card>
        ) : loadError ? (
          <Alert variant="destructive" className="p-12 text-center">
            <AlertDescription className="flex flex-col gap-1">
              <span className="text-base font-semibold">{loadError}</span>
              <span>The requested job posting may have expired or does not exist.</span>
              <a
                href="/jobs"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateJobs?.();
                }}
                className="mt-3 text-sm font-medium underline"
              >
                Back to Job Listings
              </a>
            </AlertDescription>
          </Alert>
        ) : job && isApplying ? (
          <ApplicationForm
            token={token}
            job={job}
            onBack={onBackToPosting ?? (() => undefined)}
            onSubmitApplication={handleSubmitApplication}
          />
        ) : job ? (
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-primary">{job.company_name}</span>
                <span className="text-muted-foreground">•</span>
                <Badge variant="secondary">{job.category}</Badge>
                {applicationStatus && <ApplicationStatusBadge status={applicationStatus} />}
                {postedDisplay && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Posted {postedDisplay}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">{job.title}</h1>
              <p className="text-sm text-muted-foreground">{job.location}</p>
            </CardHeader>
            <CardContent>
              <div className="my-6 grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-3 sm:p-6">
                {[
                  ["Job Type", job.job_type],
                  ["Schedule", job.job_schedule],
                  ["Compensation", salaryDisplay],
                  ["Work Hours", hoursDisplay],
                  ["Location", job.location],
                  ["Category", job.category],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label}>
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold">{value}</p>
                    </div>
                  ) : null,
                )}
              </div>
              <div className="space-y-3 border-b pb-8">
                <h2 className="text-lg font-semibold">Job Description</h2>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <MarkdownView content={job.description} />
                </div>
              </div>
              <div className="pt-6">
                <div className="flex items-center gap-4">
                  {!isRecruiter && (
                    <Button
                      type="button"
                      onClick={onApply}
                      disabled={isCheckingApplication || Boolean(applicationStatus)}
                    >
                      {applicationStatus ? "Already applied" : "Apply Now"}
                    </Button>
                  )}
                  <a
                    href="/jobs"
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigateJobs?.();
                    }}
                    className="cursor-pointer text-sm font-medium text-muted-foreground hover:underline"
                  >
                    Back to Jobs
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

export default JobDetailPage;
