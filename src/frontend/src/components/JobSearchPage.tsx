import { useEffect, useState } from "react";
import JobSearchPageNavbar from "./JobSearchPageNavbar";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import MarkdownView from "./MarkdownView";
import { getMyApplications } from "../api/applications";
import { getSavedJobs, recordJobView, saveJob, unsaveJob } from "../api/jobs";
import SavedJobButton from "./SavedJobButton";
import type { Job, ApplicationStatus } from "../api/types";

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
  const [statusByJobId, setStatusByJobId] = useState<Record<number, ApplicationStatus>>({});
  const [savedByJobId, setSavedByJobId] = useState<Record<number, boolean>>({});
  const [savingJobId, setSavingJobId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");
  const selectedStatus = selectedJob ? statusByJobId[selectedJob.id] : null;

  useEffect(() => {
    if (isRecruiter) return;
    let active = true;

    getMyApplications(token)
      .then((applications) => {
        if (active) {
          setStatusByJobId(Object.fromEntries(applications.map((a) => [a.job_id, a.status])));
        }
      })
      .catch(() => {});

    getSavedJobs(token)
      .then((savedJobs) => {
        if (active)
          setSavedByJobId(Object.fromEntries(savedJobs.map((saved) => [saved.job_id, true])));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [token, isRecruiter]);

  async function handleToggleSaved(jobId: number) {
    if (isRecruiter || savingJobId === jobId) return;
    setSaveError("");
    setSavingJobId(jobId);
    try {
      if (savedByJobId[jobId]) {
        await unsaveJob(token, jobId);
        setSavedByJobId((current) => ({ ...current, [jobId]: false }));
      } else {
        await saveJob(token, jobId);
        setSavedByJobId((current) => ({ ...current, [jobId]: true }));
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
            <p role="alert" className="text-sm text-red-600">
              {saveError}
            </p>
          )}
          {!hasLoaded && <p className="text-sm text-gray-500">Loading jobs…</p>}
          {hasLoaded && jobs.length === 0 && (
            <p className="text-sm text-gray-500">No jobs found matching your search.</p>
          )}
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleSelectJob(job)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") handleSelectJob(job);
              }}
              className={`group block w-100 rounded-xl border p-4 text-left transition hover:border-purple-300 hover:shadow-xs ${
                selectedJob?.id === job.id
                  ? "border-purple-500 bg-purple-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="group-hover:text-purple-600 group-hover:underline font-semibold">
                  {job.title}
                </h2>
                {!isRecruiter && (
                  <SavedJobButton
                    isSaved={Boolean(savedByJobId[job.id])}
                    isPending={savingJobId === job.id}
                    onToggle={() => handleToggleSaved(job.id)}
                  />
                )}
              </div>
              <p>{job.company_name}</p>
              <p>{job.job_schedule}</p>
              <p>{job.location}</p>
              {job.ai_suggested && (
                <div className="mt-2 rounded-md bg-purple-50 px-2.5 py-2 text-xs text-purple-800">
                  <span className="font-semibold">✨ AI suggested</span>
                  {job.suggestion_justification && (
                    <span className="ml-1">— {job.suggestion_justification}</span>
                  )}
                </div>
              )}
              {statusByJobId[job.id] && (
                <div className="mt-2">
                  <ApplicationStatusBadge status={statusByJobId[job.id]} />
                </div>
              )}
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.total > 0 && (
            <div className="mt-2 flex flex-col gap-2 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} jobs
              </p>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                    if (
                      pagination.totalPages > 7 &&
                      p !== 1 &&
                      p !== pagination.totalPages &&
                      Math.abs(p - pagination.page) > 1
                    ) {
                      if (p === 2 || p === pagination.totalPages - 1) {
                        return (
                          <span key={p} className="px-1 text-xs text-gray-400">
                            …
                          </span>
                        );
                      }
                      return null;
                    }

                    const isActive = p === pagination.page;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => pagination.onPageChange(p)}
                        className={`min-w-7 rounded-md px-2 py-1 text-xs font-medium transition ${
                          isActive
                            ? "bg-purple-600 text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1">
          {selectedJob && (
            <div className="group block rounded-xl border border-gray-200 bg-white p-4 text-left">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <a
                    href={`/jobs/${selectedJob.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onViewJob) onViewJob(selectedJob.id);
                    }}
                    className="font-semibold text-lg hover:text-purple-600 hover:underline cursor-pointer"
                  >
                    {selectedJob.title}
                  </a>
                  <p className="text-sm text-gray-700">{selectedJob.company_name}</p>
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
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shrink-0 cursor-pointer"
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
              <p className="mt-2 text-sm text-gray-600">{selectedJob.location}</p>
              <p className="text-sm text-gray-600">Category: {selectedJob.category}</p>
              <p className="text-sm text-gray-600">
                Type: {selectedJob.job_type} · {selectedJob.job_schedule}
              </p>
              {selectedJob.ai_suggested && selectedJob.suggestion_justification && (
                <p className="mt-2 rounded-md bg-purple-50 p-2 text-xs text-purple-800">
                  <span className="font-semibold">Why this was suggested:</span>{" "}
                  {selectedJob.suggestion_justification}
                </p>
              )}
              {(selectedJob.salary_min || selectedJob.salary_max) && (
                <p className="text-sm text-gray-700 font-medium mt-1">
                  Salary: ${selectedJob.salary_min?.toLocaleString() ?? "?"} - $
                  {selectedJob.salary_max?.toLocaleString() ?? "?"}
                </p>
              )}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Job Description
                </span>
                <div className="max-h-60 overflow-y-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                  <MarkdownView content={selectedJob.description} />
                </div>
              </div>

              {!isRecruiter && (
                <button
                  type="button"
                  onClick={() => onApplyJob?.(selectedJob.id)}
                  disabled={Boolean(selectedStatus)}
                  className="mt-3 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                >
                  {selectedStatus ? "Already applied" : "Apply"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobSearchPage;
