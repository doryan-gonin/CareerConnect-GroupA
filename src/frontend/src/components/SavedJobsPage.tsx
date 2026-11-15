import { useCallback, useState } from "react";
import { getSavedJobs, unsaveJob } from "../api/jobs";
import { useAsyncResource } from "../hooks/useAsyncResource";
import Navbar from "./Navbar";
import SavedJobCard from "./SavedJobCard";

type SavedJobsPageProps = {
  token: string;
  onLogout: () => void;
  isLoggingOut: boolean;
  onNavigateDashboard: () => void;
  onNavigateJobs: () => void;
  onViewJob: (id: number) => void;
};
function SavedJobsPage({
  token,
  onLogout,
  isLoggingOut,
  onNavigateDashboard,
  onNavigateJobs,
  onViewJob,
}: SavedJobsPageProps) {
  const [error, setError] = useState("");
  const [removingJobId, setRemovingJobId] = useState<number | null>(null);

  const loadSavedJobs = useCallback((signal: AbortSignal) => getSavedJobs(token, signal), [token]);
  const {
    data: loadedJobs,
    error: loadError,
    isLoading,
    reload,
  } = useAsyncResource(loadSavedJobs, [loadSavedJobs], Boolean(token));
  const state = isLoading ? "loading" : loadError ? "error" : "ready";

  const savedJobs = loadedJobs ?? [];

  async function removeSavedJob(jobId: number) {
    setError("");
    setRemovingJobId(jobId);
    try {
      await unsaveJob(token, jobId);
      reload();
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : String(removeError));
    } finally {
      setRemovingJobId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar
        token={token}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
        onBrowseJobs={onNavigateJobs}
        onDashboard={onNavigateDashboard}
        isRecruiter={false}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Saved jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Keep track of roles you may want to apply to.
          </p>
        </div>

        {(error || loadError) && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error || loadError?.message}
          </p>
        )}
        {state === "loading" && <p className="text-sm text-gray-500">Loading saved jobs…</p>}
        {state === "error" && !error && (
          <p className="text-sm text-gray-500">Saved jobs could not be loaded.</p>
        )}
        {state === "ready" && savedJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="font-medium text-gray-800">You have no saved jobs yet.</p>
            <p className="mt-1 text-sm text-gray-500">
              Use the bookmark on a job listing to save it here.
            </p>
            <button
              type="button"
              onClick={onNavigateJobs}
              className="mt-4 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Browse jobs
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {savedJobs.map((savedJob) => (
            <SavedJobCard
              key={savedJob.job_id}
              savedJob={savedJob}
              isPending={removingJobId === savedJob.job_id}
              onRemove={(jobId) => void removeSavedJob(jobId)}
              onView={onViewJob}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default SavedJobsPage;
