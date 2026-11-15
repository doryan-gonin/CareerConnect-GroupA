import { useState } from "react";
import JobSearchPageNavbar from "./JobSearchPageNavbar";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import MarkdownView from "./MarkdownView";
import JobListCard from "./JobListCard";
import { recordJobView, saveJob, unsaveJob } from "../api/jobs";
import SavedJobButton from "./SavedJobButton";
import type { Job } from "../api/types";
import { useCandidateJobMetadata } from "../hooks/useCandidateJobMetadata";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Skeleton } from "./ui/skeleton";

type Props = {
  token: string;
  onLogout: () => void;
  isLoggingOut: boolean;
  onNavigateDashboard?: () => void;
  onNavigateSavedJobs?: () => void;
  onViewJob?: (jobId: number) => void;
  onApplyJob?: (jobId: number) => void;
  isRecruiter?: boolean;
};

type Pagination = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

function JobSearchPage({
  token,
  onLogout,
  isLoggingOut,
  onNavigateDashboard,
  onNavigateSavedJobs,
  onViewJob,
  onApplyJob,
  isRecruiter = false,
}: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [savingJobId, setSavingJobId] = useState<number | null>(null);
  const [savedOverrides, setSavedOverrides] = useState<Record<number, boolean>>({});
  const [saveError, setSaveError] = useState("");
  const { data: metadata } = useCandidateJobMetadata(token, Boolean(token) && !isRecruiter);
  const statusByJobId = metadata?.statusByJobId ?? {};
  const savedByJobId = { ...metadata?.savedByJobId, ...savedOverrides };
  const selectedStatus = selectedJob ? statusByJobId[selectedJob.id] : null;

  async function handleToggleSaved(jobId: number) {
    if (isRecruiter || savingJobId === jobId) return;
    setSaveError("");
    setSavingJobId(jobId);
    try {
      if (savedByJobId[jobId]) {
        await unsaveJob(token, jobId);
        setSavedOverrides((current) => ({ ...current, [jobId]: false }));
      } else {
        await saveJob(token, jobId);
        setSavedOverrides((current) => ({ ...current, [jobId]: true }));
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update saved job.");
    } finally {
      setSavingJobId(null);
    }
  }

  function handleSelectJob(job: Job) {
    setSelectedJob(job);
    recordJobView(token, job.id).catch(() => {});
  }

  function handleJobsLoaded(loadedJobs: Job[], paginationInfo?: Pagination) {
    setJobs(loadedJobs);
    setHasLoaded(true);
    if (paginationInfo) {
      setPagination(paginationInfo);
    }
    setSelectedJob((prevSelected) => {
      if (!prevSelected) return null;
      const stillExists = loadedJobs.find((j) => j.id === prevSelected.id);
      if (!stillExists) {
        return null;
      }
      return stillExists;
    });
  }

  function handleReset() {
    setSelectedJob(null);
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <JobSearchPageNavbar
        token={token}
        onJobsLoaded={handleJobsLoaded}
        onReset={handleReset}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateSavedJobs={onNavigateSavedJobs}
      />
      <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
        <div className="flex flex-col gap-3">
          {saveError && (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          {!hasLoaded && (
            <div className="flex flex-col gap-3" aria-label="Loading jobs">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {hasLoaded && jobs.length === 0 && (
            <Empty className="min-w-[20rem] border">
              <EmptyHeader>
                <EmptyTitle>No jobs found matching your search.</EmptyTitle>
                <EmptyDescription>No jobs match your current search.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {jobs.map((job) => (
            <JobListCard
              key={job.id}
              job={job}
              isSelected={selectedJob?.id === job.id}
              isRecruiter={isRecruiter}
              isSaved={Boolean(savedByJobId[job.id])}
              isPending={savingJobId === job.id}
              applicationStatus={statusByJobId[job.id]}
              onSelect={handleSelectJob}
              onToggleSaved={() => void handleToggleSaved(job.id)}
            />
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.total > 0 && (
            <div className="mt-2 flex flex-col gap-2 border-t pt-3">
              <p className="text-center text-xs text-muted-foreground">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} jobs
              </p>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                    if (
                      pagination.totalPages > 7 &&
                      p !== 1 &&
                      p !== pagination.totalPages &&
                      Math.abs(p - pagination.page) > 1
                    ) {
                      if (p === 2 || p === pagination.totalPages - 1) {
                        return (
                          <span key={p} className="px-1 text-xs text-muted-foreground">
                            …
                          </span>
                        );
                      }
                      return null;
                    }

                    const isActive = p === pagination.page;
                    return (
                      <Button
                        key={p}
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => pagination.onPageChange(p)}
                        className="min-w-7"
                      >
                        {p}
                      </Button>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1">
          {selectedJob && (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <a
                      href={`/jobs/${selectedJob.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onViewJob) onViewJob(selectedJob.id);
                      }}
                      className="cursor-pointer text-lg font-semibold hover:underline"
                    >
                      {selectedJob.title}
                    </a>
                    <p className="text-sm text-muted-foreground">{selectedJob.company_name}</p>
                    {selectedStatus && (
                      <div className="mt-1">
                        <ApplicationStatusBadge status={selectedStatus} />
                      </div>
                    )}
                  </div>
                  {!isRecruiter && (
                    <SavedJobButton
                      isSaved={Boolean(savedByJobId[selectedJob.id])}
                      isPending={savingJobId === selectedJob.id}
                      onToggle={() => handleToggleSaved(selectedJob.id)}
                    />
                  )}
                  <a
                    href={`/jobs/${selectedJob.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onViewJob) onViewJob(selectedJob.id);
                    }}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                    title="View full posting"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Expand
                  </a>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{selectedJob.location}</p>
                <p className="text-sm text-muted-foreground">Category: {selectedJob.category}</p>
                <p className="text-sm text-muted-foreground">
                  Type: {selectedJob.job_type} · {selectedJob.job_schedule}
                </p>
                {selectedJob.ai_suggested && selectedJob.suggestion_justification && (
                  <p className="mt-2 rounded-md bg-primary/10 p-2 text-xs text-primary">
                    <span className="font-semibold">Why this was suggested:</span>{" "}
                    {selectedJob.suggestion_justification}
                  </p>
                )}
                {(selectedJob.salary_min || selectedJob.salary_max) && (
                  <p className="mt-1 text-sm font-medium">
                    Salary: ${selectedJob.salary_min?.toLocaleString() ?? "?"} - $
                    {selectedJob.salary_max?.toLocaleString() ?? "?"}
                  </p>
                )}
                <div className="mt-3 border-t pt-3">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Job Description
                  </span>
                  <div className="max-h-60 overflow-y-auto rounded-md bg-muted/40 p-3 text-xs">
                    <MarkdownView content={selectedJob.description} />
                  </div>
                </div>

                {!isRecruiter && (
                  <Button
                    type="button"
                    onClick={() => onApplyJob?.(selectedJob.id)}
                    disabled={Boolean(selectedStatus)}
                    className="mt-3 self-start"
                  >
                    {selectedStatus ? "Already applied" : "Apply"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobSearchPage;
